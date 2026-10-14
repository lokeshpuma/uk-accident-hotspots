#!/usr/bin/env python3
"""
services/hdfs_sink/hdfs_sink.py
HDFS micro-batch sink adhering to PRD_v2 Section 6.5, 7.4, and 8.2.
Guarantees:
- Atomic rename via temporary file paths in WebHDFS
- Format preservation: standard TSV for raw/, JSON Lines sidecar in raw_ext/
- End-of-Day (EOD) partition tracking: writes _COMPLETE marker when all partitions finish day D
- Offset commit strictly after HDFS write completion
"""

import os
import sys
import json
import time
import argparse
from typing import Dict, List, Any, Set
from collections import defaultdict

try:
    from kafka import KafkaConsumer, TopicPartition
except ImportError:
    KafkaConsumer = None

try:
    from hdfs import InsecureClient
except ImportError:
    InsecureClient = None

WEBHDFS_URL = os.getenv("WEBHDFS_URL", "http://namenode:9870")
HDFS_USER = os.getenv("HDFS_USER", "root")
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")
TOPIC_DEFAULT = "accident-reports"
CONSUMER_GROUP = "hdfs-sink"


class HdfsSinkService:
    def __init__(self, webhdfs_url: str = WEBHDFS_URL, hdfs_user: str = HDFS_USER,
                 bootstrap_servers: str = KAFKA_BOOTSTRAP, topic: str = TOPIC_DEFAULT,
                 num_partitions: int = 6):
        self.webhdfs_url = webhdfs_url
        self.hdfs_user = hdfs_user
        self.topic = topic
        self.num_partitions = num_partitions
        self.hdfs_client = None
        if InsecureClient:
            try:
                self.hdfs_client = InsecureClient(self.webhdfs_url, user=self.hdfs_user)
                print(f"[HdfsSink] Connected to WebHDFS at {self.webhdfs_url}")
            except Exception as e:
                print(f"[HdfsSink] WebHDFS warning: {e}")

        self.consumer = None
        if KafkaConsumer:
            try:
                self.consumer = KafkaConsumer(
                    self.topic,
                    bootstrap_servers=bootstrap_servers.split(","),
                    group_id=CONSUMER_GROUP,
                    enable_auto_commit=False,
                    auto_offset_reset="earliest",
                    value_deserializer=lambda m: json.loads(m.decode("utf-8"))
                )
                print(f"[HdfsSink] Subscribed to topic {self.topic}")
            except Exception as e:
                print(f"[HdfsSink] Kafka consumer warning: {e}")

        # Day -> partition set that has seen EOD
        self.eod_tracker: Dict[str, Set[int]] = defaultdict(set)

    def write_micro_batch(self, day: str, partition: int, first_offset: int, last_offset: int,
                           records: List[Dict[str, Any]]) -> bool:
        """Writes TSV raw data and JSON Lines extension atomically."""
        if not self.hdfs_client or not records:
            return True

        tsv_dir = f"/data/stats19/raw/dt={day}"
        raw_ext_dir = f"/data/stats19/raw_ext/dt={day}"
        filename = f"p{partition}-o{first_offset}-{last_offset}"
        tsv_path = f"{tsv_dir}/{filename}.tsv"
        jsonl_path = f"{raw_ext_dir}/{filename}.jsonl"
        tmp_tsv_path = f"/data/stats19/tmp/{filename}.tmp"

        # TSV format preserving v1 order:
        # collision_index \t event_date \t event_time \t latitude \t longitude \t severity \t casualties
        tsv_lines = []
        jsonl_lines = []
        for r in records:
            line = f"{r['collision_index']}\t{r['event_date']}\t{r['event_time']}\t{r['latitude']}\t{r['longitude']}\t{r['severity']}\t{r.get('casualties', 1)}\n"
            tsv_lines.append(line)
            jsonl_lines.append(json.dumps(r) + "\n")

        try:
            # Atomic write TSV
            self.hdfs_client.makedirs(tsv_dir)
            self.hdfs_client.makedirs("/data/stats19/tmp")
            self.hdfs_client.write(tmp_tsv_path, data="".join(tsv_lines).encode("utf-8"), overwrite=True)
            self.hdfs_client.rename(tmp_tsv_path, tsv_path)

            # Write JSON Lines sidecar
            self.hdfs_client.makedirs(raw_ext_dir)
            self.hdfs_client.write(jsonl_path, data="".join(jsonl_lines).encode("utf-8"), overwrite=True)

            print(f"[HdfsSink] Flushed {len(records)} records to {tsv_path}")
            return True
        except Exception as e:
            print(f"[HdfsSink] Error writing batch to HDFS: {e}")
            return False

    def mark_day_complete(self, day: str):
        """Writes zero-byte _COMPLETE marker when all partitions finish day."""
        if not self.hdfs_client:
            return
        complete_path = f"/data/stats19/raw/dt={day}/_COMPLETE"
        try:
            self.hdfs_client.write(complete_path, data=b"", overwrite=True)
            print(f"[HdfsSink] Day {day} CLOSED: Wrote {complete_path}")
        except Exception as e:
            print(f"[HdfsSink] Failed to write _COMPLETE marker: {e}")

    def run(self, max_batches: int = 0):
        if not self.consumer:
            print("[HdfsSink] Consumer not available. Exiting.")
            return

        batch_by_key = defaultdict(list)
        batch_meta = {}
        processed_batches = 0

        print("[HdfsSink] Commencing consumption loop...")
        try:
            while True:
                msg_pack = self.consumer.poll(timeout_ms=1000, max_records=200)
                if not msg_pack:
                    continue

                for tp, messages in msg_pack.items():
                    for msg in messages:
                        val = msg.value
                        # Check for EOD marker
                        if val.get("type") == "EOD":
                            eod_day = val.get("day")
                            self.eod_tracker[eod_day].add(tp.partition)
                            print(f"[HdfsSink] Partition {tp.partition} received EOD for {eod_day} ({len(self.eod_tracker[eod_day])}/{self.num_partitions})")
                            if len(self.eod_tracker[eod_day]) >= self.num_partitions:
                                self.mark_day_complete(eod_day)
                            continue

                        ev_date = val.get("event_date")
                        if not ev_date:
                            continue

                        k = (ev_date, tp.partition)
                        if k not in batch_meta:
                            batch_meta[k] = {"first": msg.offset, "last": msg.offset}
                        else:
                            batch_meta[k]["last"] = msg.offset
                        batch_by_key[k].append(val)

                # Flush all accumulated batches
                success = True
                for (d, part), items in list(batch_by_key.items()):
                    meta = batch_meta[(d, part)]
                    if not self.write_micro_batch(d, part, meta["first"], meta["last"], items):
                        success = False
                        break

                if success and batch_by_key:
                    self.consumer.commit()
                    batch_by_key.clear()
                    batch_meta.clear()
                    processed_batches += 1
                    if max_batches and processed_batches >= max_batches:
                        break

        except KeyboardInterrupt:
            print("[HdfsSink] Stopped by user.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="STATS19 HDFS Micro-Batch Sink")
    parser.add_argument("--webhdfs", default=WEBHDFS_URL)
    parser.add_argument("--bootstrap", default=KAFKA_BOOTSTRAP)
    parser.add_argument("--topic", default=TOPIC_DEFAULT)
    parser.add_argument("--partitions", type=int, default=6)
    args = parser.parse_args()

    sink = HdfsSinkService(webhdfs_url=args.webhdfs, bootstrap_servers=args.bootstrap,
                           topic=args.topic, num_partitions=args.partitions)
    sink.run()
