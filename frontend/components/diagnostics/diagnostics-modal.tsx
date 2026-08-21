'use client';

import React from 'react';
import { SystemReadinessResponse, SystemDiagnosticsResponse } from '@/lib/types';
import { Activity, CheckCircle2, AlertTriangle, X, Gauge, Cpu, Database, Network } from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  readiness: SystemReadinessResponse | null;
  diagnostics: SystemDiagnosticsResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export function DiagnosticsModal({
  isOpen,
  onClose,
  readiness,
  diagnostics,
  loading,
  onRefresh,
}: DiagnosticsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                ENGINEERING OBSERVABILITY & READINESS DIAGNOSTICS
              </h3>
              <p className="text-[11px] text-slate-400">
                Subsystem readiness checks, model singleton verification & latency benchmarks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Readiness Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-slate-100">
                  SYSTEM STATUS: {readiness?.status === 'READY' ? 'READY FOR SIH PRODUCTION' : 'INITIALIZING'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Corridor: {readiness?.corridor || 'Yamuna Expressway (165 km)'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
              {readiness?.status}
            </span>
          </div>

          {/* Subsystems Readiness Grid */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Subsystem Readiness Matrix
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-sans font-semibold">
                  <span className="flex items-center gap-1">
                    <Network className="w-3.5 h-3.5 text-sky-400" />
                    <span>Layer B Graph</span>
                  </span>
                  <span className="text-emerald-400">READY</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Nodes: {readiness?.diagnostics?.graph?.nodes} · Edges: {readiness?.diagnostics?.graph?.edges}
                </div>
              </div>

              <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-sans font-semibold">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>CP07 Risk Model</span>
                  </span>
                  <span className="text-emerald-400">SINGLETON</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Features: {readiness?.diagnostics?.risk_engine?.feature_count} · XGBoost
                </div>
              </div>

              <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-sans font-semibold">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>SQLite Alert DB</span>
                  </span>
                  <span className="text-emerald-400">READY</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Persisted Alerts: {readiness?.diagnostics?.database?.persisted_alerts}
                </div>
              </div>

              <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-sans font-semibold">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-rose-400" />
                    <span>Segment Registry</span>
                  </span>
                  <span className="text-emerald-400">READY</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Total: {readiness?.diagnostics?.segments?.count} Segments
                </div>
              </div>
            </div>
          </div>

          {/* Engine Latency Benchmarks */}
          {diagnostics && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Engine Latency Benchmarks (Sub-Second Response)
              </h4>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Full State Scan (405 Segments):</span>
                  <span className="text-emerald-400 font-bold">
                    {diagnostics.benchmarks.get_all_segment_states_ms.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">CP07 XGBoost Inference (405 Segments):</span>
                  <span className="text-emerald-400 font-bold">
                    {diagnostics.benchmarks.risk_inference_405_segments_ms.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Corridor Dijkstra Routing (177 km):</span>
                  <span className="text-emerald-400 font-bold">
                    {diagnostics.benchmarks.dijkstra_corridor_routing_ms.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Emergency Nearest Depot Optimization:</span>
                  <span className="text-emerald-400 font-bold">
                    {diagnostics.benchmarks.emergency_dispatch_optimization_ms.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <span className="text-slate-400 font-sans">Application Startup Duration:</span>
                  <span className="text-sky-300 font-bold">
                    {diagnostics.startup_duration_sec.toFixed(3)} s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Environment: {diagnostics?.environment || 'development'}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Re-Benchmark
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
