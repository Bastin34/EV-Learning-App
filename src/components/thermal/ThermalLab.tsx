import React, { useState } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Thermometer,
  Activity,
  Layers,
  Zap,
  Sliders,
  Flame,
  Snowflake,
  ShieldAlert,
  Info,
  CheckCircle2
} from 'lucide-react';

interface ThermalLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const ThermalLab: React.FC<ThermalLabProps> = ({ telemetry, onUpdateTelemetry }) => {
  // Loop routing mode
  const [valveMode, setValveMode] = useState<'parallel' | 'series' | 'chilled'>('chilled');
  // Ambient temperature (°C)
  const [ambientTempC, setAmbientTempC] = useState<number>(32);
  // Thermal load factor (motoring or fast charge)
  const [thermalLoadFactor, setThermalLoadFactor] = useState<number>(75); // %
  // Coolant Pump Speed (RPM)
  const [pumpRpm, setPumpRpm] = useState<number>(3600);

  // Calculations
  const flowRateLpm = Math.round((pumpRpm / 4500) * 28 * 10) / 10;
  // Battery temp dynamic calculation
  const batteryCoolingPowerKw = valveMode === 'chilled' ? 8.5 : 3.2;
  const batteryHeatGenerationKw = (thermalLoadFactor / 100) * 6.5;
  const netBatteryHeatKw = batteryHeatGenerationKw - batteryCoolingPowerKw;
  const estBatteryTempC = Math.round(
    Math.max(18, Math.min(65, ambientTempC - (valveMode === 'chilled' ? 5 : 0) + netBatteryHeatKw * 2.2))
  );

  // Motor & Inverter temps
  const estMotorTempC = Math.round(ambientTempC + (thermalLoadFactor / 100) * 55 - (flowRateLpm / 25) * 12);
  const estInverterTempC = Math.round(ambientTempC + (thermalLoadFactor / 100) * 45 - (flowRateLpm / 25) * 10);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Thermal Management Digital Twin</h2>
            <p className="text-xs text-slate-400">
              Liquid cooling loops, 4-way valve routing, chiller heat exchangers & thermal derating models
            </p>
          </div>
        </div>

        {/* 4-Way Valve Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          {[
            { id: 'chilled', label: 'Chilled Mode (Fast Charge / Track)' },
            { id: 'parallel', label: 'Parallel Radiator (Cruising)' },
            { id: 'series', label: 'Series Waste-Heat Scavenge' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setValveMode(mode.id as any)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                valveMode === mode.id
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coolant Loop Routing Schematic Diagram */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" /> Active Coolant Distribution Ring: {valveMode.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-cyan-300">Flow Rate: {flowRateLpm} L/min</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Thermometer className="w-4 h-4" />
              <span className="font-bold">Battery Pack Cold Plate</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{estBatteryTempC} °C</div>
            <span className="text-[10px] text-slate-500 block">Target: 25°C - 35°C</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Flame className="w-4 h-4" />
              <span className="font-bold">PMSM Motor Stator</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{estMotorTempC} °C</div>
            <span className="text-[10px] text-slate-500 block">Max Limit: 160°C</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="font-bold">SiC Inverter Cold Plate</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{estInverterTempC} °C</div>
            <span className="text-[10px] text-slate-500 block">Direct Pin-Fin Cooling</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Snowflake className="w-4 h-4" />
              <span className="font-bold">Refrigerant Chiller</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{valveMode === 'chilled' ? 'ACTIVE' : 'BYPASS'}</div>
            <span className="text-[10px] text-slate-500 block">Extraction: {batteryCoolingPowerKw} kW</span>
          </div>
        </div>
      </div>

      {/* Interactive Thermal Load Control Sliders */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-6">
          Environmental & Powertrain Heat Dissipation Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ambient Temp */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Ambient Air Temperature</span>
              <span className="text-white font-bold">{ambientTempC} °C</span>
            </div>
            <input
              type="range"
              min="-15"
              max="50"
              value={ambientTempC}
              onChange={(e) => setAmbientTempC(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[11px] text-slate-500 block">Simulates desert heatwave vs winter freeze conditions.</span>
          </div>

          {/* Thermal Load */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Powertrain / Charging Thermal Load</span>
              <span className="text-amber-300 font-bold">{thermalLoadFactor}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={thermalLoadFactor}
              onChange={(e) => setThermalLoadFactor(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[11px] text-slate-500 block">100% equates to 250 kW continuous DC fast charging or Nürburgring track driving.</span>
          </div>

          {/* Pump Speed */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Electric Coolant Pump Speed</span>
              <span className="text-emerald-300 font-bold">{pumpRpm} RPM</span>
            </div>
            <input
              type="range"
              min="1000"
              max="4800"
              step="100"
              value={pumpRpm}
              onChange={(e) => setPumpRpm(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[11px] text-slate-500 block">Regulates forced convection heat transfer coefficient ($h$).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
