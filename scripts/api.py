"""
RoadTwin AI — Checkpoint 11
Production Hardened FastAPI Backend & Digital Twin Operational Intelligence Service

Endpoints:
Core / Health / Readiness / Security:
- GET  /health (Liveness)
- GET  /api/v1/system/status (Corridor telemetry & service summary)
- GET  /api/v1/system/readiness (Deep readiness & dependency diagnostic)
- GET  /api/v1/system/diagnostics (Performance benchmarks & engine latency)
- GET  /api/v1/digital-twin/mode
- POST /api/v1/digital-twin/mode

Digital Twin State:
- GET  /api/v1/digital-twin/state
- GET  /api/v1/digital-twin/segment/{segment_id}

Operational Intelligence & Alerts:
- GET  /api/v1/alerts
- GET  /api/v1/alerts/active
- GET  /api/v1/alerts/{alert_id}
- POST /api/v1/alerts/{alert_id}/acknowledge
- GET  /api/v1/operations/vms
- GET  /api/v1/operations/patrol
- GET  /api/v1/operations/timeline

Simulation & Routing (CP08 / CP09):
- POST /api/v1/simulation/incident
- POST /api/v1/routing/diversion
- POST /api/v1/routing/emergency
- GET  /api/v1/simulation/{simulation_id}
- POST /api/v1/simulation/reset

SIH Demo Automation:
- POST /api/v1/demo/step
- POST /api/v1/demo/reset
"""

import os
import sys
import time
import uuid
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, validator

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# Ensure scripts directory is in path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import settings
from digital_twin_state import DigitalTwinStateManager
from incident_simulator import IncidentSimulator
from routing_engine import DynamicRoutingEngine
from emergency_dispatch import EmergencyDispatchEngine
from operational_intelligence import OperationalIntelligenceEngine

# Setup Structured Logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("RoadTwin-API")

# Initialize Core Services (Singletons loaded once at startup)
t_start = time.time()
op_intel_engine = OperationalIntelligenceEngine()
state_manager = op_intel_engine.state_manager
incident_simulator = IncidentSimulator(state_manager)
routing_engine = op_intel_engine.dispatch_engine.routing_engine
dispatch_engine = op_intel_engine.dispatch_engine
startup_duration_sec = round(time.time() - t_start, 3)
logger.info(f"RoadTwin services initialized in {startup_duration_sec}s.")

# FastAPI Application
app = FastAPI(
    title="RoadTwin AI — Highway Digital Twin & Operational Intelligence API",
    description="Production-hardened decision-support platform for Yamuna Expressway Corridor (165 km).",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# --- Request Correlation Middleware ---

class RequestCorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        request.state.request_id = req_id
        start_time = time.time()

        try:
            response: Response = await call_next(request)
            process_time_ms = round((time.time() - start_time) * 1000, 2)
            response.headers["X-Request-ID"] = req_id
            response.headers["X-Process-Time-Ms"] = str(process_time_ms)
            logger.info(
                f"{request.method} {request.url.path} -> {response.status_code} ({process_time_ms}ms)",
                extra={"request_id": req_id}
            )
            return response
        except Exception as exc:
            process_time_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled error on {request.method} {request.url.path}: {str(exc)} ({process_time_ms}ms)",
                extra={"request_id": req_id}
            )
            raise exc

app.add_middleware(RequestCorrelationMiddleware)

# Explicit CORS configuration from centralized settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Request Schemas with Validation ---

class ModeRequest(BaseModel):
    mode: str = Field(..., description="Operational Mode: BASELINE, LIVE, or DEMO_NIGHT_FOG")

    @validator("mode")
    def validate_mode(cls, v):
        v_clean = v.strip().upper()
        if v_clean not in ["BASELINE", "LIVE", "DEMO_NIGHT_FOG"]:
            raise ValueError(f"Invalid mode '{v}'. Must be one of: BASELINE, LIVE, DEMO_NIGHT_FOG.")
        return v_clean


class DemoStepRequest(BaseModel):
    step: int = Field(..., ge=1, le=10, description="SIH Demo step number (1 to 10)")


class IncidentRequest(BaseModel):
    segment_id: str = Field(..., description="Target RoadTwin segment ID (e.g. YE_MAIN_SB_050)")
    incident_type: str = Field("ACCIDENT", description="ACCIDENT, VEHICLE_BREAKDOWN, LANE_CLOSURE, ROAD_CLOSURE, FOG_EVENT")
    severity: str = Field("HIGH", description="LOW, MEDIUM, HIGH, CRITICAL")
    capacity_factor: Optional[float] = Field(None, ge=0.0, le=1.0, description="Capacity factor (0.0 to 1.0)")
    custom_speed_kph: Optional[float] = Field(None, ge=0.0, le=160.0, description="Post-incident speed in km/h")

    @validator("segment_id")
    def validate_segment(cls, v):
        v_clean = v.strip().upper()
        if not v_clean.startswith("YE_"):
            raise ValueError(f"Invalid RoadTwin segment ID '{v}'. Must begin with 'YE_'.")
        return v_clean


class DiversionRequest(BaseModel):
    origin_node: str = Field(..., description="Origin node ID in Layer B graph")
    dest_node: str = Field(..., description="Destination node ID in Layer B graph")
    incident_segment_id: str = Field(..., description="Incident segment ID to bypass")


class EmergencyRouteRequest(BaseModel):
    target_segment_id: str = Field(..., description="Target incident segment ID")
    incident_type: str = Field("ACCIDENT", description="Type of incident")
    severity: str = Field("HIGH", description="Severity level")


class AlertAcknowledgeRequest(BaseModel):
    operator_note: Optional[str] = Field("", max_length=500, description="Operator acknowledgement note")


# --- System, Health & Readiness Routes ---

@app.get("/health")
def health_check():
    """Liveness probe returning basic process health and corridor scale."""
    return {
        "status": "HEALTHY",
        "service": "RoadTwin AI Highway Digital Twin",
        "corridor": "Yamuna Expressway (165 km)",
        "total_segments": len(state_manager.segments_df),
        "graph_nodes": routing_engine.graph.number_of_nodes(),
        "graph_edges": routing_engine.graph.number_of_edges(),
        "timestamp": pd.Timestamp.now().isoformat()
    }


@app.get("/api/v1/system/status")
def get_system_status():
    """Returns high-level system telemetry, provider status, and active alert statistics."""
    return op_intel_engine.get_system_status()


@app.get("/api/v1/system/readiness")
def get_system_readiness():
    """
    Deep readiness probe validating all underlying digital twin subsystems:
    1. Routing Graph (Layer B MultiDiGraph)
    2. Segment Registry (405 Standardized Segments)
    3. CP07 XGBoost Risk Engine Singleton
    4. SQLite Alert Database
    5. Traffic & Weather Providers
    """
    diagnostics = {}
    is_ready = True

    # 1. Graph Check
    try:
        nodes = routing_engine.graph.number_of_nodes()
        edges = routing_engine.graph.number_of_edges()
        diagnostics["graph"] = {
            "status": "READY",
            "nodes": nodes,
            "edges": edges,
            "carriageways": "STRICT_SEPARATION"
        }
    except Exception as e:
        is_ready = False
        diagnostics["graph"] = {"status": "ERROR", "detail": str(e)}

    # 2. Segments Check
    try:
        seg_count = len(state_manager.segments_df)
        assert seg_count == 405, f"Expected 405 segments, found {seg_count}"
        diagnostics["segments"] = {"status": "READY", "count": seg_count}
    except Exception as e:
        is_ready = False
        diagnostics["segments"] = {"status": "ERROR", "detail": str(e)}

    # 3. Risk Engine Check
    try:
        assert state_manager.risk_engine.clf is not None
        assert len(state_manager.risk_engine.feature_names) == 31
        diagnostics["risk_engine"] = {
            "status": "READY",
            "model_type": "CP07_XGBOOST",
            "feature_count": 31,
            "semantics": "RELATIVE_RISK_PERCENTILE"
        }
    except Exception as e:
        is_ready = False
        diagnostics["risk_engine"] = {"status": "ERROR", "detail": str(e)}

    # 4. Database Check
    try:
        conn = op_intel_engine.alert_engine._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM alerts")
        count = cur.fetchone()[0]
        conn.close()
        diagnostics["database"] = {"status": "READY", "persisted_alerts": count}
    except Exception as e:
        is_ready = False
        diagnostics["database"] = {"status": "ERROR", "detail": str(e)}

    # 5. Provider Status
    diagnostics["providers"] = {
        "traffic": {
            "mode": op_intel_engine.current_mode,
            "status": "LIVE" if settings.has_live_traffic_key else "MOCK_OR_UNAVAILABLE",
            "source": "TOMTOM_FLOW_API" if settings.has_live_traffic_key else "SURVEY_CALIBRATED_DIURNAL_BASELINE"
        },
        "weather": {
            "status": "HISTORICAL_REANALYSIS",
            "source": "NASA_POWER_MERRA2"
        }
    }

    return {
        "status": "READY" if is_ready else "NOT_READY",
        "backend": "ONLINE",
        "corridor": "Yamuna Expressway (165 km)",
        "diagnostics": diagnostics,
        "timestamp": pd.Timestamp.now().isoformat()
    }


@app.get("/api/v1/system/diagnostics")
def get_performance_diagnostics():
    """Returns runtime latency benchmarks across core decision-support engines."""
    benchmarks = {}

    # 1. State Scan Latency
    t0 = time.perf_counter()
    df_st = state_manager.get_all_segment_states_df()
    benchmarks["get_all_segment_states_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    # 2. Risk Inference Latency (405 segments)
    t0 = time.perf_counter()
    df_risk = state_manager.risk_engine.predict_risk_for_dataframe(df_st.head(405))
    benchmarks["risk_inference_405_segments_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    # 3. Routing Dijkstra Latency (177 km corridor)
    t0 = time.perf_counter()
    route = routing_engine.find_route("1803900020", "11881660640", mode="NORMAL")
    benchmarks["dijkstra_corridor_routing_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    # 4. Emergency Dispatch Nearest Depot Latency
    t0 = time.perf_counter()
    dispatch = dispatch_engine.find_nearest_depot_and_route("YE_MAIN_SB_050", incident_type="ACCIDENT")
    benchmarks["emergency_dispatch_optimization_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    return {
        "status": "SUCCESS",
        "startup_duration_sec": startup_duration_sec,
        "benchmarks": benchmarks,
        "environment": settings.ENVIRONMENT,
        "timestamp": pd.Timestamp.now().isoformat()
    }


# --- Mode & Digital Twin State Routes ---

@app.get("/api/v1/digital-twin/mode")
def get_operational_mode():
    """Returns the active data operating mode."""
    return {
        "status": "SUCCESS",
        "current_mode": op_intel_engine.current_mode,
        "description": "BASELINE (Survey Diurnal Curves) | LIVE (TomTom Provider) | DEMO_NIGHT_FOG (04:00 Winter Fog Demonstration)"
    }


@app.post("/api/v1/digital-twin/mode")
def set_operational_mode(req: ModeRequest):
    """Switches the operating data mode."""
    try:
        res = op_intel_engine.set_mode(req.mode)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/digital-twin/state")
def get_digital_twin_state(limit: int = Query(405, ge=1, le=405)):
    """Returns the complete corridor state snapshot for all 405 segments in a single network request."""
    df_state = state_manager.get_all_segment_states_df().replace({np.nan: None})
    records = df_state.head(limit).to_dict(orient="records")
    return {
        "status": "SUCCESS",
        "segment_count": len(records),
        "total_corridor_segments": len(df_state),
        "last_update_timestamp": state_manager.last_update_timestamp,
        "segments": records
    }


@app.get("/api/v1/digital-twin/segment/{segment_id}")
def get_segment_detail(segment_id: str):
    """Returns detailed telemetry, physical geometry, and CP07 risk scores for a single segment."""
    segment_id_clean = segment_id.strip().upper()
    state = state_manager.get_segment_state(segment_id_clean)
    if not state:
        raise HTTPException(status_code=404, detail=f"RoadTwin segment '{segment_id}' not found.")
    clean_state = {k: (None if (isinstance(v, float) and np.isnan(v)) else v) for k, v in state.items()}
    return {
        "status": "SUCCESS",
        "segment_id": segment_id_clean,
        "state": clean_state
    }


# --- Alert Engine Routes ---

@app.get("/api/v1/alerts")
def get_all_alerts(limit: int = Query(100, ge=1, le=500)):
    """Returns persistent alert history."""
    alerts = op_intel_engine.alert_engine.get_all_alerts(limit=limit)
    return {
        "status": "SUCCESS",
        "total_alerts": len(alerts),
        "alerts": alerts
    }


@app.get("/api/v1/alerts/active")
def get_active_alerts():
    """Returns all currently active and acknowledged operational alerts."""
    alerts = op_intel_engine.alert_engine.get_active_alerts()
    return {
        "status": "SUCCESS",
        "active_count": len(alerts),
        "alerts": alerts
    }


@app.get("/api/v1/alerts/{alert_id}")
def get_single_alert(alert_id: str):
    """Retrieves an alert by its ID."""
    alert = op_intel_engine.alert_engine.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")
    return {
        "status": "SUCCESS",
        "alert": alert
    }


@app.post("/api/v1/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, req: AlertAcknowledgeRequest = AlertAcknowledgeRequest()):
    """Marks an alert as acknowledged by the traffic controller."""
    ok = op_intel_engine.alert_engine.acknowledge_alert(alert_id, operator_note=req.operator_note or "")
    if not ok:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")
    op_intel_engine.add_timeline_event(
        event_type="ALERT_ACKNOWLEDGED",
        title=f"Alert Acknowledged ({alert_id})",
        description=f"Operator note: {req.operator_note or 'Acknowledged from Command Center'}",
        severity="INFO"
    )
    return {
        "status": "SUCCESS",
        "alert_id": alert_id,
        "message": "Alert acknowledged successfully."
    }


# --- Operations, VMS, Patrol & Timeline ---

@app.get("/api/v1/operations/vms")
def get_vms_advisories():
    """Returns recommended Variable Message Sign (VMS) speed limits and messages for corridor gantries."""
    df_st = state_manager.get_all_segment_states_df()
    active_alerts = op_intel_engine.alert_engine.get_active_alerts()
    advisories = op_intel_engine.vms_engine.generate_advisories_from_state(df_st, active_alerts)
    return {
        "status": "SUCCESS",
        "advisories_count": len(advisories),
        "advisories": advisories
    }


@app.get("/api/v1/operations/patrol")
def get_patrol_recommendations():
    """Returns tactical highway patrol unit deployments for high-risk zones."""
    recs = op_intel_engine.get_patrol_recommendations()
    return {
        "status": "SUCCESS",
        "recommendations_count": len(recs),
        "recommendations": recs
    }


@app.get("/api/v1/operations/timeline")
def get_event_timeline():
    """Returns the operational event timeline audit trail."""
    events = op_intel_engine.get_event_timeline()
    return {
        "status": "SUCCESS",
        "events_count": len(events),
        "events": events
    }


# --- Simulation & Routing (CP08 / CP09) ---

@app.post("/api/v1/simulation/incident")
def simulate_incident_endpoint(req: IncidentRequest):
    """Simulates what-if incident on a segment and evaluates network impact."""
    if req.segment_id not in state_manager.current_state:
        raise HTTPException(status_code=404, detail=f"RoadTwin segment '{req.segment_id}' does not exist.")
    try:
        impact = incident_simulator.simulate_incident(
            segment_id=req.segment_id,
            incident_type=req.incident_type,
            severity=req.severity,
            capacity_factor=req.capacity_factor,
            custom_speed_kph=req.custom_speed_kph
        )
        df_st = state_manager.get_all_segment_states_df()
        op_intel_engine.alert_engine.generate_alerts_from_state_df(df_st)
        op_intel_engine.add_timeline_event(
            event_type="INCIDENT_SIMULATED",
            title=f"Incident Simulated: {req.incident_type} ({req.severity}) on {req.segment_id}",
            description=f"Capacity: {(impact['capacity_factor']*100):.0f}%, Speed: {impact['baseline_speed_kph']} -> {impact['post_incident_speed_kph']} km/h, {impact['affected_segments_count']} segments affected.",
            severity="CRITICAL",
            segment_id=req.segment_id
        )
        return {
            "status": "SUCCESS",
            "impact_report": impact
        }
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/routing/diversion")
def compute_diversion_endpoint(req: DiversionRequest):
    """Computes baseline vs diversion alternative bypass route."""
    res = routing_engine.compute_diversion_route(
        origin_node=req.origin_node,
        dest_node=req.dest_node,
        incident_segment_id=req.incident_segment_id
    )
    return res


@app.post("/api/v1/routing/emergency")
def dispatch_emergency_endpoint(req: EmergencyRouteRequest):
    """Dispatches the closest available emergency response depot to target segment."""
    res = dispatch_engine.find_nearest_depot_and_route(
        target_segment_id=req.target_segment_id,
        incident_type=req.incident_type,
        severity=req.severity
    )
    if res.get("status") == "DISPATCH_ROUTE_FOUND":
        op_intel_engine.add_timeline_event(
            event_type="EMERGENCY_DISPATCH",
            title=f"Emergency Unit Dispatched to {req.target_segment_id}",
            description=f"Depot: {res['assigned_depot']['name']} [{res['assigned_depot']['type']}], Distance: {res.get('distance_km')} km, ETA: {res.get('eta_minutes')} min.",
            severity="INFO",
            segment_id=req.target_segment_id
        )
    return res


@app.get("/api/v1/simulation/{simulation_id}")
def get_simulation_detail(simulation_id: str):
    """Retrieves simulation report by ID."""
    for s_id, inc in incident_simulator.active_incidents.items():
        if inc.get("incident_id") == simulation_id:
            return {"status": "SUCCESS", "incident": inc}
    raise HTTPException(status_code=404, detail=f"Simulation '{simulation_id}' not found.")


@app.post("/api/v1/simulation/reset")
def reset_simulation_endpoint():
    """Clears all active simulated incidents and restores corridor baseline state."""
    active_keys = list(incident_simulator.active_incidents.keys())
    for s_id in active_keys:
        incident_simulator.clear_incident(s_id)
    op_intel_engine.set_mode(op_intel_engine.current_mode)
    op_intel_engine.add_timeline_event(
        event_type="SIMULATION_RESET",
        title="Simulation Cleared",
        description=f"Cleared {len(active_keys)} simulated incident(s). Corridor restored.",
        severity="INFO"
    )
    return {
        "status": "SUCCESS",
        "message": f"Cleared {len(active_keys)} active simulated incident(s). Corridor restored to baseline.",
        "cleared_segments": active_keys
    }


# --- SIH 2026 Dedicated Demo Controller Routes ---

@app.post("/api/v1/demo/step")
def execute_demo_step_endpoint(req: DemoStepRequest):
    """Executes a numbered step in the official SIH 2026 jury demonstration sequence."""
    res = op_intel_engine.execute_demo_step(req.step)
    return {
        "status": "SUCCESS",
        "demo_step": res
    }


@app.post("/api/v1/demo/reset")
def reset_demo_endpoint():
    """Performs a clean reset of the demonstration state to Baseline while preserving database history."""
    # 1. Clear any active simulation incidents
    active_keys = list(incident_simulator.active_incidents.keys())
    for s_id in active_keys:
        incident_simulator.clear_incident(s_id)
    # 2. Reset operational mode to Baseline
    res = op_intel_engine.reset_demo()
    return res


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=False,
        log_level=settings.LOG_LEVEL.lower()
    )
