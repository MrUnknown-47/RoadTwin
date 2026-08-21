'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  SegmentState, DirectionType, IncidentImpactReport, 
  DiversionRouteResponse, EmergencyDispatchResponse 
} from '@/lib/types';
import { MapLegend } from './map-legend';
import { getRiskColor } from '@/lib/utils';
import { ShieldAlert, Search } from 'lucide-react';

interface RoadTwinMapProps {
  segmentStates: Record<string, SegmentState>;
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
  directionFilter: DirectionType;
  onDirectionChange: (dir: DirectionType) => void;
  impactReport: IncidentImpactReport | null;
  diversionData: DiversionRouteResponse | null;
  emergencyData: EmergencyDispatchResponse | null;
  onOpenSimulationModal: () => void;
  isEmergencyAnimating?: boolean;
}

export function RoadTwinMap({
  segmentStates,
  selectedSegmentId,
  onSelectSegment,
  directionFilter,
  onDirectionChange,
  impactReport,
  diversionData,
  emergencyData,
  onOpenSimulationModal,
  isEmergencyAnimating = false,
}: RoadTwinMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredInfo, setHoveredInfo] = useState<{ id: string; x: number; y: number; state?: SegmentState } | null>(null);
  const [basemapOffline, setBasemapOffline] = useState(false);

  const vehicleMarker = useRef<maplibregl.Marker | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Corridor Bounds (Greater Noida to Agra: [SW, NE])
  const CORRIDOR_BOUNDS: [maplibregl.LngLatLike, maplibregl.LngLatLike] = [
    [77.40, 27.10], // Southwest (Agra)
    [78.20, 28.55], // Northeast (Greater Noida)
  ];

  // 1. Fetch 405-segment Local GeoJSON
  useEffect(() => {
    fetch('/data/yamuna_expressway_segments.geojson')
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error('Failed to load segment GeoJSON:', err));
  }, []);

  // 2. Initialize MapLibre GL Map (Provider-Independent, No Token Required)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Dark operational style with resilient dark background fallback
    const darkStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
        },
      },
      layers: [
        {
          id: 'background-fallback',
          type: 'background',
          paint: {
            'background-color': '#0B1120',
          },
        },
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: darkStyle,
      center: [77.75, 27.80],
      zoom: 8.8,
      maxBounds: [
        [76.80, 26.50],
        [78.80, 29.20],
      ],
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('error', (e) => {
      // Non-blocking basemap tile failure tolerance
      if (e && e.error && (e.error.message?.includes('tile') || e.error.message?.includes('fetch'))) {
        setBasemapOffline(true);
      }
    });

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      vehicleMarker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // 3. Enrich GeoJSON with Live State & Simulation Overlays
  const enrichedGeoJSON = useMemo(() => {
    if (!geojsonData) return null;

    const affectedSet = new Set(impactReport?.affected_segment_ids || []);
    const incidentId = impactReport?.incident_segment_id;

    const filteredFeatures = geojsonData.features.filter((f: any) => {
      const segId = f.properties.segment_id;
      const dir = f.properties.direction;
      const isRamp = f.properties.is_ramp;

      if (directionFilter === 'SB') return dir === 'SB' && !isRamp;
      if (directionFilter === 'NB') return dir === 'NB' && !isRamp;
      if (directionFilter === 'RAMPS') return isRamp;
      return true;
    });

    const enriched = filteredFeatures.map((f: any) => {
      const segId = f.properties.segment_id;
      const state = segmentStates[segId];
      const riskCategory = state ? state.risk_category : 'LOW_RISK';
      const speed = state ? state.speed_kph : 95.0;
      
      const isIncident = segId === incidentId;
      const isAffected = affectedSet.has(segId) && !isIncident;
      const isSelected = segId === selectedSegmentId;

      let color = getRiskColor(riskCategory);
      if (isIncident) {
        color = '#EF4444'; // Bright Red Crash Highlight
      } else if (isAffected) {
        color = '#F59E0B'; // Amber Spillback Wave
      }

      return {
        ...f,
        properties: {
          ...f.properties,
          risk_category: riskCategory,
          speed_kph: speed,
          color: color,
          is_incident: isIncident,
          is_affected: isAffected,
          is_selected: isSelected,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features: enriched,
    };
  }, [geojsonData, segmentStates, directionFilter, selectedSegmentId, impactReport]);

  // 4. Update Map Layers & Segment GeoJSON
  useEffect(() => {
    if (!map.current || !mapLoaded || !enrichedGeoJSON) return;

    const m = map.current;
    const source = m.getSource('segments-source') as maplibregl.GeoJSONSource;

    if (source) {
      source.setData(enrichedGeoJSON);
    } else {
      m.addSource('segments-source', {
        type: 'geojson',
        data: enrichedGeoJSON,
      });

      // Casing Layer
      m.addLayer({
        id: 'segments-casing',
        type: 'line',
        source: 'segments-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['get', 'is_incident'], false],
            '#EF4444',
            ['boolean', ['get', 'is_selected'], false],
            '#38BDF8',
            '#0284C7',
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'is_incident'], false],
            10,
            ['boolean', ['get', 'is_selected'], false],
            8,
            ['boolean', ['get', 'is_affected'], false],
            6,
            4,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['get', 'is_incident'], false],
            0.9,
            ['boolean', ['get', 'is_selected'], false],
            0.8,
            0.25,
          ],
        },
      });

      // Main RoadTwin Line Layer
      m.addLayer({
        id: 'segments-line',
        type: 'line',
        source: 'segments-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'case',
            ['boolean', ['get', 'is_incident'], false],
            6,
            ['boolean', ['get', 'is_selected'], false],
            5,
            ['boolean', ['get', 'is_affected'], false],
            4.5,
            3,
          ],
          'line-opacity': 0.95,
        },
      });

      // Click event
      m.on('click', 'segments-line', (e) => {
        if (!e.features || e.features.length === 0) return;
        const clickedId = e.features[0].properties?.segment_id;
        if (clickedId) {
          onSelectSegment(clickedId);
        }
      });

      // Hover event
      m.on('mousemove', 'segments-line', (e) => {
        if (!e.features || e.features.length === 0) return;
        m.getCanvas().style.cursor = 'pointer';
        const f = e.features[0];
        const segId = f.properties?.segment_id;
        if (segId) {
          setHoveredInfo({
            id: segId,
            x: e.point.x,
            y: e.point.y,
            state: segmentStates[segId],
          });
        }
      });

      m.on('mouseleave', 'segments-line', () => {
        m.getCanvas().style.cursor = '';
        setHoveredInfo(null);
      });
    }
  }, [mapLoaded, enrichedGeoJSON, onSelectSegment, segmentStates]);

  // 5. Render Diversion Route Layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const m = map.current;

    const divCoords = diversionData?.diversion_route?.coordinates;
    const divGeoJSON = divCoords && divCoords.length > 1 ? {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: divCoords,
      },
      properties: {},
    } : null;

    const divSource = m.getSource('diversion-route-source') as maplibregl.GeoJSONSource;

    if (divGeoJSON) {
      if (divSource) {
        divSource.setData(divGeoJSON);
      } else {
        m.addSource('diversion-route-source', {
          type: 'geojson',
          data: divGeoJSON,
        });

        m.addLayer({
          id: 'diversion-route-line',
          type: 'line',
          source: 'diversion-route-source',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#10B981',
            'line-width': 4,
            'line-dasharray': [2, 1],
            'line-opacity': 0.9,
          },
        });
      }
    } else if (divSource) {
      divSource.setData({
        type: 'FeatureCollection' as const,
        features: [],
      });
    }
  }, [mapLoaded, diversionData]);

  // 6. Render Emergency Vehicle Dispatch Route & Animation
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const m = map.current;

    const emCoords = emergencyData?.coordinates;
    const emGeoJSON = emCoords && emCoords.length > 1 ? {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: emCoords,
      },
      properties: {},
    } : null;

    const emSource = m.getSource('emergency-route-source') as maplibregl.GeoJSONSource;

    if (emGeoJSON) {
      if (emSource) {
        emSource.setData(emGeoJSON);
      } else {
        m.addSource('emergency-route-source', {
          type: 'geojson',
          data: emGeoJSON,
        });

        m.addLayer({
          id: 'emergency-route-line',
          type: 'line',
          source: 'emergency-route-source',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#F43F5E',
            'line-width': 5,
            'line-opacity': 0.95,
          },
        });
      }
    } else if (emSource) {
      emSource.setData({
        type: 'FeatureCollection' as const,
        features: [],
      });
    }

    // Handle Vehicle Animation along emergency coordinates
    if (emCoords && emCoords.length > 1 && isEmergencyAnimating) {
      if (!vehicleMarker.current) {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-[10px] text-white font-bold animate-pulse';
        el.innerHTML = '🚨';
        vehicleMarker.current = new maplibregl.Marker({ element: el }).setLngLat(emCoords[0] as [number, number]).addTo(m);
      }

      let step = 0;
      const totalSteps = emCoords.length;
      const animateVehicle = () => {
        if (step < totalSteps && vehicleMarker.current) {
          vehicleMarker.current.setLngLat(emCoords[step] as [number, number]);
          step++;
          animFrameId.current = requestAnimationFrame(animateVehicle);
        }
      };
      animateVehicle();
    } else {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      vehicleMarker.current?.remove();
      vehicleMarker.current = null;
    }
  }, [mapLoaded, emergencyData, isEmergencyAnimating]);

  const handleResetView = () => {
    if (!map.current) return;
    map.current.fitBounds(CORRIDOR_BOUNDS, {
      padding: 60,
      duration: 1000,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (segmentStates[query]) {
      onSelectSegment(query);
    }
  };

  const totalShown = enrichedGeoJSON?.features?.length || 0;

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-950 overflow-hidden rounded-lg border border-slate-800">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Basemap Offline Notice (Non-blocking) */}
      {basemapOffline && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 px-3 py-1 rounded bg-slate-900/90 border border-amber-500/50 text-[11px] text-amber-300 font-mono shadow-lg">
          BASEMAP OFFLINE — ROADTWIN LOCAL CORRIDOR ACTIVE
        </div>
      )}

      {/* Map Legend & Direction Filters */}
      <MapLegend
        directionFilter={directionFilter}
        onDirectionChange={onDirectionChange}
        onResetView={handleResetView}
        selectedSegmentId={selectedSegmentId}
        totalSegmentsShown={totalShown}
      />

      {/* Top Right Controls: WHAT-IF Simulation Trigger & Search */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Prominent WHAT-IF Simulation Trigger Button */}
        <button
          onClick={onOpenSimulationModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-xl shadow-red-950/60 transition-all border border-red-400/50"
          title="Open What-If Incident Simulator"
        >
          <ShieldAlert className="w-4 h-4 animate-pulse" />
          <span>WHAT-IF SIMULATION</span>
        </button>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur p-1 rounded-lg border border-slate-800 shadow-xl">
          <input
            type="text"
            placeholder="Segment (e.g. YE_MAIN_SB_050)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800 text-xs px-2.5 py-1 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono w-48"
          />
          <button
            type="submit"
            className="p-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Hover Tooltip */}
      {hoveredInfo && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700 rounded p-2 text-xs shadow-2xl backdrop-blur font-sans transform -translate-x-1/2 -translate-y-full -mt-2"
          style={{ left: hoveredInfo.x, top: hoveredInfo.y }}
        >
          <div className="font-mono font-bold text-sky-400">{hoveredInfo.id}</div>
          {hoveredInfo.state && (
            <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
              <div>Speed: <span className="font-mono text-slate-100">{hoveredInfo.state.speed_kph.toFixed(1)} km/h</span></div>
              <div>Risk: <span className="font-bold text-amber-400">{hoveredInfo.state.risk_category.replace('_', ' ')}</span></div>
              {hoveredInfo.state.chainage_start_km >= 0 && (
                <div className="text-[10px] text-slate-400 font-mono">Km {hoveredInfo.state.chainage_start_km.toFixed(1)} → {hoveredInfo.state.chainage_end_km.toFixed(1)}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Route Overlays Legend (Bottom Right) */}
      {(diversionData || emergencyData) && (
        <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded p-2.5 text-[11px] space-y-1.5 shadow-xl font-mono">
          <div className="text-[10px] font-bold text-slate-400 uppercase font-sans">Active Route Layers</div>
          {diversionData && (
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400 border-dashed border-emerald-400 inline-block" />
              <span>Diversion Bypass Route</span>
            </div>
          )}
          {emergencyData && (
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" />
              <span>Emergency Vehicle Route</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
