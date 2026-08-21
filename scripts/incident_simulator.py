"""
RoadTwin AI — Checkpoint 08
Incident Simulation & Network Impact Analysis Engine

This module implements:
1. IncidentSimulator:
   - Simulates incidents on specified RoadTwin segments:
     - ACCIDENT
     - VEHICLE_BREAKDOWN
     - LANE_CLOSURE
     - ROAD_CLOSURE
     - FOG_EVENT
   - Configurable capacity factor, blockage status, and incident severity.
2. Network Impact Analysis:
   - Evaluates before vs after network state:
     - Segment speed drops, travel time inflation, queueing/spillback.
     - Edge blockage status in underlying Layer B routing graph.
     - Estimated delay and affected downstream segments.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

import numpy as np
import pandas as pd
import geopandas as gpd
import networkx as nx

from digital_twin_state import DigitalTwinStateManager

logger = logging.getLogger("RoadTwin-IncidentSimulator")

# Project Directories
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PROCESSED_DT_DIR = DATA_DIR / "processed" / "digital_twin"

# Incident Simulation Configuration Assumptions
INCIDENT_DEFAULT_PROFILES = {
    "ROAD_CLOSURE": {"capacity_factor": 0.0, "is_blocked": True, "speed_factor": 0.0, "risk_multiplier": 3.0},
    "ACCIDENT": {"capacity_factor": 0.25, "is_blocked": False, "speed_factor": 0.20, "risk_multiplier": 2.5},
    "LANE_CLOSURE": {"capacity_factor": 0.50, "is_blocked": False, "speed_factor": 0.45, "risk_multiplier": 1.5},
    "VEHICLE_BREAKDOWN": {"capacity_factor": 0.70, "is_blocked": False, "speed_factor": 0.65, "risk_multiplier": 1.3},
    "FOG_EVENT": {"capacity_factor": 0.60, "is_blocked": False, "speed_factor": 0.40, "risk_multiplier": 2.0}
}


class IncidentSimulator:
    """
    Simulates what-if incidents on RoadTwin segments and computes network-wide impacts.
    """
    
    def __init__(self, state_manager: DigitalTwinStateManager, graph: nx.MultiDiGraph = None):
        self.state_manager = state_manager
        self.mapping_df = pd.read_parquet(PROCESSED_DT_DIR / "segment_graph_edge_mapping.parquet")
        
        # Load Layer B routing graph if not supplied
        if graph is not None:
            self.graph = graph
        else:
            graph_path = DATA_DIR / "processed" / "osm" / "yamuna_corridor_layer_b_routing.graphml"
            self.graph = nx.read_graphml(graph_path)
            
        self.active_incidents: Dict[str, Dict[str, Any]] = {}
        logger.info("IncidentSimulator initialized.")

    def simulate_incident(self, segment_id: str, incident_type: str = "ACCIDENT",
                          severity: str = "HIGH", capacity_factor: float = None,
                          custom_speed_kph: float = None) -> Dict[str, Any]:
        """
        Executes a simulated incident on segment_id, updates digital twin state and graph edge weights,
        and returns the before/after network impact report.
        """
        if segment_id not in self.state_manager.current_state:
            raise KeyError(f"Segment ID {segment_id} not found in state registry.")
            
        incident_type = incident_type.upper()
        severity = severity.upper()
        
        profile = INCIDENT_DEFAULT_PROFILES.get(incident_type, INCIDENT_DEFAULT_PROFILES["ACCIDENT"])
        cap_factor = capacity_factor if capacity_factor is not None else profile["capacity_factor"]
        is_blocked = (cap_factor == 0.0) or profile["is_blocked"]
        
        # Baseline Segment State (Before Incident)
        base_state = dict(self.state_manager.get_segment_state(segment_id))
        base_speed = base_state["speed_kph"]
        base_travel_time = base_state["travel_time_seconds"]
        base_risk_score = base_state["risk_score"]
        length_m = base_state["length_m"]
        
        # Compute Post-Incident Operating Speed & Travel Time
        if is_blocked:
            post_speed = 0.0
            post_travel_time = float("inf")
            post_congestion_ratio = 1.0
        else:
            speed_factor = profile["speed_factor"]
            post_speed = custom_speed_kph if custom_speed_kph is not None else max(5.0, round(base_speed * speed_factor, 1))
            speed_ms = post_speed * (1000.0 / 3600.0)
            post_travel_time = round(length_m / speed_ms, 1)
            ff_speed = base_state["free_flow_speed_kph"]
            post_congestion_ratio = max(0.0, min(1.0, 1.0 - (post_speed / ff_speed)))
            
        # Update Digital Twin Segment State
        current_state = self.state_manager.current_state[segment_id]
        current_state["incident_status"] = f"INCIDENT_{severity}"
        current_state["incident_type"] = incident_type
        current_state["capacity_factor"] = cap_factor
        current_state["is_blocked"] = is_blocked
        current_state["speed_kph"] = post_speed
        current_state["travel_time_seconds"] = post_travel_time
        current_state["congestion_ratio"] = round(post_congestion_ratio, 4)
        current_state["risk_score"] = min(1.0, round(base_risk_score * profile["risk_multiplier"], 4))
        current_state["risk_category"] = "CRITICAL_RISK" if (is_blocked or severity in ["HIGH", "CRITICAL"]) else "HIGH_RISK"
        
        # Map Segment to Underlying Layer B Graph Edges
        seg_maps = self.mapping_df[self.mapping_df["segment_id"] == segment_id]
        affected_edges = []
        for _, map_row in seg_maps.iterrows():
            u, v, k = str(map_row["u"]), str(map_row["v"]), int(map_row["key"])
            if self.graph.has_edge(u, v):
                edge_data = self.graph[u][v][k]
                edge_data["is_blocked"] = is_blocked
                edge_data["capacity_factor"] = cap_factor
                edge_data["current_speed_kph"] = post_speed
                edge_data["travel_time_seconds"] = post_travel_time
                edge_data["incident_status"] = incident_type
                affected_edges.append(f"{u}->{v} (key={k})")
                
        # Find Downstream / Upstream Affected Segments (Queueing Spillback)
        direction = base_state["direction"]
        c_start = base_state["chainage_start_km"]
        affected_segment_ids = [segment_id]
        
        # Nearby 3 segments in queueing zone
        for s_id, s_data in self.state_manager.current_state.items():
            if s_id != segment_id and s_data.get("direction") == direction and s_data.get("is_mainline"):
                c_dist = abs(s_data.get("chainage_start_km", 0) - c_start)
                if c_dist <= 3.0:
                    affected_segment_ids.append(s_id)
                    
        # Construct Network Impact Summary
        impact_report = {
            "incident_id": f"SIM_INC_{segment_id}_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}",
            "incident_segment_id": segment_id,
            "direction": direction,
            "chainage_km": round(float(c_start), 2),
            "incident_type": incident_type,
            "severity": severity,
            "capacity_factor": cap_factor,
            "is_blocked": is_blocked,
            "baseline_speed_kph": base_speed,
            "post_incident_speed_kph": post_speed,
            "speed_reduction_percent": round(((base_speed - post_speed) / base_speed) * 100.0, 1) if base_speed > 0 else 0.0,
            "baseline_travel_time_sec": base_travel_time,
            "post_incident_travel_time_sec": post_travel_time if not is_blocked else 999999.0,
            "estimated_delay_seconds": round(post_travel_time - base_travel_time, 1) if not is_blocked else "INFINITE_ROAD_CLOSED",
            "baseline_risk_score": base_risk_score,
            "post_incident_risk_score": current_state["risk_score"],
            "affected_segments_count": len(affected_segment_ids),
            "affected_segment_ids": affected_segment_ids,
            "blocked_edges": affected_edges,
            "timestamp": pd.Timestamp.now().isoformat()
        }
        
        self.active_incidents[segment_id] = impact_report
        logger.info(f"Simulated {incident_type} ({severity}) on {segment_id}. Blocked={is_blocked}, Affected Edges={len(affected_edges)}")
        return impact_report

    def clear_incident(self, segment_id: str):
        """Clears simulated incident and restores baseline state on segment and graph."""
        if segment_id not in self.active_incidents:
            return
            
        # Re-initialize single segment state from baseline
        self.state_manager.update_segment_traffic(segment_id, speed_kph=95.0)
        curr = self.state_manager.current_state[segment_id]
        curr["incident_status"] = "NORMAL"
        curr["incident_type"] = "NONE"
        curr["capacity_factor"] = 1.0
        curr["is_blocked"] = False
        
        # Restore graph edge attributes
        seg_maps = self.mapping_df[self.mapping_df["segment_id"] == segment_id]
        for _, map_row in seg_maps.iterrows():
            u, v, k = str(map_row["u"]), str(map_row["v"]), int(map_row["key"])
            if self.graph.has_edge(u, v):
                edge_data = self.graph[u][v][k]
                edge_data["is_blocked"] = False
                edge_data["capacity_factor"] = 1.0
                edge_data["current_speed_kph"] = 95.0
                edge_data["incident_status"] = "NORMAL"
                
        del self.active_incidents[segment_id]
        logger.info(f"Cleared incident on {segment_id}.")


if __name__ == "__main__":
    manager = DigitalTwinStateManager()
    simulator = IncidentSimulator(manager)
    impact = simulator.simulate_incident("YE_MAIN_SB_050", incident_type="ACCIDENT", severity="HIGH")
    print("Incident Simulation Impact:", json.dumps(impact, indent=2))
