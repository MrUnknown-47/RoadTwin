"""
RoadTwin AI — Checkpoint 10
Operational Hazard Detection & Deduplicated Alert Engine

This module implements:
1. HazardDetector:
   - Evaluates physical segment telemetry and CP07 XGBoost risk predictions.
   - Rule-based hazard detection (DENSE_FOG, HEAVY_RAIN, HIGH_CONGESTION, NIGHT_SPEED_EXCESS, INCIDENT_ACTIVE, COMPOUND_RISK).
   - Labeled explicitly as OPERATIONAL_RULE.
2. AlertEngine:
   - Deduplicated alert generation with lifecycle management (ACTIVE, ACKNOWLEDGED, RESOLVED).
   - SQLite persistence in data/processed/digital_twin/alerts.db.
"""

import os
import sys
import json
import sqlite3
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger("RoadTwin-AlertEngine")

# Directories
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DT_DIR = DATA_DIR / "processed" / "digital_twin"
DT_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DT_DIR / "alerts.db"


class HazardDetector:
    """
    Evaluates physical state + CP07 risk scores to identify operational hazards across segments.
    Thresholds are explicit engineering rules labeled OPERATIONAL_RULE.
    """

    @staticmethod
    def detect_hazards_for_segment(row: Dict[str, Any]) -> List[Dict[str, Any]]:
        hazards = []
        seg_id = row.get("segment_id", "UNKNOWN")
        risk_score = float(row.get("risk_score", 0.0))
        risk_pct = float(row.get("risk_percentile", 50.0))
        risk_cat = row.get("risk_category", "LOW_RISK")
        hour = int(row.get("hour_of_day", 14))
        fog_risk = int(row.get("fog_risk_code", 0))
        rh = float(row.get("relative_humidity_pct", 65.0))
        dp_dep = float(row.get("dew_point_depression_c", 4.0))
        precip = float(row.get("precipitation_mm_hr", 0.0))
        cong_ratio = float(row.get("congestion_ratio", 0.0))
        speed = float(row.get("speed_kph", 90.0))
        speed_excess = float(row.get("speed_excess_kph", 0.0))
        incident_status = str(row.get("incident_status", "NORMAL"))
        chainage = float(row.get("chainage_start_km", 0.0))

        # 1. INCIDENT ACTIVE HAZARD
        if incident_status != "NORMAL":
            inc_type = row.get("incident_type", "ACCIDENT")
            hazards.append({
                "hazard_type": "INCIDENT_ACTIVE",
                "severity": "CRITICAL",
                "message": f"Active simulated incident ({inc_type}) on segment {seg_id} at Km {chainage:.1f}.",
                "recommended_action": "ACTIVATE VMS CRASH WARNING · DISPATCH EMERGENCY RESPONSE · INITIATE DIVERSION",
                "rule": "OPERATIONAL_RULE: incident_status != NORMAL"
            })

        # 2. DENSE FOG HAZARD
        if fog_risk >= 2 or (dp_dep <= 1.5 and rh >= 90.0):
            is_critical = (risk_cat in ["CRITICAL_RISK", "HIGH_RISK"]) or fog_risk == 3
            hazards.append({
                "hazard_type": "DENSE_FOG",
                "severity": "CRITICAL" if is_critical else "WARNING",
                "message": f"Severe fog visibility hazard detected on {seg_id} (RH: {rh:.0f}%, Dew Point Depression: {dp_dep:.1f}°C).",
                "recommended_action": "ACTIVATE VMS FOG ADVISORY (60 km/h) · ALERT PATROL VAN · ENGAGE FOG LIGHTS",
                "rule": "OPERATIONAL_RULE: fog_risk_code >= 2 or (dp_dep <= 1.5 and rh >= 90%)"
            })

        # 3. HEAVY RAIN HAZARD
        if precip >= 5.0:
            hazards.append({
                "hazard_type": "HEAVY_RAIN",
                "severity": "WARNING",
                "message": f"Heavy rainfall ({precip:.1f} mm/hr) on segment {seg_id} causing surface hydroplaning risk.",
                "recommended_action": "ACTIVATE VMS RAIN WARNING (70 km/h) · BROADCAST SPEED REDUCTION ADVISORY",
                "rule": "OPERATIONAL_RULE: precipitation_mm_hr >= 5.0"
            })

        # 4. HIGH CONGESTION HAZARD
        if cong_ratio >= 0.35:
            hazards.append({
                "hazard_type": "HIGH_CONGESTION",
                "severity": "WARNING" if cong_ratio < 0.60 else "CRITICAL",
                "message": f"Bottleneck congestion index elevated to {(cong_ratio*100):.1f}% on segment {seg_id} (Speed: {speed:.1f} km/h).",
                "recommended_action": "ACTIVATE VMS QUEUE WARNING · MONITOR UPSTREAM MERGE · EVALUATE TOLL PLAZA REGULATION",
                "rule": "OPERATIONAL_RULE: congestion_ratio >= 0.35"
            })

        # 5. NIGHT SPEED EXCESS HAZARD
        is_night = (hour < 6 or hour >= 22)
        if is_night and speed_excess >= 10.0:
            hazards.append({
                "hazard_type": "NIGHT_SPEED_EXCESS",
                "severity": "ADVISORY" if risk_cat == "LOW_RISK" else "WARNING",
                "message": f"Nocturnal speeding detected ({speed:.1f} km/h, +{speed_excess:.1f} km/h excess) during low-visibility hours.",
                "recommended_action": "DISPLAY SPEED RADAR WARNING · POSITION HIGHWAY PATROL INTERCEPTOR",
                "rule": "OPERATIONAL_RULE: (hour < 6 or hour >= 22) and speed_excess >= 10 km/h"
            })

        # 6. COMPOUND RISK HAZARD
        if len(hazards) >= 2:
            hazard_names = " + ".join(h["hazard_type"] for h in hazards)
            hazards.append({
                "hazard_type": "COMPOUND_RISK",
                "severity": "CRITICAL",
                "message": f"Compound multi-hazard condition active on {seg_id} ({hazard_names}) with Risk Percentile {risk_pct:.1f}%.",
                "recommended_action": "ESCALATE TO SENIOR TRAFFIC CONTROLLER · PRIORITY PATROL DISPATCH · VMS OVERRIDE",
                "rule": "OPERATIONAL_RULE: multiple simultaneous active hazards"
            })

        return hazards


class AlertEngine:
    """
    Manages deduplicated alert lifecycle with SQLite database persistence.
    """

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()
        logger.info(f"AlertEngine initialized with database at {self.db_path}")

    def _get_connection(self):
        conn = sqlite3.connect(str(self.db_path), timeout=30.0)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=30000")
        return conn

    def _init_db(self):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                alert_id TEXT PRIMARY KEY,
                segment_id TEXT NOT NULL,
                hazard_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                risk_score REAL NOT NULL,
                risk_percentile REAL NOT NULL,
                message TEXT NOT NULL,
                recommended_action TEXT NOT NULL,
                source TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                acknowledged_at TEXT,
                resolved_at TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_segment ON alerts(segment_id)")
        conn.commit()
        conn.close()

    def generate_alerts_from_state_df(self, df_state: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Scans current corridor segment states, evaluates hazards, updates existing alerts or creates new ones.
        Uses fast in-memory evaluation and batch atomic transactions.
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()

        # Load currently active alerts for deduplication: key -> alert_id
        cursor.execute("SELECT alert_id, segment_id, hazard_type FROM alerts WHERE status IN ('ACTIVE', 'ACKNOWLEDGED')")
        active_map = {(row[1], row[2]): row[0] for row in cursor.fetchall()}

        generated_alerts = []
        current_hazard_keys = set()
        inserts = []
        updates = []

        for _, row in df_state.iterrows():
            row_dict = row.to_dict()
            seg_id = str(row_dict.get("segment_id"))
            hazards = HazardDetector.detect_hazards_for_segment(row_dict)

            for h in hazards:
                h_type = h["hazard_type"]
                key = (seg_id, h_type)
                current_hazard_keys.add(key)

                risk_score = float(row_dict.get("risk_score", 0.0))
                risk_pct = float(row_dict.get("risk_percentile", 50.0))
                sev = h["severity"]
                msg = h["message"]
                action = h["recommended_action"]
                src = h["rule"]

                if key in active_map:
                    alert_id = active_map[key]
                    updates.append((sev, risk_score, risk_pct, msg, action, now_iso, alert_id))
                    generated_alerts.append({
                        "alert_id": alert_id,
                        "segment_id": seg_id,
                        "hazard_type": h_type,
                        "severity": sev,
                        "risk_score": risk_score,
                        "risk_percentile": risk_pct,
                        "message": msg,
                        "recommended_action": action,
                        "source": src,
                        "status": "ACTIVE",
                        "created_at": now_iso,
                        "updated_at": now_iso
                    })
                else:
                    alert_id = f"ALT_{seg_id}_{h_type}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
                    inserts.append((alert_id, seg_id, h_type, sev, risk_score, risk_pct, msg, action, src, 'ACTIVE', now_iso, now_iso))
                    generated_alerts.append({
                        "alert_id": alert_id,
                        "segment_id": seg_id,
                        "hazard_type": h_type,
                        "severity": sev,
                        "risk_score": risk_score,
                        "risk_percentile": risk_pct,
                        "message": msg,
                        "recommended_action": action,
                        "source": src,
                        "status": "ACTIVE",
                        "created_at": now_iso,
                        "updated_at": now_iso
                    })

        # Auto-resolve active alerts that are no longer detected
        resolves = [
            (now_iso, alert_id)
            for (seg_id, h_type), alert_id in active_map.items()
            if (seg_id, h_type) not in current_hazard_keys
        ]

        # Execute in atomic transaction
        try:
            if updates:
                cursor.executemany("""
                    UPDATE alerts 
                    SET severity = ?, risk_score = ?, risk_percentile = ?, 
                        message = ?, recommended_action = ?, updated_at = ?
                    WHERE alert_id = ?
                """, updates)

            if inserts:
                cursor.executemany("""
                    INSERT OR REPLACE INTO alerts (
                        alert_id, segment_id, hazard_type, severity, 
                        risk_score, risk_percentile, message, recommended_action, 
                        source, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, inserts)

            if resolves:
                cursor.executemany("UPDATE alerts SET status = 'RESOLVED', resolved_at = ? WHERE alert_id = ?", resolves)

            conn.commit()
        finally:
            conn.close()
        return generated_alerts

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Returns all currently active and acknowledged alerts sorted by severity."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM alerts 
            WHERE status IN ('ACTIVE', 'ACKNOWLEDGED')
            ORDER BY 
                CASE severity 
                    WHEN 'CRITICAL' THEN 1 
                    WHEN 'WARNING' THEN 2 
                    WHEN 'ADVISORY' THEN 3 
                    ELSE 4 
                END, 
                risk_percentile DESC, 
                created_at DESC
        """)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def get_all_alerts(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Returns recent alert history."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def get_alert_by_id(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Finds alert by ID."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts WHERE alert_id = ?", (alert_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def acknowledge_alert(self, alert_id: str, operator_note: str = "") -> bool:
        """Marks alert as ACKNOWLEDGED by operator."""
        conn = self._get_connection()
        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()
        cursor.execute("""
            UPDATE alerts 
            SET status = 'ACKNOWLEDGED', acknowledged_at = ? 
            WHERE alert_id = ?
        """, (now_iso, alert_id))
        changed = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return changed

    def resolve_alert(self, alert_id: str) -> bool:
        """Marks alert as RESOLVED."""
        conn = self._get_connection()
        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()
        cursor.execute("UPDATE alerts SET status = 'RESOLVED', resolved_at = ? WHERE alert_id = ?", (now_iso, alert_id))
        changed = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return changed


if __name__ == "__main__":
    from digital_twin_state import DigitalTwinStateManager
    manager = DigitalTwinStateManager()
    engine = AlertEngine()
    alerts = engine.generate_alerts_from_state_df(manager.get_all_segment_states_df())
    print(f"Generated {len(alerts)} alerts. Active alerts count: {len(engine.get_active_alerts())}")
