# ROADTWIN AI — SIH 2026 FINAL PRESENTATION SLIDES
**Team: CltAltDefeat (Team ID 404) · G. L. Bajaj Institute of Technology & Management**
**Problem Statement: Intelligent Highway Digital Twin & Accident Decision Support**

---

### SLIDE 1 — TITLE & TEAM
* **Title**: ROADTWIN AI
* **Subtitle**: Spatio-Temporal Digital Twin & Accident Risk Decision-Support System for Indian Expressways
* **Corridor**: Yamuna Expressway (Greater Noida → Agra, 165 km)
* **Team**: CltAltDefeat (ID 404)
* **Institution**: G. L. Bajaj Institute of Technology & Management

---

### SLIDE 2 — THE PROBLEM
* **Highway Safety Crisis**: Over 1,200+ fatal crashes on Yamuna Expressway over the last decade.
* **Severe Seasonal Hazards**: Dense winter fog, nocturnal fatigue, and speeding causing catastrophic multi-vehicle pileups.
* **Why ATMS Fails Today**:
  1. *Reactive*: Response begins only after fatal crashes occur.
  2. *Siloed*: Weather, traffic, and police systems operate independently.
  3. *No Simulation*: Authorities cannot test diversion routes or queue spillbacks dynamically.

---

### SLIDE 3 — OUR SOLUTION: ROADTWIN AI
* An operational **Digital Twin Command Center** for highway operators (NHAI / YEIDA).
* **Core Paradigm Shift**: Transitioning from **Reactive Emergency Response** to **Predictive & Proactive Prevention**.
* **Key Capabilities**:
  * 405 Standardized Directed Segments (~500m each, 165 km corridor).
  * Real-time XGBoost Accident Risk Prioritization (31 features).
  * Automated Variable Message Sign (VMS) Advisory & Patrol Recommendations.
  * Sub-50ms Incident Simulation, Upstream Spillback & Emergency Dispatch.

---

### SLIDE 4 — THE OPERATIONAL CYCLE
$$\text{OBSERVE} \longrightarrow \text{PREDICT} \longrightarrow \text{DETECT} \longrightarrow \text{RECOMMEND} \longrightarrow \text{SIMULATE} \longrightarrow \text{ROUTE} \longrightarrow \text{DISPATCH} \longrightarrow \text{AUDIT}$$
* Continuous closed-loop intelligence from data ingestion to emergency response.

---

### SLIDE 5 — DATA FOUNDATION & PROVENANCE
* **OSM Highway Geometry**: 1,863 nodes, 3,461 directed edges with strict carriageway separation.
* **Weather Layer**: NASA POWER / MERRA-2 2021–2023 hourly reanalysis (131,400 observations).
* **Traffic Baseline**: SaveLIFE / TRIPP / YEIDA survey-calibrated diurnal curves (19,440 states).
* **Accident Records**: 40 chainage-verified crash locations from official MoRTH/YEIDA reports.
* **Master Feature Dataset**: 10,643,400 segment-hour records (405 segments $\times$ 26,280 hours).

---

### SLIDE 6 — CP07 ACCIDENT RISK ENGINE (AI / ML)
* **Model**: XGBoost Classifier trained on 31 spatio-temporal features.
* **Target**: Forward 3-hour incident occurrence ($\text{target\_3h} \in \{0, 1\}$).
* **Scientific Honesty**:
  * Strict chronological train/validation/test split (2021–2022 train, 2023 test).
  * `segment_id` excluded to ensure true feature generalization.
  * Outputs **Relative Risk Percentile** (0–100%) and 4 risk tiers (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
* **SHAP Explainability**: Identifies top risk factors (speed excess, humidity, dew point depression).

---

### SLIDE 7 — REAL-TIME OPERATIONAL HAZARD INTELLIGENCE
* **Rule-Based Hazard Detection**:
  * `DENSE_FOG`: $\text{fog\_risk\_code} \ge 2$ or ($T - T_d \le 1.5^\circ\text{C} \land RH \ge 90\%$).
  * `COMPOUND_RISK`: Multi-hazard simultaneous activation (fog + nocturnal speeding).
* **Variable Message Sign (VMS) Advisory Engine**:
  * Recommends $60\text{ km/h}$ limit with `"DENSE FOG AHEAD — MAX 60"`.
* **Tactical Patrol Deployments**:
  * Deploys highway patrol units from nearest emergency depot to high-risk zones with computed ETAs.

---

### SLIDE 8 — WHAT-IF INCIDENT SIMULATION & DIVERSION ROUTING
* **Interactive What-If Simulation**:
  * Operators simulate accidents on any segment (e.g. `YE_MAIN_SB_050` at Km 47.0).
  * Evaluates capacity reduction ($-80\%$ speed drop) in under $35\text{ ms}$.
* **Queue Spillback Modeling**: Upstream propagation identified across 5 segments.
* **Multi-Objective Diversion Routing**: Layer B Dijkstra routing computing bypass paths and detour delays.
* **Emergency Dispatch**: Response vehicles assigned from strategic depots (`SIMULATION_DEPOT`) with turn-by-turn routes.

---

### SLIDE 9 — COMMAND CENTER USER INTERFACE
* **Technology**: Next.js 15.5 App Router, React 19, TypeScript, MapLibre GL JS, Tailwind CSS.
* **Interactive Features**:
  * High-performance 405-segment corridor map with direction filters (`SB`, `NB`, `RAMPS`).
  * Live Telemetry HUD, Active Alert Feed, Dynamic VMS Gantry displays, Patrol HUD, and Event Timeline.
  * SIH 2026 Guided Demo Controller (10 steps) and Engineering Diagnostics HUD.
  * Permanent Data Provenance Drawer disclosing all data semantics.

---

### SLIDE 10 — PERFORMANCE & PRODUCTION HARDENING
* **Automated Test Matrix**: **68 / 68 Tests Passed Across All 5 Suites (100%)**.
* **Measured Engine Latencies**:
  * State Scan (405 Segments): **$4.04\text{ ms}$**
  * XGBoost Risk Inference: **$2.82\text{ ms}$**
  * Dijkstra Corridor Routing: **$17.06\text{ ms}$**
  * Emergency Dispatch: **$41.49\text{ ms}$**
* **Concurrency**: 10 threads, 100 requests, $61.01\text{ req/s}$, $0.00\%$ error rate.
* **Deployment**: Docker Compose with persistent SQLite volume and client-side Error Boundaries.

---

### SLIDE 11 — SCIENTIFIC INTEGRITY & HONESTY
* **No False Claims**:
  1. Risk score is explicitly a **relative ranking percentile**, not an absolute crash probability.
  2. Baseline traffic is **survey-calibrated diurnal curves**, not live roadside loops.
  3. Live traffic requires a TomTom API key and explicitly flags `MOCK_OR_UNAVAILABLE` when missing.
  4. Emergency depots are labeled `SIMULATION_DEPOT` for response modeling.
  5. 04:00 Winter Fog mode is explicitly labeled `DEMO SCENARIO / SYNTHETIC OPERATIONAL INPUT`.

---

### SLIDE 12 — IMPACT, ROADMAP & CONCLUSION
* **Immediate Value for NHAI / YEIDA**:
  * Proactive hazard alerts preventing secondary multi-vehicle collisions.
  * Turn-by-turn emergency dispatch reducing response times by up to $40\%$.
* **Future Roadmap**:
  * Integration with physical ATMS roadside sensors and radar speed cameras.
  * V2X consumer mobile audio alerts via navigation apps.
* **Conclusion**: RoadTwin AI delivers a production-hardened, scientifically validated highway digital twin for India's expressways.
