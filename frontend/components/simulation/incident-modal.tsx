'use client';

import React, { useState } from 'react';
import { IncidentType, SeverityType } from '@/lib/types';
import { ShieldAlert, AlertTriangle, X, Play, Loader2, Zap, Sliders } from 'lucide-react';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSegmentId: string;
  onRunSimulation: (params: {
    segment_id: string;
    incident_type: IncidentType;
    severity: SeverityType;
    capacity_factor: number;
  }) => Promise<void>;
  loading: boolean;
}

export function IncidentModal({
  isOpen,
  onClose,
  selectedSegmentId,
  onRunSimulation,
  loading,
}: IncidentModalProps) {
  const [segmentId, setSegmentId] = useState(selectedSegmentId || 'YE_MAIN_SB_050');
  const [incidentType, setIncidentType] = useState<IncidentType>('ACCIDENT');
  const [severity, setSeverity] = useState<SeverityType>('CRITICAL');
  const [capacityFactor, setCapacityFactor] = useState<number>(0.20);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRunSimulation({
      segment_id: segmentId,
      incident_type: incidentType,
      severity: severity,
      capacity_factor: capacityFactor,
    });
  };

  const setPreset = (type: IncidentType, sev: SeverityType, cap: number) => {
    setIncidentType(type);
    setSeverity(sev);
    setCapacityFactor(cap);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                WHAT-IF INCIDENT SIMULATION
              </h3>
              <p className="text-[11px] text-slate-400">
                Trigger synthetic incident & evaluate corridor network degradation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Simulation Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset('ACCIDENT', 'CRITICAL', 0.20)}
                className={`text-xs py-1.5 px-2 rounded border font-medium transition-all text-center ${
                  incidentType === 'ACCIDENT' && severity === 'CRITICAL' && capacityFactor === 0.20
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Major Crash (20%)
              </button>
              <button
                type="button"
                onClick={() => setPreset('ROAD_CLOSURE', 'CRITICAL', 0.0)}
                className={`text-xs py-1.5 px-2 rounded border font-medium transition-all text-center ${
                  capacityFactor === 0.0
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Total Block (0%)
              </button>
              <button
                type="button"
                onClick={() => setPreset('LANE_CLOSURE', 'MEDIUM', 0.50)}
                className={`text-xs py-1.5 px-2 rounded border font-medium transition-all text-center ${
                  incidentType === 'LANE_CLOSURE'
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Lane Closure (50%)
              </button>
            </div>
          </div>

          {/* Target Segment */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Target RoadTwin Segment ID
            </label>
            <input
              type="text"
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value.toUpperCase())}
              required
              placeholder="e.g. YE_MAIN_SB_050"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          {/* Grid: Incident Type & Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Incident Type
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
              >
                <option value="ACCIDENT">ACCIDENT</option>
                <option value="VEHICLE_BREAKDOWN">VEHICLE_BREAKDOWN</option>
                <option value="LANE_CLOSURE">LANE_CLOSURE</option>
                <option value="ROAD_CLOSURE">ROAD_CLOSURE</option>
                <option value="FOG_EVENT">FOG_EVENT</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          {/* Remaining Capacity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Operating Capacity Factor:</span>
              </label>
              <span className="font-mono text-xs font-bold text-amber-400">
                {(capacityFactor * 100).toFixed(0)}% {capacityFactor === 0.0 ? '(TOTAL ROAD CLOSURE)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={capacityFactor}
              onChange={(e) => setCapacityFactor(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0% (Blocked)</span>
              <span>25% (Major)</span>
              <span>50% (1-Lane)</span>
              <span>100% (Normal)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg shadow-red-900/50 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>RUNNING SIMULATION...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RUN SIMULATION</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
