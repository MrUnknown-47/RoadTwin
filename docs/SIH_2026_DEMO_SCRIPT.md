# ROADTWIN AI — SIH 2026 OFFICIAL JURY DEMONSTRATION SCRIPT
**Smart India Hackathon 2026 — Team CltAltDefeat (ID 404)**
**Corridor: Yamuna Expressway (Greater Noida → Agra, 165 km)**

---

## 1. Fast Overview of Demonstration Tiers

| Tier | Target Duration | Focus | Ideal Context |
| :--- | :---: | :--- | :--- |
| **Tier 1: Elevator Pitch** | **3 Minutes** | Core narrative: Observe $\rightarrow$ Predict $\rightarrow$ Incident Simulation $\rightarrow$ Response | Preliminary Screening |
| **Tier 2: Standard Demonstration** | **5 Minutes** | Full lifecycle: Baseline $\rightarrow$ Fog Hazard $\rightarrow$ VMS $\rightarrow$ Collision $\rightarrow$ Diversion & Dispatch | Main Jury Evaluation |
| **Tier 3: Deep Technical Evaluation**| **10 Minutes** | Architecture, SHAP explainability, graph routing, SQLite persistence, and provenance audit | Technical Grand Finale |

---

## 2. 3-Minute Demonstration Script (Elevator Pitch)

### Step 1: Baseline Corridor State (0:00 – 0:45)
* **What to Click**: Open `http://localhost:3000`. Keep in `BASELINE` mode. Click on segment `YE_MAIN_SB_050` (Km 47.0 Southbound).
* **What the Jury Sees**: Interactive MapLibre canvas rendering 405 standardized segments of Yamuna Expressway in green/blue nominal risk colors. Telemetry HUD showing free-flow speed ($96.8\text{ km/h}$) and nominal traffic.
* **What to Say**:
  > *"Respected Jury, Indian expressways suffer from fragmented incident management where operators only react after a crash happens. RoadTwin AI transforms the 165 km Yamuna Expressway into an intelligent digital twin that transitions highway authorities from reactive emergency response to predictive and proactive decision support. Here you see all 405 segments operating under nominal conditions with physical road telemetry, weather reanalysis, and XGBoost risk ranking."*

### Step 2: Predictive Hazard & Fog Advisory (0:45 – 1:30)
* **What to Click**: Click `[ 04:00 FOG DEMO ]` on the top header $\rightarrow$ Click **VMS** tab.
* **What the Jury Sees**: Map segments transition to elevated risk colors. The VMS tab displays simulated LED display gantries recommending $60\text{ km/h}$ limits with `"DENSE FOG AHEAD — MAX 60"`.
* **What to Say**:
  > *"At 04:00 AM in winter, visibility collapses. RoadTwin AI detects compound hazards combining dense fog ($RH=98\%$) and nocturnal speeding. Our operational intelligence engine immediately triggers automated Variable Message Sign (VMS) advisories, reducing advisory speeds from 100 to 60 km/h and deploying proactive highway patrol units before crashes occur."*

### Step 3: What-If Collision Simulation & Dispatch (1:30 – 2:30)
* **What to Click**: Select `YE_MAIN_SB_050` $\rightarrow$ Click `[ WHAT-IF SIMULATION ]` $\rightarrow$ `ACCIDENT` (`CRITICAL`, `20% Capacity`) $\rightarrow$ `RUN SIMULATION` $\rightarrow$ Click `[ DIVERSION ROUTE ]` $\rightarrow$ Click `[ EMERGENCY DISPATCH ]`.
* **What the Jury Sees**: Segment speed drops from $96.8\text{ km/h}$ to $19.4\text{ km/h}$ ($-80\%$). 5 upstream queue spillback segments highlight in amber. Alternative bypass diversion route renders on the map. Emergency vehicle marker animates from Tappal emergency depot to the crash site ($0.0\text{ km}$, $< 1\text{ min ETA}$).
* **What to Say**:
  > *"When a major collision occurs, operators can simulate network impact in 35 milliseconds. RoadTwin calculates upstream spillback, computes real-time multi-objective diversion routes via Layer B Dijkstra routing, and dispatches the optimal response unit from our strategic response base network with turn-by-turn routing."*

### Step 4: Provenance & Reset (2:30 – 3:00)
* **What to Click**: Click `[ Provenance ]` on the top header $\rightarrow$ Click `[ RESET SIMULATION ]`.
* **What the Jury Sees**: Provenance modal showing full architectural transparency. Simulation resets smoothly to baseline.
* **What to Say**:
  > *"Every single output is labeled with strict scientific provenance. RoadTwin AI is built for real-world NHAI/YEIDA deployment to save lives. Thank you."*

---

## 3. 5-Minute Demonstration Script (Standard Jury Evaluation)

| Stage | Action & Click | Jury View | Spoken Narrative & Technical Defense |
| :--- | :--- | :--- | :--- |
| **0:00 – 1:00**<br>**Introduction & Baseline** | 1. Open dashboard.<br>2. Filter by `SB` (Southbound).<br>3. Select `YE_MAIN_SB_050`. | 201 Southbound segments rendered. Telemetry HUD showing Km 47.0, 3 lanes, speed $96.8\text{ km/h}$, risk percentile $98.5\%$. | *"RoadTwin AI models the entire 165 km Yamuna Expressway as 405 directed segments with strict carriageway separation. We fuse OpenStreetMap roadway topology, 131,400 hours of NASA POWER weather, and 19,440 traffic baseline observations into a unified spatio-temporal state engine."* |
| **1:00 – 2:00**<br>**Predictive Risk & Fog** | 1. Click `[ 04:00 FOG DEMO ]`.<br>2. Switch to **Alerts** tab.<br>3. Click `[ Acknowledge ]` on alert. | Active alert stream populated. High-risk fog alerts flagged `CRITICAL`. Alert status updates to `ACKNOWLEDGED`. | *"Our CP07 XGBoost model evaluates 31 engineered features to rank relative crash risk. In dense winter fog ($RH=98\%$, dew point depression $0.5^\circ\text{C}$), the HazardDetector flags compound risks. Operators acknowledge deduplicated alerts directly in the command center."* |
| **2:00 – 3:00**<br>**VMS & Tactical Patrol** | 1. Switch to **VMS** tab.<br>2. Switch to **Patrol** tab. | VMS dot-matrix LED panels showing $60\text{ km/h}$ advisory limit. Patrol recommendations show tactical deployments from Tappal/Pari Chowk response bases. | *"Rather than waiting for collisions, RoadTwin acts proactively. VMS gantries update speed advisories according to MoRTH guidelines, and patrol units are deployed to high-risk visibility choke points with computed ETAs."* |
| **3:00 – 4:15**<br>**What-If Simulation & Response** | 1. Click `[ WHAT-IF SIMULATION ]`.<br>2. Set Severity `CRITICAL`, Capacity `20%`.<br>3. Click `[ RUN SIMULATION ]`.<br>4. Click `[ DIVERSION ROUTE ]`.<br>5. Click `[ EMERGENCY DISPATCH ]`. | Telemetry shows $-80\%$ speed reduction ($19.4\text{ km/h}$). 5 upstream spillback segments highlighted. Bypass route computed. Emergency ambulance animates along the carriageway. | *"When an incident occurs, our dynamic state engine recalculates Layer B edge weights (1,863 nodes, 3,461 edges). The routing engine calculates multi-objective diversions to prevent secondary crashes, while the emergency engine finds the closest depot in under 45 ms."* |
| **4:15 – 5:00**<br>**Audit, Provenance & Reset** | 1. Switch to **Timeline** tab.<br>2. Click `[ Diagnostics ]`.<br>3. Click `[ RESET SIMULATION ]`. | Chronological audit trail displayed. Diagnostics HUD showing sub-50ms engine benchmarks. Dashboard resets cleanly to Baseline. | *"Every decision is recorded in a tamper-resistant SQLite timeline. Diagnostics confirm sub-50ms inference. We cleanly reset to baseline. We are ready for jury questions."* |

---

## 4. 10-Minute Detailed Technical Walkthrough Script

### Section 1: Spatial Discretization & Network Topology (2 Mins)
* Explain the 405 standardized segments (~500m length, 201 Southbound, 204 Northbound, 39 interchange ramps).
* Explain Layer B MultiDiGraph with 1,863 nodes and 3,461 directed edges. Show that Southbound traffic cannot illegally cross into Northbound edges.

### Section 2: Machine Learning Risk Architecture & Feature Space (2 Mins)
* Explain the CP07 XGBoost model trained on the 10,643,400-row master spatio-temporal dataset.
* Detail the 31 strict features: roadway geometry, diurnal traffic speed and congestion ratios, atmospheric reanalysis, and historical crash lookbacks.
* Defend scientific integrity: `target_3h` is forward-looking, trained chronologically (2021–2022 train, 2023 test), `segment_id` is excluded to prevent overfitting, and output is relative risk percentile for prioritization.

### Section 3: Operational Hazard & VMS Engine (2 Mins)
* Walk through the 6 operational hazard rules (`DENSE_FOG`, `HEAVY_RAIN`, `HIGH_CONGESTION`, `NIGHT_SPEED_EXCESS`, `INCIDENT_ACTIVE`, `COMPOUND_RISK`).
* Walk through the SQLite alert engine with WAL journaling, busy timeouts, and atomic batch deduplication.
* Inspect the VMS advisory engine generating speed limits ($40\text{ km/h}$ for accidents, $60\text{ km/h}$ for fog) and LED messages.

### Section 4: Incident Simulation, Spillback & Dijkstra Routing (2 Mins)
* Trigger a $20\%$ capacity reduction on `YE_MAIN_SB_050`.
* Explain upstream spillback propagation across 5 segments based on density-flow conservation.
* Demonstrate Multi-Objective Dijkstra routing comparing baseline vs detour travel times and delays.

### Section 5: Architecture, Concurrency, Hardening & Security (2 Mins)
* Open `[ Diagnostics ]` modal: show micro-benchmarks ($4.04\text{ ms}$ state scan, $2.82\text{ ms}$ XGBoost inference, $17.06\text{ ms}$ routing).
* Explain Docker multi-stage build, CORS allowlists, `X-Request-ID` correlation middleware, and frontend Error Boundary resilience.

---

## 5. Technical Defense & Contingency Cheat Sheet

| Question / Failure Scenario | Technical Explanation | Recommended Spoken Answer |
| :--- | :--- | :--- |
| **"Is this risk score the actual probability of a crash?"** | Risk score represents relative risk ranking among 405 segments based on CP07 XGBoost training. | *"No, we are scientifically honest: our model outputs a relative risk ranking and percentile for tactical prioritization, not an absolute probability."* |
| **"Where does your traffic data come from?"** | SaveLIFE / TRIPP / YEIDA survey-calibrated diurnal curves (CP05). | *"Baseline traffic represents empirical diurnal speed-flow curves. For live operations, we support TomTom Flow API, and explicitly flag MOCK_OR_UNAVAILABLE when an API key is absent."* |
| **"Are the emergency depots real facilities?"** | Algorithmic placements at major expressway cuts and toll plazas labeled `SIMULATION_DEPOT`. | *"They are strategic simulation depot locations modeled at major cuts and toll plazas for response time optimization."* |
| **"What if the backend process disconnects?"** | Frontend Error Boundary and cached state prevent crashes, displaying a retry banner. | *"Our Next.js dashboard features full Error Boundaries and local caching so the interface never shows a blank screen."* |
