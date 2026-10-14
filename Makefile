# Makefile for HotspotWatch
# Production and demonstration operations

.PHONY: up down logs demo rebuild-state frontend-build frontend-dev predict patrol-plan osm-enrich

frontend-build:
	@echo "==> Building React frontend with Vite..."
	cd frontend && npm run build

frontend-dev:
	@echo "==> Starting React Vite dev server on http://localhost:5173..."
	cd frontend && npm run dev

SHELL := /bin/bash

up:
	@echo "==> Starting HotspotWatch infrastructure stack..."
	docker compose up -d
	@echo "==> Initializing topics and HDFS storage layout..."
	@sleep 4
	@bash scripts/create_topics.sh
	@echo "==> HotspotWatch is ready at http://localhost:8000/"

down:
	@echo "==> Tearing down containers..."
	docker compose down

logs:
	docker compose logs -f app

demo:
	@echo "==> Commencing simulated feed replay..."
	docker compose exec app python services/producer/producer.py --source replay --speed day-10 --max-events 200

rebuild-state:
	@echo "==> Rebuilding state from HDFS raw micro-batches..."
	docker compose exec app python scripts/rebuild_state.py

predict:
	@echo "==> Computing 7-day predictive risk forecast..."
	docker compose exec app python -c "import requests; r=requests.get('http://127.0.0.1:8000/api/v1/predictions/risk').json(); print(f'Computed 7-day forecasts for {len(r[\"hotspot_predictions\"])} hotspots.')"

patrol-plan:
	@echo "==> Generating MCLP patrol dispatch manifest and GPX route..."
	docker compose exec app python scripts/patrol_planner.py

osm-enrich:
	@echo "==> Executing OSM infrastructure snapping..."
	docker compose exec app python scripts/osm_enrich.py

