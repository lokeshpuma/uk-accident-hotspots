#!/usr/bin/env python3
"""
services/producer/producer.py
Kafka producer for STATS19 accident events adhering to PRD_v2 Section 7.5 and 8.1.
Supports:
- Schema v2 validation with Dead Letter Queue (DLQ) routing
- Virtual clock pacing (replay mode) and Synthetic amplification
- End-Of-Day (EOD) partition markers and day barrier synchronization
"""

import os
import sys
import json
import time
import math
import random
import argparse
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, Iterator, Tuple

try:
    from kafka import KafkaProducer
except ImportError:
    KafkaProducer = None


TOPIC_DEFAULT = "accident-reports"
DLQ_DEFAULT = "accident-reports.dlq"
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")


class EventValidator:
    """Validates records against Schema v2 specifications (Section 6.4)."""
    @staticmethod
    def validate(ev: Dict[str, Any]) -> Optional[str]:
        # Required fields check
        required = ["collision_index", "event_date", "event_time", "latitude", "longitude", "severity"]
        for field in required:
            if field not in ev or ev[field] is None:
                return f"Missing required field: {field}"
        
        # Severity check (1: Fatal, 2: Serious, 3: Slight)
        try:
            sev = int(ev["severity"])
            if sev not in (1, 2, 3):
                return f"Invalid severity: {sev} (must be 1, 2, or 3)"
        except (ValueError, TypeError):
            return "Severity is not an integer"

        # Geospatial bounding box check (UK bounds: Lat 49.0 - 61.0, Lon -9.0 - 2.5)
        try:
            lat = float(ev["latitude"])
            lon = float(ev["longitude"])
            if not (49.0 <= lat <= 61.0):
                return f"Latitude out of bounds: {lat}"
            if not (-9.0 <= lon <= 2.5):
                return f"Longitude out of bounds: {lon}"
        except (ValueError, TypeError):
            return "Latitude or longitude not a valid float"

        # Time format validation HH:MM
        t_str = str(ev["event_time"]).strip()
        parts = t_str.split(":")
        if len(parts) < 2:
            return f"Invalid event_time format: {t_str}"
        try:
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                return f"Time out of range: {t_str}"
        except ValueError:
            return f"Non-numeric time values: {t_str}"

        return None


class SourceAdapter:
    """Base interface for event sources."""
    def due_events(self, upto_ts: datetime) -> Iterator[Dict[str, Any]]:
        raise NotImplementedError

    def is_day_finished(self, current_ts: datetime) -> Tuple[bool, Optional[str]]:
        raise NotImplementedError


class StatsReplayAdapter(SourceAdapter):
    """Replays historical STATS19 CSV data chronologically."""
    def __init__(self, csv_path: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
        self.csv_path = csv_path
        self.start_date = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else None
        self.end_date = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
        self.events = []
        self.pointer = 0
        self.current_day: Optional[date] = None
        self._load_csv()

    def _load_csv(self):
        import csv
        if not os.path.exists(self.csv_path):
            print(f"[StatsReplayAdapter] CSV not found at {self.csv_path}")
            return

        loaded = 0
        skipped = 0
        raw_list = []
        with open(self.csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    c_idx = row.get("collision_index") or row.get("accident_index") or row.get("accident_reference")
                    d_str = row.get("date", "").strip()
                    t_str = row.get("time", "").strip() or "12:00"
                    lat_str = row.get("latitude", "").strip()
                    lon_str = row.get("longitude", "").strip()
                    sev_str = row.get("accident_severity", "").strip()

                    # Parse date DD/MM/YYYY or YYYY-MM-DD
                    if "/" in d_str:
                        ev_d = datetime.strptime(d_str, "%d/%m/%Y").date()
                    else:
                        ev_d = datetime.strptime(d_str, "%Y-%m-%d").date()

                    if self.start_date and ev_d < self.start_date:
                        skipped += 1
                        continue
                    if self.end_date and ev_d > self.end_date:
                        skipped += 1
                        continue

                    # Parse time HH:MM
                    time_parts = t_str.split(":")
                    h = int(time_parts[0])
                    m = int(time_parts[1]) if len(time_parts) > 1 else 0
                    ev_ts = datetime(ev_d.year, ev_d.month, ev_d.day, h, m)

                    ev = {
                        "schema_version": 2,
                        "collision_index": str(c_idx),
                        "event_date": ev_d.isoformat(),
                        "event_time": f"{h:02d}:{m:02d}",
                        "event_ts": ev_ts.isoformat(),
                        "latitude": float(lat_str),
                        "longitude": float(lon_str),
                        "severity": int(sev_str),
                        "casualties": int(row.get("number_of_casualties") or 1),
                        "vehicles": int(row.get("number_of_vehicles") or 1),
                        "police_force": int(row.get("police_force") or 1),
                        "source": "replay",
                        "published_ts": datetime.utcnow().isoformat() + "Z",
                        "enrichment": {
                            "light_conditions": row.get("light_conditions"),
                            "weather_conditions": row.get("weather_conditions"),
                            "road_type": row.get("road_type"),
                            "speed_limit": row.get("speed_limit"),
                            "urban_or_rural_area": row.get("urban_or_rural_area"),
                            "first_road_class": row.get("first_road_class"),
                            "first_road_number": row.get("first_road_number"),
                            "local_authority_district": row.get("local_authority_district")
                        }
                    }
                    raw_list.append((ev_ts, ev))
                    loaded += 1
                except Exception:
                    skipped += 1

        # Sort chronologically by event timestamp
        raw_list.sort(key=lambda x: x[0])
        self.events = [item[1] for item in raw_list]
        print(f"[StatsReplayAdapter] Loaded {loaded} records, skipped {skipped}.")

    def due_events(self, upto_ts: datetime) -> Iterator[Dict[str, Any]]:
        while self.pointer < len(self.events):
            ev = self.events[self.pointer]
            ev_ts = datetime.fromisoformat(ev["event_ts"])
            if ev_ts <= upto_ts:
                self.pointer += 1
                self.current_day = ev_ts.date()
                yield ev
            else:
                break

    def is_day_finished(self, current_ts: datetime) -> Tuple[bool, Optional[str]]:
        if not self.current_day:
            return False, None
        if self.pointer >= len(self.events):
            return True, self.current_day.isoformat()
        next_ev = self.events[self.pointer]
        next_ts = datetime.fromisoformat(next_ev["event_ts"])
        if next_ts.date() > self.current_day:
            finished = self.current_day.isoformat()
            self.current_day = next_ts.date()
            return True, finished
        return False, None


class SyntheticAdapter(SourceAdapter):
    """Generates amplified statistically representative collision events (Section 11.2)."""
    def __init__(self, multiplier: int = 1):
        self.multiplier = multiplier
        self.counter = 0

    def due_events(self, upto_ts: datetime) -> Iterator[Dict[str, Any]]:
        # Generate N synthetic events per tick
        count = int(self.multiplier * random.randint(1, 4))
        for _ in range(count):
            self.counter += 1
            # Sample around known UK hotspots (Central London, Manchester, Birmingham)
            centers = [(51.5074, -0.1278), (53.4808, -2.2426), (52.4862, -1.8904)]
            lat_c, lon_c = random.choice(centers)
            lat = round(lat_c + random.gauss(0, 0.05), 4)
            lon = round(lon_c + random.gauss(0, 0.05), 4)
            sev = random.choices([1, 2, 3], weights=[0.02, 0.20, 0.78])[0]
            yield {
                "schema_version": 2,
                "collision_index": f"SYN-{datetime.utcnow().strftime('%Y%m%d')}-{self.counter:08d}",
                "event_date": upto_ts.date().isoformat(),
                "event_time": upto_ts.strftime("%H:%M"),
                "event_ts": upto_ts.isoformat(),
                "latitude": lat,
                "longitude": lon,
                "severity": sev,
                "casualties": 1 if sev == 3 else random.randint(1, 3),
                "vehicles": random.randint(1, 3),
                "police_force": 1,
                "source": "synthetic",
                "published_ts": datetime.utcnow().isoformat() + "Z",
                "enrichment": {
                    "light_conditions": "Daylight",
                    "weather_conditions": "Fine without high winds",
                    "road_type": "Single carriageway",
                    "speed_limit": 30,
                    "urban_or_rural_area": "Urban"
                }
            }

    def is_day_finished(self, current_ts: datetime) -> Tuple[bool, Optional[str]]:
        return False, None


class ProducerService:
    def __init__(self, bootstrap_servers: str, topic: str = TOPIC_DEFAULT, dlq_topic: str = DLQ_DEFAULT):
        self.topic = topic
        self.dlq_topic = dlq_topic
        self.producer = None
        if KafkaProducer:
            try:
                self.producer = KafkaProducer(
                    bootstrap_servers=bootstrap_servers.split(","),
                    acks="all",
                    retries=3,
                    compression_type="gzip",
                    key_serializer=lambda k: k.encode("utf-8") if k else b"",
                    value_serializer=lambda v: json.dumps(v).encode("utf-8")
                )
                print(f"[ProducerService] Connected to Kafka at {bootstrap_servers}")
            except Exception as e:
                print(f"[ProducerService] Kafka connect warning: {e}")

    def send_event(self, ev: Dict[str, Any]):
        err = EventValidator.validate(ev)
        if err:
            print(f"[DLQ] Record rejected: {err} (id={ev.get('collision_index')})")
            if self.producer:
                self.producer.send(
                    self.dlq_topic,
                    key=str(ev.get("collision_index", "unknown")),
                    value={"error_reason": err, "raw": ev}
                )
            return False

        key = str(ev["collision_index"])
        if self.producer:
            self.producer.send(self.topic, key=key, value=ev)
        return True

    def send_eod_marker(self, day_str: str, num_partitions: int = 6):
        """Emits EOD marker to every partition of the topic."""
        marker = {
            "schema_version": 2,
            "type": "EOD",
            "day": day_str,
            "published_ts": datetime.utcnow().isoformat() + "Z"
        }
        if self.producer:
            for p in range(num_partitions):
                self.producer.send(self.topic, key=f"EOD-{day_str}", value=marker, partition=p)
            self.producer.flush()
        print(f"[ProducerService] Emitted EOD markers across {num_partitions} partitions for {day_str}")

    def flush(self):
        if self.producer:
            self.producer.flush()


def run_producer(source: str = "replay", csv_path: str = "data/dft-road-casualty-statistics-collision-last-5-years.csv",
                 speed: str = "day-10", max_events: int = 0):
    producer = ProducerService(bootstrap_servers=KAFKA_BOOTSTRAP)
    if source == "synthetic":
        adapter = SyntheticAdapter(multiplier=1)
        sim_time = datetime(2025, 12, 1, 0, 0)
    else:
        adapter = StatsReplayAdapter(csv_path=csv_path, start_date="2025-10-01", end_date="2025-12-31")
        sim_time = datetime(2025, 10, 1, 0, 0)

    # Speed pacing
    # day-10 = 1 virtual day per 10 real seconds -> 1 virtual hour = 0.416 seconds
    step_minutes = 30
    delay_sec = 0.2
    if speed == "max":
        delay_sec = 0.0

    count = 0
    print(f"[ProducerService] Commencing feed replay ({source}) at speed {speed}...")
    try:
        while True:
            sim_time += timedelta(minutes=step_minutes)
            for ev in adapter.due_events(sim_time):
                producer.send_event(ev)
                count += 1
                if max_events and count >= max_events:
                    print(f"[ProducerService] Reached max_events target {max_events}.")
                    producer.flush()
                    return

            day_done, finished_day = adapter.is_day_finished(sim_time)
            if day_done and finished_day:
                producer.send_eod_marker(finished_day)

            if delay_sec > 0:
                time.sleep(delay_sec)

            if source == "replay" and adapter.pointer >= len(adapter.events):
                print("[ProducerService] All replay records dispatched.")
                break
    except KeyboardInterrupt:
        print("[ProducerService] Interrupted by user.")
    finally:
        producer.flush()
        print(f"[ProducerService] Completed. Total events published: {count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="STATS19 Kafka Stream Producer")
    parser.add_argument("--source", choices=["replay", "synthetic"], default="replay")
    parser.add_argument("--csv", default="data/dft-road-casualty-statistics-collision-last-5-years.csv")
    parser.add_argument("--speed", default="day-10")
    parser.add_argument("--max-events", type=int, default=0)
    args = parser.parse_args()
    run_producer(source=args.source, csv_path=args.csv, speed=args.speed, max_events=args.max_events)
