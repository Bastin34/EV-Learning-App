import React, { useState, useEffect } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Cpu,
  Layers,
  Activity,
  Zap,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
  Info
} from 'lucide-react';

interface BMSLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const BMSLab: React.FC<BMSLabProps> = ({ telemetry, onUpdateTelemetry }) => {
  // Balancing mode: Passive bleed vs Active capacitive shuttle
  const [balancingMode, setBalancingMode] = useState<'passive' | 'active'>('passive');
  const [isBalancingActive, setIsBalancingActive] = useState<boolean>(true);

  // 12 Cells in a simulated module
  const [cells, setCells] = useState<
    { id: number; voltage: number; tempC: number; balancing: boolean; soc: number }[]
  >([
    { id: 1, voltage: 3.78, tempC: 28.2, balancing: false, soc: 76 },
    { id: 2, voltage: 3.75, tempC: 28.1, balancing: false, soc: 75 },
    { id: 3, voltage: 3.82, tempC: 28.5, balancing: true, soc: 78 }, // High cell
    { id: 4, voltage: 3.74, tempC: 27.9, balancing: false, soc: 74 },
    { id: 5, voltage: 3.76, tempC: 28.3, balancing: false, soc: 75 },
    { id: 6, voltage: 3.83, tempC: 28.6, balancing: true, soc: 79 }, // High cell
    { id: 7, voltage: 3.71, tempC: 28.0, balancing: false, soc: 73 }, // Low cell
    { id: 8, voltage: 3.75, tempC: 28.2, balancing: false, soc: 75 },
    { id: 9, voltage: 3.74, tempC: 28.1, balancing: false, soc: 74 },
    { id: 10, voltage: 3.77, tempC: 28.4, balancing: false, soc: 76 },
    { id: 11, voltage: 3.81, tempC: 28.5, balancing: true, soc: 78 }, // High cell
    { id: 12, voltage: 3.73, tempC: 28.0, balancing: false, soc: 74 },
  ]);

  // SOC Algorithm tab: Coulomb Counting vs OCV Lookup vs Extended Kalman Filter (EKF)
  const [socAlgorithm, setSocAlgorithm] = useState<'coulomb' | 'ocv' | 'ekf'>('ekf');

  // Safety limits thresholds
  const [overVoltageThreshold, setOverVoltageThreshold] = useState<number>(4.20);
  const [underVoltageThreshold, setUnderVoltageThreshold] = useState<number>(3.00);
  const [overTempThreshold, setOverTempThreshold] = useState<number>(55.0);

  // Active Faults
  const [activeFault, setActiveFault] = useState<string | null>(null);

  // Simulation tick for cell balancing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBalancingActive) {
      interval = setInterval(() => {
        setCells((prev) => {
          // Find target min voltage
          const minVolt = Math.min(...prev.map((c) => c.voltage));
          return prev.map((cell) => {
            const isHigh = cell.voltage - minVolt > 0.015;
            let newVolt = cell.voltage;
            if (isHigh) {
              // Bleed in passive (150 mA) or transfer in active
              newVolt = Math.max(minVolt, cell.voltage - 0.001);
            }
            return {
              ...cell,
              balancing: isHigh,
              voltage: Math.round(newVolt * 1000) / 1000,
            };
          });
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isBalancingActive]);

  // Inject a cell fault
  const handleTriggerFault = (type: 'overvoltage' | 'undervoltage' | 'overtemp' | 'clear') => {
    if (type === 'clear') {
      setActiveFault(null);
      setCells((prev) =>
        prev.map((c) => ({
          ...c,
          voltage: 3.75,
          tempC: 28.0,
        }))
      );
      return;
    }

    if (type === 'overvoltage') {
      setActiveFault('CELL 3 CRITICAL OVER-VOLTAGE (4.28V > 4.20V Limit)');
      setCells((prev) =>
        prev.map((c, idx) => (idx === 2 ? { ...c, voltage: 4.28 } : c))
      );
    } else if (type === 'undervoltage') {
      setActiveFault('CELL 7 UNDER-VOLTAGE FAULT (2.85V < 3.00V Limit)');
      setCells((prev) =>
        prev.map((c, idx) => (idx === 6 ? { ...c, voltage: 2.85 } : c))
      );
    } else if (type === 'overtemp') {
      setActiveFault('MODULE 1 THERMAL RUNAWAY WARNING (CELL 6 TEMP 68°C > 55°C Limit)');
      setCells((prev) =>
        prev.map((c, idx) => (idx === 5 ? { ...c, tempC: 68.4 } : c))
      );
    }
  };

  const minV = Math.min(...cells.map((c) => c.voltage));
  const maxV = Math.max(...cells.map((c) => c.voltage));
  const deltaV = Math.round((maxV - minV) * 1000); // in mV
  const avgV = cells.reduce((acc, c) => acc + c.voltage, 0) / cells.length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">BMS Architecture & Algorithm Simulator</h2>
            <p className="text-xs text-slate-400">
              Analog Front End (AFE) monitoring, cell balancing, state estimation & fault isolation
            </p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-[11px] text-slate-400 block">Cell Imbalance (ΔV)</span>
            <span className={`text-sm font-bold ${deltaV > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {deltaV} mV ({minV.toFixed(3)}V - {maxV.toFixed(3)}V)
            </span>
          </div>
        </div>
      </div>

      {/* Fault Alert Banner if Active */}
      {activeFault && (
        <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">BMS Safety Interlock Tripped</span>
              <span className="text-sm text-red-200 font-mono font-semibold">{activeFault}</span>
            </div>
          </div>
          <button
            onClick={() => handleTriggerFault('clear')}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
          >
            Clear Fault & Reset
          </button>
        </div>
      )}

      {/* 12-Cell Live Monitoring Matrix & Balancing Visualizer */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Module 1 Cell Voltage & Balancing Matrix (12S)</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setBalancingMode('passive')}
                className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                  balancingMode === 'passive' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Passive Bleed (150 mA)
              </button>
              <button
                onClick={() => setBalancingMode('active')}
                className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                  balancingMode === 'active' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active Shuttle (1.8 A)
              </button>
            </div>
            <button
              onClick={() => setIsBalancingActive(!isBalancingActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                isBalancingActive
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {isBalancingActive ? 'BALANCING ON' : 'BALANCING OFF'}
            </button>
          </div>
        </div>

        {/* 12 Cells Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {cells.map((cell) => {
            const isHighest = cell.voltage === maxV;
            const isLowest = cell.voltage === minV;
            const voltPercent = Math.max(0, Math.min(100, ((cell.voltage - 3.0) / 1.2) * 100));

            return (
              <div
                key={cell.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  cell.voltage > overVoltageThreshold || cell.tempC > overTempThreshold
                    ? 'bg-red-500/10 border-red-500/50'
                    : cell.balancing
                    ? 'bg-cyan-950/40 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-400">Cell #{cell.id}</span>
                  {cell.balancing && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 animate-pulse">
                      BLEED
                    </span>
                  )}
                </div>

                <div className="text-lg font-mono font-bold text-white mb-1">
                  {cell.voltage.toFixed(3)}
                  <span className="text-xs text-slate-400 ml-0.5">V</span>
                </div>

                {/* Voltage Fill Bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      cell.voltage > overVoltageThreshold
                        ? 'bg-red-500'
                        : isHighest
                        ? 'bg-cyan-400'
                        : isLowest
                        ? 'bg-amber-400'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${voltPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{cell.tempC.toFixed(1)}°C</span>
                  <span>SOC {cell.soc}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Balancing Explanation */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            {balancingMode === 'passive'
              ? 'Passive Balancing: Dissipates excess energy from high-voltage cells as heat across internal 33 Ω shunt resistors via CSC bleed MOSFETs. Simple, robust, standard in 95% of production EVs.'
              : 'Active Balancing: Uses inductive flyback converters or switched-capacitor shuttles to transfer energy directly from higher cells to lower cells. Higher efficiency (>85%) but adds circuit complexity and bill-of-materials cost.'}
          </span>
        </div>
      </div>

      {/* SOC Estimation Algorithms Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" /> State-of-Charge (SOC) Algorithms
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['coulomb', 'ocv', 'ekf'] as const).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => setSocAlgorithm(algo)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                      socAlgorithm === algo ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {algo}
                  </button>
                ))}
              </div>
            </div>

            {socAlgorithm === 'coulomb' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h4 className="text-sm font-bold text-white">Coulomb Counting Method (Ampere-Hour Integration)</h4>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300">
                  {"$$SOC(t) = SOC(0) - \\frac{1}{Q_{rated}} \\int_{0}^{t} \\eta \\cdot I(\\tau) \\, d\\tau$$"}
                </div>
                <p className="text-slate-300">
                  Integrates current entering and leaving the pack measured by a high-precision Hall effect or Shunt sensor.
                </p>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200">
                  <strong>Engineering Limitation:</strong> Sensor zero-offset bias drifts over time, accumulating significant error (up to 8% error after 5 hours without calibration).
                </div>
              </div>
            )}

            {socAlgorithm === 'ocv' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h4 className="text-sm font-bold text-white">Open Circuit Voltage (OCV) Lookup Method</h4>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300">
                  {"$$SOC = f^{-1}(V_{ocv}, T)$$"}
                </div>
                <p className="text-slate-300">
                  Maps resting cell voltage directly to known electrochemical discharge curves stored in MCU look-up tables (LUT).
                </p>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200">
                  <strong>Engineering Limitation:</strong> Only accurate when the vehicle has been stationary with contactors open for &gt;30–60 minutes (voltage relaxation). Completely ineffective for LFP batteries due to their flat voltage plateau between 20% and 80% SOC.
                </div>
              </div>
            )}

            {socAlgorithm === 'ekf' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h4 className="text-sm font-bold text-white">Extended Kalman Filter (EKF) Dual Estimation</h4>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300">
                  {"$$\\hat{x}_{k} = \\hat{x}_{k}^- + K_k \\left(y_k - h(\\hat{x}_k^-, u_k)\\right)$$"}
                </div>
                <p className="text-slate-300">
                  Combines the Coulomb counting prediction model with an Equivalent Circuit Model (ECM, e.g. Thevenin 2-RC model). Continuously corrects state vector estimates using real-time terminal voltage feedback and Kalman gain ($K_k$).
                </p>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-200">
                  <strong>Industry Standard:</strong> Used in Tesla, Rivian, and Porsche BMS. Self-correcting for initial SOC uncertainty, noise-tolerant, maintains accuracy within ±1.5% under dynamic track driving.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fault Injection Station */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> BMS Fault Simulation & Isolation Lab
              </span>
              <span className="text-xs font-mono text-slate-400">ISO 26262 ASIL-D</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Simulate critical battery conditions to observe how the BMS MCU detects, flags DTCs, and safely opens high-voltage contactors to protect occupants.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Cell Over-Voltage (OV)</span>
                  <span className="text-[11px] text-slate-400">Triggered when any cell exceeds 4.25V during regenerative braking.</span>
                </div>
                <button
                  onClick={() => handleTriggerFault('overvoltage')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                >
                  Trip OV
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Cell Under-Voltage (UV)</span>
                  <span className="text-[11px] text-slate-400">Triggered when high acceleration load causes cell to sag below 2.90V.</span>
                </div>
                <button
                  onClick={() => handleTriggerFault('undervoltage')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                >
                  Trip UV
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Thermal Runaway Inception (OT)</span>
                  <span className="text-[11px] text-slate-400">Local hot spot exceeding 65°C requires immediate contactor opening & cooling blast.</span>
                </div>
                <button
                  onClick={() => handleTriggerFault('overtemp')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                >
                  Trip OT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
