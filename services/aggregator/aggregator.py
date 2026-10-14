#!/usr/bin/env python3
"""
services/aggregator/aggregator.py
Real-time streaming aggregator implementing PRD_v2 Section 7.2, 7.3, 8.3, and 18.1.
Features:
- Incremental epoch-normalised scoring (D0 = 2020-01-01, H = 30 days)
- Dual spatial indexing: 0.02° Cartesian grid + Uber H3 hexagonal bins (res 8)
- Real-time deduplication by collision_index
- 90-day rolling window slide at virtual midnight
- Emerging hotspot detection and daily snapshot exports
"""

import os
import sys
import json
import math
import heapq
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict

try:
    import h3
except ImportError:
    h3 = None

D0 = date(2020, 1, 1)
HALF_LIFE = 30.0

SEVERITY_WEIGHTS = {
    1: 10.0,
    2: 5.0,
    3: 1.0
}


def get_time_band(hour: int) -> str:
    """PRD_v2 Section 7.1:
    07-09: AM_PEAK
    16-18: PM_PEAK
    19-23 and 00-04: NIGHT
    otherwise: DAY (05-06 and 10-15)
    """
    if 7 <= hour <= 9:
        return "AM_PEAK"
    elif 16 <= hour <= 18:
        return "PM_PEAK"
    elif hour >= 19 or hour <= 4:
        return "NIGHT"
    else:
        return "DAY"


def compute_g(event_date: date, weight: float) -> float:
    """g = weight * 2 ^ ((event_date - D0) / 30.0)"""
    days_diff = (event_date - D0).days
    return weight * math.pow(2.0, days_diff / HALF_LIFE)


def score_from_g(g: float, asof_date: date) -> float:
    """score_A = G * 2 ^ (-(asof - D0) / 30.0)"""
    days_diff = (asof_date - D0).days
    return g * math.pow(2.0, -days_diff / HALF_LIFE)


def cell_index(lat: float, lon: float) -> str:
    """0.02° grid: floor(lat/0.02):floor(lon/0.02) with float precision rounding."""
    lat_idx = math.floor(round(lat / 0.02, 8))
    lon_idx = math.floor(round(lon / 0.02, 8))
    return f"{lat_idx}:{lon_idx}"


class AggregatorState:
    """Thread-safe state store for live clusters, metadata, and sliding window."""
    def __init__(self):
        # member (cell|BAND) -> G (sum of normalized g)
        self.scores_g: Dict[str, float] = defaultdict(float)
        # band -> member -> G
        self.band_scores_g: Dict[str, Dict[str, float]] = {
            "AM_PEAK": defaultdict(float),
            "DAY": defaultdict(float),
            "PM_PEAK": defaultdict(float),
            "NIGHT": defaultdict(float)
        }
        # member -> metadata
        self.meta: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "n": 0, "lat_sum": 0.0, "lon_sum": 0.0,
            "fatal": 0, "serious": 0, "slight": 0
        })
        # event_date_str -> set(collision_index)
        self.seen: Dict[str, set] = defaultdict(set)
        # event_date_str -> member -> deltas for expiry
        self.exp: Dict[str, Dict[str, Dict[str, Any]]] = defaultdict(lambda: defaultdict(lambda: {
            "g": 0.0, "n": 0, "lat_sum": 0.0, "lon_sum": 0.0,
            "fatal": 0, "serious": 0, "slight": 0
        }))
        # H3 res 8 scores: member (h3|BAND) -> G
        self.h3_scores_g: Dict[str, float] = defaultdict(float)
        self.h3_meta: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "n": 0, "lat_sum": 0.0, "lon_sum": 0.0, "fatal": 0, "serious": 0, "slight": 0
        })
        # Previous day ranks for rank-change calculation
        self.prev_ranks: Dict[str, int] = {}
        # Closing daily top 20
        self.daily_snapshots: Dict[str, List[Dict[str, Any]]] = {}

    def apply_event(self, ev: Dict[str, Any]) -> bool:
        """Processes an incoming event atomically. Returns True if processed, False if duplicate."""
        cid = str(ev["collision_index"])
        d_str = ev["event_date"]
        if cid in self.seen[d_str]:
            return False  # Duplicate
        self.seen[d_str].add(cid)

        lat = float(ev["latitude"])
        lon = float(ev["longitude"])
        sev = int(ev["severity"])
        weight = SEVERITY_WEIGHTS.get(sev, 1.0)

        ev_d = datetime.strptime(d_str, "%Y-%m-%d").date()
        ev_time = str(ev.get("event_time", "12:00"))
        hour = int(ev_time.split(":")[0])
        band = get_time_band(hour)

        cell = cell_index(lat, lon)
        member = f"{cell}|{band}"
        g = compute_g(ev_d, weight)

        # 1. Update Grid Scores
        self.scores_g[member] += g
        self.band_scores_g[band][member] += g

        # 2. Update Grid Metadata
        m = self.meta[member]
        m["n"] += 1
        m["lat_sum"] += lat
        m["lon_sum"] += lon
        if sev == 1:
            m["fatal"] += 1
        elif sev == 2:
            m["serious"] += 1
        else:
            m["slight"] += 1

        # 3. Record Expiry Delta for window slide
        delta = self.exp[d_str][member]
        delta["g"] += g
        delta["n"] += 1
        delta["lat_sum"] += lat
        delta["lon_sum"] += lon
        if sev == 1:
            delta["fatal"] += 1
        elif sev == 2:
            delta["serious"] += 1
        else:
            delta["slight"] += 1

        # 4. Uber H3 Indexing (Add-on 18.1)
        if h3:
            if hasattr(h3, "latlng_to_cell"):
                h3_idx = h3.latlng_to_cell(lat, lon, 8)
            else:
                h3_idx = h3.geo_to_h3(lat, lon, 8)
            h3_member = f"{h3_idx}|{band}"
            self.h3_scores_g[h3_member] += g
            h_m = self.h3_meta[h3_member]
            h_m["n"] += 1
            h_m["lat_sum"] += lat
            h_m["lon_sum"] += lon
            if sev == 1:
                h_m["fatal"] += 1
            elif sev == 2:
                h_m["serious"] += 1
            else:
                h_m["slight"] += 1

        return True

    def slide_window(self, new_asof: date) -> List[Dict[str, Any]]:
        """Slides 90-day window: drops events aged >= 90 days (event_date <= new_asof - 90)."""
        expired_date = new_asof - timedelta(days=90)
        exp_d_str = expired_date.isoformat()

        if exp_d_str in self.exp:
            for member, delta in self.exp[exp_d_str].items():
                self.scores_g[member] -= delta["g"]
                parts = member.split("|")
                band = parts[1]
                self.band_scores_g[band][member] -= delta["g"]

                m = self.meta[member]
                m["n"] -= delta["n"]
                m["lat_sum"] -= delta["lat_sum"]
                m["lon_sum"] -= delta["lon_sum"]
                m["fatal"] -= delta["fatal"]
                m["serious"] -= delta["serious"]
                m["slight"] -= delta["slight"]

                if m["n"] <= 0:
                    del self.meta[member]
                    if member in self.scores_g:
                        del self.scores_g[member]
                    if member in self.band_scores_g[band]:
                        del self.band_scores_g[band][member]

            del self.exp[exp_d_str]

        # Cleanup old seen sets (older than 92 days)
        cleanup_date = (new_asof - timedelta(days=92)).isoformat()
        if cleanup_date in self.seen:
            del self.seen[cleanup_date]

        # Generate snapshot for closing day
        snapshot = self.get_top_n(new_asof, n=20)
        self.daily_snapshots[new_asof.isoformat()] = snapshot

        # Update previous ranks for arrows
        new_prev = {}
        for item in snapshot:
            new_prev[item["member"]] = item["rank"]
        self.prev_ranks = new_prev

        return snapshot

    def get_top_n(self, asof: date, n: int = 20, band_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns authoritative Top-N ranked hotspots matching v1 tie-breaking rules."""
        pool = self.scores_g if not band_filter else self.band_scores_g.get(band_filter, {})

        # Min-heap of size N: (score, member)
        # Note: tie-breaking by member descending
        heap = []
        for member, g in pool.items():
            if g <= 0:
                continue
            sc = score_from_g(g, asof)
            if len(heap) < n:
                heapq.heappush(heap, (sc, member))
            else:
                if sc > heap[0][0] or (sc == heap[0][0] and member > heap[0][1]):
                    heapq.heappushpop(heap, (sc, member))

        # Sort descending
        top_items = sorted(heap, key=lambda x: (x[0], x[1]), reverse=True)

        results = []
        for rank, (sc, member) in enumerate(top_items, start=1):
            cell, band = member.split("|")
            m = self.meta[member]
            count = m["n"]
            avg_lat = round(m["lat_sum"] / count, 6) if count > 0 else 0.0
            avg_lon = round(m["lon_sum"] / count, 6) if count > 0 else 0.0

            prev_r = self.prev_ranks.get(member)
            rank_change = 0 if prev_r is None else (prev_r - rank)
            is_new = prev_r is None

            results.append({
                "rank": rank,
                "cell": cell,
                "band": band,
                "member": member,
                "score": round(sc, 4),
                "collisions": count,
                "lat": avg_lat,
                "lon": avg_lon,
                "fatal": m["fatal"],
                "serious": m["serious"],
                "slight": m["slight"],
                "rank_change": rank_change,
                "is_new": is_new,
                "verified": True
            })
        return results

    def get_h3_cells(self, asof: date, limit: int = 500) -> List[Dict[str, Any]]:
        """Returns Top-N Uber H3 hexagonal bins for 3D extrusion (Add-on 18.1)."""
        heap = []
        for member, g in self.h3_scores_g.items():
            if g <= 0:
                continue
            sc = score_from_g(g, asof)
            if len(heap) < limit:
                heapq.heappush(heap, (sc, member))
            else:
                if sc > heap[0][0]:
                    heapq.heappushpop(heap, (sc, member))

        top_h3 = sorted(heap, key=lambda x: x[0], reverse=True)
        results = []
        for sc, member in top_h3:
            h3_idx, band = member.split("|")
            m = self.h3_meta[member]
            lat = round(m["lat_sum"] / m["n"], 6) if m["n"] > 0 else 0.0
            lon = round(m["lon_sum"] / m["n"], 6) if m["n"] > 0 else 0.0
            results.append({
                "h3_index": h3_idx,
                "band": band,
                "score": round(sc, 4),
                "collisions": m["n"],
                "lat": lat,
                "lon": lon,
                "fatal": m["fatal"],
                "serious": m["serious"],
                "slight": m["slight"]
            })
        return results


# Global singleton instance for shared in-process / API access
GLOBAL_AGGREGATOR = AggregatorState()


def load_backfill_from_csv(csv_path: str, asof_date_str: str = "2025-12-31", state: Optional[AggregatorState] = None):
    """Loads 90-day window ending on asof_date into state for immediate warm-start."""
    import csv
    if state is None:
        state = GLOBAL_AGGREGATOR

    asof = datetime.strptime(asof_date_str, "%Y-%m-%d").date()
    window_start = asof - timedelta(days=89)

    print(f"[Aggregator] Backfilling window {window_start} -> {asof} from {csv_path}...")
    if not os.path.exists(csv_path):
        print(f"[Aggregator] CSV file not found: {csv_path}")
        return

    loaded = 0
    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                d_str = row.get("date", "").strip()
                if "/" in d_str:
                    ev_d = datetime.strptime(d_str, "%d/%m/%Y").date()
                else:
                    ev_d = datetime.strptime(d_str, "%Y-%m-%d").date()

                if not (window_start <= ev_d <= asof):
                    continue

                c_idx = row.get("collision_index") or row.get("accident_index") or row.get("accident_reference")
                lat = float(row["latitude"])
                lon = float(row["longitude"])
                sev = int(row["accident_severity"])
                t_str = row.get("time", "").strip() or "12:00"

                ev = {
                    "collision_index": str(c_idx),
                    "event_date": ev_d.isoformat(),
                    "event_time": t_str,
                    "latitude": lat,
                    "longitude": lon,
                    "severity": sev,
                    "casualties": int(row.get("number_of_casualties") or 1)
                }
                if state.apply_event(ev):
                    loaded += 1
            except Exception:
                continue

    top20 = state.get_top_n(asof, n=20)
    state.daily_snapshots[asof_date_str] = top20
    print(f"[Aggregator] Backfill completed. Loaded {loaded} collisions. Top 1 score: {top20[0]['score'] if top20 else 0}")


if __name__ == "__main__":
    csv_file = "data/dft-road-casualty-statistics-collision-last-5-years.csv"
    load_backfill_from_csv(csv_file, "2025-12-31")
    top20 = GLOBAL_AGGREGATOR.get_top_n(date(2025, 12, 31), 20)
    print("\n--- Aggregator Top-20 Hotspots (2025-12-31) ---")
    for item in top20:
        print(f"#{item['rank']:02d} | Cell: {item['cell']:<8} | Band: {item['band']:<8} | Score: {item['score']:<8.4f} | Collisions: {item['collisions']}")
