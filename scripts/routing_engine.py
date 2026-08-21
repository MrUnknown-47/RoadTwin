"""
RoadTwin AI — Checkpoint 08
Dynamic Multi-Objective Routing Engine

This module implements:
1. DynamicRoutingEngine:
   - Evaluates shortest paths on the directed Layer B corridor graph.
   - Multi-objective routing modes:
     - FASTEST: Minimizes travel time.
     - SAFEST: Balances travel time against segment accident risk exposure.
     - EMERGENCY: High-priority emergency vehicle routing strictly avoiding blockages.
2. Diversion & Detour Routing:
   - Computes alternative bypass routes when expressway mainline segments are blocked.
   - Computes detour distance, estimated delay, and rerouted edge counts.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

import numpy as np
import pandas as pd
import geopandas as gpd
import networkx as nx

logger = logging.getLogger("RoadTwin-RoutingEngine")

# Project Directories
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PROCESSED_DIR = DATA_DIR / "processed"


class DynamicRoutingEngine:
    """
    Graph routing engine using Dijkstra / A* over directed Layer B network with dynamic edge penalties.
    """
    
    def __init__(self, graph: nx.MultiDiGraph = None, graph_path: Path = None):
        if graph is not None:
            self.graph = graph
        else:
            g_path = graph_path or (PROCESSED_DIR / "osm" / "yamuna_corridor_layer_b_routing.graphml")
            self.graph = nx.read_graphml(g_path)
            
        self.mapping_df = pd.read_parquet(PROCESSED_DIR / "digital_twin" / "segment_graph_edge_mapping.parquet")
        logger.info(f"DynamicRoutingEngine initialized with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges.")

    def update_edge_costs(self, mode: str = "FASTEST", risk_dict: Dict[str, float] = None):
        """
        Updates dynamic routing cost weights across all edges in the Layer B graph.
        """
        risk_dict = risk_dict or {}
        
        # Build segment_id -> risk_score mapping per graph edge
        edge_risk_map = {}
        for _, row in self.mapping_df.iterrows():
            u, v, k = str(row["u"]), str(row["v"]), int(row["key"])
            seg_id = row["segment_id"]
            if seg_id in risk_dict:
                edge_risk_map[(u, v, k)] = risk_dict[seg_id]
                
        for u, v, k, data in self.graph.edges(data=True, keys=True):
            length_m = float(data.get("length", 100.0))
            is_blocked = bool(data.get("is_blocked", False))
            cap_factor = float(data.get("capacity_factor", 1.0))
            
            # If edge is blocked or capacity is 0, set infinite cost
            if is_blocked or cap_factor <= 0.0:
                data["dynamic_cost"] = float("inf")
                data["travel_time_sec"] = float("inf")
                continue
                
            # Compute effective operating speed
            highway_type = data.get("highway", "tertiary")
            default_speed = 95.0 if highway_type in ["motorway", "motorway_link"] else (60.0 if highway_type in ["trunk", "primary"] else 40.0)
            curr_speed = float(data.get("current_speed_kph", default_speed))
            
            # Adjust speed for capacity degradation
            eff_speed = max(5.0, curr_speed * cap_factor)
            speed_ms = eff_speed * (1000.0 / 3600.0)
            travel_time_sec = length_m / speed_ms
            
            # Base risk penalty
            edge_risk = edge_risk_map.get((u, v, k), 0.01)
            
            if mode == "FASTEST":
                cost = travel_time_sec
            elif mode == "SAFEST":
                cost = travel_time_sec * (1.0 + 2.5 * edge_risk)
            elif mode == "EMERGENCY":
                # Emergency vehicles travel faster on clear highway but heavily penalize risk/congestion
                cost = (travel_time_sec * 0.8) * (1.0 + 4.0 * edge_risk)
            else:
                cost = travel_time_sec
                
            data["dynamic_cost"] = cost
            data["travel_time_sec"] = travel_time_sec
            data["effective_speed_kph"] = eff_speed

    def find_route(self, origin_node: str, dest_node: str, mode: str = "FASTEST",
                   blocked_segments: List[str] = None) -> Dict[str, Any]:
        """
        Computes dynamic route between origin_node and dest_node under specified routing mode.
        """
        origin_node = str(origin_node)
        dest_node = str(dest_node)
        
        if not self.graph.has_node(origin_node) or not self.graph.has_node(dest_node):
            return {
                "status": "INVALID_NODES",
                "origin_node": origin_node,
                "dest_node": dest_node,
                "route_found": False
            }
            
        # Update edge costs
        self.update_edge_costs(mode=mode)
        
        # Apply temporary blocked segments if provided
        blocked_edges_set = set()
        if blocked_segments:
            for s_id in blocked_segments:
                seg_maps = self.mapping_df[self.mapping_df["segment_id"] == s_id]
                for _, map_row in seg_maps.iterrows():
                    u, v, k = str(map_row["u"]), str(map_row["v"]), int(map_row["key"])
                    blocked_edges_set.add((u, v, k))
                    if self.graph.has_edge(u, v):
                        self.graph[u][v][k]["dynamic_cost"] = float("inf")
                        
        # Create a view excluding infinite cost edges
        def edge_weight(u, v, edge_dict):
            # In MultiDiGraph, edge_dict is {key: {attributes...}}
            if isinstance(edge_dict, dict):
                costs = [d.get("dynamic_cost", float("inf")) for d in edge_dict.values() if isinstance(d, dict)]
                return min(costs) if costs else float("inf")
            return float("inf")
            
        try:
            # Dijkstra Shortest Path
            node_path = nx.shortest_path(self.graph, source=origin_node, target=dest_node, weight=edge_weight)
            
            # Extract edge details along path
            total_distance_m = 0.0
            total_time_sec = 0.0
            path_edges = []
            
            for i in range(len(node_path) - 1):
                u = node_path[i]
                v = node_path[i + 1]
                edge_dict = self.graph[u][v]
                # Pick minimum cost key
                best_k = min(edge_dict.keys(), key=lambda k: edge_dict[k].get("dynamic_cost", float("inf")))
                e_data = edge_dict[best_k]
                
                # Check for blockage
                if e_data.get("dynamic_cost", 0.0) == float("inf"):
                    raise nx.NetworkXNoPath(f"Blocked edge encountered: {u}->{v}")
                    
                length = float(e_data.get("length", 100.0))
                tt = float(e_data.get("travel_time_sec", 10.0))
                total_distance_m += length
                total_time_sec += tt
                path_edges.append({
                    "u": u,
                    "v": v,
                    "key": best_k,
                    "highway": e_data.get("highway", "motorway"),
                    "name": e_data.get("name", "Unnamed"),
                    "length_m": round(length, 1),
                    "travel_time_sec": round(tt, 1),
                    "speed_kph": round(float(e_data.get("effective_speed_kph", 95.0)), 1)
                })
                
            coordinates = []
            for n in node_path:
                if self.graph.has_node(n) and "x" in self.graph.nodes[n] and "y" in self.graph.nodes[n]:
                    coordinates.append([float(self.graph.nodes[n]["x"]), float(self.graph.nodes[n]["y"])])
                    
            return {
                "status": "ROUTE_FOUND",
                "route_found": True,
                "mode": mode,
                "origin_node": origin_node,
                "dest_node": dest_node,
                "node_count": len(node_path),
                "edge_count": len(path_edges),
                "total_distance_km": round(total_distance_m / 1000.0, 2),
                "total_travel_time_minutes": round(total_time_sec / 60.0, 2),
                "node_path": node_path,
                "coordinates": coordinates,
                "path_edges": path_edges
            }
        except (nx.NetworkXNoPath, nx.NodeNotFound) as e:
            return {
                "status": "NO_ROUTE_AVAILABLE",
                "route_found": False,
                "mode": mode,
                "origin_node": origin_node,
                "dest_node": dest_node,
                "error_reason": str(e)
            }

    def compute_diversion_route(self, origin_node: str, dest_node: str,
                                incident_segment_id: str) -> Dict[str, Any]:
        """
        Computes baseline route and alternative diversion route avoiding an incident segment,
        calculating detour distance and delay impact.
        """
        # 1. Baseline Route (Clear Corridor)
        base_route = self.find_route(origin_node, dest_node, mode="FASTEST")
        
        # 2. Diversion Route (Incident Segment Blocked)
        div_route = self.find_route(origin_node, dest_node, mode="FASTEST", blocked_segments=[incident_segment_id])
        
        if not base_route.get("route_found") or not div_route.get("route_found"):
            return {
                "status": "DIVERSION_EVALUATION_FAILED",
                "baseline_route": base_route,
                "diversion_route": div_route
            }
            
        base_dist = base_route["total_distance_km"]
        div_dist = div_route["total_distance_km"]
        base_time = base_route["total_travel_time_minutes"]
        div_time = div_route["total_travel_time_minutes"]
        
        detour_km = round(div_dist - base_dist, 2)
        delay_min = round(div_time - base_time, 2)
        
        # Identify newly rerouted edges
        base_edge_set = set((e["u"], e["v"]) for e in base_route["path_edges"])
        div_edge_set = set((e["u"], e["v"]) for e in div_route["path_edges"])
        rerouted_edges_count = len(div_edge_set - base_edge_set)
        
        return {
            "status": "DIVERSION_FOUND",
            "incident_segment_id": incident_segment_id,
            "baseline_distance_km": base_dist,
            "diversion_distance_km": div_dist,
            "detour_distance_km": detour_km,
            "baseline_travel_time_min": base_time,
            "diversion_travel_time_min": div_time,
            "estimated_delay_min": delay_min,
            "rerouted_edges_count": rerouted_edges_count,
            "baseline_route": base_route,
            "diversion_route": div_route
        }


if __name__ == "__main__":
    engine = DynamicRoutingEngine()
    # Test sample nodes from Greater Noida to Agra
    origin = "1803900020" # Greater Noida entrance node
    dest = "1803896582"   # Agra Kuberpur exit node
    res = engine.find_route(origin, dest, mode="FASTEST")
    print("Sample Route Result:", json.dumps(res, indent=2))
