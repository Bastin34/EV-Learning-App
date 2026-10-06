import React, { useState } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Cpu,
  Layers,
  Zap,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

interface VCULabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const VCULab: React.FC<VCULabProps> = ({ telemetry, onUpdateTelemetry }) => {
  // Accelerator pedal dual sensor inputs (APP1: 0.5V - 4.5V; APP2: 0.25V - 2.25V)
  const [pedalTravelPct, setPedalTravelPct] = useState<number>(40);
  const [injectAppMismatch, setInjectAppMismatch] = useState<boolean>(false);

  // Derived APP voltages
  const app1Voltage = 0.5 + (pedalTravelPct / 100) * 4.0;
  // Normally APP2 is exactly 50% of APP1. If mismatch injected, APP2 drifts
  const app2Voltage = injectAppMismatch ? 0.3 : 0.25 + (pedalTravelPct / 100) * 2.0;

  // Plausibility check: |APP1 - 2*APP2| must be < 0.25V
  const isPlausibilityOk = Math.abs(app1Voltage - 2 * app2Voltage) < 0.25;

  // Drive Mode Torque Map scaling
  const maxTorqueMap =
    telemetry.driveMode === 'Ludicrous'
      ? 520
      : telemetry.driveMode === 'Sport'
      ? 450
      : telemetry.driveMode === 'Normal'
      ? 360
      : 240;

  // Torque demand calculation
  const calculatedTorqueRequestNm = isPlausibilityOk && telemetry.gear === 'D'
    ? Math.round((pedalTravelPct / 100) * maxTorqueMap)
    : 0;

  // VCU Output Decisions
  const coolingRequest = telemetry.batteryTempC > 35 || telemetry.motorTempC > 80 ? 'HIGH' : 'NORMAL';
  const vcuSafetyState = !isPlausibilityOk
    ? 'LIMP HOME (TORQUE MUTED)'
    : telemetry.hvReady
    ? 'DRIVE ACTIVE (ASIL-D NOMINAL)'
    : 'STANDBY';

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Vehicle Control Unit (VCU) Master Logic Lab</h2>
            <p className="text-xs text-slate-400">
              ISO 26262 ASIL-D dual sensor plausibility, torque arbitration & state supervisory logic
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-400 block">VCU Supervisory State</span>
          <span
            className={`text-sm font-bold ${
              !isPlausibilityOk ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {vcuSafetyState}
          </span>
        </div>
      </div>

      {/* Dual Accelerator Pedal Sensor Cross-Plausibility Check */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Pedal Sensor Acquisition (APP1 vs APP2)
            </span>
            <button
              onClick={() => setInjectAppMismatch(!injectAppMismatch)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                injectAppMismatch
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {injectAppMismatch ? 'Fault Injected: Clear' : 'Inject Sensor Drift'}
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Driver Pedal Position</span>
              <span className="text-cyan-300 font-bold">{pedalTravelPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={pedalTravelPct}
              onChange={(e) => setPedalTravelPct(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Sensor 1 (APP1 0.5V - 4.5V)</span>
              <span className="text-lg font-bold text-cyan-300">{app1Voltage.toFixed(2)} V</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Sensor 2 (APP2 0.25V - 2.25V)</span>
              <span className={`text-lg font-bold ${injectAppMismatch ? 'text-rose-400' : 'text-amber-300'}`}>
                {app2Voltage.toFixed(2)} V
              </span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
              isPlausibilityOk
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            }`}
          >
            {isPlausibilityOk ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <span>
              {isPlausibilityOk
                ? 'Sensor Plausibility Verified: Transfer function $|V_1 - 2V_2| < 0.25V$ satisfied.'
                : 'CRITICAL SAFETY VIOLATION: Pedal sensor voltage correlation failed! VCU mutes torque to 0 Nm.'}
            </span>
          </div>
        </div>

        {/* VCU Torque Arbitration & Actuation Outputs */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-4">
              VCU CAN Actuation Command Dispatch
            </span>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Torque Request (T*_req) → Inverter</span>
                <span className="text-cyan-300 font-bold text-base">{calculatedTorqueRequestNm} Nm</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Coolant Pump Flow Command</span>
                <span className="text-emerald-300 font-bold">{coolingRequest === 'HIGH' ? '28 L/min (MAX)' : '14 L/min (ECO)'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Brake Blending Command</span>
                <span className="text-amber-300 font-bold">{telemetry.regenPowerKw > 0 ? 'REGEN BLENDED' : 'IDLE'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Contactor Safety Interlock Loop</span>
                <span className="text-slate-200 font-bold">{telemetry.hvReady ? 'ENERGIZED' : 'DE-ENERGIZED'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
