import React, { useState, useEffect } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Zap,
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Eye,
  Info
} from 'lucide-react';

interface HVArchitectureLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const HVArchitectureLab: React.FC<HVArchitectureLabProps> = ({
  telemetry,
  onUpdateTelemetry,
}) => {
  // Pre-charge State Machine steps
  // 0: Standby (12V ON, HV Open)
  // 1: VCU & BMS Wakeup & Self-Check
  // 2: Insulation Resistance Test (R_iso > 500 kΩ)
  // 3: Close Main Negative Contactor (Contactor -)
  // 4: Close Pre-charge Contactor (Current flows through 33 Ω Resistor)
  // 5: DC-Link Capacitor Charging (Rising Voltage)
  // 6: Voltage Parity Check (|V_pack - V_dclink| < 20V)
  // 7: Close Main Positive Contactor (Contactor +)
  // 8: Open Pre-charge Contactor
  // 9: System HV READY!
  const [seqStep, setSeqStep] = useState<number>(0);
  const [isAutomatedRunning, setIsAutomatedRunning] = useState<boolean>(false);
  const [dclinkVoltage, setDclinkVoltage] = useState<number>(0);
  const [prechargeCurrent, setPrechargeCurrent] = useState<number>(0);
  const [timeMs, setTimeMs] = useState<number>(0);

  // Fault injection modes for pre-charge
  const [prechargeFault, setPrechargeFault] = useState<
    'none' | 'blown_resistor' | 'welded_main' | 'isolation_loss' | 'timeout'
  >('none');

  // Interactive selected HV connection node
  const [selectedNode, setSelectedNode] = useState<string>('inverter');

  // Contactors physical states
  const [contactorNeg, setContactorNeg] = useState<boolean>(false);
  const [contactorPre, setContactorPre] = useState<boolean>(false);
  const [contactorPos, setContactorPos] = useState<boolean>(false);

  // Pre-charge waveform history points
  const [waveformPoints, setWaveformPoints] = useState<{ t: number; v: number; i: number }[]>([]);

  // Startup simulation runner
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutomatedRunning) {
      timer = setInterval(() => {
        setSeqStep((prev) => {
          if (prev >= 9) {
            setIsAutomatedRunning(false);
            return 9;
          }

          // Step 1: Self Check
          if (prev === 0) return 1;

          // Step 2: Insulation Test
          if (prev === 1) {
            if (prechargeFault === 'isolation_loss') {
              setIsAutomatedRunning(false);
              return 2; // Stuck at isolation fail
            }
            return 2;
          }

          // Step 3: Close Neg Contactor
          if (prev === 2) {
            setContactorNeg(true);
            return 3;
          }

          // Step 4: Close Pre-charge Contactor
          if (prev === 3) {
            if (prechargeFault === 'blown_resistor') {
              setIsAutomatedRunning(false);
              return 4; // Resistor open circuit, no current
            }
            setContactorPre(true);
            return 4;
          }

          // Step 5: Charging DC-link
          if (prev === 4) {
            return 5;
          }

          // Step 6: Parity check
          if (prev === 5) {
            if (prechargeFault === 'timeout') {
              setIsAutomatedRunning(false);
              return 5; // Timeout
            }
            return 6;
          }

          // Step 7: Close Main Positive
          if (prev === 6) {
            setContactorPos(true);
            return 7;
          }

          // Step 8: Open Pre-charge
          if (prev === 7) {
            setContactorPre(false);
            return 8;
          }

          // Step 9: HV READY
          if (prev === 8) {
            onUpdateTelemetry({ hvReady: true, dcLinkVoltageV: telemetry.batteryVoltageV });
            return 9;
          }

          return prev + 1;
        });
      }, 400);
    }
    return () => clearInterval(timer);
  }, [isAutomatedRunning, prechargeFault, telemetry.batteryVoltageV, onUpdateTelemetry]);

  // Waveform progression during charging (step 4 & 5)
  useEffect(() => {
    let waveInterval: NodeJS.Timeout;
    if (seqStep >= 4 && seqStep <= 9) {
      waveInterval = setInterval(() => {
        setTimeMs((t) => {
          const nextT = t + 20;
          const tau = 33 * 0.00092 * 1000; // R=33Ω, C=920µF -> tau ≈ 30.36 ms
          const V_pack = telemetry.batteryVoltageV;

          let v = 0;
          let i = 0;

          if (prechargeFault === 'blown_resistor') {
            v = 0;
            i = 0;
          } else {
            // V(t) = V_pack * (1 - e^(-t / tau))
            v = Math.min(V_pack, V_pack * (1 - Math.exp(-nextT / tau)));
            // I(t) = (V_pack / R) * e^(-t / tau)
            i = Math.max(0, (V_pack / 33) * Math.exp(-nextT / tau));
          }

          setDclinkVoltage(Math.round(v));
          setPrechargeCurrent(Math.round(i * 10) / 10);

          setWaveformPoints((pts) => [...pts.slice(-30), { t: nextT, v: Math.round(v), i: Math.round(i) }]);
          return nextT;
        });
      }, 50);
    }
    return () => clearInterval(waveInterval);
  }, [seqStep, prechargeFault, telemetry.batteryVoltageV]);

  const handleReset = () => {
    setIsAutomatedRunning(false);
    setSeqStep(0);
    setContactorNeg(false);
    setContactorPre(false);
    setContactorPos(false);
    setDclinkVoltage(0);
    setPrechargeCurrent(0);
    setTimeMs(0);
    setWaveformPoints([]);
    onUpdateTelemetry({ hvReady: false, dcLinkVoltageV: 0 });
  };

  const handleStartSequence = () => {
    handleReset();
    setIsAutomatedRunning(true);
  };

  // Node technical database
  const hvNodes: Record<
    string,
    { name: string; voltage: string; current: string; power: string; cableSpec: string; function: string }
  > = {
    battery: {
      name: 'Traction Battery Output Terminals',
      voltage: `${telemetry.batteryVoltageV.toFixed(1)} V DC`,
      current: `${telemetry.batteryCurrentA.toFixed(1)} A`,
      power: `${telemetry.batteryPowerKw.toFixed(1)} kW`,
      cableSpec: 'Dual 95 mm² Shielded Copper Cable (Class 4 HV)',
      function: 'Main electrochemical energy reservoir providing 800V DC traction potential.',
    },
    inverter: {
      name: 'Rear Traction Inverter (SiC 3-Phase)',
      voltage: `${dclinkVoltage} V DC (Bus) / 580V AC (Phase)`,
      current: `${telemetry.batteryCurrentA.toFixed(1)} A`,
      power: `${telemetry.batteryPowerKw.toFixed(1)} kW`,
      cableSpec: '70 mm² Braided Shield (Orange RAL 2003)',
      function: 'Converts high-voltage DC to variable frequency AC for motor speed & torque control.',
    },
    dcdc: {
      name: 'HV-to-12V DC/DC Converter',
      voltage: '720V DC In / 13.8V DC Out',
      current: '3.2 A HV / 165 A LV',
      power: '2.3 kW',
      cableSpec: '6 mm² HV Cable / 35 mm² LV Ground',
      function: 'Powers all low-voltage vehicular electronics and recharges the 12V auxiliary battery.',
    },
    obc: {
      name: 'On-Board Charger (AC Charge Port)',
      voltage: '400V AC Grid / 720V DC Pack',
      current: '16 A AC / 15.2 A DC',
      power: '11 kW',
      cableSpec: '10 mm² 5-Core AC Harness',
      function: 'Rectifies single/three-phase AC wallbox power into pack DC charging current.',
    },
    ptc: {
      name: 'High-Voltage Cabin PTC Heater',
      voltage: '720V DC',
      current: '7.5 A',
      power: '5.4 kW',
      cableSpec: '4 mm² High-Temp Silicone Cable',
      function: 'Instant resistive heating for cabin air and battery pack warming during sub-zero cold starts.',
    },
    compressor: {
      name: 'Electric Air Conditioning Scroll Compressor',
      voltage: '720V DC',
      current: '4.8 A',
      power: '3.5 kW',
      cableSpec: '4 mm² Shielded HV Line',
      function: 'Compresses refrigerant for passenger climate control and battery chiller heat exchange.',
    },
  };

  const activeNodeInfo = hvNodes[selectedNode] || hvNodes.inverter;

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">High-Voltage Architecture & Pre-Charge Lab</h2>
            <p className="text-xs text-slate-400">
              Interactive contactor sequencing, inrush damping waveforms & HV junction box topology
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartSequence}
            disabled={isAutomatedRunning || seqStep === 9}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5" /> Start Pre-Charge Sequence
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Realistic Pre-charge State Machine Progression Steps */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" /> Contactor Sequencing State Machine (Step {seqStep} of 9)
          </span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              seqStep === 9
                ? 'bg-emerald-500/20 text-emerald-400'
                : seqStep > 0
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {seqStep === 9
              ? 'STATUS: HV READY'
              : seqStep > 0
              ? 'STATUS: PRE-CHARGING'
              : 'STATUS: STANDBY'}
          </span>
        </div>

        {/* 9 Step Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs font-mono">
          {[
            { step: 1, label: '1. BMS/VCU Self-Check' },
            { step: 2, label: '2. Insulation Check' },
            { step: 3, label: '3. Contactor (-) Close' },
            { step: 4, label: '4. Pre-charge Relay Close' },
            { step: 5, label: '5. Cap Inrush Charging' },
            { step: 6, label: '6. Voltage ΔV < 20V Check' },
            { step: 7, label: '7. Main (+) Contactor Close' },
            { step: 8, label: '8. Pre-charge Relay Open' },
            { step: 9, label: '9. HV READY (Drivetrain On)' },
          ].map((s) => (
            <div
              key={s.step}
              className={`p-2.5 rounded-xl border transition-all ${
                seqStep > s.step
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : seqStep === s.step
                  ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-md'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {seqStep > s.step && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Oscilloscope Waveform & Physical Circuit Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Oscilloscope Pre-charge Waveform */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" /> DC-Link Capacitor Oscilloscope ($V_C(t)$)
              </span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-cyan-300 font-bold">V_dc: {dclinkVoltage} V</span>
                <span className="text-amber-300 font-bold">I_pre: {prechargeCurrent} A</span>
              </div>
            </div>

            {/* Canvas/SVG Waveform */}
            <div className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex items-end p-2">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-20">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="border border-slate-700" />
                ))}
              </div>

              {/* Target Pack Voltage Reference Line */}
              <div className="absolute top-4 left-0 right-0 border-b border-dashed border-cyan-500/40 px-2 flex justify-between text-[10px] text-cyan-400 font-mono">
                <span>V_pack Threshold ({telemetry.batteryVoltageV.toFixed(0)}V)</span>
                <span>τ = 30.3 ms</span>
              </div>

              {/* SVG Waveform Curve */}
              <svg className="w-full h-full absolute inset-0">
                {waveformPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    points={waveformPoints
                      .map((p, idx) => {
                        const x = (idx / (waveformPoints.length - 1)) * 360 + 20;
                        const y = 180 - (p.v / telemetry.batteryVoltageV) * 150;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>

              <div className="relative z-10 w-full flex justify-between text-[10px] font-mono text-slate-500">
                <span>t = 0 ms</span>
                <span>t = {timeMs} ms</span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400 leading-relaxed">
              {"Equation: V_c(t) = V_pack · (1 - e^(-t / τ)) where τ = R_pre · C_dc = 33 Ω × 920 µF ≈ 30.36 ms."}
            </div>
          </div>
        </div>

        {/* Contactors Status & Fault Injection */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Physical Contactors & Pre-charge Hardware
              </span>
              <span className="text-xs font-mono text-slate-400">1000V Isolation</span>
            </div>

            {/* Contactor visual states */}
            <div className="grid grid-cols-3 gap-3 mb-6 font-mono text-xs text-center">
              <div
                className={`p-3 rounded-xl border ${
                  contactorNeg ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] block mb-1">Negative Main</span>
                <span className="text-sm font-bold block">{contactorNeg ? 'CLOSED [ON]' : 'OPEN [OFF]'}</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  contactorPre ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] block mb-1">Pre-charge Relay</span>
                <span className="text-sm font-bold block">{contactorPre ? 'ENGAGED' : 'DISENGAGED'}</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  contactorPos ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] block mb-1">Positive Main</span>
                <span className="text-sm font-bold block">{contactorPos ? 'CLOSED [ON]' : 'OPEN [OFF]'}</span>
              </div>
            </div>

            {/* Fault Injector */}
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Inject Pre-Charge Fault Signature:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setPrechargeFault('none')}
                className={`p-2 rounded-lg border font-medium text-left transition-colors ${
                  prechargeFault === 'none' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Normal Operation (No Fault)
              </button>
              <button
                onClick={() => setPrechargeFault('blown_resistor')}
                className={`p-2 rounded-lg border font-medium text-left transition-colors ${
                  prechargeFault === 'blown_resistor' ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Burned Out Pre-charge Resistor
              </button>
              <button
                onClick={() => setPrechargeFault('isolation_loss')}
                className={`p-2 rounded-lg border font-medium text-left transition-colors ${
                  prechargeFault === 'isolation_loss' ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                High-Voltage Isolation Loss
              </button>
              <button
                onClick={() => setPrechargeFault('timeout')}
                className={`p-2 rounded-lg border font-medium text-left transition-colors ${
                  prechargeFault === 'timeout' ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Pre-charge ΔV Timeout (&gt;500ms)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clickable HV Architecture Schematic Nodes */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            High-Voltage Junction Box (HVJB) Power Distribution Ring
          </span>
          <span className="text-xs font-mono text-cyan-400">Click node to inspect electrical specs</span>
        </div>

        {/* Node Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { id: 'battery', label: 'Traction Battery' },
            { id: 'inverter', label: 'SiC Inverter' },
            { id: 'dcdc', label: 'DC/DC Converter' },
            { id: 'obc', label: 'On-Board Charger' },
            { id: 'ptc', label: 'PTC Cabin Heater' },
            { id: 'compressor', label: 'A/C Compressor' },
          ].map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedNode(n.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedNode === n.id
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span className="text-xs block">{n.label}</span>
            </button>
          ))}
        </div>

        {/* Selected Node Details Card */}
        <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">{activeNodeInfo.name}</h4>
            <span className="text-xs font-mono text-cyan-300">{activeNodeInfo.cableSpec}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{activeNodeInfo.function}</p>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">Bus Voltage</span>
              <span className="text-cyan-300 font-bold">{activeNodeInfo.voltage}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Current Load</span>
              <span className="text-amber-300 font-bold">{activeNodeInfo.current}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Active Power</span>
              <span className="text-emerald-300 font-bold">{activeNodeInfo.power}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
