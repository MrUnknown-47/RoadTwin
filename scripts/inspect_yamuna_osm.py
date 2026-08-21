import osmnx as ox
import geopandas as gpd
import pandas as pd

ox.settings.use_cache = True
ox.settings.log_console = True

print(f"OSMnx version: {ox.__version__}")

# Check features with name "Yamuna Expressway"
try:
    print("Searching for Yamuna Expressway features...")
    gdf = ox.features_from_place("Yamuna Expressway, Uttar Pradesh, India", tags={"highway": True})
    print(f"Found {len(gdf)} features from place query")
    print(gdf.head())
except Exception as e:
    print(f"Place query failed: {e}")

# Try custom Overpass query or bbox
# Yamuna Expressway bounds roughly:
# North: Greater Noida ~28.50
# South: Agra ~27.15
# West: ~77.45
# East: ~78.15
print("\nTesting Overpass query for highway ways with name matching Yamuna Expressway...")
import requests

overpass_url = "https://overpass-api.de/api/interpreter"
overpass_query = """
[out:json][timeout:60];
(
  way["name"~"Yamuna Expressway",i](27.1,77.4,28.6,78.2);
  relation["name"~"Yamuna Expressway",i](27.1,77.4,28.6,78.2);
);
out body;
>;
out skel qt;
"""

resp = requests.post(overpass_url, data={"data": overpass_query})
if resp.status_code == 200:
    data = resp.json()
    elements = data.get("elements", [])
    ways = [e for e in elements if e.get("type") == "way"]
    relations = [e for e in elements if e.get("type") == "relation"]
    print(f"Overpass returned {len(elements)} elements: {len(ways)} ways, {len(relations)} relations.")
    
    # Inspect tags from first few ways
    for i, w in enumerate(ways[:5]):
        print(f"Way {i}: tags={w.get('tags')}")
    for i, r in enumerate(relations):
        print(f"Relation {i}: tags={r.get('tags')}")
else:
    print(f"Overpass failed with code {resp.status_code}: {resp.text[:200]}")
