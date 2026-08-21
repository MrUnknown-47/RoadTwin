'use client';

import React from 'react';
import { SegmentState } from '@/lib/types';
import { getRiskBadgeClass, formatNumber } from '@/lib/utils';
import { 
  Gauge, Clock, ShieldAlert, Thermometer, Wind, 
  MapPin, GitBranch, ArrowRight, X, AlertOctagon,
  Activity, CheckCircle2, CloudFog
} from 'lucide-react';

interface SegmentDetailsProps {
  segment: SegmentState | null;
  loading: boolean;
  onClose: () => void;
}

export function SegmentDetails({ segment, loading, onClose }: SegmentDetailsProps) {
  if (!segment && !loading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 text-center text-slate-400">
        <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No Segment Selected</h4>
        <p className="text-xs text-slate-500 mt-1">
          Click any road segment on the Yamuna Expressway map to inspect real-time digital twin telemetry.
        </p>
      </div>
    );
  }

  if (loading || !segment) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 text-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs text-slate-400 font-mono">Fetching segment telemetry from FastAPI...</div>
      </div>
    );
  }

  const isSB = segment.direction === 'SB';
  const dirLabel = segment.is_ramp 
    ? 'Interchange Ramp' 
    : (isSB ? 'Southbound (Greater Noida → Agra)' : 'Northbound (Agra → Greater Noida)');

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">
      {/* Panel Header */}
      <div className="p-4 bg-slate-800/80 border-b border-slate-700/60 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-sky-400">{segment.segment_id}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getRiskBadgeClass(segment.risk_category)}`}>
              {segment.risk_category.replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1.5">
            <span>{dirLabel}</span>
          </div>
          {segment.chainage_start_km >= 0 && (
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Chainage: Km {segment.chainage_start_km.toFixed(2)} → {segment.chainage_end_km.toFixed(2)} ({formatNumber(segment.length_m, 0)} m)
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="Close details panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Risk & Safety Intelligence */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            <span>CP07 Risk Intelligence</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
            <div>
              <div className="text-[10px] text-slate-400">Relative Risk Score</div>
              <div className="text-sm font-bold font-mono text-slate-100">{segment.risk_score.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Corridor Risk Percentile</div>
              <div className="text-sm font-bold font-mono text-amber-400">
                {segment.risk_percentile ? `${segment.risk_percentile.toFixed(1)}th %ile` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Operating Traffic & Speeds */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>Traffic Dynamics</span>
          </h4>
          <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 text-center">
            <div>
              <div className="text-[10px] text-slate-400">Current Speed</div>
              <div className="text-sm font-bold text-slate-100 font-mono">{formatNumber(segment.speed_kph)} km/h</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Free Flow</div>
              <div className="text-sm font-bold text-slate-300 font-mono">{formatNumber(segment.free_flow_speed_kph)} km/h</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Congestion</div>
              <div className="text-sm font-bold text-amber-400 font-mono">{(segment.congestion_ratio * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
            <div>
              <div className="text-[10px] text-slate-400">Travel Time on Segment</div>
              <div className="text-sm font-bold text-slate-200 font-mono">{formatNumber(segment.travel_time_seconds)} sec</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Speed Reduction</div>
              <div className="text-sm font-bold text-slate-200 font-mono">{formatNumber(segment.speed_reduction_pct)}%</div>
            </div>
          </div>
        </div>

        {/* Atmospheric Layer */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CloudFog className="w-3.5 h-3.5 text-sky-400" />
            <span>Atmospheric State</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Temperature:</span>
              <span className="font-mono text-slate-200">{formatNumber(segment.temperature_c)}°C</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Humidity:</span>
              <span className="font-mono text-slate-200">{formatNumber(segment.relative_humidity_pct)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Wind Velocity:</span>
              <span className="font-mono text-slate-200">{formatNumber(segment.wind_speed_ms)} m/s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Dew Point:</span>
              <span className="font-mono text-slate-200">{formatNumber(segment.dew_point_c)}°C</span>
            </div>
          </div>
        </div>

        {/* Graph & Topological Mapping */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-sky-400" />
            <span>Layer B Graph Topology</span>
          </h4>
          <div className="space-y-1.5 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-sans">Parent Graph Edge:</span>
              <span className="text-slate-200">{segment.source_edge_id}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-sans">Start Graph Node:</span>
              <span className="text-slate-300">{segment.start_node}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-sans">End Graph Node:</span>
              <span className="text-slate-300">{segment.end_node}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-sans">Subsegment Index:</span>
              <span className="text-slate-300">{segment.subsegment_index + 1} of {segment.total_subsegments}</span>
            </div>
          </div>
        </div>

        {/* Data Provenance Footer */}
        <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Data Provenance Summary</div>
          <div>• Speed: {segment.speed_source || 'SURVEY_CALIBRATED_DIURNAL_BASELINE'}</div>
          <div>• Weather: NASA POWER / MERRA-2 Hourly Reanalysis</div>
          <div>• Risk: CP07 XGBoost Decision-Support Inference</div>
        </div>
      </div>
    </div>
  );
}
