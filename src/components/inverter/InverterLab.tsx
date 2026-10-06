import React, { useState, useEffect } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Zap,
  Activity,
  Cpu,
  Layers,
  Sliders,
  Thermometer,
  ShieldCheck,
  TrendingDown,
  Info
} from 'lucide-react';

interface InverterLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const InverterLab: React.FC<InverterLabProps> = ({
  telemetry,
  onUpdateTelemetry,
}) => {
  // Semiconductor device type
  const [deviceType, setDeviceType] = useState<'SiC_MOSFET' | 'Si_IGBT' | 'GaN'>('SiC_MOSFET');
  // Switching frequency
  const [switchingFreqKhz, setSwitchingFreqKhz] = useState<number>(16); // 16 kHz
  // DC Bus Voltage
  const [dcVoltageV, setDcVoltageV] = useState<number>(720);
  // Requested Motor Torque
  const [torqueRequestNm, setTorqueRequestNm] = useState<number>(250);
  // Dead time in nanoseconds
  const [deadTimeNs, setDeadTimeNs] = useState<number>(350);

  // Semiconductor properties
  const devices = {
    SiC_MOSFET: {
      name: 'Silicon Carbide (SiC) MOSFET (1200V / 600A)',
      rdsOnMOhm: 2.2, // 2.2 mΩ
      eOnMilliJ: 2.8,
      eOffMilliJ: 1.6,
      thermalResistanceCPerW: 0.18,
      maxJunctionTempC: 175,
      description: 'Wide bandgap semiconductor with 10x higher breakdown field, permitting 3x faster switching, lower output capacitance, and 70% reduced switching losses compared to IGBTs.',
    },
    Si_IGBT: {
      name: 'Silicon IGBT + Anti-parallel Diode (1200V / 600A)',
      rdsOnMOhm: 5.8, // Effective saturation V_ce drop
      eOnMilliJ: 14.5,
      eOffMilliJ: 11.2,
      thermalResistanceCPerW: 0.24,
      maxJunctionTempC: 150,
      description: 'Legacy power switch. Suffers from minority carrier recombination tail currents during turn-off, resulting in severe switching losses above 10 kHz.',
    },
    GaN: {
      name: 'Gallium Nitride (GaN) HEMT (900V / 300A)',
      rdsOnMOhm: 1.4,
      eOnMilliJ: 0.9,
      eOffMilliJ: 0.6,
      thermalResistanceCPerW: 0.22,
      maxJunctionTempC: 150,
      description: 'Ultra-fast electron mobility with zero reverse recovery charge ($Q_{rr} = 0$). Ideal for extremely high switching frequencies (&gt;40 kHz).',
    },
  };

  const currentDev = devices[deviceType];

  // Mathematical loss equations
  // Stator phase current approximate
  const phaseCurrentRms = Math.min(500, (torqueRequestNm / 520) * 450);
  // Conduction losses: P_cond = 6 * I_rms^2 * R_ds(on)
  const pCondWatts = 6 * Math.pow(phaseCurrentRms, 2) * (currentDev.rdsOnMOhm / 1000);
  // Switching losses: P_sw = 6 * f_sw * (E_on + E_off) * (V_dc / 800) * (I_rms / 300)
  const pSwWatts =
    6 *
    (switchingFreqKhz * 1000) *
    ((currentDev.eOnMilliJ + currentDev.eOffMilliJ) / 1000) *
    (dcVoltageV / 800) *
    (phaseCurrentRms / 300) *
    0.001;
  // Total Loss
  const totalLossWatts = pCondWatts + pSwWatts;
  // Mechanical Shaft Output Power
  const motorSpeedRpm = telemetry.motorRpm || 4500;
  const pOutWatts = (torqueRequestNm * motorSpeedRpm * 2 * Math.PI) / 60;
  // Efficiency
  const efficiencyPct = pOutWatts > 0 ? (pOutWatts / (pOutWatts + totalLossWatts)) * 100 : 99.1;
  // Junction Temp
  const junctionTempC = telemetry.coolantTempC + totalLossWatts * (currentDev.thermalResistanceCPerW / 6);

  // SVG 3-Phase Sinusoidal Waveform Points
  const [phaseOffset, setPhaseOffset] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseOffset((prev) => (prev + 0.15) % (Math.PI * 2));
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Silicon Carbide (SiC) 3-Phase Inverter Lab</h2>
            <p className="text-xs text-slate-400">
              DC-link capacitor bus, space vector PWM switching, conduction & switching loss models
            </p>
          </div>
        </div>

        {/* Semiconductor Device Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          {(['SiC_MOSFET', 'Si_IGBT', 'GaN'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDeviceType(d)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                deviceType === d ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Phase Bridge Cutaway Circuit Schematic & Gate Signal Timing */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" /> 6-Switch Power Semiconductor Bridge Architecture ($S_1 - S_6$)
          </span>
          <span className="text-xs font-mono text-cyan-300">Phase U, V, W Complementary Pairs</span>
        </div>

        {/* 6-Switch Circuit Diagram Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Leg U */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-cyan-300">Phase Leg U</span>
              <span className="text-[10px] font-mono text-slate-400">Dead Time: {deadTimeNs} ns</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300">High-Side Switch ($S_1$)</span>
                <span className="text-emerald-400 font-bold">PWM ON</span>
              </div>
              <div className="w-full flex items-center justify-center text-[10px] text-cyan-400 font-mono py-1">
                ── Output Terminal Phase U ──
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300">Low-Side Switch ($S_2$)</span>
                <span className="text-slate-500 font-bold">OFF</span>
              </div>
            </div>
          </div>

          {/* Leg V */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-300">Phase Leg V</span>
              <span className="text-[10px] font-mono text-slate-400">120° Phase Shift</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300">High-Side Switch ($S_3$)</span>
                <span className="text-slate-500 font-bold">OFF</span>
              </div>
              <div className="w-full flex items-center justify-center text-[10px] text-amber-400 font-mono py-1">
                ── Output Terminal Phase V ──
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300">Low-Side Switch ($S_4$)</span>
                <span className="text-emerald-400 font-bold">PWM ON</span>
              </div>
            </div>
          </div>

          {/* Leg W */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-300">Phase Leg W</span>
              <span className="text-[10px] font-mono text-slate-400">240° Phase Shift</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300">High-Side Switch ($S_5$)</span>
                <span className="text-emerald-400 font-bold">PWM ON</span>
              </div>
              <div className="w-full flex items-center justify-center text-[10px] text-emerald-400 font-mono py-1">
                ── Output Terminal Phase W ──
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300">Low-Side Switch ($S_6$)</span>
                <span className="text-slate-500 font-bold">OFF</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Phase Sinusoidal Current Waveform Oscilloscope Display */}
        <div className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex items-center p-2">
          <svg className="w-full h-full absolute inset-0">
            {/* Phase U (Cyan) */}
            <path
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              d={Array.from({ length: 60 })
                .map((_, i) => {
                  const x = (i / 59) * 800;
                  const y = 80 + Math.sin(phaseOffset + (i / 59) * Math.PI * 4) * 60;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
            />
            {/* Phase V (Amber, 120° shifted) */}
            <path
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              d={Array.from({ length: 60 })
                .map((_, i) => {
                  const x = (i / 59) * 800;
                  const y = 80 + Math.sin(phaseOffset + (i / 59) * Math.PI * 4 - (2 * Math.PI) / 3) * 60;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
            />
            {/* Phase W (Emerald, 240° shifted) */}
            <path
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              d={Array.from({ length: 60 })
                .map((_, i) => {
                  const x = (i / 59) * 800;
                  const y = 80 + Math.sin(phaseOffset + (i / 59) * Math.PI * 4 - (4 * Math.PI) / 3) * 60;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
            />
          </svg>
          <div className="absolute top-2 left-4 flex items-center gap-4 text-[11px] font-mono">
            <span className="text-cyan-400 font-bold">Phase U: {phaseCurrentRms.toFixed(0)} A_rms</span>
            <span className="text-amber-400 font-bold">Phase V: {phaseCurrentRms.toFixed(0)} A_rms</span>
            <span className="text-emerald-400 font-bold">Phase W: {phaseCurrentRms.toFixed(0)} A_rms</span>
          </div>
        </div>
      </div>

      {/* Parameter Control & Loss Modeling Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders for Inverter Parameters */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Inverter Operating Variables
          </h3>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">PWM Switching Frequency (f_sw)</span>
              <span className="text-cyan-300 font-bold">{switchingFreqKhz} kHz</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={switchingFreqKhz}
              onChange={(e) => setSwitchingFreqKhz(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[11px] text-slate-500 block">Higher frequency reduces acoustic motor whine and current harmonics, but increases switching losses.</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">DC Bus Supply Voltage</span>
              <span className="text-amber-300 font-bold">{dcVoltageV} V</span>
            </div>
            <input
              type="range"
              min="400"
              max="850"
              step="10"
              value={dcVoltageV}
              onChange={(e) => setDcVoltageV(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[11px] text-slate-500 block">Typical 400V vs 800V architecture sweep.</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Motor Torque Command ($T^*$)</span>
              <span className="text-emerald-300 font-bold">{torqueRequestNm} Nm</span>
            </div>
            <input
              type="range"
              min="0"
              max="520"
              step="10"
              value={torqueRequestNm}
              onChange={(e) => setTorqueRequestNm(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>

        {/* Calculated Loss Breakdown & Thermal Junction State */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Electro-Thermal Loss Breakdown
              </h3>
              <span className="text-xs font-mono text-cyan-300">
                Total Inverter Efficiency: {efficiencyPct.toFixed(2)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Conduction Loss (P_cond)</span>
                <span className="text-sm font-bold text-cyan-300">{pCondWatts.toFixed(1)} W</span>
                <span className="text-[10px] text-slate-500 block">{"6 · I² · R_on"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Switching Loss (P_sw)</span>
                <span className="text-sm font-bold text-amber-300">{pSwWatts.toFixed(1)} W</span>
                <span className="text-[10px] text-slate-500 block">{"6 · f_sw · (E_on + E_off)"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Total Dissipated Heat</span>
                <span className="text-sm font-bold text-rose-400">{totalLossWatts.toFixed(1)} W</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SiC Junction Temp ($T_j$)</span>
                <span className="text-sm font-bold text-emerald-300">{junctionTempC.toFixed(1)} °C</span>
                <span className="text-[10px] text-slate-500 block">Max Limit: {currentDev.maxJunctionTempC}°C</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Engineering Takeaway:</strong> {currentDev.name} demonstrates that SiC allows increasing switching frequency to 16+ kHz with minimal switching penalties, shrinking required DC-link film capacitor size and motor current ripple.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
