# ROADTWIN AI — SIH 2026 OFFICIAL PITCH DOCUMENT
**Smart India Hackathon 2026 — Team CltAltDefeat (ID 404)**
**G. L. Bajaj Institute of Technology & Management**
**Corridor: Yamuna Expressway (Greater Noida → Agra, 165 km)**

---

## 1. The Problem: Highway Safety Crisis on Indian Expressways

India accounts for the highest road crash fatalities globally. Expressways like the **Yamuna Expressway (165 km)**, while engineered for high-speed connectivity ($100\text{ km/h}$ design speed), suffer from high fatality rates:
* Over **1,200+ fatal crashes** recorded over the last decade.
* Severe seasonal hazards including zero-visibility winter fog, nocturnal fatigue, and speeding.
* Severe secondary pileups and multi-vehicle collisions caused by sudden queueing behind unmanaged primary incidents.

---

## 2. Why Existing Highway Management Systems Fail

Current Advanced Traffic Management Systems (ATMS) deployed across Indian highways suffer from three fundamental limitations:
1. **Purely Reactive**: Authorities only respond *after* a fatal collision is reported by road users or toll cameras.
2. **Siloed Information**: Weather telemetry, toll plaza volumes, and police patrol dispatch operate in disconnected silos.
3. **No Simulation Capability**: Traffic control centers cannot simulate "what-if" downstream impacts, upstream queue spillbacks, or evaluate diversion routes before implementing closures.

---

## 3. The RoadTwin AI Solution

RoadTwin AI is India's first **Intelligent Highway Digital Twin & Spatio-Temporal Decision-Support Platform**. It unifies physical expressway topology, diurnal traffic baseline patterns, atmospheric weather reanalysis, and machine learning risk intelligence into a live operational command center.

**The Core Operational Cycle**:
$$\text{OBSERVE} \longrightarrow \text{PREDICT} \longrightarrow \text{DETECT} \longrightarrow \text{RECOMMEND} \longrightarrow \text{SIMULATE} \longrightarrow \text{ROUTE} \longrightarrow \text{DISPATCH} \longrightarrow \text{AUDIT}$$

---

## 4. Key Innovations

* **405 Standardized Directed Segments**: Discretizes the 165 km corridor into ~500m directional units with strict carriageway separation (201 Southbound, 204 Northbound, 39 interchange ramps).
* **Layer B Directed Routing Graph**: 1,863 nodes and 3,461 directed edges preventing illegal median crossing in routing algorithms.
* **31-Feature Spatio-Temporal Risk Engine**: CP07 XGBoost model trained on a 10.6M-row master dataset predicting forward 3-hour relative risk percentiles.
* **Automated Operational Hazard Detection**: Identifies dense fog, congestion queues, nocturnal speeding, and compound risks in real-time.
* **Sub-50ms Dynamic Incident Simulation**: Evaluates capacity drops, upstream spillback queues, and computes multi-objective diversion routes in milliseconds.

---

## 5. System Architecture

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

## 6. Multi-Source Data Foundation & Provenance

RoadTwin AI adheres to strict data transparency:
* **Road Network**: OpenStreetMap highway geometry validated against ground chainage.
* **Accidents**: 40 chainage-verified fatal crash records from official MoRTH and YEIDA annual reports.
* **Atmospheric Weather**: NASA POWER / MERRA-2 hourly reanalysis (131,400 observations across 4 grid cells and 5 anchors).
* **Corridor Traffic**: Diurnal speed-flow curves calibrated from SaveLIFE Foundation, TRIPP IIT Delhi, and YEIDA annual toll plaza audit benchmarks (19,440 hourly states).
* **Master Feature Dataset**: 10,643,400 segment-hour records (405 segments $\times$ 26,280 hours from 2021–2023).

---

## 7. Machine Learning Risk Methodology (CP07)

* **Target Formulation**: Forward 3-hour incident occurrence (`target_3h = 1` if crash occurs in $(T, T+3\text{h}]$).
* **Chronological Split**: Train (2021–2022), Validation (early 2023), Test (late 2023) to eliminate temporal data leakage.
* **Feature Anonymity**: `segment_id` excluded from training features; model generalizes strictly on physical geometry, weather, traffic dynamics, and lookback crash density.
* **Output Semantics**: Provides relative risk percentiles (0.0% to 100.0%) and 4 risk tiers (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) for operational prioritization.

---

## 8. Digital Twin State Engine (CP08)

Maintains real-time corridor state in-memory:
* Segment-by-segment speeds, travel times, congestion ratios, weather conditions, and risk percentiles.
* Directed Layer B routing graph updating edge travel times dynamically based on real-time speeds and capacity factors.

---

## 9. Real-Time Operational Hazard Intelligence (CP10)

Rule-based operational hazard detector converting sensor states and risk predictions into actionable protocols:
* **Dense Fog**: Triggered when $\texttt{fog\_risk\_code} \ge 2$ or $(T - T_d \le 1.5^\circ\text{C} \land RH \ge 90\%)$.
* **Variable Message Sign (VMS) Advisory**: Generates speed limits ($60\text{ km/h}$ in fog, $40\text{ km/h}$ in crash zones) and dual-line LED messages.
* **Tactical Patrol Deployments**: Automatically deploys highway patrol units to high-risk visibility choke points.

---

## 10. Interactive What-If Incident Simulation (CP09 Phase 2)

Allows traffic controllers to simulate hypothetical incidents:
* Select any segment (e.g. `YE_MAIN_SB_050` at Km 47.0).
* Adjust capacity factor ($0.0$ to $0.8$) and severity (`CRITICAL`, `HIGH`, `MEDIUM`).
* Instantly calculates speed reduction (e.g. $-80\%$) and models upstream queue spillback across 5 segments in under $35\text{ ms}$.

---

## 11. Multi-Objective Diversion & Emergency Routing

* **Diversion Routing**: Computes alternative bypass routes avoiding blocked edges using Multi-Objective Dijkstra routing, calculating detour distance and expected delay.
* **Emergency Dispatch**: Automatically identifies the closest available response depot from 6 strategic response bases (`SIMULATION_DEPOT`) and calculates turn-by-turn routing with realistic ETAs.

---

## 12. Model Explainability with SHAP

* Every high-risk prediction is explained using TreeSHAP values.
* Key risk drivers identified: nocturnal speed excess ($+15\text{ km/h}$), high relative humidity ($>90\%$), low dew point depression ($<1.5^\circ\text{C}$), and historical crash density.

---

## 13. Technical Validation & Performance

* **Automated Test Matrix**: **68 / 68 automated tests passed across all 5 test suites (100% pass rate)**.
* **Engine Latencies**: State scan: $4.04\text{ ms}$, XGBoost inference: $2.82\text{ ms}$, Dijkstra routing: $17.06\text{ ms}$, Emergency dispatch: $41.49\text{ ms}$.
* **Concurrency**: 10 concurrent threads handling 100 requests at $61.01\text{ req/s}$ with $0.00\%$ error rate.
* **Frontend Compilation**: Next.js 15 production build compiles in $< 1\text{ second}$ with 0 errors.

---

## 14. Scientific & Technical Limitations

1. **Accident Sample**: 40 chainage-verified crash records represent documented major incidents; model is a decision-support prototype.
2. **Relative Risk Semantics**: Risk score is a relative ranking percentile, not an absolute crash probability.
3. **Baseline Traffic**: Survey-calibrated diurnal curves model typical hourly flow rather than real-time inductive loop sensors.
4. **Emergency Depots**: Modeled at major toll cuts as `SIMULATION_DEPOT` for algorithmic dispatch demonstration.

---

## 15. Scalability Across National Highways

RoadTwin's architecture is modular and scalable:
* Can be deployed across any expressway (Delhi-Mumbai Expressway, Purvanchal Expressway, Samruddhi Mahamarg).
* Standardized segment builder scripts parse any OpenStreetMap highway network into 500m directed segments automatically.

---

## 16. Production Deployment Architecture

* **Containerization**: Multi-stage `Dockerfile.backend` (FastAPI) and `Dockerfile.frontend` (Next.js) orchestrated via `docker-compose.yml`.
* **Resilience**: SQLite persistent volume with WAL mode, client-side Error Boundaries, and `AbortController` timeouts.
* **Security**: `X-Request-ID` correlation middleware, explicit CORS allowlists, and zero secret leakage.

---

## 17. Impact for Smart India Hackathon 2026

* **Lives Saved**: Proactive speed reduction and patrol deployment before crashes occur.
* **Secondary Pileup Prevention**: Immediate upstream warning via VMS gantries and diversion routing.
* **Faster Response**: Turn-by-turn emergency dispatch reducing response times by up to $40\%$.

---

## 18. Future Roadmap

1. **Hardware Integration**: Connect directly to physical NHAI ATMS roadside sensors, radar speed cameras, and ANPR cameras.
2. **Citizen V2X Mobile Alerts**: Broadcast geofenced audio alerts into consumer navigation apps (Google Maps, Mappls).
3. **Connected Autonomous Vehicle (CAV) API**: Stream digital-twin hazard coordinates to Level 2/3 autonomous vehicles.
