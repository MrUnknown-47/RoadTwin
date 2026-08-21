'use client';

import React, { useState } from 'react';
import { AlertItem } from '@/lib/types';
import { AlertCard } from './alert-card';
import { ShieldAlert, Bell, Filter, CheckCircle2 } from 'lucide-react';

interface AlertFeedProps {
  alerts: AlertItem[];
  onSelectSegment: (segmentId: string) => void;
  onAcknowledge: (alertId: string) => Promise<void>;
  loading?: boolean;
}

export function AlertFeed({ alerts, onSelectSegment, onAcknowledge, loading = false }: AlertFeedProps) {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [ackingId, setAckingId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (filter === 'WARNING') return a.severity === 'WARNING';
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;

  const handleAck = async (id: string) => {
    setAckingId(id);
    try {
      await onAcknowledge(id);
    } finally {
      setAckingId(null);
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full max-h-[550px]">
      {/* Feed Header */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            OPERATIONAL HAZARD ALERTS
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {alerts.length} Active
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-0.5 rounded transition-all ${
              filter === 'ALL' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={`px-2 py-0.5 rounded transition-all ${
              filter === 'CRITICAL' ? 'bg-red-600 text-white font-bold' : 'text-red-400 hover:text-red-300'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('WARNING')}
            className={`px-2 py-0.5 rounded transition-all ${
              filter === 'WARNING' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Warning ({warningCount})
          </button>
        </div>
      </div>

      {/* Feed Content */}
      <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.alert_id}
              alert={alert}
              onSelectSegment={onSelectSegment}
              onAcknowledge={handleAck}
              isAcknowledging={ackingId === alert.alert_id}
            />
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs space-y-1">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500/50" />
            <div>No active operational alerts in current filter.</div>
            <div className="text-[10px] text-slate-600">Corridor operating within nominal hazard parameters.</div>
          </div>
        )}
      </div>
    </div>
  );
}
