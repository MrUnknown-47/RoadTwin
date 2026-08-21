'use client';

import React from 'react';
import { Database, ShieldCheck, X, FileText, AlertTriangle } from 'lucide-react';

interface DataProvenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataProvenanceDrawer({ isOpen, onClose }: DataProvenanceDrawerProps) {
  if (!isOpen) return null;

  const provenanceItems = [
    {
      layer: 'ROADWAY NETWORK',
      source: 'OpenStreetMap + RoadTwin Standardization',
      details: '405 standardized directed segments (201 SB, 204 NB, 39 ramps) over 165 km Yamuna Expressway.',
      badge: 'CP01 / CP02 VALIDATED',
      badgeColor: 'bg-sky-950 text-sky-400 border-sky-500/30'
    },
    {
      layer: 'ATMOSPHERIC LAYER',
      source: 'NASA POWER / MERRA-2 Reanalysis',
      details: 'Hourly reanalysis data across 4 corridor grid cells and 5 spatial anchors. Reanalysis estimates, not roadside micro-weather stations.',
      badge: 'CP04 HISTORICAL REANALYSIS',
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
    },
    {
      layer: 'HISTORICAL TRAFFIC',
      source: 'YEIDA / SaveLIFE / TRIPP Survey-Calibrated Baseline',
      details: 'Hourly diurnal speed & volume curves across 405 segments. Calibrated baseline, not minute-by-minute inductive loop telemetry.',
      badge: 'CP05 CALIBRATED BASELINE',
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-500/30'
    },
    {
      layer: 'LIVE TRAFFIC ADAPTER',
      source: 'TomTom Traffic Flow API v4',
      details: 'Activated when TOMTOM_API_KEY is configured. If unconfigured, system explicitly reports MOCK_OR_UNAVAILABLE without fabricating readings.',
      badge: 'LIVE OR MOCK_OR_UNAVAILABLE',
      badgeColor: 'bg-purple-950 text-purple-400 border-purple-500/30'
    },
    {
      layer: 'ACCIDENT CRASH GROUND TRUTH',
      source: 'MoRTH / YEIDA Documented Baseline',
      details: '40 chainage-verified crash records (2021–2023) used for spatial lookback features. Low-sample verified ground truth.',
      badge: 'CP03 40 VERIFIED CRASHES',
      badgeColor: 'bg-rose-950 text-rose-400 border-rose-500/30'
    },
    {
      layer: 'ACCIDENT RISK MODEL',
      source: 'CP07 XGBoost Machine Learning Classifier',
      details: 'Trained on 31 spatio-temporal features. Produces Relative Risk Score & Risk Percentile for decision support — not literal crash probability.',
      badge: 'CP07 XGBOOST (31 FEATURES)',
      badgeColor: 'bg-indigo-950 text-indigo-400 border-indigo-500/30'
    },
    {
      layer: 'ROUTING GRAPH',
      source: 'Layer B Directed MultiDiGraph',
      details: '1,863 nodes, 3,461 edges with 100% 405-segment topological mapping, Multi-Objective Dijkstra routing, and strict carriageway separation.',
      badge: 'CP08 LAYER B DIRECTED',
      badgeColor: 'bg-teal-950 text-teal-400 border-teal-500/30'
    },
    {
      layer: 'EMERGENCY DEPOTS',
      source: 'Operational Simulation Bases',
      details: '6 strategic corridor emergency stations modeled as SIMULATION_DEPOT with 0.8 speed multiplier and 4.0 risk penalty assumptions.',
      badge: 'SIMULATION_DEPOT',
      badgeColor: 'bg-red-950 text-red-400 border-red-500/30'
    },
    {
      layer: 'VMS SPEED ADVISORY',
      source: 'VMS Operational Policy Assumption',
      details: 'Rule-based variable speed and message board recommendation engine for highway gantries (Decision Support Only).',
      badge: 'VMS_POLICY_ASSUMPTION',
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                DATA PROVENANCE & ARCHITECTURAL SEMANTICS
              </h3>
              <p className="text-[11px] text-slate-400">
                Transparent disclosure of data layers, assumptions & decision-support semantics
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

        {/* Content */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
          {provenanceItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  {item.layer}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
              <div className="font-mono text-sky-300 text-[11px]">Source: {item.source}</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{item.details}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>RoadTwin AI · Smart India Hackathon 2026</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
}
