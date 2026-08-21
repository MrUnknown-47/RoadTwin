"""
RoadTwin AI — Checkpoint 11
Centralized Production Configuration Module

Manages environment variables, security settings, file paths, and deployment modes.
Secrets (like TOMTOM_API_KEY) are read safely from backend environment variables
and are never exposed to the client or logged.
"""

import os
from pathlib import Path
from typing import List

# Project Root Directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "processed"

# Zero-dependency .env loader
env_file = PROJECT_ROOT / ".env"
if env_file.exists():
    try:
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k not in os.environ and v:
                        os.environ[k] = v
    except Exception:
        pass


class Settings:
    """Centralized application settings and environment configuration."""

    # Environment: development, test, production
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()

    # API Server Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

    # CORS Configuration
    # In development, allows localhost origins. In production, requires explicit allowlist.
    CORS_ORIGINS_STR: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
    )

    @property
    def cors_origins(self) -> List[str]:
        if self.ENVIRONMENT == "production":
            return [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]
        # Development allowlist including localhost ports
        origins = [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]
        for default in ["http://localhost:3000", "http://127.0.0.1:3000"]:
            if default not in origins:
                origins.append(default)
        return origins

    # Database & Storage Configuration
    DATABASE_PATH: Path = Path(os.getenv("DATABASE_PATH", str(DATA_DIR / "digital_twin" / "alerts.db")))

    # External Provider Credentials (Optional — system falls back gracefully to baseline)
    @property
    def TOMTOM_API_KEY(self) -> str:
        return os.getenv("TOMTOM_API_KEY", "")

    @property
    def tomtom_api_key(self) -> str:
        return self.TOMTOM_API_KEY

    @property
    def has_live_traffic_key(self) -> bool:
        k = self.tomtom_api_key
        return bool(k and len(k.strip()) > 5)

    @property
    def tomtom_configured(self) -> bool:
        return self.has_live_traffic_key

    # Core Asset Paths
    SEGMENTS_PARQUET_PATH: Path = DATA_DIR / "segments" / "yamuna_expressway_segments.parquet"
    TRAFFIC_BASELINE_PATH: Path = DATA_DIR / "traffic" / "corridor_traffic_baseline_hourly.parquet"
    WEATHER_MAPPING_PATH: Path = DATA_DIR / "weather" / "segment_weather_spatial_mapping.parquet"
    WEATHER_HOURLY_PATH: Path = DATA_DIR / "weather" / "corridor_weather_hourly_2021_2023.parquet"
    ML_MODEL_PATH: Path = DATA_DIR / "ml" / "checkpoint_07_xgboost_model.json"
    ML_METADATA_PATH: Path = DATA_DIR / "ml" / "checkpoint_07_metadata.json"
    ROUTING_GRAPH_PATH: Path = DATA_DIR / "osm" / "yamuna_corridor_layer_b_routing.graphml"
    SEGMENT_EDGE_MAPPING_PATH: Path = DATA_DIR / "digital_twin" / "segment_graph_edge_mapping.parquet"

    # Operational Polling & Limits
    POLLING_INTERVAL_SEC: int = int(os.getenv("POLLING_INTERVAL_SEC", "30"))
    TOTAL_CORRIDOR_SEGMENTS: int = 405
    CORRIDOR_LENGTH_KM: float = 165.0


# Instantiate Global Singleton Settings
settings = Settings()
