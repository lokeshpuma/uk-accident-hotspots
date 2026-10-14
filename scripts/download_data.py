#!/usr/bin/env python3
"""
scripts/download_data.py
Resolves and validates the official Department for Transport (DfT) STATS19 collision CSV dataset.
Verifies header fields against PRD schema requirements.
"""

import os
import sys
import csv
import urllib.request
import re

OFFICIAL_DFT_PAGE = "https://www.gov.uk/government/statistical-data-sets/road-safety-open-data"
EXPECTED_COLUMNS = [
    "date", "time", "latitude", "longitude", "accident_severity"
]


def resolve_and_download(dest_dir: str = "data") -> str:
    os.makedirs(dest_dir, exist_ok=True)
    target_path = os.path.join(dest_dir, "dft-road-casualty-statistics-collision-last-5-years.csv")

    if os.path.exists(target_path):
        size_mb = os.path.getsize(target_path) / (1024 * 1024)
        print(f"[download_data] Existing STATS19 dataset located at {target_path} ({size_mb:.2f} MB).")
        validate_dataset(target_path)
        return target_path

    print(f"[download_data] Querying official DfT portal: {OFFICIAL_DFT_PAGE}")
    try:
        req = urllib.request.Request(OFFICIAL_DFT_PAGE, headers={"User-Agent": "HotspotWatch-Ingestion/2.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            # Look for collisions 5-year CSV link
            match = re.search(r'href="([^"]+dft-road-casualty-statistics-collision-last-5-years\.csv[^"]*)"', html, re.I)
            if match:
                download_url = match.group(1)
                print(f"[download_data] Discovered official download URL: {download_url}")
                print(f"[download_data] Fetching to {target_path}...")
                urllib.request.urlretrieve(download_url, target_path)
            else:
                print("[download_data] Could not parse direct link from HTML. Please ensure file exists in data/")
                return target_path
    except Exception as e:
        print(f"[download_data] Download network note: {e}")

    validate_dataset(target_path)
    return target_path


def validate_dataset(filepath: str):
    if not os.path.exists(filepath):
        print(f"[download_data] ERROR: File not found at {filepath}")
        return

    with open(filepath, mode="r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader)
        print(f"[download_data] Dataset columns ({len(header)}): {header[:8]} ...")

        # Validate minimum columns
        missing = [col for col in EXPECTED_COLUMNS if not any(col in h.lower() for h in header)]
        if missing:
            print(f"[download_data] WARNING: Missing expected columns: {missing}")
        else:
            print("[download_data] PASS: Header schema matches required STATS19 dimensions.")

        rows = 0
        for _ in reader:
            rows += 1
            if rows % 200000 == 0:
                print(f"[download_data] Read {rows} records...")
        print(f"[download_data] Total valid collision rows: {rows}")


if __name__ == "__main__":
    resolve_and_download()
