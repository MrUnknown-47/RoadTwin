'use client';

import React from 'react';
import { IncidentImpactReport } from '@/lib/types';
import { ShieldAlert, RotateCcw, Loader2 } from 'lucide-react';

interface SimulationBannerProps {
  impact: IncidentImpactReport | null;
  onReset: () => Promise<void>;
  resetLoading: boolean;
}

export function SimulationBanner({ impact, onReset, resetLoading }: SimulationBannerProps) {
  if (!impact) return null;

  return (
    <div className="bg-red-950/95 border-b border-red-500/60 px-6 py-2 text-xs text-red-100 flex flex-wrap items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>

        <div className="flex items-center gap-2 font-medium">
          <span className="font-bold tracking-wider text-red-200">
            DIGITAL TWIN SIMULATION ACTIVE:
          </span>
          <span className="font-mono font-bold text-white bg-red-900/80 px-2 py-0.5 rounded border border-red-500/50">
            {impact.incident_segment_id}
          </span>
          <span className="text-red-300">
            ({impact.incident_type} · {impact.severity} · {(impact.capacity_factor * 100).toFixed(0)}% Capacity · {impact.affected_segments_count} Segments Impacted)
          </span>
        </div>
      </div>

      <button
        onClick={onReset}
        disabled={resetLoading}
        className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-[11px] font-bold transition-all shadow border border-red-600 disabled:opacity-50"
      >
        {resetLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RotateCcw className="w-3.5 h-3.5" />
        )}
        <span>RESET SIMULATION</span>
      </button>
    </div>
  );
}
