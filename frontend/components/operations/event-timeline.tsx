'use client';

import React from 'react';
import { TimelineEvent } from '@/lib/types';
import { History, ShieldAlert, Radio, Ambulance, RotateCcw, Info, ArrowUpRight } from 'lucide-react';

interface EventTimelineProps {
  events: TimelineEvent[];
  onSelectSegment: (segmentId: string) => void;
}

export function EventTimeline({ events, onSelectSegment }: EventTimelineProps) {
  const getIcon = (type: string, sev: string) => {
    if (sev === 'CRITICAL' || type.includes('INCIDENT')) {
      return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
    }
    if (type.includes('DISPATCH')) {
      return <Ambulance className="w-3.5 h-3.5 text-emerald-400" />;
    }
    if (type.includes('RESET')) {
      return <RotateCcw className="w-3.5 h-3.5 text-sky-400" />;
    }
    if (type.includes('VMS')) {
      return <Radio className="w-3.5 h-3.5 text-amber-400" />;
    }
    return <Info className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full max-h-[550px]">
      {/* Header */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            OPERATIONAL EVENT LOG
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800">
          {events.length} Events
        </span>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto flex-1 font-sans">
        {events.map((evt) => (
          <div
            key={evt.event_id}
            className="flex items-start gap-2.5 p-2 rounded bg-slate-800/40 border border-slate-700/40 text-xs hover:bg-slate-800/70 transition-colors"
          >
            <div className="p-1 rounded bg-slate-900 border border-slate-750 shrink-0 mt-0.5">
              {getIcon(evt.event_type, evt.severity)}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-200 truncate">{evt.title}</div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{evt.time_str}</span>
              </div>
              <div className="text-[11px] text-slate-400 leading-snug">{evt.description}</div>
              {evt.segment_id && (
                <button
                  onClick={() => onSelectSegment(evt.segment_id!)}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-0.5 mt-1"
                >
                  <span>Locate {evt.segment_id}</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
