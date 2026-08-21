'use client';

import React from 'react';
import { DirectionType } from '@/lib/types';
import { Compass, Filter, RefreshCw, Layers } from 'lucide-react';

interface MapLegendProps {
  directionFilter: DirectionType;
  onDirectionChange: (dir: DirectionType) => void;
  onResetView: () => void;
  selectedSegmentId: string | null;
  totalSegmentsShown: number;
}

export function MapLegend({
  directionFilter,
  onDirectionChange,
  onResetView,
  selectedSegmentId,
  totalSegmentsShown,
}: MapLegendProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2.5 max-w-xs pointer-events-auto">
      {/* Direction Filter Bar */}
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>CARRIAGEWAY FILTER</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{totalSegmentsShown} Segments</span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {(['ALL', 'SB', 'NB', 'RAMPS'] as DirectionType[]).map((dir) => {
            const isActive = directionFilter === dir;
            const labels: Record<DirectionType, string> = {
              ALL: 'ALL',
              SB: 'SB ↓',
              NB: 'NB ↑',
              RAMPS: 'RAMPS',
            };
            return (
              <button
                key={dir}
                onClick={() => onDirectionChange(dir)}
                className={`text-[11px] font-medium py-1 px-1.5 rounded transition-all text-center ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {labels[dir]}
              </button>
            );
          })}
        </div>
      </div>

      {/* CP07 Relative Risk Legend */}
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 shadow-xl">
        <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>CP07 Relative Risk</span>
          <span className="text-[9px] text-slate-500 font-normal">PERCENTILE</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-slate-200">CRITICAL</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">≥ 95%</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-orange-500" />
              <span className="text-slate-200">HIGH</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">85% – 95%</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-amber-400" />
              <span className="text-slate-200">MODERATE</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">70% – 85%</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-200">LOW</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">&lt; 70%</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onResetView}
            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
          >
            <Compass className="w-3 h-3" />
            <span>Reset View</span>
          </button>

          {selectedSegmentId && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">
              {selectedSegmentId}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
