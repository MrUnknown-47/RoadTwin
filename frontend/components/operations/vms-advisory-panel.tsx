'use client';

import React from 'react';
import { VMSAdvisory } from '@/lib/types';
import { Radio, Gauge, MapPin, AlertCircle, ArrowUpRight } from 'lucide-react';

interface VMSAdvisoryPanelProps {
  advisories: VMSAdvisory[];
  onSelectSegment: (segmentId: string) => void;
}

export function VMSAdvisoryPanel({ advisories, onSelectSegment }: VMSAdvisoryPanelProps) {
  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full max-h-[550px]">
      {/* Header */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            VMS SPEED ADVISORY & DISPLAY GANTRIES
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
          {advisories.length} Gantries Active
        </span>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        <div className="text-[11px] text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>
            <strong>Decision Support Policy:</strong> Variable Message Sign recommendations are computed dynamically via <code>VMS_POLICY_ASSUMPTION</code> rules.
          </span>
        </div>

        {advisories.map((vms) => (
          <div
            key={vms.vms_id}
            className="bg-black border border-slate-800 rounded-lg p-3 space-y-2.5 shadow-lg relative overflow-hidden"
          >
            {/* Top Gantry ID & Location */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-200 font-bold">{vms.segment_id}</span>
                <span>(Km {vms.chainage_km} {vms.direction})</span>
              </div>
              <button
                onClick={() => onSelectSegment(vms.segment_id)}
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
              >
                <span>Locate</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* LED Gantry Display Simulation */}
            <div className="bg-[#050505] border-2 border-[#1a1a1a] rounded p-2.5 flex items-center justify-between gap-3 shadow-inner">
              {/* LED Speed Badge */}
              <div className="flex flex-col items-center justify-center bg-black border-2 border-red-500 rounded-full w-14 h-14 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                <span className="font-mono text-lg font-black text-amber-300 tracking-tighter">
                  {vms.recommended_advisory_speed_kph}
                </span>
                <span className="text-[8px] font-mono text-red-400 uppercase -mt-1">KM/H</span>
              </div>

              {/* LED Text Matrix */}
              <div className="flex-1 font-mono tracking-wider space-y-0.5">
                <div
                  className="text-xs font-black uppercase text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                  style={{ color: vms.color_code }}
                >
                  {vms.primary_message}
                </div>
                <div className="text-[10px] text-amber-200/90 font-medium">
                  {vms.secondary_message}
                </div>
              </div>
            </div>

            {/* Telemetry Comparison & Policy Source */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900">
              <div>
                Operating Speed: <span className="text-slate-200">{vms.current_operating_speed_kph} km/h</span>
              </div>
              <div className="text-[9px] text-slate-500 truncate max-w-[200px]" title={vms.policy_source}>
                {vms.policy_source}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
