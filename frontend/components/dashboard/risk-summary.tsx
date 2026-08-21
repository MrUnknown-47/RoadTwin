'use client';

import React from 'react';
import { CorridorMetricsSummary } from '@/lib/types';
import { ShieldAlert, AlertTriangle, CheckCircle, Gauge, Clock, Layers } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface RiskSummaryProps {
  metrics: CorridorMetricsSummary;
  loading: boolean;
}

export function RiskSummary({ metrics, loading }: RiskSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-slate-900/60 border-b border-slate-800">
      {/* Total Segments */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Corridor Segments</span>
          <Layers className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100">{loading ? '...' : metrics.total_segments}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {metrics.mainline_segments} Mainline · {metrics.ramp_segments} Ramps
          </div>
        </div>
      </div>

      {/* Critical Risk Segments */}
      <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-red-400">
          <span>Critical Risk</span>
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-red-400">{loading ? '...' : metrics.critical_risk_count}</div>
          <div className="text-[10px] text-red-400/80 mt-0.5">≥ 95th Risk Percentile</div>
        </div>
      </div>

      {/* High Risk Segments */}
      <div className="bg-orange-950/30 border border-orange-500/30 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-orange-400">
          <span>High Risk</span>
          <AlertTriangle className="w-4 h-4 text-orange-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-orange-400">{loading ? '...' : metrics.high_risk_count}</div>
          <div className="text-[10px] text-orange-400/80 mt-0.5">85th–95th Percentile</div>
        </div>
      </div>

      {/* Moderate / Low Risk */}
      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-emerald-400">
          <span>Normal / Moderate</span>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-emerald-400">
            {loading ? '...' : metrics.low_risk_count + metrics.moderate_risk_count}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">
            {metrics.moderate_risk_count} Mod · {metrics.low_risk_count} Low
          </div>
        </div>
      </div>

      {/* Mean Operating Speed */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Corridor Mean Speed</span>
          <Gauge className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100">
            {loading ? '...' : `${formatNumber(metrics.mean_speed_kph)} km/h`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Baseline Diurnal Speed</div>
        </div>
      </div>

      {/* Mean Congestion Ratio */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Congestion Index</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100">
            {loading ? '...' : `${(metrics.mean_congestion_ratio * 100).toFixed(1)}%`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Corridor Average Delay</div>
        </div>
      </div>
    </div>
  );
}
