import React, { useState } from 'react';
import {
  Calculator,
  Zap,
  Activity,
  Layers,
  Sliders,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';

export const CalculatorsLab: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<
    'battery_sizing' | 'precharge_rc' | 'motor_power' | 'gear_speed' | 'cable_drop' | 'charge_time'
  >('battery_sizing');

  // 1. Battery Pack Sizing State
  const [cellVolt, setCellVolt] = useState<number>(3.7);
  const [cellCapAh, setCellCapAh] = useState<number>(5.0); // e.g. 2170 cell 5Ah
  const [seriesCells, setSeriesCells] = useState<number>(192);
  const [parallelCells, setParallelCells] = useState<number>(20);
  const [cellWeightKg, setCellWeightKg] = useState<number>(0.07); // 70g

  const packNominalV = seriesCells * cellVolt;
  const packCapAh = parallelCells * cellCapAh;
  const packEnergyKwh = (packNominalV * packCapAh) / 1000;
  const totalCellCount = seriesCells * parallelCells;
  const totalCellsMassKg = totalCellCount * cellWeightKg;
  const estPackMassKg = Math.round(totalCellsMassKg / 0.65); // 65% cell-to-pack mass ratio

  // 2. Pre-charge RC State
  const [prechargeResistOhm, setPrechargeResistOhm] = useState<number>(33);
  const [dcCapUf, setDcCapUf] = useState<number>(920); // 920 µF
  const [batteryPackV, setBatteryPackV] = useState<number>(720);

  const rcTauMs = (prechargeResistOhm * (dcCapUf / 1000000)) * 1000;
  const peakInrushA = batteryPackV / prechargeResistOhm;
  const energyJoules = 0.5 * (dcCapUf / 1000000) * Math.pow(batteryPackV, 2);
  const timeTo95PctMs = Math.round(3 * rcTauMs);

  // 3. Motor Torque / Power
  const [motorTorqueNm, setMotorTorqueNm] = useState<number>(380);
  const [motorRpm, setMotorRpm] = useState<number>(6000);
  const motorKw = (motorTorqueNm * motorRpm) / 9550;
  const motorHp = motorKw * 1.341;

  // 4. Gear Ratio & Speed
  const [gearRatio, setGearRatio] = useState<number>(9.34);
  const [wheelRadiusM, setWheelRadiusM] = useState<number>(0.342);
  const [gearMotorRpm, setGearMotorRpm] = useState<number>(12000);
  const roadSpeedKmh = Math.round(((2 * Math.PI * wheelRadiusM * (gearMotorRpm / gearRatio)) / 60) * 3.6);

  // 5. Cable Sizing & Voltage Drop
  const [cableCurrentA, setCableCurrentA] = useState<number>(350);
  const [cableAreaMm2, setCableAreaMm2] = useState<number>(70);
  const [cableLengthM, setCableLengthM] = useState<number>(3.5);
  const rhoCopper = 0.0175; // Ω·mm²/m at 20°C
  const cableResistanceOhm = (rhoCopper * (2 * cableLengthM)) / cableAreaMm2;
  const cableDeltaV = cableCurrentA * cableResistanceOhm;
  const cableHeatWatts = Math.pow(cableCurrentA, 2) * cableResistanceOhm;

  // 6. Fast Charge Time
  const [targetKwh, setTargetKwh] = useState<number>(65);
  const [avgChargerPowerKw, setAvgChargerPowerKw] = useState<number>(150);
  const chargeMinutes = Math.round((targetKwh / avgChargerPowerKw) * 60);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">EV Engineering Formula Calculators</h2>
            <p className="text-xs text-slate-400">
              Rigorous analytical sizing calculators for pack architecture, pre-charge RC, drivetrain & cables
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          {[
            { id: 'battery_sizing', label: '1. Battery Pack Sizing' },
            { id: 'precharge_rc', label: '2. Pre-charge RC' },
            { id: 'motor_power', label: '3. Motor Power (kW)' },
            { id: 'gear_speed', label: '4. Gear Ratio & Speed' },
            { id: 'cable_drop', label: '5. HV Cable Voltage Drop' },
          ].map((calc) => (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id as any)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                activeCalc === calc.id
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {calc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calculator Body */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        {activeCalc === 'battery_sizing' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white">Series / Parallel Traction Battery Pack Sizing</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Cell Voltage (V)</span>
                <input
                  type="number"
                  step="0.05"
                  value={cellVolt}
                  onChange={(e) => setCellVolt(parseFloat(e.target.value) || 3.7)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Cell Capacity (Ah)</span>
                <input
                  type="number"
                  step="0.1"
                  value={cellCapAh}
                  onChange={(e) => setCellCapAh(parseFloat(e.target.value) || 5.0)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Series Cells Count (S)</span>
                <input
                  type="number"
                  value={seriesCells}
                  onChange={(e) => setSeriesCells(parseInt(e.target.value) || 100)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Parallel Cells Count (P)</span>
                <input
                  type="number"
                  value={parallelCells}
                  onChange={(e) => setParallelCells(parseInt(e.target.value) || 10)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Pack Nominal Voltage</span>
                <span className="text-2xl font-bold text-cyan-300">{packNominalV.toFixed(1)} V</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{seriesCells}S configuration</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Pack Total Capacity</span>
                <span className="text-2xl font-bold text-amber-300">{packCapAh.toFixed(1)} Ah</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{parallelCells}P configuration</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Total Pack Energy</span>
                <span className="text-2xl font-bold text-emerald-300">{packEnergyKwh.toFixed(1)} kWh</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{totalCellCount} total individual cells</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Estimated Pack Weight</span>
                <span className="text-2xl font-bold text-white">{estPackMassKg} kg</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Includes cold plate & casing</span>
              </div>
            </div>
          </div>
        )}

        {activeCalc === 'precharge_rc' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white">Pre-charge Resistor & Inrush Damping Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Pre-charge Resistor (R_pre) [Ω]</span>
                <input
                  type="number"
                  value={prechargeResistOhm}
                  onChange={(e) => setPrechargeResistOhm(parseFloat(e.target.value) || 33)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Inverter DC-Link Cap (C_dc) [µF]</span>
                <input
                  type="number"
                  value={dcCapUf}
                  onChange={(e) => setDcCapUf(parseFloat(e.target.value) || 920)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Battery Pack Voltage (V_pack) [V]</span>
                <input
                  type="number"
                  value={batteryPackV}
                  onChange={(e) => setBatteryPackV(parseFloat(e.target.value) || 720)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">RC Time Constant ($\tau$)</span>
                <span className="text-2xl font-bold text-cyan-300">{rcTauMs.toFixed(2)} ms</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">$\tau = R \cdot C$</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Time to 95% ($3\tau$)</span>
                <span className="text-2xl font-bold text-emerald-300">{timeTo95PctMs} ms</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Contactor closing target</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Peak Resistor Current</span>
                <span className="text-2xl font-bold text-amber-300">{peakInrushA.toFixed(1)} A</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">$I = V / R$</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Energy Dissipated</span>
                <span className="text-2xl font-bold text-rose-400">{energyJoules.toFixed(1)} Joules</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Pulse pulse rating required</span>
              </div>
            </div>
          </div>
        )}

        {activeCalc === 'motor_power' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white">Motor Torque, RPM & Shaft Mechanical Power</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Shaft Torque ($T$) [Nm]</span>
                <input
                  type="number"
                  value={motorTorqueNm}
                  onChange={(e) => setMotorTorqueNm(parseFloat(e.target.value) || 300)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Motor Rotational Speed ($N$) [RPM]</span>
                <input
                  type="number"
                  value={motorRpm}
                  onChange={(e) => setMotorRpm(parseFloat(e.target.value) || 6000)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Shaft Power in Kilowatts</span>
                <span className="text-3xl font-bold text-cyan-300">{motorKw.toFixed(1)} kW</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{"P = (T · N) / 9550"}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Shaft Power in Horsepower</span>
                <span className="text-3xl font-bold text-amber-300">{motorHp.toFixed(0)} HP</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Brake horsepower</span>
              </div>
            </div>
          </div>
        )}

        {activeCalc === 'gear_speed' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white">Gearbox Reduction Ratio & Vehicle Top Speed</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Overall Gear Ratio ($i_g$)</span>
                <input
                  type="number"
                  step="0.05"
                  value={gearRatio}
                  onChange={(e) => setGearRatio(parseFloat(e.target.value) || 9.34)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Tire Dynamic Radius ($r$) [m]</span>
                <input
                  type="number"
                  step="0.005"
                  value={wheelRadiusM}
                  onChange={(e) => setWheelRadiusM(parseFloat(e.target.value) || 0.342)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Max Motor Speed [RPM]</span>
                <input
                  type="number"
                  value={gearMotorRpm}
                  onChange={(e) => setGearMotorRpm(parseInt(e.target.value) || 12000)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 block text-[10px] mb-1">Theoretical Vehicle Top Road Speed</span>
              <span className="text-3xl font-bold text-cyan-300">{roadSpeedKmh} km/h</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {"v = (2π · r · N_motor) / (60 · i_g) · 3.6"}
              </span>
            </div>
          </div>
        )}

        {activeCalc === 'cable_drop' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white">High-Voltage Cable Sizing, Resistance & Voltage Drop</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Traction Current ($I$) [A]</span>
                <input
                  type="number"
                  value={cableCurrentA}
                  onChange={(e) => setCableCurrentA(parseFloat(e.target.value) || 300)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Conductor Area ($A$) [mm²]</span>
                <input
                  type="number"
                  value={cableAreaMm2}
                  onChange={(e) => setCableAreaMm2(parseFloat(e.target.value) || 70)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Cable Harness Length ($L$) [m]</span>
                <input
                  type="number"
                  value={cableLengthM}
                  onChange={(e) => setCableLengthM(parseFloat(e.target.value) || 3.0)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Loop Resistance (R_cable)</span>
                <span className="text-xl font-bold text-cyan-300">{(cableResistanceOhm * 1000).toFixed(2)} mΩ</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Terminal Voltage Drop ($\Delta V$)</span>
                <span className="text-xl font-bold text-amber-300">{cableDeltaV.toFixed(2)} V</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">Ohmic Heat Loss ($I^2 R$)</span>
                <span className="text-xl font-bold text-rose-400">{cableHeatWatts.toFixed(0)} W</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
