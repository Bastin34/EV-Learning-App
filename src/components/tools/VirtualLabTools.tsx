import React, { useState, useEffect } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Activity,
  Layers,
  Zap,
  Sliders,
  CheckCircle2,
  Play,
  RotateCcw,
  Info
} from 'lucide-react';

interface VirtualLabToolsProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const VirtualLabTools: React.FC<VirtualLabToolsProps> = ({
  telemetry,
  onUpdateTelemetry,
}) => {
  const [activeTool, setActiveTool] = useState<'multimeter' | 'oscilloscope'>('multimeter');

  // Multimeter probe state
  const [probeLocation, setProbeLocation] = useState<string>('pack_terminal');
  const [dmmMode, setDmmMode] = useState<'V_DC' | 'V_AC' | 'OHM' | 'CONTINUITY'>('V_DC');

  // Oscilloscope channel signal
  const [dsoSignal, setDsoSignal] = useState<'pwm_gate' | 'can_diff' | 'precharge_rc' | 'resolver' | 'phase_u'>('pwm_gate');
  const [timebaseMs, setTimebaseMs] = useState<number>(2); // ms/div
  const [voltsDiv, setVoltsDiv] = useState<number>(5); // V/div
  const [isDsoRunning, setIsDsoRunning] = useState<boolean>(true);
  const [dsoPhase, setDsoPhase] = useState<number>(0);

  useEffect(() => {
    let anim: NodeJS.Timeout;
    if (isDsoRunning) {
      anim = setInterval(() => {
        setDsoPhase((p) => (p + 0.2) % (Math.PI * 4));
      }, 50);
    }
    return () => clearInterval(anim);
  }, [isDsoRunning]);

  // Multimeter reading calculations
  const getDmmReading = (): { value: string; unit: string; status: string } => {
    switch (probeLocation) {
      case 'pack_terminal':
        if (dmmMode === 'V_DC') return { value: telemetry.batteryVoltageV.toFixed(1), unit: 'V DC', status: 'HV ACTIVE' };
        if (dmmMode === 'OHM') return { value: 'OL', unit: 'MΩ', status: 'Do Not Measure Ohms on Live HV' };
        return { value: '0.0', unit: 'V AC', status: 'DC Potential' };

      case 'precharge_resistor':
        if (dmmMode === 'OHM') return { value: '33.2', unit: 'Ω', status: 'Normal Component' };
        if (dmmMode === 'V_DC') return { value: telemetry.hvReady ? '0.0' : '48.5', unit: 'V DC', status: 'Transient' };
        return { value: '33.2', unit: 'Ω', status: 'Nominal' };

      case 'aux_12v':
        if (dmmMode === 'V_DC') return { value: telemetry.aux12vVoltageV.toFixed(2), unit: 'V DC', status: 'LV System Normal' };
        return { value: '0.0', unit: 'V AC', status: 'DC' };

      case 'can_differential':
        if (dmmMode === 'V_DC') return { value: '2.05', unit: 'V DC', status: 'CAN Dominant Bit' };
        if (dmmMode === 'OHM') return { value: '60.4', unit: 'Ω', status: '2x 120Ω Parallel' };
        return { value: '2.05', unit: 'V', status: 'Normal' };

      case 'hvil_loop':
        if (dmmMode === 'CONTINUITY') return { value: 'BEEP · 0.2', unit: 'Ω', status: 'HVIL Closed & Safe' };
        if (dmmMode === 'V_DC') return { value: '12.0', unit: 'V DC', status: 'Pilot Interlock Active' };
        return { value: '0.2', unit: 'Ω', status: 'Continuity OK' };

      default:
        return { value: '0.00', unit: 'V', status: 'Idle' };
    }
  };

  const dmm = getDmmReading();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Virtual Engineering Multimeter & Oscilloscope</h2>
            <p className="text-xs text-slate-400">
              Interactive test bench probes, PWM gate waveforms, CAN differential & resolver signal analysis
            </p>
          </div>
        </div>

        {/* Tool Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTool('multimeter')}
            className={`px-4 py-2 font-bold rounded-lg transition-all ${
              activeTool === 'multimeter' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Digital Multimeter (DMM)
          </button>
          <button
            onClick={() => setActiveTool('oscilloscope')}
            className={`px-4 py-2 font-bold rounded-lg transition-all ${
              activeTool === 'oscilloscope' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Digital Storage Oscilloscope (DSO)
          </button>
        </div>
      </div>

      {/* Multimeter Tool Screen */}
      {activeTool === 'multimeter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Physical DMM Hardware Face */}
          <div className="p-8 bg-slate-950 border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center justify-between space-y-6">
            <div className="w-full flex justify-between items-center text-xs text-slate-500 font-mono">
              <span>VOLTX DMM-800V PRO</span>
              <span className="text-cyan-400">CAT IV 1000V TRUE RMS</span>
            </div>

            {/* LCD Screen */}
            <div className="w-full bg-emerald-950/20 border-2 border-emerald-900/60 rounded-2xl p-6 text-center font-mono">
              <span className="text-xs text-emerald-500/80 block uppercase tracking-widest">{dmm.status}</span>
              <div className="text-6xl font-extrabold text-emerald-400 tracking-tight my-2">
                {dmm.value}
              </div>
              <span className="text-sm font-bold text-emerald-500 uppercase">{dmm.unit}</span>
            </div>

            {/* Mode Dial Selector */}
            <div className="grid grid-cols-4 gap-2 w-full text-xs font-mono">
              {[
                { id: 'V_DC', label: 'V DC' },
                { id: 'V_AC', label: 'V AC' },
                { id: 'OHM', label: 'Ω Ohms' },
                { id: 'CONTINUITY', label: 'Continuity' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDmmMode(m.id as any)}
                  className={`py-3 rounded-xl font-bold border transition-all ${
                    dmmMode === m.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Point Probing Selector */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Select Virtual Probe Location on EV:
            </h3>

            <div className="space-y-2.5">
              {[
                { id: 'pack_terminal', label: 'Traction Battery Positive (+) Terminal', desc: 'Monitors full 800V DC bus potential' },
                { id: 'precharge_resistor', label: 'Pre-charge Current-Limiting Resistor (R_pre)', desc: 'Measures 33 Ω wirewound resistance' },
                { id: 'aux_12v', label: 'Low-Voltage 12V Auxiliary Battery Rail', desc: 'Checks DC/DC converter output potential' },
                { id: 'can_differential', label: 'CAN-High vs CAN-Low Differential Bus', desc: 'Verifies 60 Ω parallel bus termination' },
                { id: 'hvil_loop', label: 'High-Voltage Interlock Loop (HVIL)', desc: 'Verifies complete continuity safety chain' },
              ].map((tp) => (
                <div
                  key={tp.id}
                  onClick={() => setProbeLocation(tp.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    probeLocation === tp.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold block text-white">{tp.label}</span>
                  <span className="text-[11px] text-slate-400">{tp.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Oscilloscope Tool Screen */}
      {activeTool === 'oscilloscope' && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400">CH1 ACTIVE · 200 MS/s</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">Timebase: {timebaseMs} ms/div</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDsoRunning(!isDsoRunning)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isDsoRunning
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-emerald-500 text-slate-950'
                }`}
              >
                {isDsoRunning ? 'STOP TRIGGER' : 'RUN TRIGGER'}
              </button>
            </div>
          </div>

          {/* DSO CRT Graticule Display */}
          <div className="w-full h-64 bg-slate-950 border-2 border-slate-800 rounded-2xl relative overflow-hidden flex items-center p-2">
            {/* Grid */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-8 pointer-events-none opacity-25">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="border border-cyan-500/30" />
              ))}
            </div>

            {/* Waveform Canvas */}
            <svg className="w-full h-full absolute inset-0">
              {dsoSignal === 'pwm_gate' && (
                <path
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="2.5"
                  d={Array.from({ length: 40 })
                    .map((_, i) => {
                      const x = (i / 39) * 800;
                      const y = Math.sin(dsoPhase + (i / 39) * Math.PI * 16) > 0 ? 50 : 190;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                />
              )}

              {dsoSignal === 'can_diff' && (
                <path
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  d={Array.from({ length: 40 })
                    .map((_, i) => {
                      const x = (i / 39) * 800;
                      const isDominant = Math.sin(dsoPhase + (i / 39) * Math.PI * 8) > 0.3;
                      const y = isDominant ? 70 : 160;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                />
              )}

              {dsoSignal === 'resolver' && (
                <path
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  d={Array.from({ length: 60 })
                    .map((_, i) => {
                      const x = (i / 59) * 800;
                      const y = 120 + Math.sin(dsoPhase + (i / 59) * Math.PI * 6) * 70;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                />
              )}

              {dsoSignal === 'phase_u' && (
                <path
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  d={Array.from({ length: 60 })
                    .map((_, i) => {
                      const x = (i / 59) * 800;
                      const y = 120 + Math.sin(dsoPhase + (i / 59) * Math.PI * 4) * 80;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                />
              )}
            </svg>
          </div>

          {/* Signal Channel Selector */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-400 font-semibold mr-2">Probe Channel:</span>
            {[
              { id: 'pwm_gate', label: '16 kHz Inverter PWM Gate Signal' },
              { id: 'can_diff', label: 'CAN Bus Differential ($V_H - V_L$)' },
              { id: 'resolver', label: 'Motor Resolver Sinusoidal Angle' },
              { id: 'phase_u', label: 'Stator Motor Phase U AC Voltage' },
            ].map((sig) => (
              <button
                key={sig.id}
                onClick={() => setDsoSignal(sig.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  dsoSignal === sig.id
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {sig.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
