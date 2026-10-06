import React, { useState } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  RotateCcw,
  Zap,
  Activity,
  BatteryCharging,
  TrendingDown,
  Sliders,
  ShieldAlert,
  Info,
  CheckCircle2
} from 'lucide-react';

interface RegenLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const RegenLab: React.FC<RegenLabProps> = ({ telemetry, onUpdateTelemetry }) => {
  // Sim parameters
  const [vehicleSpeedKmh, setVehicleSpeedKmh] = useState<number>(90);
  const [brakePedalPct, setBrakePedalPct] = useState<number>(60);
  const [battSocPct, setBattSocPct] = useState<number>(72);
  const [packTempC, setPackTempC] = useState<number>(26);
  const [regenMode, setRegenMode] = useState<'Standard' | 'Low' | 'OnePedal'>('OnePedal');

  // Kinetic energy calculation: E_k = 1/2 * m * v^2
  const vehicleMassKg = 2150; // kg
  const speedMs = vehicleSpeedKmh / 3.6;
  const kineticEnergyJoules = 0.5 * vehicleMassKg * Math.pow(speedMs, 2);
  const kineticEnergyKwh = kineticEnergyJoules / (3600 * 1000);

  // Derating conditions:
  // 1. High SOC cutoff: If SOC > 95%, battery cannot accept high charge currents without dendrites/over-voltage
  const isSocRestricted = battSocPct > 95;
  const socDerateFactor = battSocPct > 95 ? Math.max(0, 1 - (battSocPct - 95) / 5) : 1.0;

  // 2. Cold battery cutoff: If Temp < 5°C, lithium plating risk restricts fast regeneration
  const isColdRestricted = packTempC < 10;
  const tempDerateFactor = packTempC < 10 ? Math.max(0.1, packTempC / 10) : 1.0;

  // Maximum vehicle regenerative deceleration power: up to 180 kW
  const maxVehicleRegenKw = 180;
  const requestedRegenKw = (brakePedalPct / 100) * maxVehicleRegenKw;
  const actualRegenPowerKw = requestedRegenKw * socDerateFactor * tempDerateFactor;

  // Friction brake blending percentage
  const totalDecelDemandKw = (brakePedalPct / 100) * 240;
  const frictionBrakeKw = Math.max(0, totalDecelDemandKw - actualRegenPowerKw);
  const regenSharePct = totalDecelDemandKw > 0 ? (actualRegenPowerKw / totalDecelDemandKw) * 100 : 0;

  // Energy recovered per single deceleration stop from current speed to 0 km/h:
  // E_rec = E_k * (actualRegen / totalDecel) * motor_eff (0.92) * inverter_eff (0.97) * battery_coulombic (0.98)
  const drivetrainEfficiency = 0.92 * 0.97 * 0.98; // ≈ 0.874
  const recoveredEnergyKwh = kineticEnergyKwh * (regenSharePct / 100) * drivetrainEfficiency;
  const gainedRangeKm = recoveredEnergyKwh * (1000 / 165); // At 165 Wh/km consumption

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Regenerative Braking & Energy Recovery Lab</h2>
            <p className="text-xs text-slate-400">
              Back-EMF active rectification, electro-hydraulic brake blending & battery acceptance limits
            </p>
          </div>
        </div>

        {/* Regenerative Drive Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          {(['Standard', 'Low', 'OnePedal'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setRegenMode(m)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                regenMode === m ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Energy Flow Direction Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Motoring / Traction Flow */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Motoring Mode (Forward Acceleration)
            </span>
            <span className="text-xs font-mono text-amber-300">Discharging Battery</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-300 font-bold">800V Battery</span>
            <span className="text-slate-500">───►</span>
            <span className="text-amber-300 font-bold">Inverter</span>
            <span className="text-slate-500">───►</span>
            <span className="text-emerald-300 font-bold">Motor</span>
            <span className="text-slate-500">───►</span>
            <span className="text-white font-bold">Wheels</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inverter synthesizes 3-phase AC voltage exceeding rotor back-EMF, forcing electromagnetic torque to drive the road wheels forward.
          </p>
        </div>

        {/* Regenerative Generator Flow */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-emerald-400" /> Regeneration Mode (Braking Recovery)
            </span>
            <span className="text-xs font-mono text-emerald-300">Charging Battery</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-white font-bold">Road Wheels</span>
            <span className="text-slate-500">───►</span>
            <span className="text-emerald-300 font-bold">Motor (Gen)</span>
            <span className="text-slate-500">───►</span>
            <span className="text-amber-300 font-bold">Inverter</span>
            <span className="text-slate-500">───►</span>
            <span className="text-cyan-300 font-bold">800V Battery</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Vehicle momentum back-drives motor shaft. Inverter operates as an active boost rectifier, pushing charging current into the high-voltage battery.
          </p>
        </div>
      </div>

      {/* Interactive Brake Blending Simulator Controls */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-6">
          Brake-by-Wire Deceleration Blending Simulator
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Speed */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Vehicle Speed</span>
              <span className="text-white font-bold">{vehicleSpeedKmh} km/h</span>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={vehicleSpeedKmh}
              onChange={(e) => setVehicleSpeedKmh(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Brake Pedal */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Brake Pedal Pressure</span>
              <span className="text-rose-400 font-bold">{brakePedalPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={brakePedalPct}
              onChange={(e) => setBrakePedalPct(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
          </div>

          {/* Battery SOC */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Battery SOC</span>
              <span className={`font-bold ${isSocRestricted ? 'text-amber-400' : 'text-cyan-300'}`}>
                {battSocPct}% {isSocRestricted && '(DERATED)'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={battSocPct}
              onChange={(e) => setBattSocPct(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Battery Temp */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Battery Pack Temp</span>
              <span className={`font-bold ${isColdRestricted ? 'text-blue-400' : 'text-emerald-300'}`}>
                {packTempC}°C {isColdRestricted && '(COLD LIMIT)'}
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="45"
              step="1"
              value={packTempC}
              onChange={(e) => setPackTempC(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>

        {/* Brake Blending Output Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Electric Regen Power</span>
            <span className="text-xl font-bold text-emerald-400">{actualRegenPowerKw.toFixed(1)} kW</span>
            <span className="text-[10px] text-slate-500 block mt-1">({regenSharePct.toFixed(0)}% of total braking force)</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Hydraulic Friction Brakes</span>
            <span className="text-xl font-bold text-rose-400">{frictionBrakeKw.toFixed(1)} kW</span>
            <span className="text-[10px] text-slate-500 block mt-1">Dissipated as heat on brake rotors</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Energy Recovered per Stop</span>
            <span className="text-xl font-bold text-cyan-300">{recoveredEnergyKwh.toFixed(3)} kWh</span>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1">+{gainedRangeKm.toFixed(2)} km driving range added</span>
          </div>
        </div>
      </div>
    </div>
  );
};
