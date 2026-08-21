"""
RoadTwin AI — Checkpoint 10
Variable Message Sign (VMS) Speed Advisory & Message Recommendation Engine

This module implements:
1. VMSAdvisoryEngine:
   - Evaluates active operational hazards & CP07 risk levels.
   - Generates advisory speeds and dynamic message board displays along Yamuna Expressway gantries.
   - Explicitly framed as DECISION SUPPORT recommendations labeled VMS_POLICY_ASSUMPTION.
"""

import os
import sys
import json
import logging
from typing import Dict, List, Any, Optional
import pandas as pd

logger = logging.getLogger("RoadTwin-VMSAdvisory")

# Configurable VMS Policy Table (Explicitly Labeled VMS_POLICY_ASSUMPTION)
VMS_POLICY_RULES = {
    "INCIDENT_ACTIVE": {
        "advisory_speed_kph": 40,
        "primary_message": "CRASH AHEAD — SLOW DOWN",
        "secondary_message": "CAUTION · MERGE SAFELY",
        "color_code": "#EF4444",
        "policy_source": "VMS_POLICY_ASSUMPTION (Severe Obstruction Speed Reduction)"
    },
    "DENSE_FOG": {
        "advisory_speed_kph": 60,
        "primary_message": "DENSE FOG AHEAD — MAX 60",
        "secondary_message": "USE LOW BEAMS · 50M GAP",
        "color_code": "#F97316",
        "policy_source": "VMS_POLICY_ASSUMPTION (MoRTH Winter Fog Standard Advisory)"
    },
    "HEAVY_RAIN": {
        "advisory_speed_kph": 70,
        "primary_message": "WET SURFACE — MAX 70",
        "secondary_message": "HYDROPLANING RISK · DRIVE SLOW",
        "color_code": "#38BDF8",
        "policy_source": "VMS_POLICY_ASSUMPTION (Wet Asphalt Friction Advisory)"
    },
    "HIGH_CONGESTION": {
        "advisory_speed_kph": 50,
        "primary_message": "QUEUE AHEAD — EXPECT DELAY",
        "secondary_message": "REDUCE SPEED · NO OVERTAKING",
        "color_code": "#FBBF24",
        "policy_source": "VMS_POLICY_ASSUMPTION (Queue Protection Advisory)"
    },
    "NIGHT_SPEED_EXCESS": {
        "advisory_speed_kph": 80,
        "primary_message": "SPEED RADAR ACTIVE",
        "secondary_message": "STRICT 100 KM/H LIMIT",
        "color_code": "#A855F7",
        "policy_source": "VMS_POLICY_ASSUMPTION (Nocturnal Radar Enforcement)"
    },
    "COMPOUND_RISK": {
        "advisory_speed_kph": 50,
        "primary_message": "HAZARD ZONE — EXTREME CAUTION",
        "secondary_message": "REDUCE SPEED · ADHERE TO SIGNS",
        "color_code": "#EF4444",
        "policy_source": "VMS_POLICY_ASSUMPTION (Compound Hazard Multi-Warning)"
    },
    "DEFAULT_CLEAR": {
        "advisory_speed_kph": 100,
        "primary_message": "YAMUNA EXPRESSWAY",
        "secondary_message": "DRIVE SAFELY · FASTEN SEATBELTS",
        "color_code": "#10B981",
        "policy_source": "VMS_POLICY_ASSUMPTION (Corridor Baseline Advisory)"
    }
}


class VMSAdvisoryEngine:
    """
    Generates operational VMS speed advisories and display recommendations for expressway gantries.
    """

    def __init__(self):
        self.policy_rules = VMS_POLICY_RULES
        logger.info("VMSAdvisoryEngine initialized with policy table.")

    def generate_advisories_from_state(self, df_state: pd.DataFrame, active_alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Evaluates active alerts and segment states to generate corridor-wide VMS recommendations.
        """
        alerts_by_segment: Dict[str, List[Dict[str, Any]]] = {}
        for a in active_alerts:
            s_id = a.get("segment_id")
            if s_id:
                alerts_by_segment.setdefault(s_id, []).append(a)

        advisories = []

        # If there are specific active alerts, generate prioritized VMS advisories
        for seg_id, seg_alerts in alerts_by_segment.items():
            seg_row = df_state[df_state["segment_id"] == seg_id]
            if len(seg_row) == 0:
                continue
            r = seg_row.iloc[0]

            # Priority: INCIDENT_ACTIVE > COMPOUND_RISK > DENSE_FOG > HIGH_CONGESTION > HEAVY_RAIN > NIGHT_SPEED_EXCESS
            top_hazard = "DEFAULT_CLEAR"
            hazard_types = [a["hazard_type"] for a in seg_alerts]
            
            if "INCIDENT_ACTIVE" in hazard_types:
                top_hazard = "INCIDENT_ACTIVE"
            elif "COMPOUND_RISK" in hazard_types:
                top_hazard = "COMPOUND_RISK"
            elif "DENSE_FOG" in hazard_types:
                top_hazard = "DENSE_FOG"
            elif "HIGH_CONGESTION" in hazard_types:
                top_hazard = "HIGH_CONGESTION"
            elif "HEAVY_RAIN" in hazard_types:
                top_hazard = "HEAVY_RAIN"
            elif "NIGHT_SPEED_EXCESS" in hazard_types:
                top_hazard = "NIGHT_SPEED_EXCESS"

            rule = self.policy_rules.get(top_hazard, self.policy_rules["DEFAULT_CLEAR"])
            chainage = float(r.get("chainage_start_km", 0.0))
            direction = str(r.get("direction", "SB"))

            advisories.append({
                "vms_id": f"VMS_{seg_id}",
                "segment_id": seg_id,
                "direction": direction,
                "chainage_km": round(chainage, 1),
                "trigger_hazard": top_hazard,
                "recommended_advisory_speed_kph": rule["advisory_speed_kph"],
                "current_operating_speed_kph": round(float(r.get("speed_kph", 90.0)), 1),
                "free_flow_speed_kph": round(float(r.get("free_flow_speed_kph", 96.5)), 1),
                "primary_message": rule["primary_message"],
                "secondary_message": rule["secondary_message"],
                "color_code": rule["color_code"],
                "policy_source": rule["policy_source"],
                "status": "RECOMMENDED"
            })

        # If no active alerts, provide standard corridor advisory at key interchange toll plazas
        if len(advisories) == 0:
            key_plazas = [
                {"seg_id": "YE_MAIN_SB_001", "name": "Pari Chowk Gantry (Km 0.0)", "km": 0.0, "dir": "SB"},
                {"seg_id": "YE_MAIN_SB_040", "name": "Jewar Toll Gantry (Km 38.0)", "km": 38.0, "dir": "SB"},
                {"seg_id": "YE_MAIN_SB_110", "name": "Mathura Raya Gantry (Km 103.0)", "km": 103.0, "dir": "SB"},
                {"seg_id": "YE_MAIN_SB_150", "name": "Khandauli Toll Gantry (Km 141.0)", "km": 141.0, "dir": "SB"},
            ]
            for p in key_plazas:
                advisories.append({
                    "vms_id": f"VMS_{p['seg_id']}",
                    "segment_id": p["seg_id"],
                    "direction": p["dir"],
                    "chainage_km": p["km"],
                    "trigger_hazard": "NONE",
                    "recommended_advisory_speed_kph": 100,
                    "current_operating_speed_kph": 90.7,
                    "free_flow_speed_kph": 96.5,
                    "primary_message": "YAMUNA EXPRESSWAY — DRIVE SAFELY",
                    "secondary_message": "SPEED LIMIT 100 KM/H · FASTEN SEATBELT",
                    "color_code": "#10B981",
                    "policy_source": "VMS_POLICY_ASSUMPTION (Corridor Baseline Advisory)",
                    "status": "BASELINE"
                })

        return advisories


if __name__ == "__main__":
    from digital_twin_state import DigitalTwinStateManager
    from alert_engine import AlertEngine
    manager = DigitalTwinStateManager()
    alerts_eng = AlertEngine()
    vms_eng = VMSAdvisoryEngine()
    df_st = manager.get_all_segment_states_df()
    active_al = alerts_eng.get_active_alerts()
    adv = vms_eng.generate_advisories_from_state(df_st, active_al)
    print(f"Generated {len(adv)} VMS advisories. Sample:", json.dumps(adv[0], indent=2))
