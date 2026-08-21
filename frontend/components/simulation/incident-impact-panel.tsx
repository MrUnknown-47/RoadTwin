'use client';

import React from 'react';
import { IncidentImpactReport } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { 
  ShieldAlert, AlertTriangle, ArrowRight, Gauge, 
  Clock, Navigation, Ambulance, RotateCcw, Loader2, Layers 
} from 'lucide-react';

interface IncidentImpactPanelProps {
  impact: IncidentImpactReport;
  onCalculateDiversion: () => Promise<void>;
  onDispatchEmergency: () => Promise<void>;
  onReset: () => Promise<void>;
  onSelectSegment: (segmentId: string) => void;
  diversionLoading: boolean;
  emergencyLoading: boolean;
  resetLoading: boolean;
}

export function IncidentImpactPanel({
  impact,
  onCalculateDiversion,
  onDispatchEmergency,
  onReset,
  onSelectSegment,
  diversionLoading,
  emergencyLoading,
  resetLoading,
}: IncidentImpactPanelProps) {
  const isBlocked = impact.is_blocked || impact.capacity_factor === 0.0;

  return (
    <div className="bg-slate-900/95 border border-red-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3.5 bg-red-950/80 border-b border-red-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-200">
            INCIDENT IMPACT & NETWORK DEGRADATION
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-red-900/80 text-red-300 border border-red-500/40">
          {impact.incident_type} · {impact.severity}
        </span>
      </div>

      <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Incident Summary Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Target Incident Segment:</span>
            <span className="font-mono font-bold text-sky-400">{impact.incident_segment_id}</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Corridor Location:</span>
            <span className="font-mono text-slate-200">Km {impact.chainage_km} ({impact.direction === 'SB' ? 'Southbound' : 'Northbound'})</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Operating Capacity:</span>
            <span className="font-mono font-bold text-amber-400">
              {(impact.capacity_factor * 100).toFixed(0)}% {isBlocked ? '(ROAD CLOSED)' : '(THROTTLED)'}
            </span>
          </div>
        </div>

        {/* Before vs After Telemetry Comparison Grid */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Before vs After Telemetry
          </h4>
          <div className="border border-slate-700 rounded-lg overflow-hidden text-xs">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-slate-800/80 p-2 font-semibold text-slate-300 border-b border-slate-700 text-center">
              <div>Metric</div>
              <div>Baseline</div>
              <div>Simulated</div>
            </div>

            {/* Row 1: Operating Speed */}
            <div className="grid grid-cols-3 p-2 bg-slate-900/60 border-b border-slate-800 text-center items-center">
              <div className="text-slate-400 font-medium text-left pl-2">Speed (km/h)</div>
              <div className="font-mono text-slate-200">{formatNumber(impact.baseline_speed_kph)}</div>
              <div className="font-mono font-bold text-red-400">
                {formatNumber(impact.post_incident_speed_kph)} (-{formatNumber(impact.speed_reduction_percent, 0)}%)
              </div>
            </div>

            {/* Row 2: Travel Time */}
            <div className="grid grid-cols-3 p-2 bg-slate-900/60 border-b border-slate-800 text-center items-center">
              <div className="text-slate-400 font-medium text-left pl-2">Segment Travel Time</div>
              <div className="font-mono text-slate-200">{formatNumber(impact.baseline_travel_time_sec)}s</div>
              <div className="font-mono font-bold text-amber-400">
                {isBlocked ? '∞ (Blocked)' : `${formatNumber(Number(impact.post_incident_travel_time_sec))}s`}
              </div>
            </div>

            {/* Row 3: Estimated Delay */}
            <div className="grid grid-cols-3 p-2 bg-slate-900/60 border-b border-slate-800 text-center items-center">
              <div className="text-slate-400 font-medium text-left pl-2">Estimated Delay</div>
              <div className="font-mono text-slate-200">0.0s</div>
              <div className="font-mono font-bold text-red-400">
                {isBlocked ? 'Road Closed' : `+${formatNumber(Number(impact.estimated_delay_seconds))}s`}
              </div>
            </div>

            {/* Row 4: CP07 Risk Score */}
            <div className="grid grid-cols-3 p-2 bg-slate-900/60 text-center items-center">
              <div className="text-slate-400 font-medium text-left pl-2">CP07 Relative Risk</div>
              <div className="font-mono text-slate-200">{impact.baseline_risk_score.toFixed(4)}</div>
              <div className="font-mono font-bold text-red-400">{impact.post_incident_risk_score.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* Affected Spillback Queueing Segments */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Affected Spillback Network</span>
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
              {impact.affected_segments_count} Segments
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
            {impact.affected_segment_ids.map((segId) => (
              <button
                key={segId}
                onClick={() => onSelectSegment(segId)}
                className={`text-[11px] font-mono py-1 px-2 rounded border text-left flex items-center justify-between transition-all ${
                  segId === impact.incident_segment_id
                    ? 'bg-red-950/80 border-red-500/80 text-red-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{segId}</span>
                {segId === impact.incident_segment_id && (
                  <span className="text-[9px] text-red-400 font-sans">CRASH</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 space-y-2 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            {/* Calculate Diversion */}
            <button
              onClick={onCalculateDiversion}
              disabled={diversionLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-lg shadow-sky-900/40 transition-all disabled:opacity-50"
            >
              {diversionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>ROUTING...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>DIVERSION ROUTE</span>
                </>
              )}
            </button>

            {/* Dispatch Emergency Response */}
            <button
              onClick={onDispatchEmergency}
              disabled={emergencyLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
            >
              {emergencyLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>DISPATCHING...</span>
                </>
              ) : (
                <>
                  <Ambulance className="w-3.5 h-3.5" />
                  <span>EMERGENCY DISPATCH</span>
                </>
              )}
            </button>
          </div>

          {/* Clean Reset Button */}
          <button
            onClick={onReset}
            disabled={resetLoading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            {resetLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>RESET SIMULATION TO BASELINE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
