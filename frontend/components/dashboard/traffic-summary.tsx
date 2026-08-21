'use client';

import React from 'react';
import { Car, Info } from 'lucide-react';

interface TrafficSummaryProps {
  mode?: string;
  meanSpeedKph?: number;
  totalSegments?: number;
  trafficProvider?: {
    configured_mode: string;
    status: string;
    source: string;
    tomtom_configured?: boolean;
  } | null;
}

export function TrafficSummary({ 
  mode = 'BASELINE', 
  meanSpeedKph = 92.4, 
  totalSegments = 405,
  trafficProvider = null
}: TrafficSummaryProps) {
  const isLiveMode = mode === 'LIVE';
  const isTomTomConfigured = Boolean(trafficProvider?.tomtom_configured);
  const isLiveSuccess = isLiveMode && (trafficProvider?.status === 'LIVE' || isTomTomConfigured);

  let badgeText = 'CALIBRATED BASELINE';
  let badgeColor = 'bg-sky-950/60 text-sky-400 border-sky-500/40';
  let trafficSourceText = 'SURVEY_CALIBRATED_DIURNAL_BASELINE';
  let liveAdapterText = isTomTomConfigured ? 'READY (Key Configured)' : 'MOCK_OR_UNAVAILABLE (No API Key)';
  let liveAdapterColor = isTomTomConfigured ? 'text-emerald-400' : 'text-amber-400';

  if (isLiveMode) {
    if (isLiveSuccess) {
      badgeText = 'LIVE TOMTOM';
      badgeColor = 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
      trafficSourceText = 'TOMTOM_LIVE_TRAFFIC_FLOW';
      liveAdapterText = 'LIVE';
      liveAdapterColor = 'text-emerald-400';
    } else {
      badgeText = 'CALIBRATED BASELINE';
      badgeColor = 'bg-amber-950/60 text-amber-400 border-amber-500/40';
      trafficSourceText = 'SURVEY_CALIBRATED_DIURNAL_BASELINE';
      liveAdapterText = 'MOCK_OR_UNAVAILABLE';
      liveAdapterColor = 'text-amber-400';
    }
  } else if (mode === 'DEMO_NIGHT_FOG') {
    badgeText = 'DEMO SCENARIO';
    badgeColor = 'bg-amber-950/60 text-amber-400 border-amber-500/40';
    trafficSourceText = 'DEMO_SCENARIO_SYNTHETIC';
    liveAdapterText = 'SYNTHETIC_FOG_OPERATIONAL_INPUT';
    liveAdapterColor = 'text-amber-400';
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-sans">Traffic Layer Telemetry</h3>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded font-medium border font-mono ${badgeColor}`}>
          {badgeText}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Traffic Source:</span>
          <span className="font-mono text-slate-200 text-[11px]">{trafficSourceText}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Live API Adapter:</span>
          <span className={`${liveAdapterColor} font-mono text-[11px]`}>{liveAdapterText}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Corridor Mean Speed:</span>
          <span className="text-slate-200 font-medium font-mono">{meanSpeedKph.toFixed(1)} km/h ({totalSegments} Segments)</span>
        </div>

        <div className="p-2 rounded bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>
            {isLiveSuccess 
              ? 'Real-time traffic speeds ingested from TomTom Traffic Flow API across representative Yamuna Expressway anchors.' 
              : 'Nominal baseline speeds calibrated from SaveLIFE Foundation radar audits and Concessionaire toll counts.'}
          </span>
        </div>
      </div>
    </div>
  );
}
