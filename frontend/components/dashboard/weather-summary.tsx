'use client';

import React from 'react';
import { CloudRain, Wind, Thermometer, Droplets, Compass } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface WeatherSummaryProps {
  temperatureC?: number;
  humidityPct?: number;
  windSpeedMs?: number;
  fogRiskCode?: number;
}

export function WeatherSummary({ temperatureC = 22.0, humidityPct = 65.0, windSpeedMs = 2.5, fogRiskCode = 0 }: WeatherSummaryProps) {
  const fogLabel = fogRiskCode === 2 ? 'HIGH FOG (DENSE)' : (fogRiskCode === 1 ? 'MODERATE MIST' : 'CLEAR VISIBILITY');
  const fogColor = fogRiskCode === 2 ? 'text-amber-400 bg-amber-950/60 border-amber-500/40' : (fogRiskCode === 1 ? 'text-sky-400 bg-sky-950/60 border-sky-500/40' : 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40');

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">Atmospheric & Fog Monitor</h3>
        </div>
        <span className="text-[10px] text-slate-400">NASA POWER / MERRA-2</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="flex items-center gap-2.5 p-2 rounded bg-slate-800/40 border border-slate-700/40">
          <Thermometer className="w-4 h-4 text-rose-400" />
          <div>
            <div className="text-[10px] text-slate-400">Ambient Temp</div>
            <div className="text-sm font-bold text-slate-100">{formatNumber(temperatureC)}°C</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded bg-slate-800/40 border border-slate-700/40">
          <Droplets className="w-4 h-4 text-sky-400" />
          <div>
            <div className="text-[10px] text-slate-400">Relative Humidity</div>
            <div className="text-sm font-bold text-slate-100">{formatNumber(humidityPct)}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded bg-slate-800/40 border border-slate-700/40">
          <Wind className="w-4 h-4 text-teal-400" />
          <div>
            <div className="text-[10px] text-slate-400">Wind Velocity</div>
            <div className="text-sm font-bold text-slate-100">{formatNumber(windSpeedMs)} m/s</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded bg-slate-800/40 border border-slate-700/40">
          <Compass className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400">Fog Hazard</div>
            <div className="text-xs font-bold text-slate-100">{fogLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
