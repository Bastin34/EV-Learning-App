import React, { useState } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  BatteryCharging,
  Zap,
  Activity,
  Layers,
  Sliders,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';

interface ChargingLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const ChargingLab: React.FC<ChargingLabProps> = ({ telemetry, onUpdateTelemetry }) => {
  // Charge mode: AC Level 2 (11 kW) vs DC Fast Charge (250 kW CCS2/NACS)
  const [chargeType, setChargeType] = useState<'DC_FAST' | 'AC_LEVEL2'>('DC_FAST');
  // Current Battery SOC for charging curve
  const [simSocPct, setSimSocPct] = useState<number>(25);
  // Battery pack temperature
  const [packTempC, setPackTempC] = useState<number>(28);

  // CC-CV Curve Calculation:
  // In CC (Constant Current) phase (0% to 65% SOC): Peak charging power is maintained
  // In CV (Constant Voltage) phase (65% to 100% SOC): Current tapers off exponentially to prevent cell overvoltage
  let availablePowerKw = 0;
  if (chargeType === 'DC_FAST') {
    const peakDcKw = 250;
    if (simSocPct <= 65) {
      availablePowerKw = peakDcKw;
    } else {
      // Taper from 250 kW down to 35 kW at 100%
      const taperFactor = 1 - (simSocPct - 65) / 35;
      availablePowerKw = 35 + peakDcKw * 0.86 * Math.pow(taperFactor, 1.4);
    }
    // Cold battery or hot battery derating
    if (packTempC < 15) {
      availablePowerKw *= Math.max(0.2, packTempC / 15);
    } else if (packTempC > 48) {
      availablePowerKw *= Math.max(0.3, (55 - packTempC) / 7);
    }
  } else {
    // AC Level 2 (11 kW 3-Phase OBC limit)
    availablePowerKw = simSocPct > 95 ? 4.5 : 11.0;
  }

  const dcCurrentA = (availablePowerKw * 1000) / telemetry.batteryVoltageV;
  // Estimated minutes remaining to 80% and 100%
  const energyRemainingTo80Kwh = Math.max(0, (80 - simSocPct) * 0.01 * 94.2);
  const minutesTo80 = Math.round((energyRemainingTo80Kwh / Math.max(5, availablePowerKw)) * 60);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Charging Architecture & CC-CV Curve Lab</h2>
            <p className="text-xs text-slate-400">
              AC Level 2 vs DC Fast Charging (CCS2 / NACS), Control Pilot protocol & thermal derating curves
            </p>
          </div>
        </div>

        {/* Charge Type Segmented Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setChargeType('DC_FAST')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              chargeType === 'DC_FAST' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            DC Fast Charging (CCS2/NACS 250 kW)
          </button>
          <button
            onClick={() => setChargeType('AC_LEVEL2')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              chargeType === 'AC_LEVEL2' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            AC Level 2 Wallbox (11 kW OBC)
          </button>
        </div>
      </div>

      {/* Real-time Charging Metrics & Time Estimation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400 block text-[10px] mb-1">Instantaneous Charge Power</span>
          <span className="text-2xl font-bold text-cyan-300">{availablePowerKw.toFixed(1)} kW</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {simSocPct <= 65 ? 'Constant Current (CC)' : 'Constant Voltage (CV Taper)'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400 block text-[10px] mb-1">Pack Charge Current</span>
          <span className="text-2xl font-bold text-amber-300">{dcCurrentA.toFixed(1)} A</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">At {telemetry.batteryVoltageV.toFixed(0)}V Rail</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400 block text-[10px] mb-1">Estimated Time to 80% SOC</span>
          <span className="text-2xl font-bold text-emerald-300">{minutesTo80} mins</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Fast Charge sweet spot</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400 block text-[10px] mb-1">Added Range Velocity</span>
          <span className="text-2xl font-bold text-white">
            {Math.round((availablePowerKw * 1000) / 165)} km/h
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Effective distance recovery</span>
        </div>
      </div>

      {/* CC-CV Charging Profile Curve Visualization */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" /> Non-Linear CC-CV Charge Profile vs State-of-Charge (0% - 100%)
          </span>
          <span className="text-xs font-mono text-cyan-300">Current SOC: {simSocPct}%</span>
        </div>

        {/* SVG Curve */}
        <div className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex items-end p-2">
          <svg className="w-full h-full absolute inset-0">
            {/* CC Phase Plateau (0 to 65% SOC) */}
            <path
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              d="M 20 20 L 520 20 Q 650 30 760 120"
            />
          </svg>
          {/* Vertical marker for current SOC */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
            style={{ left: `${(simSocPct / 100) * 94 + 3}%` }}
          />
          <div className="relative z-10 w-full flex justify-between text-[10px] font-mono text-slate-500">
            <span>0% SOC</span>
            <span>20%</span>
            <span>40%</span>
            <span>60% (CC/CV Knee)</span>
            <span>80%</span>
            <span>100% SOC</span>
          </div>
        </div>

        {/* Sliders to simulate SOC & Pack Temperature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Battery SOC</span>
              <span className="text-cyan-300 font-bold">{simSocPct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={simSocPct}
              onChange={(e) => setSimSocPct(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Battery Pack Temperature</span>
              <span className="text-amber-300 font-bold">{packTempC} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="55"
              value={packTempC}
              onChange={(e) => setPackTempC(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[11px] text-slate-500 block">Below 15°C cold throttles; above 48°C thermal derates.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
