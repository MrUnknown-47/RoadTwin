'use client';

import React from 'react';
import { HealthResponse, SystemStatusResponse, OperationalMode } from '@/lib/types';
import { 
  Activity, ShieldCheck, Database, RefreshCw, 
  Sparkles, Gauge, Bell, Cpu 
} from 'lucide-react';

interface SystemStatusProps {
  health: HealthResponse | null;
  systemStatus: SystemStatusResponse | null;
  currentMode: OperationalMode;
  onModeChange: (mode: OperationalMode) => void;
  onOpenProvenance: () => void;
  onOpenDiagnostics: () => void;
  onOpenDemo: () => void;
  isDemoActive: boolean;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  lastUpdated: string | null;
}

export function SystemStatus({
  health,
  systemStatus,
  currentMode,
  onModeChange,
  onOpenProvenance,
  onOpenDiagnostics,
  onOpenDemo,
  isDemoActive,
  loading,
  error,
  onRefresh,
  lastUpdated,
}: SystemStatusProps) {
  const isHealthy = health?.status === 'HEALTHY' && !error;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
          <Activity className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-white uppercase font-sans">
              ROADTWIN <span className="text-sky-400">AI</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40">
              SIH 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Yamuna Expressway Digital Twin · 165 km Corridor
          </p>
        </div>
      </div>

      {/* Center: Operational Mode Selector */}
      <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
        <span className="text-[10px] text-slate-400 uppercase font-mono px-2 font-bold">
          Data Mode:
        </span>
        <button
          onClick={() => onModeChange('BASELINE')}
          className={`px-2.5 py-1 rounded font-mono text-xs transition-all ${
            currentMode === 'BASELINE'
              ? 'bg-sky-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Calibrated Diurnal Baseline (SaveLIFE / TRIPP / NASA POWER)"
        >
          BASELINE
        </button>
        <button
          onClick={() => onModeChange('LIVE')}
          className={`px-2.5 py-1 rounded font-mono text-xs transition-all ${
            currentMode === 'LIVE'
              ? 'bg-purple-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="TomTom Live Flow Adapter (Or MOCK_OR_UNAVAILABLE)"
        >
          LIVE
        </button>
        <button
          onClick={() => onModeChange('DEMO_NIGHT_FOG')}
          className={`px-2.5 py-1 rounded font-mono text-xs transition-all ${
            currentMode === 'DEMO_NIGHT_FOG'
              ? 'bg-amber-600 text-white font-bold shadow'
              : 'text-amber-400/80 hover:text-amber-200'
          }`}
          title="04:00 Winter Fog & Speed Excess Scenario [DEMO]"
        >
          04:00 FOG DEMO
        </button>
      </div>

      {/* Right Controls: SIH Demo, Diagnostics, Provenance */}
      <div className="flex items-center gap-2.5">
        {/* SIH Official Demo Controller Button */}
        <button
          onClick={onOpenDemo}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
            isDemoActive
              ? 'bg-amber-500 text-slate-950 border border-amber-300 animate-pulse'
              : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-500 hover:to-indigo-500'
          }`}
          title="Launch SIH 2026 10-Step Jury Demonstration"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>SIH DEMO</span>
        </button>

        {/* Active Alerts Pill */}
        {systemStatus && systemStatus.active_alerts_count > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950 border border-red-500/50 text-red-300 text-xs font-mono font-bold">
            <Bell className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>{systemStatus.active_alerts_count} ALERTS</span>
          </div>
        )}

        {/* Diagnostics Button */}
        <button
          onClick={onOpenDiagnostics}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors border border-slate-700"
          title="Inspect Subsystem Readiness & Engine Benchmarks"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Diagnostics</span>
        </button>

        {/* Provenance Button */}
        <button
          onClick={onOpenProvenance}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors border border-slate-700"
          title="Inspect Layer Provenance & Model Semantics"
        >
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>Provenance</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700 disabled:opacity-50"
          title="Refresh Corridor State"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>
    </header>
  );
}
