'use client';

import React from 'react';
import { PatrolRecommendation } from '@/lib/types';
import { Shield, MapPin, Clock, Navigation, ArrowUpRight } from 'lucide-react';

interface PatrolPanelProps {
  recommendations: PatrolRecommendation[];
  onSelectSegment: (segmentId: string) => void;
}

export function PatrolPanel({ recommendations, onSelectSegment }: PatrolPanelProps) {
  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full max-h-[550px]">
      {/* Header */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            TACTICAL PATROL DEPLOYMENTS
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-950 text-sky-400 border border-sky-500/30">
          {recommendations.length} Assigned
        </span>
      </div>

      <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div
              key={rec.patrol_id}
              className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-2 text-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono font-bold text-sky-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{rec.target_segment_id}</span>
                  <span className="text-slate-400 font-normal">(Km {rec.chainage_km} {rec.direction})</span>
                </div>
                <button
                  onClick={() => onSelectSegment(rec.target_segment_id)}
                  className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
                >
                  <span>View</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Objective */}
              <div className="text-[11px] text-slate-200 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">Tactical Objective:</div>
                <div className="text-amber-300 font-semibold">{rec.tactical_objective}</div>
              </div>

              {/* Depot & ETA */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                  <div className="text-[9px] text-slate-500 font-sans">Assigned Depot:</div>
                  <div className="truncate text-slate-200" title={rec.assigned_depot}>
                    {rec.assigned_depot}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                  <div className="text-[9px] text-slate-500 font-sans">ETA / Distance:</div>
                  <div className="text-emerald-400 font-bold">
                    {rec.eta_minutes.toFixed(1)}m ({rec.distance_km.toFixed(1)} km)
                  </div>
                </div>
              </div>

              {/* Source Tag */}
              <div className="text-[9px] text-slate-500 font-mono pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>{rec.dispatch_source}</span>
                <span className="text-sky-400">{rec.status}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No emergency patrol deployments currently required.
          </div>
        )}
      </div>
    </div>
  );
}
