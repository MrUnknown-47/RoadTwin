'use client';

import React from 'react';
import { DiversionRouteResponse } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { Navigation, Clock, AlertTriangle, CheckCircle, ArrowRight, X } from 'lucide-react';

interface DiversionPanelProps {
  diversion: DiversionRouteResponse | null;
  onClose: () => void;
}

export function DiversionPanel({ diversion, onClose }: DiversionPanelProps) {
  if (!diversion) return null;

  const routeFound = diversion.status === 'DIVERSION_FOUND' || diversion.diversion_route?.route_found;

  return (
    <div className="bg-slate-900/95 border border-sky-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-3.5 bg-sky-950/80 border-b border-sky-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-200">
            DYNAMIC DIVERSION & BYPASS ROUTING
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {routeFound ? (
          <>
            {/* Route Comparison Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[10px] text-slate-400">Baseline Expressway Path</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-1">
                  {formatNumber(diversion.baseline_distance_km)} km
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {formatNumber(diversion.baseline_travel_time_min)} min
                </div>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[10px] text-sky-400">Post-Incident Route</div>
                <div className="text-sm font-bold font-mono text-sky-300 mt-1">
                  {formatNumber(diversion.diversion_distance_km)} km
                </div>
                <div className="text-[11px] font-bold text-amber-400 font-mono">
                  {formatNumber(diversion.diversion_travel_time_min)} min (+{formatNumber(diversion.estimated_delay_min)}m)
                </div>
              </div>
            </div>

            {/* Telemetry Details */}
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Corridor Origin:</span>
                <span className="text-slate-200">Greater Noida (Pari Chowk Hub)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Corridor Destination:</span>
                <span className="text-slate-200">Agra Kuberpur Terminus</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Detour Distance Added:</span>
                <span className="text-slate-200">{formatNumber(diversion.detour_distance_km)} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Rerouted Graph Edges:</span>
                <span className="text-slate-200">{diversion.rerouted_edges_count} Edges</span>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-amber-950/60 border border-amber-500/40 p-3 rounded-lg text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">NO ALTERNATIVE DIVERSION AVAILABLE</div>
              <div className="text-[11px] text-amber-300/80 mt-0.5">
                The incident segment has severed the directed graph path on this isolated carriageway without connecting slip ramps. Blocked edges are strictly excluded from traffic routing.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
