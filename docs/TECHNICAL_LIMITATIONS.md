# ROADTWIN AI — TECHNICAL & OPERATIONAL LIMITATIONS
**Smart India Hackathon 2026 — Team CltAltDefeat (ID 404)**
**Corridor: Yamuna Expressway (Greater Noida → Agra, 165 km)**

---

## 1. Executive Statement on Scientific Integrity

RoadTwin AI is designed as a **decision-support prototype** for intelligent expressway management. In accordance with the scientific integrity standards of SIH 2026, this document explicitly details the assumptions, boundary conditions, and technical limitations of the system.

---

## 2. Machine Learning Risk Model Limitations (CP07)

1. **Small Accident Sample**:
   * The historical ground-truth dataset consists of **40 chainage-verified crash records** extracted from official annual safety audits (MoRTH / YEIDA).
   * While representative of major reported fatal incidents, the sample size is small relative to the 10.6M segment-hour space.
2. **Relative Risk Ranking vs Absolute Probability**:
   * The CP07 XGBoost model predicts a **relative risk score / percentile** (0.0% to 100.0%) for ranking segments relative to corridor-wide historical patterns.
   * Model outputs must **NOT** be interpreted as literal crash probabilities (e.g. a score of 0.056 does not mean a 5.6% probability of a crash occurring within the hour).
3. **No Direct Causal Inference**:
   * The model identifies spatio-temporal statistical correlations (e.g. nocturnal speeding combined with high relative humidity). It does not model microscopic vehicle kinematics or driver behavioral impairment.

---

## 3. Traffic Data Provenance & Telemetry Assumptions

1. **Survey-Calibrated Diurnal Baseline**:
   * The baseline traffic layer represents empirical diurnal speed-flow curves calibrated from published SaveLIFE Foundation, TRIPP IIT Delhi, and YEIDA toll plaza volume reports.
   * Baseline traffic represents typical hourly patterns rather than live roadside inductive loop sensors.
2. **Live Traffic Provider Dependency**:
   * Real-time traffic flow requires a valid external provider API key (`TOMTOM_API_KEY`).
   * When unconfigured or unreachable, the system explicitly operates in `MOCK_OR_UNAVAILABLE` fallback mode backed by the survey diurnal baseline.

---

## 4. Atmospheric Weather Reanalysis Assumptions

1. **Spatial Resolution**:
   * Weather telemetry is derived from NASA POWER / MERRA-2 historical hourly reanalysis across 4 grid cells and 5 anchor points along the 165 km corridor.
   * Micro-climatic localized fog patches occurring between grid points are interpolated via nearest-neighbor spatial mapping.
2. **Historical vs Live Weather**:
   * Baseline mode utilizes 2021–2023 hourly historical reanalysis to simulate realistic seasonal atmospheric dynamics.

---

## 5. Simulation & Operational Assumptions

1. **Emergency Depots (`SIMULATION_DEPOT`)**:
   * Emergency response facilities are modeled at strategic expressway cuts and toll plazas (Pari Chowk, Jewar, Tappal, Mathura, Khandauli, Agra).
   * These stations are labeled `SIMULATION_DEPOT` for response time optimization modeling and do not represent verified operational hospital emergency bays.
2. **Variable Message Sign (VMS) Policies**:
   * Speed limit reductions and LED display messages are generated via `VMS_POLICY_ASSUMPTION` rules based on MoRTH winter safety guidelines.
   * In a production deployment, these recommendations serve as decision support for human traffic controllers before actuating physical highway displays.
3. **Synthetic Demonstration Scenario (`DEMO_NIGHT_FOG`)**:
   * The 04:00 winter fog demonstration mode uses deterministic synthetic operational inputs ($T=9.5^\circ\text{C}, RH=98\%, \text{fog\_risk\_code}=3, \text{speed\_excess}=+15\text{ km/h}$) to demonstrate offline operational capability.

---

## 6. Recommendations for Operational Deployment

To transition RoadTwin AI from an SIH decision-support prototype into a live field-deployed system:
1. **IoT Sensor Ingestion**: Ingest live roadside radar speed cameras, automatic number plate recognition (ANPR) feeds, and automated weather stations (AWS).
2. **Model Retraining with Continuous Crash Logs**: Connect directly to state police Integrated Road Accident Database (iRAD) feeds for continuous retraining.
3. **Hardware Actuator Integration**: Connect VMS advisory endpoints to NTCIP-compliant physical display controllers.
