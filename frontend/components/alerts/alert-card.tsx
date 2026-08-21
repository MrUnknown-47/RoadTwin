'use client';

import React from 'react';
import { AlertItem } from '@/lib/types';
import { ShieldAlert, AlertTriangle, Info, MapPin, CheckCircle, ArrowUpRight } from 'lucide-react';

interface AlertCardProps {
  alert: AlertItem;
  onSelectSegment: (segmentId: string) => void;
  onAcknowledge: (alertId: string) => Promise<void>;
  isAcknowledging?: boolean;
}

export function AlertCard({ alert, onSelectSegment, onAcknowledge, isAcknowledging = false }: AlertCardProps) {
  const isCritical = alert.severity === 'CRITICAL';
  const isWarning = alert.severity === 'WARNING';
  const isAcknowledged = alert.status === 'ACKNOWLEDGED';

  const severityBg = isCritical 
    ? 'bg-red-950/80 border-red-500/50 text-red-200' 
    : isWarning 
    ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' 
    : 'bg-sky-950/80 border-sky-500/50 text-sky-200';

  const badgeBg = isCritical
    ? 'bg-red-500/20 text-red-400 border-red-500/40'
    : isWarning
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    : 'bg-sky-500/20 text-sky-400 border-sky-500/40';

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`border rounded-lg p-3 transition-all ${severityBg} shadow-md space-y-2`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${badgeBg}`}>
            {alert.severity}
          </span>
          <span className="font-mono text-xs font-bold text-slate-100">
            {alert.hazard_type.replace('_', ' ')}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {formatTimeAgo(alert.created_at)}
        </span>
      </div>

      {/* Target Segment & Risk Percentile */}
      <div className="flex items-center justify-between text-xs bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80 font-mono">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-200 font-bold">{alert.segment_id}</span>
        </div>
        <div className="text-[11px] text-slate-300">
          Risk: <span className="font-bold text-amber-400">{alert.risk_percentile.toFixed(1)}%ile</span>
        </div>
      </div>

      {/* Message & Action */}
      <p className="text-xs text-slate-300 leading-snug">
        {alert.message}
      </p>

      <div className="text-[11px] text-slate-400 font-mono bg-slate-950/70 p-1.5 rounded border border-slate-800">
        <span className="text-sky-400 font-bold">Action:</span> {alert.recommended_action}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
        <button
          onClick={() => onSelectSegment(alert.segment_id)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition-colors"
        >
          <span>View on Map</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>

        {!isAcknowledged ? (
          <button
            onClick={() => onAcknowledge(alert.alert_id)}
            disabled={isAcknowledging}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-[11px] text-white font-semibold transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3 h-3" />
            <span>{isAcknowledging ? 'Acking...' : 'Acknowledge'}</span>
          </button>
        ) : (
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            <span>Acknowledged</span>
          </span>
        )}
      </div>
    </div>
  );
}
