import React, { useState } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Gauge,
  Activity,
  Layers,
  Zap,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';

interface VehicleDynamicsLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const VehicleDynamicsLab: React.FC<VehicleDynamicsLabProps> = ({
  telemetry,
  onUpdateTelemetry,
}) => {
  // Vehicle parameter variables
  const [vehicleMassKg, setVehicleMassKg] = useState<number>(2150);
  const [dragCoeffCd, setDragCoeffCd] = useState<number>(0.21); // Aerodynamic drag
  const [frontalAreaM2, setFrontalAreaM2] = useState<number>(2.35); // m²
  const [rollingResistCrr, setRollingResistCrr] = useState<number>(0.0078);
  const [roadSlopeDeg, setRoadSlopeDeg] = useState<number>(0);
  const [testSpeedKmh, setTestSpeedKmh] = useState<number>(110);
  const [gearRatio, setGearRatio] = useState<number>(9.34);
  const [wheelRadiusM, setWheelRadiusM] = useState<number>(0.342);

  // Physics constants
  const rhoAir = 1.225; // kg/m³ air density at 15°C
  const g = 9.81; // m/s² gravity

  // Dynamic calculations at testSpeedKmh
  const vMs = testSpeedKmh / 3.6;
  const slopeRad = (roadSlopeDeg * Math.PI) / 180;

  // 1. Aerodynamic drag force: F_aero = 1/2 * rho * C_d * A * v^2
  const fAeroN = 0.5 * rhoAir * dragCoeffCd * frontalAreaM2 * Math.pow(vMs, 2);
  // 2. Rolling resistance force: F_roll = C_rr * m * g * cos(theta)
  const fRollN = rollingResistCrr * vehicleMassKg * g * Math.cos(slopeRad);
  // 3. Road slope grade force: F_grade = m * g * sin(theta)
  const fGradeN = vehicleMassKg * g * Math.sin(slopeRad);

  // Steady-state total road load tractive force (at constant speed a = 0):
  const fTotalN = fAeroN + fRollN + fGradeN;
  // Road Tractive Power: P_road = F_total * v
  const pRoadWatts = fTotalN * vMs;
  const pRoadKw = pRoadWatts / 1000;

  // Motor shaft torque and electrical power considering 91% drivetrain efficiency
  const wheelTorqueNm = fTotalN * wheelRadiusM;
  const motorTorqueNm = wheelTorqueNm / (gearRatio * 0.97);
  const electricalPowerKw = pRoadKw / (0.97 * 0.94); // Gearbox & Inverter/Motor combined
  const motorRpm = Math.round((vMs * gearRatio * 60) / (2 * Math.PI * wheelRadiusM));

  // Energy consumption (Wh/km) = (Electrical Power kW * 1000) / Speed km/h
  const energyConsumptionWhPerKm = Math.round((electricalPowerKw * 1000) / Math.max(1, testSpeedKmh));
  const estimatedRangeKm = Math.round((89.5 * 1000) / energyConsumptionWhPerKm);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Vehicle Longitudinal Dynamics Engine</h2>
            <p className="text-xs text-slate-400">
              Aerodynamic drag, rolling resistance, climbing forces & consumption modeling
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-400 block">Energy Consumption at {testSpeedKmh} km/h</span>
          <span className="text-xl font-bold text-cyan-300">{energyConsumptionWhPerKm} Wh/km</span>
          <span className="text-slate-500 block">Est. Range: {estimatedRangeKm} km</span>
        </div>
      </div>

      {/* Force Component Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-slate-400 block text-[10px] mb-1">Aero Drag Force (F_aero)</span>
          <span className="text-2xl font-bold text-cyan-300">{Math.round(fAeroN)} N</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{"0.5 · ρ · C_d · A · v²"}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-slate-400 block text-[10px] mb-1">Rolling Resistance (F_roll)</span>
          <span className="text-2xl font-bold text-amber-300">{Math.round(fRollN)} N</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{"C_rr · m · g · cos(θ)"}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-slate-400 block text-[10px] mb-1">Grade Climbing Force (F_grade)</span>
          <span className="text-2xl font-bold text-emerald-300">{Math.round(fGradeN)} N</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{"m · g · sin(θ)"}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-slate-400 block text-[10px] mb-1">Steady State Power</span>
          <span className="text-2xl font-bold text-white">{electricalPowerKw.toFixed(1)} kW</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Motor: {Math.round(motorTorqueNm)} Nm @ {motorRpm} RPM</span>
        </div>
      </div>

      {/* Interactive Parameter Controls */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-6">
          Longitudinal Dynamics Parameter Sweep
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Speed Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Cruising Speed</span>
              <span className="text-white font-bold">{testSpeedKmh} km/h</span>
            </div>
            <input
              type="range"
              min="30"
              max="220"
              step="5"
              value={testSpeedKmh}
              onChange={(e) => setTestSpeedKmh(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Mass Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Vehicle Total Mass</span>
              <span className="text-cyan-300 font-bold">{vehicleMassKg} kg</span>
            </div>
            <input
              type="range"
              min="1400"
              max="3200"
              step="50"
              value={vehicleMassKg}
              onChange={(e) => setVehicleMassKg(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Drag Coeff Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Aero Drag ($C_d$)</span>
              <span className="text-amber-300 font-bold">{dragCoeffCd}</span>
            </div>
            <input
              type="range"
              min="0.18"
              max="0.38"
              step="0.01"
              value={dragCoeffCd}
              onChange={(e) => setDragCoeffCd(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Road Incline Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Road Grade Incline</span>
              <span className="text-emerald-300 font-bold">{roadSlopeDeg}°</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={roadSlopeDeg}
              onChange={(e) => setRoadSlopeDeg(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
