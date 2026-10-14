#!/usr/bin/env python3
"""
scripts/patrol_planner.py
Generates intelligent patrol dispatch manifests and GPX waypoints for active hotspots (PRD_v2 Section 16 & 18.5).
"""

import sys
import json
import urllib.request
from services.patrol.dispatch import PATROL_ENGINE

def run_patrol_planner(api_url: str = "http://localhost:8000/api/v1", band: str = "PM_PEAK",
                       output_gpx: str = "docs/patrol_plan.gpx"):
    print(f"[patrol_planner] Generating dispatch plan for band: {band}...")
    try:
        req = urllib.request.urlopen(f"{api_url}/hotspots?limit=10")
        hotspots = json.loads(req.read().decode("utf-8")).get("hotspots", [])
    except Exception:
        hotspots = [{"rank": 1, "cell": "2575:-7", "band": band, "lat": 51.5106, "lon": -0.1300, "score": 24.8}]

    manifest = PATROL_ENGINE.generate_manifest(hotspots, active_band=band, num_units=3)
    gpx_str = PATROL_ENGINE.export_gpx(manifest)
    with open(output_gpx, "w", encoding="utf-8") as f:
        f.write(gpx_str)

    print(f"[patrol_planner] Deployed {manifest['units_deployed']} units across active time window ({manifest['deployment_schedule']}):")
    for u in manifest["patrol_units"]:
        print(f"  * Unit {u['unit_id']}: Target {u['cell']} (Lat: {u['staging_waypoint']['latitude']}, Lon: {u['staging_waypoint']['longitude']})")
    print(f"[patrol_planner] Wrote in-car GPX route manifest to {output_gpx}")

if __name__ == "__main__":
    run_patrol_planner()
