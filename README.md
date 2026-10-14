# HotspotWatch: Real-Time Road Accident Hotspot Detection & Predictive Intelligence Platform 🚦📍

[![Docker Compose](https://img.shields.io/badge/Docker-Containers%20Active-blue?logo=docker)](https://www.docker.com/)
[![Apache Hadoop](https://img.shields.io/badge/Apache%20Hadoop-3.3.6%20YARN-yellow?logo=apachehadoop)](https://hadoop.apache.org/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-3.7.0-black?logo=apachekafka)](https://kafka.apache.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-teal?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18%20Vite-61dafb?logo=react)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Geospatial%20GIS-green?logo=leaflet)](https://leafletjs.com/)

An enterprise-grade **Big Data Lambda Architecture platform** for real-time and historical road safety analytics. The system ingests, deduplicates, scores, ranks, and predicts road accident concentration hotspots across Great Britain using **Apache Kafka**, **Hadoop HDFS**, **YARN MapReduce**, and a **React 18 / FastAPI interactive spatial dashboard**.

---

## 📌 1. Project Overview & Academic Problem Statement

Traditional traffic enforcement and road casualty interventions rely on **retrospective annual casualty reports**, which are published months after collisions occur. These reports obscure *when* (diurnal peaks) and *where* (localized micro-corridors) collision risks are highest.

**HotspotWatch** solves this by implementing a dual **Lambda Architecture**:
1. **Batch Layer (Hadoop & MapReduce)**: Executes a 3-stage MapReduce chain computing spatio-temporal hotspot clusters over a rolling 90-day window with mathematical recency decay and casualty severity weighting.
2. **Speed Layer (Apache Kafka & SSE)**: Ingests streaming STATS19 accident reports in real time, advancing an interactive virtual clock and updating active top-of-stack live telemetry.
3. **Serving & Analytics Layer (FastAPI & React)**: Visualizes hotspots via interactive GIS heatmaps, Uber H3 hexagonal binning, 7-day Poisson machine learning risk forecasts, UK DfT WebTAG casualty economic appraisal, and patrol dispatch optimization.

---

## 🏗️ 2. System Architecture

```text
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   INGESTION & STREAMING                                 │
 │  STATS19 Dataset ───► Ingestion Producer ───► Apache Kafka Topic: accident-reports       │
 └───────────────────────────────┬──────────────────────────┬──────────────────────────────┘
                                 │                          │
                 ┌───────────────▼───────────────┐          │
                 │          BATCH LAYER          │          │
                 │   HDFS Sink (WebHDFS)         │          │
                 │   /data/stats19/raw/dt=YYYY/  │          │
                 └───────────────┬───────────────┘          │
                                 │                          │
                 ┌───────────────▼───────────────┐          │
                 │       YARN MapReduce Chain    │          │
                 │  Job 1: Window & DedupScore   │          │
                 │  Job 2: Centroid & Aggregate  │          │
                 │  Job 3: Global Top-N Rank     │          │
                 └───────────────┬───────────────┘          │
                                 │                          │
                 ┌───────────────▼───────────────┐          │
                 │      HDFS Output Partials     │          │
                 │   /data/stats19/output/asof/  │          │
                 └───────────────┬───────────────┘          │
                                 │                          │
                                 ▼                          ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                           SERVING LAYER (FastAPI Backend)                               │
 │   • Real-Time Server-Sent Events (SSE) Broadcast (/api/v1/stream)                       │
 │   • 7-Day Poisson ML Risk Forecasting Engine (/api/v1/forecast)                         │
 │   • UK DfT WebTAG Economic Valuation & PCC PDF Generator (/api/v1/economics)           │
 │   • Maximum Coverage Location Problem (MCLP) Patrol Optimizer (/api/v1/patrol)          │
 │   • Uber H3 Hexagonal Spatial Indexer (Resolution 8) (/api/v1/h3)                       │
 │   • OpenStreetMap Road Snapping & XAI Diagnostic Cards (/api/v1/osm, /api/v1/diagnostics)│
 └───────────────────────────────────────────────┬─────────────────────────────────────────┘
                                                 │
                                                 ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                       PRESENTATION LAYER (React 18 Vite SPA)                            │
 │   • Interactive Leaflet GIS Heatmap with Dynamic Normalization & Time-Band Filters      │
 │   • Real-Time Live Ingest Telemetry Table (Top-of-Stack Row Insertion & Flash Updates) │
 │   • Executive PCC Business Case PDF Export & In-Car GPS Waypoint GPX Downloads          │
 │   • Responsive Dark / Light Mode with Glassmorphism Aesthetic                           │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 3. Core Methodology & Mathematical Formulations

### 3.1 Spatio-Temporal Discretization
- **Spatial Grid Cell**: Coordinates are partitioned into a uniform $0.02^\circ \times 0.02^\circ$ latitude/longitude bounding box ($\approx 2.2\text{ km} \times 1.3\text{ km}$ at UK latitudes):
  $$\text{Cell ID} = \lfloor \text{lat} / 0.02 \rfloor : \lfloor \text{lon} / 0.02 \rfloor$$
- **Diurnal Time Bands**:
  - `AM_PEAK`: 07:00 – 09:59 (Morning rush commuter conflict)
  - `DAY`: 10:00 – 15:59 & 05:00 – 06:59 (Off-peak mixed traffic)
  - `PM_PEAK`: 16:00 – 18:59 (Evening peak congestion)
  - `NIGHT`: 19:00 – 04:59 (Low-light, speeding, alcohol vulnerability)

### 3.2 Exponential Recency Decay & Severity Weighting
Each collision event within the rolling 90-day window ($0 \le \text{age} < 90$) is assigned a decayed severity weight:

$$\text{Score} = \sum_{i=1}^{N} W(\text{severity}_i) \times 0.5^{\frac{\text{age\_days}_i}{\lambda}}$$

- **Severity Weights ($W$)**:
  - Fatal Collision (`Severity 1`): **$10.0$**
  - Serious Injury Collision (`Severity 2`): **$5.0$**
  - Slight Collision (`Severity 3`): **$1.0$**
- **Half-Life ($\lambda$)**: **$30\text{ days}$** (collisions occurring 30 days ago carry 50% weight; 60 days carry 25%).

### 3.3 7-Day Poisson ML Risk Forecasting
Collision count arrivals at high-risk corridors follow a Poisson stochastic process. The forward 7-day expected incident intensity $\hat{\lambda}_{t+k}$ is modeled via historical band frequency and day-of-week seasonality:

$$P(Y = k) = \frac{\lambda^k e^{-\lambda}}{k!}, \quad \text{Risk Index} = \frac{\hat{\lambda} \times \bar{W}_{\text{hist}}}{\max(\text{baseline})}$$

### 3.4 UK DfT WebTAG Economic Valuation Engine
Societal casualty appraisals follow the official **UK Department for Transport (DfT) WebTAG** unit valuation criteria:
- **Fatal Casualty**: **£2,250,000**
- **Serious Casualty**: **£253,000**
- **Slight Casualty**: **£19,500**

**Benefit-to-Cost Ratio (BCR)**:
$$\text{Gross Societal Savings} = \text{Baseline Casualty Loss} \times \text{Target Crash Reduction \%}$$
$$\text{BCR} = \frac{\text{Gross Societal Savings}}{\text{Targeted Mobile Patrol Operating Cost}}$$

### 3.5 Maximum Coverage Location Problem (MCLP) Patrol Optimizer
Police patrol units are positioned to maximize deterrent coverage across ranked hotspots within an effective **1,500m deterrence radius**:

$$\max \sum_{i \in I} w_i y_i \quad \text{subject to} \quad \sum_{j \in J} x_j \le K, \quad y_i \le \sum_{j \in N_i} x_j$$

Where $w_i$ represents hotspot risk score, $x_j \in \{0, 1\}$ indicates unit deployment at site $j$, and $K$ is available mobile units.

---

## 📁 4. Clean Project Directory Structure

```text
bda road/
├── docker-compose.yml       # Multi-container orchestration (FastAPI, Kafka, HDFS, YARN)
├── hadoop.env               # Hadoop cluster environment configurations
├── Makefile                 # Automation commands (build, run, clean)
├── requirements.txt         # Python dependencies (FastAPI, reportlab, uvicorn, etc.)
│
├── frontend/                # React 18 SPA Source (Vite + Vanilla CSS)
│   ├── src/
│   │   ├── components/      # UI components (Header, Map, Panels, Tabs, Modals)
│   │   │   ├── tabs/        # HotspotsTab, TelemetryTab, ForecastTab, EconomicsTab, OpsTab
│   │   │   └── modals/      # Explainable AI, ROI Simulation Modals
│   │   ├── utils/           # STATS19 formatters & coordinate decoders
│   │   ├── App.jsx          # Root application state & SSE stream consumer
│   │   └── index.css        # Professional design system & responsive layout
│   ├── public/              # Brand assets & vector SVG favicon
│   └── vite.config.js       # Production bundler configuration
│
├── site/                    # Compiled production web assets (served directly by Docker)
│   ├── index.html           # Single Page Application entry
│   ├── app_data.json        # Precomputed Top-20 hotspots & telemetry cache
│   └── assets/              # Minified production JS/CSS bundles & SVGs
│
├── services/                # Backend Microservices & Intelligence Engines
│   ├── api/
│   │   └── main.py          # FastAPI application, REST endpoints & SSE streaming
│   ├── aggregator/          # Real-time window aggregators
│   ├── enrichment/          # Weather sensitivity & OSM road snapping
│   ├── ml/                  # Poisson risk forecaster
│   └── patrol/              # WebTAG economics & MCLP patrol optimizer
│
├── mapreduce/               # Apache Hadoop MapReduce Java Job
│   ├── pom.xml              # Maven configuration
│   └── src/main/java/hotspot/
│       └── Hs.java          # 3-stage MapReduce implementation (DedupScore, Aggregate, TopN)
│
├── ingest/                  # Streaming Ingest Pipeline
│   ├── producer.py          # Kafka collision report publisher
│   └── hdfs_sink.py         # Micro-batch atomic HDFS sink
│
├── heatmap/                 # Spatial Clustering & KDE Generator
│   └── heatmap.py           # Kernel density aggregation script
│
├── scripts/                 # Operational & Automation Scripts
│   ├── prepare_app_data.py  # Generates warm cache and app_data.json
│   ├── simulate.sh          # Simulates Kafka stream events
│   └── run_daily.sh         # Executes automated daily MapReduce pipeline
│
└── data/                    # UK STATS19 Collision Data
    └── dft-road-casualty-statistics-collision-last-5-years.csv
```

---

## 🚀 5. Quickstart & How to Run the Platform

### Prerequisites
- **Docker** and **Docker Compose**
- **Node.js 18+** & **npm** (for modifying frontend, optional since pre-built bundle is in `site/`)
- **Python 3.11**

### Step 1: Start the Full Big Data Stack
```bash
docker compose up -d
```
This initializes:
- `kafka:9092` — Apache Kafka 3.7.0 event broker
- `namenode:9870` — Apache Hadoop HDFS NameNode
- `resourcemanager:8088` — Apache Hadoop YARN ResourceManager
- `app:8000` — FastAPI Application & React Production Web Server

### Step 2: Open the Web Application
Open your web browser and navigate to:
```text
http://localhost:8000/
```

---

## 🌐 7. Deploying to GitHub Pages

This repository is pre-configured for instant GitHub Pages deployment via **GitHub Actions**:
1. Push to the `main` branch.
2. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions** (or select **Deploy from a branch** and choose `gh-pages`).
3. The interactive map will be live at: [https://lokeshpuma.github.io/Road-Accident-Hotspot-Detection/](https://lokeshpuma.github.io/Road-Accident-Hotspot-Detection/)

---

## 📡 6. Key REST & Streaming API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/healthz` | `GET` | Cluster and microservice health status |
| `/api/v1/stream` | `GET` | Real-time Server-Sent Events (SSE) emitting clock, ticker, and top20 updates |
| `/api/v1/stats` | `GET` | 90-day window collision volume, severity totals, and ingest rate |
| `/api/v1/h3/cells` | `GET` | Uber H3 Hexagonal Grid indices (Resolution 8) with incident densities |
| `/api/v1/predictions/risk` | `GET` | 7-day Poisson ML forward risk projections by road corridor |
| `/api/v1/economics/summary` | `GET` | UK DfT WebTAG societal casualty valuation breakdown |
| `/api/v1/economics/simulate-roi` | `GET` | Dynamic BCR calculations based on user casualty reduction slider |
| `/api/v1/economics/business-case.pdf` | `GET` | Dynamic generation of official PCC Executive Business Case PDF |
| `/api/v1/patrol/manifest` | `GET` | MCLP optimal police patrol dispatch schedule (JSON or GPX format) |
| `/api/v1/export/top20.csv` | `GET` | Direct CSV export of current Top-20 ranked hotspots |
| `/api/v1/export/top20.geojson` | `GET` | GeoJSON FeatureCollection export for GIS tools (QGIS, ArcGIS) |

---

## 🎓 7. Evaluation & Teacher Presentation Guide

When presenting this project to evaluators or professors, highlight these architectural achievements:

1. **Lambda Architecture Realization**:
   - Explain how **Hadoop MapReduce** provides mathematically rigorous, fault-tolerant batch deduplication over 90 rolling days.
   - Contrast this with the **Speed Layer** where **Kafka** streams incoming collision micro-events directly to web clients via Server-Sent Events (SSE) with sub-second latency.
2. **Elimination of Static Aggregations**:
   - The platform treats **time as a first-class citizen**. The virtual clock advances, past accidents decay by half-life ($0.5^{\Delta t / 30}$), and hotspots dynamically shift based on diurnal commute patterns.
3. **Actionable Civic Value (Vision Zero)**:
   - Emphasize that the system does not just show "dots on a map"—it translates raw statistics into **monetary public value** (UK DfT WebTAG) and gives police commanders **patrol dispatch GPS waypoints (GPX)** and downloadable **executive PDFs** ready for public safety meetings.
4. **Resilience & Fault Tolerance**:
   - Kafka offset management with atomic HDFS staging prevents duplicate counting.
   - Clean microservice separation ensures frontend operability even during batch maintenance cycles.
