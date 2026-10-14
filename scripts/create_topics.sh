#!/usr/bin/env bash
set -euo pipefail

echo "[create_topics] Initializing Kafka topics (Section 6.3)..."
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 \
  --create --if-not-exists --topic accident-reports --partitions 6 --replication-factor 1

docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 \
  --create --if-not-exists --topic accident-reports.dlq --partitions 3 --replication-factor 1

docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 \
  --create --if-not-exists --topic batch.results --partitions 1 --replication-factor 1

echo "[create_topics] Verifying HDFS filesystem directories (Section 6.5)..."
docker compose exec namenode hdfs dfs -mkdir -p \
  /data/stats19/raw \
  /data/stats19/raw_ext \
  /data/stats19/daily \
  /data/stats19/output \
  /data/stats19/tmp

echo "[create_topics] Topics and HDFS directories successfully verified."
