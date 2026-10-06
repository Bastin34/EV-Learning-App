import React, { useState, useEffect } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Gauge,
  Zap,
  BatteryCharging,
  Thermometer,
  ShieldCheck,
  Power,
  RotateCw,
  Compass,
  ArrowUpRight,
  TrendingDown,
  Activity,
  Flame,
  Award
} from 'lucide-react';

interface VehicleClusterProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
  onNavigateToModule?: (moduleId: string) => void;
}

export const VehicleCluster: React.FC<VehicleClusterProps> = ({
  telemetry,
  onUpdateTelemetry,
  onNavigateToModule
}) => {
  const [isDriveSimActive, setIsDriveSimActive] = useState<boolean>(false);
  const [pedalInput, setPedalInput] = useState<number>(0); // -100 (Full Brake) to +100 (Full Throttle)
  const [roadGradePct, setRoadGradePct] = useState<number>(0);

  // Drive simulator loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDriveSimActive && telemetry.hvReady) {
      interval = setInterval(() => {
        let speed = telemetry.speedKmh;
        let soc = telemetry.batterySoc;
        let odo = telemetry.odometerKm;
        let battTemp = telemetry.batteryTempC;
        let motorTemp = telemetry.motorTempC;
        let invTemp = telemetry.inverterTempC;
        let cur = telemetry.batteryCurrentA;
        let volt = telemetry.batteryVoltageV;
        let power = telemetry.batteryPowerKw;
        let regen = telemetry.regenPowerKw;
        let gear = telemetry.gear;

        if (gear === 'D') {
          if (pedalInput > 0) {
            // Accelerating
            const accelFactor = (pedalInput / 100) * (telemetry.driveMode === 'Ludicrous' ? 4.2 : telemetry.driveMode === 'Sport' ? 3.0 : 2.0);
            speed = Math.min(260, speed + accelFactor * 0.5 - (speed * 0.01) - (roadGradePct * 0.15));
            power = (pedalInput / 100) * (telemetry.driveMode === 'Ludicrous' ? 380 : 250);
            cur = (power * 1000) / volt;
            regen = 0;
            soc = Math.max(0, soc - (power * 0.0004));
            motorTemp = Math.min(130, motorTemp + power * 0.002);
            invTemp = Math.min(105, invTemp + power * 0.0018);
          } else if (pedalInput < 0) {
            // Regenerative & Friction Braking
            const brakeFactor = Math.abs(pedalInput) / 100;
            const maxRegenKw = soc > 95 ? 20 : 160; // Regen capped near 100% SOC
            regen = Math.min(maxRegenKw, (speed / 100) * maxRegenKw * brakeFactor);
            power = -regen;
            cur = -(regen * 1000) / volt;
            speed = Math.max(0, speed - brakeFactor * 5.5);
            soc = Math.min(100, soc + (regen * 0.0002));
            motorTemp = Math.max(25, motorTemp - 0.02);
          } else {
            // Coasting with mild 1-pedal regen
            const coastRegen = Math.min(35, speed * 0.4);
            regen = coastRegen;
            power = -regen;
            cur = -(regen * 1000) / volt;
            speed = Math.max(0, speed - 0.8);
            if (speed === 0) {
              power = 0;
              cur = 0.5; // parasitic 12V DC/DC draw
              regen = 0;
            }
          }
        } else if (gear === 'R') {
          if (pedalInput > 0) {
            speed = Math.min(45, speed + 1.2);
            power = 30;
            cur = (power * 1000) / volt;
          } else {
            speed = Math.max(0, speed - 2.0);
            power = 0;
            cur = 0.5;
          }
        } else {
          // P or N
          speed = 0;
          power = 0;
          cur = 0.5;
          regen = 0;
        }

        const motorRpm = Math.round((speed * 9.34 * 60) / (2 * Math.PI * 0.342));
        const torqueNm = speed > 0 ? (power * 1000) / Math.max(1, (motorRpm * 2 * Math.PI) / 60) : 0;
        odo += (speed / 3600) * 0.1;
        const range = Math.round((soc / 100) * 580);

        onUpdateTelemetry({
          speedKmh: Math.round(speed * 10) / 10,
          motorRpm,
          motorTorqueNm: Math.round(torqueNm),
          motorPowerKw: Math.round(power * 10) / 10,
          batteryPowerKw: Math.round(power * 10) / 10,
          batteryCurrentA: Math.round(cur * 10) / 10,
          batterySoc: Math.round(soc * 10) / 10,
          regenPowerKw: Math.round(regen * 10) / 10,
          motorTempC: Math.round(motorTemp * 10) / 10,
          inverterTempC: Math.round(invTemp * 10) / 10,
          batteryTempC: Math.round(battTemp * 10) / 10,
          odometerKm: Math.round(odo * 10) / 10,
          rangeKm: range,
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isDriveSimActive, pedalInput, roadGradePct, telemetry, onUpdateTelemetry]);

  const handleStartStop = () => {
    if (telemetry.hvReady) {
      // Turn OFF
      onUpdateTelemetry({
        hvReady: false,
        speedKmh: 0,
        motorRpm: 0,
        batteryCurrentA: 0,
        batteryPowerKw: 0,
        dcLinkVoltageV: 0,
      });
      setIsDriveSimActive(false);
    } else {
      // Initiate Startup
      onUpdateTelemetry({
        hvReady: true,
        dcLinkVoltageV: telemetry.batteryVoltageV,
        gear: 'D',
      });
      setIsDriveSimActive(true);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Cockpit Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartStop}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
              telemetry.hvReady
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{telemetry.hvReady ? 'SYSTEM HV ON (PRESS STOP)' : 'START POWERTRAIN'}</span>
          </button>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">HV Bus:</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                telemetry.hvReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {telemetry.hvReady ? 'READY · 720V ACTIVE' : 'OPEN / SAFE'}
            </span>
          </div>
        </div>

        {/* Gear Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {(['P', 'R', 'N', 'D'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onUpdateTelemetry({ gear: g })}
              disabled={!telemetry.hvReady}
              className={`w-9 h-8 rounded-lg font-mono text-xs font-bold transition-all ${
                telemetry.gear === g
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white disabled:opacity-30'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Drive Mode Segmented */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {(['Eco', 'Normal', 'Sport', 'Ludicrous'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdateTelemetry({ driveMode: mode })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                telemetry.driveMode === mode
                  ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Digital Cockpit Cluster Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Gauge: Battery & Energy State */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Traction Pack Telemetry
            </span>
            <span className="text-xs font-mono text-cyan-400">{telemetry.rangeKm} km Range</span>
          </div>

          {/* Large SOC Circle */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={telemetry.batterySoc > 20 ? '#06b6d4' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * telemetry.batterySoc) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                  {telemetry.batterySoc.toFixed(0)}
                  <span className="text-xl text-slate-400">%</span>
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">SOC</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-4 border-t border-slate-800">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Pack Voltage</span>
              <span className="text-sm text-cyan-300 font-bold">{telemetry.batteryVoltageV.toFixed(1)} V</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Pack Current</span>
              <span className="text-sm text-amber-300 font-bold">{telemetry.batteryCurrentA.toFixed(1)} A</span>
            </div>
          </div>
        </div>

        {/* Center Gauge: Main Speedometer & Power Arc */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Speedometer</span>
            <span className="text-xs font-mono text-emerald-400">Gear [{telemetry.gear}]</span>
          </div>

          <div className="my-6">
            <div className="text-7xl font-extrabold text-white font-mono tracking-tighter">
              {Math.round(telemetry.speedKmh)}
            </div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mt-1">KM / H</div>
          </div>

          {/* Real-time Traction & Regeneration Power Bar */}
          <div className="w-full space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> REGEN {telemetry.regenPowerKw.toFixed(1)} kW
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                PWR {telemetry.batteryPowerKw > 0 ? telemetry.batteryPowerKw.toFixed(1) : '0.0'} kW <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              {/* Regen bar (left) */}
              <div
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${Math.min(50, (telemetry.regenPowerKw / 160) * 50)}%` }}
              />
              <div className="w-0.5 h-full bg-slate-700" />
              {/* Power bar (right) */}
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${Math.min(50, (Math.max(0, telemetry.batteryPowerKw) / 380) * 50)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Gauge: Motor Dynamics & Thermal States */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <RotateCw className="w-4 h-4 text-cyan-400" /> PMSM Motor & Inverter
            </span>
            <span className="text-xs font-mono text-slate-300">{telemetry.motorRpm} RPM</span>
          </div>

          <div className="space-y-4 my-2">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Shaft Torque</span>
                <span className="text-white font-bold">{telemetry.motorTorqueNm} Nm</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (telemetry.motorTorqueNm / 520) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Motor Temperature</span>
                <span className="text-amber-300 font-bold">{telemetry.motorTempC.toFixed(1)} °C</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (telemetry.motorTempC / 140) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">SiC Inverter Temperature</span>
                <span className="text-emerald-300 font-bold">{telemetry.inverterTempC.toFixed(1)} °C</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (telemetry.inverterTempC / 120) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-4 border-t border-slate-800">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Coolant Flow</span>
              <span className="text-sm text-cyan-300 font-bold">{telemetry.coolantFlowLpm} L/min</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Odometer</span>
              <span className="text-sm text-slate-200 font-bold">{telemetry.odometerKm.toFixed(1)} km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Driver Simulator Control Station */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Interactive Driver Throttle & Regen Lab</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Simulate real road driving dynamics in real-time
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Accelerator & Brake Single Slider / Dual Pedals */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold">100% REGEN BRAKE</span>
              <span className="text-slate-400">NEUTRAL / COAST</span>
              <span className="text-amber-400 font-bold">100% THROTTLE ACCEL</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="5"
              value={pedalInput}
              onChange={(e) => setPedalInput(parseInt(e.target.value))}
              disabled={!telemetry.hvReady}
              className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800 disabled:opacity-40"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => setPedalInput(-80)}
                  onMouseUp={() => setPedalInput(0)}
                  disabled={!telemetry.hvReady}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium transition-colors disabled:opacity-40"
                >
                  Hold Brake Pedal
                </button>
                <button
                  onMouseDown={() => setPedalInput(80)}
                  onMouseUp={() => setPedalInput(0)}
                  disabled={!telemetry.hvReady}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-medium transition-colors disabled:opacity-40"
                >
                  Hold Throttle Pedal
                </button>
              </div>
              <button
                onClick={() => setPedalInput(0)}
                className="px-3 py-1 text-slate-400 hover:text-white bg-slate-800 rounded transition-colors text-xs"
              >
                Release Pedals (Coast)
              </button>
            </div>
          </div>

          {/* Road Grade Simulator */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs text-slate-400 font-semibold block">Incline / Road Gradient:</span>
            <div className="flex items-center gap-2">
              {[0, 5, 10, 15].map((grade) => (
                <button
                  key={grade}
                  onClick={() => setRoadGradePct(grade)}
                  className={`flex-1 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                    roadGradePct === grade
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {grade}%
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500 block leading-tight">
              Higher grade increases motor gravitational climbing torque demand ($F_g = m g \\sin\\theta$).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
