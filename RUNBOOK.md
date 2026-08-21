# ROADTWIN AI — PRODUCTION RUNBOOK & OPERATIONS GUIDE
**Smart India Hackathon 2026 — Team CltAltDefeat (ID 404)**
**Corridor: Yamuna Expressway (Greater Noida → Agra, 165 km)**

---

## 1. Quick Start & Local Execution

### Prerequisites
* Python 3.11+
* Node.js 20+
* npm 10+

### Option A: Local Bare-Metal Setup
```bash
# 1. Clone & activate virtual environment
cd /Users/vaibhavsingh/RoadTwin
source .venv/bin/activate

# 2. Start FastAPI Backend (Port 8000)
PYTHONPATH=scripts python scripts/api.py
# Verify: curl http://localhost:8000/health

# 3. Start Next.js Frontend (Port 3000)
cd frontend
npm install
npm run dev
# Dashboard accessible at http://localhost:3000
```

### Option B: Docker Compose Production Deployment
```bash
# Build and launch both services with persistent SQLite volume
docker-compose up --build -d

# Check service logs
docker-compose logs -f backend

# Verify health probe
curl http://localhost:8000/api/v1/system/readiness
```

---

## 2. Environment Variables & Configuration

Configuration is managed centrally via `scripts/config.py` and reads from `.env` or `.env.local`:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | `development`, `test`, or `production` |
| `API_HOST` | `0.0.0.0` | Binding host for Uvicorn server |
| `API_PORT` | `8000` | Port for FastAPI service |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed web clients |
| `DATABASE_PATH` | `data/processed/digital_twin/alerts.db` | SQLite persistent alert database |
| `TOMTOM_API_KEY` | *Empty* | Live TomTom flow adapter (if absent, operates in `MOCK_OR_UNAVAILABLE` mode) |
| `NEXT_PUBLIC_API_URL`| `http://localhost:8000` | Frontend backend endpoint |

---

## 3. Health, Liveness & Readiness Probes

1. **Liveness Probe** (`GET /health`):
   Returns `200 OK` with basic process status.
2. **Readiness Diagnostic** (`GET /api/v1/system/readiness`):
   Validates Layer B MultiDiGraph (1,863 nodes, 3,461 edges), 405 segment registry, CP07 XGBoost model singleton (31 features), and SQLite database connectivity.
3. **Performance Diagnostics** (`GET /api/v1/system/diagnostics`):
   Returns real-time sub-second engine latency measurements (state scan, inference, routing, dispatch).

---

## 4. SIH 2026 Guided Demonstration Sequence

To execute the official 10-step jury demonstration:

1. Click **`[ SIH DEMO ]`** on the top header.
2. **Step 1 (Baseline)**: Shows 405 segments operating under nominal daylight conditions.
3. **Step 2 (Winter Fog)**: Switches to 04:00 IST winter fog scenario ($RH=98\%$, dew point depression $0.5^\circ\text{C}$).
4. **Step 3 (Hazard Detection)**: Identifies `DENSE_FOG` and `COMPOUND_RISK` hazards.
5. **Step 4 (Alerts)**: Explores live active alerts stream with operator acknowledgement.
6. **Step 5 (VMS Signage)**: Inspects simulated Variable Message Sign boards displaying $60\text{ km/h}$ limits.
7. **Step 6 (Patrol Deployments)**: Reviews tactical patrol units dispatched from `DEPOT_03_TAPPAL`.
8. **Step 7 (Accident Simulation)**: Simulates collision on `YE_MAIN_SB_050` ($-80\%$ speed drop, 5 spillback segments).
9. **Step 8 (Diversion Route)**: Computes alternative bypass path avoiding blocked edge.
10. **Step 9 (Emergency Dispatch)**: Dispatches response unit with animated vehicle trajectory.
11. **Step 10 (Event Timeline & Debrief)**: Displays chronological audit trail of all operational decisions.
12. Click **`[ Reset Demo ]`** to cleanly restore baseline state.

---

## 5. Database Backup & Disaster Recovery

### Backup Active SQLite Database
```bash
# Backup SQLite alerts database to backup folder
mkdir -p data/backups
sqlite3 data/processed/digital_twin/alerts.db ".backup data/backups/alerts_backup_$(date +%Y%m%d_%H%M%S).db"
```

### Restore Database
```bash
cp data/backups/alerts_backup_XXXXX.db data/processed/digital_twin/alerts.db
```

---

## 6. Automated Testing & Validation

Run the complete 5-suite automated regression test suite:
```bash
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_08.py
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_09_frontend.py
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_09_phase2.py
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_10.py
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_11.py
```

---

## 7. Troubleshooting

* **Backend Disconnected / Error Banner in UI**:
  Ensure FastAPI is running on port 8000 (`curl http://localhost:8000/health`). Check that `NEXT_PUBLIC_API_URL` in `frontend/.env.local` points to `http://localhost:8000`.
* **Database is Locked Error**:
  SQLite WAL mode is enabled automatically with `busy_timeout=30000`. Ensure no separate process is locking `alerts.db` exclusively.
* **Map Canvas Blank or Basemap Offline**:
  MapLibre GL JS operates independently without proprietary API keys. If external raster tiles are unreachable, the local corridor geometry (`frontend/public/data/yamuna_expressway_segments.geojson`) and dark operational canvas remain fully active.
