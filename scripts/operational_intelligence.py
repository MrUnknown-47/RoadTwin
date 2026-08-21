"""
RoadTwin AI — Checkpoint 10
Operational Intelligence Master Engine

This module connects:
1. DigitalTwinStateManager (CP08)
2. AlertEngine & HazardDetector (CP10)
3. VMSAdvisoryEngine (CP10)
4. EmergencyDispatchEngine (CP08)
5. Mode Orchestrator (BASELINE vs LIVE vs DEMO_NIGHT_FOG)
6. Event Timeline Log
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

import numpy as np
import pandas as pd

# Add scripts directory to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

from config import settings
from digital_twin_state import DigitalTwinStateManager
from alert_engine import AlertEngine, HazardDetector
from vms_advisory import VMSAdvisoryEngine
from emergency_dispatch import EmergencyDispatchEngine

logger = logging.getLogger("RoadTwin-OpIntel")

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class OperationalIntelligenceEngine:
    """
    Central orchestration engine for operational intelligence, alerts, VMS advisories,
    and patrol recommendations.
    """

    def __init__(self, state_manager: DigitalTwinStateManager = None):
        self.state_manager = state_manager or DigitalTwinStateManager(mode="BASELINE")
        self.alert_engine = AlertEngine()
        self.vms_engine = VMSAdvisoryEngine()
        self.dispatch_engine = EmergencyDispatchEngine()
        
        # Operational Mode: 'BASELINE', 'LIVE', 'DEMO_NIGHT_FOG'
        self.current_mode = "BASELINE"
        self.timeline_events: List[Dict[str, Any]] = []

        # Log system boot event
        self.add_timeline_event(
            event_type="SYSTEM_INITIALIZED",
            title="RoadTwin AI Digital Twin Operational Engine Online",
            description="System ready in BASELINE mode. 405 segments monitored via CP07 XGBoost.",
            severity="INFO",
            segment_id=None
        )
        logger.info("OperationalIntelligenceEngine initialized.")

    def set_mode(self, mode: str) -> Dict[str, Any]:
        """
        Switches the operational data mode between BASELINE, LIVE, and DEMO_NIGHT_FOG.
        """
        mode = mode.upper()
        if mode not in ["BASELINE", "LIVE", "DEMO_NIGHT_FOG"]:
            raise ValueError(f"Invalid mode: {mode}. Must be BASELINE, LIVE, or DEMO_NIGHT_FOG.")

        self.current_mode = mode
        
        if mode == "BASELINE":
            # Baseline Daytime Off-Peak Hour 14
            self.state_manager.initialize_state_snapshot(
                hour_of_day=14, is_weekend=False, month=1, season_code=0,
                fog_risk_code=0, ambient_temp_c=22.0, humidity_pct=65.0, wind_speed_ms=2.5
            )
            self.add_timeline_event(
                event_type="MODE_SWITCH",
                title="Switched to BASELINE Mode",
                description="Using survey-calibrated diurnal traffic curves & NASA POWER reanalysis.",
                severity="INFO"
            )
        elif mode == "LIVE":
            # Attempt live adapter; if no API key, explicitly fallback to baseline with transparent label
            self.state_manager.initialize_state_snapshot(
                hour_of_day=datetime.now().hour, is_weekend=(datetime.now().weekday() >= 5)
            )
            live_applied_count = 0
            if settings.has_live_traffic_key:
                try:
                    from ingest_traffic_data import TomTomTrafficProvider
                    provider = TomTomTrafficProvider(api_key=settings.TOMTOM_API_KEY)
                    anchor_points = [
                        {"name": "Greater Noida (Km 0.0)", "lat": 28.4480, "lon": 77.5020, "sb": "YE_MAIN_SB_001", "nb": "YE_MAIN_NB_183"},
                        {"name": "Jewar Toll Area (Km 35.0)", "lat": 28.1465, "lon": 77.5850, "sb": "YE_MAIN_SB_037", "nb": "YE_MAIN_NB_148"},
                        {"name": "Tappal Interchange (Km 50.0)", "lat": 28.0250, "lon": 77.6250, "sb": "YE_MAIN_SB_051", "nb": "YE_MAIN_NB_134"},
                        {"name": "Mathura / Raya Cut (Km 103.0)", "lat": 27.5680, "lon": 77.7850, "sb": "YE_MAIN_SB_111", "nb": "YE_MAIN_NB_074"},
                        {"name": "Khandauli Toll (Km 141.0)", "lat": 27.2850, "lon": 77.9850, "sb": "YE_MAIN_SB_154", "nb": "YE_MAIN_NB_030"},
                        {"name": "Agra / Kuberpur (Km 165.0)", "lat": 27.1430, "lon": 78.1180, "sb": "YE_MAIN_SB_178", "nb": "YE_MAIN_NB_006"},
                    ]
                    for pt in anchor_points:
                        res = provider.query_live_flow_point(pt["lat"], pt["lon"], pt["name"])
                        if res.get("status") == "SUCCESS":
                            cs = float(res.get("currentSpeed", 0.0))
                            ff = float(res.get("freeFlowSpeed", 0.0))
                            if cs > 0 and ff > 0:
                                cr = max(0.0, min(1.0, 1.0 - (cs / ff)))
                                for target_id in [pt["sb"], pt["nb"]]:
                                    if target_id in self.state_manager.current_state:
                                        curr = self.state_manager.current_state[target_id]
                                        curr["speed_kph"] = cs
                                        curr["free_flow_speed_kph"] = ff
                                        curr["congestion_ratio"] = round(cr, 4)
                                        curr["speed_excess_kph"] = max(0.0, cs - ff)
                                        length_m = float(curr.get("length_m", 500.0))
                                        curr["travel_time_seconds"] = round(length_m / (cs / 3.6), 1)
                                        curr["speed_source"] = "TOMTOM_LIVE_TRAFFIC_FLOW"
                                        curr["live_traffic_status"] = "LIVE"
                                        live_applied_count += 1

                    if live_applied_count > 0:
                        # Recompute CP07 Risk Inference for all segments
                        df_st = self.state_manager.get_all_segment_states_df()
                        df_risk = self.state_manager.risk_engine.predict_risk_for_dataframe(df_st)
                        for idx, r in df_risk.iterrows():
                            self.state_manager.current_state[r["segment_id"]] = r.to_dict()

                except Exception as e:
                    logger.warning(f"Error querying live TomTom flow: {e}")

            self.add_timeline_event(
                event_type="MODE_SWITCH",
                title="Switched to LIVE Mode",
                description=f"TomTom Flow API active ({live_applied_count} representative segments updated with live telemetry)." if live_applied_count > 0 else "TomTom API Key not detected or unavailable. Operating in MOCK_OR_UNAVAILABLE mode with baseline fallback.",
                severity="ADVISORY"
            )
        elif mode == "DEMO_NIGHT_FOG":
            # Deterministic Demonstration Scenario: 04:00 IST Winter Fog + Night Speed Excess
            self.state_manager.initialize_state_snapshot(
                hour_of_day=4, is_weekend=False, month=1, season_code=0,
                fog_risk_code=3, ambient_temp_c=9.5, humidity_pct=98.0, wind_speed_ms=1.2
            )
            # Inject nocturnal speed excess on high-risk corridor segments
            for seg_id in ["YE_MAIN_SB_050", "YE_MAIN_SB_051", "YE_MAIN_SB_080"]:
                if seg_id in self.state_manager.current_state:
                    curr = self.state_manager.current_state[seg_id]
                    curr["speed_kph"] = 115.0 # Speeding in fog
                    curr["speed_excess_kph"] = 15.0
                    curr["dew_point_depression_c"] = 0.5
            
            # Recompute Risk
            df_st = self.state_manager.get_all_segment_states_df()
            df_risk = self.state_manager.risk_engine.predict_risk_for_dataframe(df_st)
            for idx, r in df_risk.iterrows():
                self.state_manager.current_state[r["segment_id"]] = r.to_dict()

            self.add_timeline_event(
                event_type="MODE_SWITCH",
                title="Switched to DEMO 04:00 NIGHT FOG Scenario",
                description="[DEMO SCENARIO / SYNTHETIC OPERATIONAL INPUT]: 04:00 IST, Dense Fog (RH 98%), Speed Excess.",
                severity="WARNING",
                segment_id="YE_MAIN_SB_050"
            )

        # Refresh Alerts & VMS
        df_updated = self.state_manager.get_all_segment_states_df()
        new_alerts = self.alert_engine.generate_alerts_from_state_df(df_updated)

        return {
            "status": "SUCCESS",
            "current_mode": self.current_mode,
            "generated_alerts_count": len(new_alerts),
            "timestamp": datetime.now().isoformat()
        }

    def get_system_status(self) -> Dict[str, Any]:
        """Returns comprehensive system health, provider status, and operational telemetry."""
        df_state = self.state_manager.get_all_segment_states_df()
        active_alerts = self.alert_engine.get_active_alerts()
        has_tomtom_key = settings.has_live_traffic_key

        return {
            "status": "HEALTHY",
            "backend": "ONLINE",
            "digital_twin": "READY",
            "mode": self.current_mode,
            "corridor": "Yamuna Expressway (165 km)",
            "segments_monitored": len(df_state),
            "graph_nodes": self.dispatch_engine.routing_engine.graph.number_of_nodes(),
            "graph_edges": self.dispatch_engine.routing_engine.graph.number_of_edges(),
            "risk_engine": {
                "status": "READY",
                "model_type": "CP07_XGBOOST",
                "feature_count": 31,
                "output_semantics": "RELATIVE_RISK_PERCENTILE"
            },
            "traffic_provider": {
                "configured_mode": self.current_mode,
                "status": "LIVE" if has_tomtom_key else "MOCK_OR_UNAVAILABLE",
                "source": "TOMTOM_FLOW_API" if has_tomtom_key else "SURVEY_CALIBRATED_DIURNAL_BASELINE",
                "tomtom_configured": has_tomtom_key
            },
            "weather_provider": {
                "status": "HISTORICAL_REANALYSIS",
                "source": "NASA_POWER_MERRA2",
                "grid_cells": 4,
                "anchors": 5
            },
            "active_alerts_count": len(active_alerts),
            "critical_alerts_count": sum(1 for a in active_alerts if a["severity"] == "CRITICAL"),
            "timestamp": datetime.now().isoformat()
        }

    def get_patrol_recommendations(self) -> List[Dict[str, Any]]:
        """
        Generates tactical highway patrol unit dispatch recommendations for high/critical hazard segments.
        """
        df_state = self.state_manager.get_all_segment_states_df()
        active_alerts = self.alert_engine.get_active_alerts()
        
        # High priority segments (Critical Alerts or High Risk)
        target_segs = []
        for a in active_alerts:
            if a["severity"] in ["CRITICAL", "WARNING"] and a["segment_id"] not in target_segs:
                target_segs.append(a["segment_id"])

        # Fallback to key corridor checkpoint segments if no active hazard alerts
        if len(target_segs) == 0:
            target_segs = ["YE_MAIN_SB_040", "YE_MAIN_SB_050", "YE_MAIN_SB_110", "YE_MAIN_SB_150"]

        recommendations = []
        for seg_id in target_segs[:6]: # Limit to top 6 priority patrols
            seg_row = df_state[df_state["segment_id"] == seg_id]
            if len(seg_row) == 0:
                continue
            r = seg_row.iloc[0]

            dispatch = self.dispatch_engine.find_nearest_depot_and_route(
                target_segment_id=seg_id,
                incident_type="HAZARD_PATROL",
                severity="HIGH"
            )

            depot = dispatch["assigned_depot"]
            recommendations.append({
                "patrol_id": f"PATROL_REC_{seg_id}",
                "target_segment_id": seg_id,
                "chainage_km": round(float(r.get("chainage_start_km", 0.0)), 1),
                "direction": str(r.get("direction", "SB")),
                "assigned_depot": depot["name"],
                "depot_type": depot["type"],
                "eta_minutes": dispatch.get("eta_minutes", 10.0),
                "distance_km": dispatch.get("distance_km", 15.0),
                "tactical_objective": "VISIBILITY SURVEILLANCE & SPEED RADAR INTERCEPTION",
                "status": "RECOMMENDED",
                "dispatch_source": "SIMULATION_DEPOT (Decision Support)"
            })

        return recommendations

    def add_timeline_event(self, event_type: str, title: str, description: str,
                           severity: str = "INFO", segment_id: Optional[str] = None):
        """Appends an operational event to the chronological timeline."""
        event = {
            "event_id": f"EVT_{datetime.now().strftime('%Y%m%d%H%M%S%f')[:17]}",
            "event_type": event_type,
            "title": title,
            "description": description,
            "severity": severity,
            "segment_id": segment_id,
            "timestamp": datetime.now().isoformat(),
            "time_str": datetime.now().strftime("%H:%M:%S")
        }
        self.timeline_events.insert(0, event)
        if len(self.timeline_events) > 50:
            self.timeline_events = self.timeline_events[:50]
        return event

    def get_event_timeline(self) -> List[Dict[str, Any]]:
        """Returns recent chronological event timeline."""
        return self.timeline_events

    def execute_demo_step(self, step: int) -> Dict[str, Any]:
        """
        Executes a specific step of the SIH 2026 jury demonstration sequence.
        Steps:
        1: BASELINE NOMINAL
        2: 04:00 WINTER FOG & NOCTURNAL SPEEDING
        3: HAZARDS & COMPOUND RISK IDENTIFICATION
        4: CRITICAL OPERATIONAL ALERTS
        5: VMS SPEED ADVISORY ACTIVATION (60 km/h)
        6: TACTICAL HIGHWAY PATROL DEPLOYMENT
        7: WHAT-IF INCIDENT SIMULATION (YE_MAIN_SB_050)
        8: MULTI-OBJECTIVE DIVERSION ROUTING
        9: EMERGENCY VEHICLE DISPATCH
        10: EVENT TIMELINE & JURY DEBRIEF
        """
        step = max(1, min(10, step))
        
        if step == 1:
            self.set_mode("BASELINE")
            return {
                "step": 1,
                "title": "Corridor Baseline State",
                "description": "Nominal daylight conditions. 405 segments operating at free-flow speeds.",
                "target_segment_id": "YE_MAIN_SB_050",
                "active_tab": "TELEMETRY"
            }
        elif step in [2, 3, 4]:
            self.set_mode("DEMO_NIGHT_FOG")
            return {
                "step": step,
                "title": "04:00 Winter Fog & Compound Risk Hazard",
                "description": "[DEMO SCENARIO]: RH 98%, low visibility, nocturnal speeding. Dense fog alerts generated.",
                "target_segment_id": "YE_MAIN_SB_050",
                "active_tab": "ALERTS"
            }
        elif step == 5:
            return {
                "step": 5,
                "title": "Variable Message Sign (VMS) Advisory",
                "description": "VMS policy lowers advisory speed to 60 km/h: 'DENSE FOG AHEAD — MAX 60'.",
                "target_segment_id": "YE_MAIN_SB_050",
                "active_tab": "VMS"
            }
        elif step == 6:
            return {
                "step": 6,
                "title": "Tactical Patrol Deployment",
                "description": "Patrol units deployed to high-risk visibility choke points from strategic response bases.",
                "target_segment_id": "YE_MAIN_SB_050",
                "active_tab": "PATROL"
            }
        elif step in [7, 8, 9]:
            return {
                "step": step,
                "title": "What-If Incident Simulation & Response",
                "description": "Accident on YE_MAIN_SB_050 (Km 47). Spillback evaluated, diversion calculated, emergency unit dispatched.",
                "target_segment_id": "YE_MAIN_SB_050",
                "active_tab": "TELEMETRY"
            }
        else: # Step 10
            return {
                "step": 10,
                "title": "Operational Event Audit Log",
                "description": "Complete chronological timeline of all predictive, preventive, and emergency response actions.",
                "target_segment_id": "YE_MAIN_SB_050",
                "active_tab": "TIMELINE"
            }

    def reset_demo(self) -> Dict[str, Any]:
        """Performs clean reset of demo state to Baseline without deleting persistent history."""
        self.set_mode("BASELINE")
        self.add_timeline_event(
            event_type="DEMO_RESET",
            title="SIH Demonstration Reset",
            description="Restored corridor to nominal baseline state. Historical records preserved in SQLite.",
            severity="INFO"
        )
        return {
            "status": "SUCCESS",
            "message": "Demo state successfully reset to Baseline.",
            "mode": "BASELINE"
        }


if __name__ == "__main__":
    engine = OperationalIntelligenceEngine()
    print("System Status:", json.dumps(engine.get_system_status(), indent=2))
    
    # Test Demo Night Fog Mode
    res_demo = engine.set_mode("DEMO_NIGHT_FOG")
    print("\nDemo Mode Switch Result:", json.dumps(res_demo, indent=2))
    
    alerts = engine.alert_engine.get_active_alerts()
    print(f"\nActive Alerts in Demo Fog Mode: {len(alerts)}")
    if alerts:
        print("Top Alert:", json.dumps(alerts[0], indent=2))
        
    vms = engine.vms_engine.generate_advisories_from_state(engine.state_manager.get_all_segment_states_df(), alerts)
    print(f"\nGenerated VMS Advisories: {len(vms)}")
    if vms:
        print("Top VMS Advisory:", json.dumps(vms[0], indent=2))
