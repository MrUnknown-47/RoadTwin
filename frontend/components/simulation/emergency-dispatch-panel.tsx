'use client';

import React from 'react';
import { EmergencyDispatchResponse } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { Ambulance, Clock, MapPin, Play, RotateCcw, Shield, X } from 'lucide-react';

interface EmergencyDispatchPanelProps {
  dispatch: EmergencyDispatchResponse | null;
  onClose: () => void;
  isAnimating: boolean;
  onToggleAnimation: () => void;
}

export function EmergencyDispatchPanel({
  dispatch,
  onClose,
  isAnimating,
  onToggleAnimation,
}: EmergencyDispatchPanelProps) {
  if (!dispatch) return null;

  const depot = dispatch.assigned_depot;
  const isImmediate = dispatch.distance_km === 0.0 || dispatch.eta_minutes < 1.0;

  return (
    <div className="bg-slate-900/95 border border-emerald-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-3.5 bg-emerald-950/80 border-b border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ambulance className="w-4 h-4 text-emerald-400 animate-bounce" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            SIMULATED EMERGENCY VEHICLE DISPATCH
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
        {/* Selected Depot Card */}
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Assigned Response Base:</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
              {depot.type}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{depot.name}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Location: Corridor Km {depot.chainage_km.toFixed(1)} · Graph Node: {depot.node_id}
          </div>
        </div>

        {/* ETA & Distance Metric Cards */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
            <div className="text-[10px] text-emerald-400">Estimated Response Time</div>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
              {isImmediate ? '< 1.0 min' : `${formatNumber(dispatch.eta_minutes)} min`}
            </div>
            <div className="text-[10px] text-emerald-400/80">
              {isImmediate ? 'Immediate Proximity' : 'Emergency Speed'}
            </div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
            <div className="text-[10px] text-slate-400">Dispatch Distance</div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
              {formatNumber(dispatch.distance_km)} km
            </div>
            <div className="text-[10px] text-slate-400">
              {dispatch.node_count} Graph Nodes
            </div>
          </div>
        </div>

        {/* Routing Mode & Provenance */}
        <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
          <div className="flex items-center justify-between">
            <span className="font-sans">Routing Mode:</span>
            <span className="text-emerald-400 font-bold">{dispatch.routing_mode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans">Target Incident Segment:</span>
            <span className="text-slate-200">{dispatch.target_segment_id}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-sans pt-1 border-t border-slate-800">
            * Note: Response depots and speed factors are simulation assumptions for decision support.
          </div>
        </div>

        {/* Animation Control Button */}
        {dispatch.coordinates && dispatch.coordinates.length > 1 && (
          <button
            onClick={onToggleAnimation}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg transition-all"
          >
            {isAnimating ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>STOPPING VEHICLE ANIMATION...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>REPLAY EMERGENCY VEHICLE DISPATCH ANIMATION</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
