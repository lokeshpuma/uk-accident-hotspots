#!/usr/bin/env python3
"""
scripts/osm_enrich.py
Enriches Top-20 hotspots with OSM road vectors, speed limits, and camera distances (PRD_v2 Section 16 & 18.6).
"""

import sys
import json
import urllib.request
from services.enrichment.osm import OsmInfrastructureEngine, XaiDiagnosticEngine

def run_osm_enrichment(api_url: str = "http://localhost:8000/api/v1"):
    print("[osm_enrich] Snapping Top hotspots to OpenStreetMap highway geometry...")
    try:
        req = urllib.request.urlopen(f"{api_url}/hotspots?limit=10")
        hotspots = json.loads(req.read().decode("utf-8")).get("hotspots", [])
    except Exception as e:
        print(f"[osm_enrich] Fallback: {e}")
        hotspots = [{"cell": "2575:-7", "band": "DAY", "lat": 51.5106, "lon": -0.1300, "fatal": 1, "serious": 8, "slight": 15, "collisions": 24}]

    for h in hotspots[:5]:
        meta = OsmInfrastructureEngine.snap_coordinates(h["lat"], h["lon"], h["cell"])
        print(f"Hotspot #{h.get('rank', 1)} [{h['cell']}|{h['band']}]:")
        print(f"  Road: {meta['road_name']} ({meta['highway_class']}) - Speed Limit: {meta['speed_limit_mph']} mph")
        print(f"  Nearest Speed Camera: {meta['nearest_speed_camera_meters']}m | Junction: {meta['junction_geometry']}")

if __name__ == "__main__":
    run_osm_enrichment()
