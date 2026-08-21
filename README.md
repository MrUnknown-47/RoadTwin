# RoadTwin AI — Intelligent Highway Digital Twin & Accident Decision-Support System
**Smart India Hackathon (SIH) 2026 — Team CltAltDefeat (Team ID 404)**
**Institution:** G. L. Bajaj Institute of Technology & Management
**Target Corridor:** Yamuna Expressway (Greater Noida → Agra, 165 km)

---

## 🚦 Overview

**RoadTwin AI** is India's first Spatio-Temporal Digital Twin and Accident Risk Decision-Support Platform developed for the 165 km Yamuna Expressway corridor. It empowers highway authorities (NHAI / YEIDA) to transition from **reactive emergency response** to **predictive and proactive accident prevention**.

$$\text{OBSERVE} \longrightarrow \text{PREDICT} \longrightarrow \text{DETECT} \longrightarrow \text{RECOMMEND} \longrightarrow \text{SIMULATE} \longrightarrow \text{ROUTE} \longrightarrow \text{DISPATCH} \longrightarrow \text{AUDIT}$$

---

## 🌟 Key Features

* **405 Standardized Directed Segments**: Discretizes the 165 km corridor into ~500m directional units with strict carriageway separation (201 Southbound, 204 Northbound, 39 interchange ramps).
* **Layer B Directed Routing Graph**: 1,863 nodes and 3,461 directed edges preventing illegal U-turns or median crossing during routing.
* **CP07 XGBoost Accident Risk Model**: 31-feature machine learning engine predicting forward 3-hour relative risk percentiles (0–100%) and 4 risk categories (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
* **Automated Operational Hazard Detector**: Evaluates real-time sensor states to identify dense fog, congestion queues, nocturnal speeding, and compound hazards.
* **Dynamic Variable Message Sign (VMS) Advisory**: Generates dynamic speed limits ($60\text{ km/h}$ in fog, $40\text{ km/h}$ in crash zones) and dual-line LED matrix display messages.
* **Tactical Patrol Unit Recommendations**: Automatically assigns highway patrol deployments from strategic emergency response bases.
* **Sub-50ms What-If Incident Simulator**: Simulates collisions, capacity reductions ($-80\%$), upstream queue spillbacks, and computes multi-objective diversion routes in milliseconds.
* **Interactive Next.js 15 Command Center**: MapLibre GL JS map (provider-independent, zero token required), live telemetry HUD, active alert stream, VMS matrix display, patrol panel, and chronological event audit trail.

---

## 🏗️ System Architecture

```
[ PHYSICAL HIGHWAY ]  (165 km Yamuna Expressway: 405 Segments, 1863 Nodes, 3461 Edges)
         │
         ▼
[ SPATIO-TEMPORAL FUSION ] (Weather: NASA POWER / Traffic: SaveLIFE / Accidents: MoRTH)
         │
         ▼
[ CP07 XGBOOST ENGINE ] (31 Engineered Features -> Forward 3-Hour Relative Risk Percentiles)
         │
         ▼
[ OPERATIONAL INTELLIGENCE ] (HazardDetector -> VMS Advisories -> Patrol Deployments)
         │
         ▼
[ WHAT-IF SIMULATOR ] (Capacity Reduction -> Upstream Queue Spillback -> Multi-Objective Dijkstra)
         │
         ▼
[ NEXT.JS COMMAND CENTER ] (Real-time MapLibre GL JS, Alert HUD, LED VMS matrix, Audit Timeline)
```

---

## 📊 Provenance & Scientific Integrity

| Layer | Classification | Authority / Source | Operational Semantics |
| :--- | :--- | :--- | :--- |
| **OSM Highway Network** | Real / Published | OpenStreetMap Contributors | 165 km corridor, 1,863 nodes, 3,461 directed edges |
| **405 Segments** | Empirically Derived | OSM Segment Builder | 405 standardized directed segments (~500m length) |
| **Historical Crashes** | Real / Published | MoRTH / YEIDA Reports | 40 chainage-verified crash records |
| **Weather Layer** | Reanalysis Data | NASA POWER / MERRA-2 | 131,400 hourly observations (2021–2023) |
| **Traffic Baseline** | Empirically Derived | SaveLIFE / TRIPP / YEIDA | 19,440 diurnal hourly baseline states |
| **CP07 Risk Model** | Derived ML Output | XGBoost Classifier (CP07) | 31 features, forward 3-hour relative risk percentile |
| **Emergency Depots** | Simulation Assumption| Strategic response bases | 6 corridor stations labeled `SIMULATION_DEPOT` |
| **VMS Policies** | Simulation Assumption| MoRTH Safety Guidelines | Decision-support speed limits (`VMS_POLICY_ASSUMPTION`)|
| **Demo Fog Mode** | Synthetic Demo Input | Synthetic Operational State | 04:00 winter fog state ($RH=98\%$, fog risk code 3) |

---

## ⚡ Performance Benchmarks

| Engine Operation | Measured Mean Latency | Target Spec | Status |
| :--- | :---: | :---: | :---: |
| **Corridor State Scan (405 Segments)** | **$4.04\text{ ms}$** | $< 100\text{ ms}$ | **PASS** |
| **CP07 XGBoost Risk Inference** | **$2.82\text{ ms}$** | $< 50\text{ ms}$ | **PASS** |
| **Dijkstra Corridor Routing (177 km)** | **$17.06\text{ ms}$** | $< 50\text{ ms}$ | **PASS** |
| **Emergency Dispatch Optimization** | **$41.49\text{ ms}$** | $< 100\text{ ms}$ | **PASS** |
| **FastAPI Backend Startup Duration** | **$0.561\text{ s}$** | $< 3.0\text{ s}$ | **PASS** |

---

## 🚀 Getting Started

### Prerequisites
* Python 3.11+
* Node.js 20+
* npm 10+

### Option A: Local Bare-Metal Setup
```bash
# 1. Clone repository & setup virtual environment
cd /Users/vaibhavsingh/RoadTwin
source .venv/bin/activate
pip install -r requirements.txt

# 2. Start FastAPI Backend (Port 8000)
PYTHONPATH=scripts python scripts/api.py

# 3. Start Next.js Frontend (Port 3000)
cd frontend
npm install
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) to view the Command Center.*

### Option B: Docker Compose Production Deployment
```bash
docker-compose up --build -d
```

---

## 🧪 Automated Testing & Validation

Run the complete 5-suite regression test matrix:
```bash
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_08.py
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_09_frontend.py
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_09_phase2.py
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_10.py
PYTHONPATH=scripts .venv/bin/python tests/test_checkpoint_11.py
```
**Total Validation: 68 / 68 Tests Passed (100% Pass Rate).**

---

## 🎬 SIH 2026 Jury Demonstration

1. Open the dashboard at [http://localhost:3000](http://localhost:3000).
2. Click **`[ SIH DEMO ]`** on the top header.
3. Advance through the official 10-step sequence:
   * **Step 1**: Baseline free-flow state across 405 segments.
   * **Step 2**: 04:00 Winter Fog state ($RH=98\%$, nocturnal speeding).
   * **Step 3**: Hazard detector flags dense fog and compound risk.
   * **Step 4**: Active alerts stream populated in SQLite.
   * **Step 5**: VMS displays $60\text{ km/h}$ advisory with `"DENSE FOG AHEAD — MAX 60"`.
   * **Step 6**: Tactical patrol units dispatched from `DEPOT_03_TAPPAL`.
   * **Step 7**: Critical collision simulated on `YE_MAIN_SB_050` ($-80\%$ speed drop, 5 spillback segments).
   * **Step 8**: Multi-objective diversion route rendered on MapLibre.
   * **Step 9**: Emergency vehicle dispatched with turn-by-turn routing.
   * **Step 10**: Operational timeline audit trail reviewed.
4. Click **`[ Reset Demo ]`** to restore nominal corridor baseline.

---

## 📄 Documentation Index

* 📖 **[SIH 2026 Pitch Document](docs/SIH_2026_FINAL_PITCH.md)** — Complete 18-section technical pitch.
* 🎙️ **[SIH 2026 Demo Script](docs/SIH_2026_DEMO_SCRIPT.md)** — 3-min, 5-min, and 10-min jury presentation scripts.
* 📊 **[SIH 2026 Final Slides](docs/SIH_2026_FINAL_PPT.md)** — 12-slide presentation outline.
* 🏛️ **[System Architecture](docs/ROADTWIN_FINAL_ARCHITECTURE.md)** — Deep component breakdown and Mermaid diagrams.
* ⚠️ **[Technical Limitations](docs/TECHNICAL_LIMITATIONS.md)** — Scientific assumptions and boundary conditions.
* 🛠️ **[Production Runbook](RUNBOOK.md)** — Operations, environment configuration, and recovery guides.

---

## 👥 Team: CltAltDefeat (Team ID 404)
* **Institution**: G. L. Bajaj Institute of Technology & Management
* **Smart India Hackathon 2026**
* **License**: MIT
