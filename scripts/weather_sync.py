#!/usr/bin/env python3
"""
scripts/weather_sync.py
Synchronizes weather correlation statistics from Open-Meteo for Top hotspots (PRD_v2 Section 16 & 18.2).
"""

import sys
import json
import urllib.request
from services.enrichment.weather import WEATHER_ENGINE, get_weather_summary

def sync_weather(api_url: str = "http://localhost:8000/api/v1"):
    print("[weather_sync] Querying active hotspots...")
    try:
        req = urllib.request.urlopen(f"{api_url}/hotspots?limit=20")
        hotspots = json.loads(req.read().decode("utf-8")).get("hotspots", [])
    except Exception as e:
        print(f"[weather_sync] API unavailable, using offline fallback: {e}")
        hotspots = [{"cell": "2575:-7", "band": "DAY", "lat": 51.5106, "lon": -0.1300, "collisions": 24, "score": 24.8}]

    summary = get_weather_summary(hotspots)
    print(f"[weather_sync] Evaluated {len(hotspots)} clusters.")
    print(f"[weather_sync] Weather-triggered anomaly count: {summary['weather_sensitive_count']}")
    for c in summary["clusters"][:3]:
        print(f"  Cluster {c['cell']}|{c['band']}: WSR={c['wsr']} ({c['risk_category']})")

if __name__ == "__main__":
    sync_weather()
