import React, { useState } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Battery,
  Layers,
  Zap,
  Thermometer,
  ShieldAlert,
  Flame,
  Info,
  Sliders,
  CheckCircle2,
  Cpu,
  RefreshCw
} from 'lucide-react';

interface BatteryLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const BatteryLab: React.FC<BatteryLabProps> = ({ telemetry, onUpdateTelemetry }) => {
  // Chemistry selection
  const [selectedChemistry, setSelectedChemistry] = useState<'NMC811' | 'LFP' | 'NCA'>('NMC811');
  // Form factor selection
  const [formFactor, setFormFactor] = useState<'cylindrical4680' | 'prismatic' | 'pouch'>('prismatic');
  // Inspection hierarchy level
  const [hierarchyLevel, setHierarchyLevel] = useState<'pack' | 'module' | 'cell_group' | 'cell'>('cell');

  // Interactive single-cell simulator parameters
  const [cellCapacityAh, setCellCapacityAh] = useState<number>(50); // 50 Ah prismatic
  const [cellSocPct, setCellSocPct] = useState<number>(75);
  const [cellTempC, setCellTempC] = useState<number>(28);
  const [cellCurrentA, setCellCurrentA] = useState<number>(45); // Discharge current
  const [cellInternalResistanceMOhm, setCellInternalResistanceMOhm] = useState<number>(0.85); // 0.85 mΩ

  // Chemistry database
  const chemistries = {
    NMC811: {
      name: 'NMC 811 (Nickel-Manganese-Cobalt)',
      nominalVoltage: 3.7,
      voltageRange: '3.0V - 4.2V',
      energyDensity: '260 - 300 Wh/kg',
      cycleLife: '1,500 - 2,000 cycles',
      thermalRunawayTemp: '210°C',
      anode: 'Graphite with 5% Silicon-Oxide (SiOx)',
      cathode: 'LiNi₀.₈Mn₀.₁Co₀.₁O₂',
      description: 'High energy density chosen for long-range and premium performance EVs (Lucid, Porsche, Tesla Long Range). Requires active thermal management.',
    },
    LFP: {
      name: 'LFP (Lithium Iron Phosphate)',
      nominalVoltage: 3.2,
      voltageRange: '2.5V - 3.65V',
      energyDensity: '160 - 185 Wh/kg',
      cycleLife: '3,000 - 6,000 cycles',
      thermalRunawayTemp: '270°C (Extremely high thermal stability)',
      anode: 'Graphite',
      cathode: 'LiFePO₄',
      description: 'Exceptionally safe, cobalt-free, low cost with long cycle life. Flat OCV curve makes SOC estimation via voltage challenging (requires Coulomb counting).',
    },
    NCA: {
      name: 'NCA (Nickel-Cobalt-Aluminum)',
      nominalVoltage: 3.65,
      voltageRange: '3.0V - 4.2V',
      energyDensity: '250 - 290 Wh/kg',
      cycleLife: '1,200 - 1,800 cycles',
      thermalRunawayTemp: '190°C',
      anode: 'Synthetic Graphite',
      cathode: 'LiNi₀.₈₄Co₀.₁₂Al₀.₀₄O₂',
      description: 'High specific energy and high discharge C-rate capability, historically popularized in cylindrical 21700 EV cells.',
    },
  };

  const chem = chemistries[selectedChemistry];

  // Mathematical Cell Calculations
  // Open Circuit Voltage (OCV) as function of SOC
  const calculateOcv = (soc: number, chemType: 'NMC811' | 'LFP' | 'NCA'): number => {
    const s = soc / 100;
    if (chemType === 'LFP') {
      // Characteristic flat plateau of LFP
      return 3.0 + 0.35 * Math.pow(s, 0.2) + 0.2 * s;
    } else {
      // Sloped curve of NMC / NCA
      return 3.2 + 0.95 * s + 0.1 * Math.pow(s, 3);
    }
  };

  const ocv = calculateOcv(cellSocPct, selectedChemistry);
  const resistanceOhm = cellInternalResistanceMOhm / 1000;
  // Terminal Voltage: V_term = OCV - I * R_i (for discharge)
  const terminalVoltage = Math.max(2.0, ocv - cellCurrentA * resistanceOhm);
  // Power = V_term * I
  const cellPowerW = terminalVoltage * cellCurrentA;
  // Ohmic heat generation: P_heat = I^2 * R_i
  const heatGenerationW = Math.pow(cellCurrentA, 2) * resistanceOhm;
  // C-rate = I / Capacity
  const cRate = cellCurrentA / cellCapacityAh;
  // Cell Electrical Efficiency
  const efficiencyPct = (terminalVoltage / ocv) * 100;

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Battery className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Traction Battery Pack & Cell Laboratory</h2>
            <p className="text-xs text-slate-400">
              Interactive Lithium-Ion electrochemical simulator, cell hierarchy & electrochemistry models
            </p>
          </div>
        </div>

        {/* Hierarchy Level Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {[
            { id: 'pack', label: '1. Complete Pack' },
            { id: 'module', label: '2. Module (12S)' },
            { id: 'cell_group', label: '3. Parallel Group' },
            { id: 'cell', label: '4. Single Cell' },
          ].map((level) => (
            <button
              key={level.id}
              onClick={() => setHierarchyLevel(level.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                hierarchyLevel === level.id
                  ? 'bg-cyan-500 text-slate-950 shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hierarchy Explorer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hierarchy Breakdown Visualizer */}
        <div className="lg:col-span-1 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" /> Pack Architecture Stack
              </span>
              <span className="text-xs font-mono text-cyan-300">192S2P Config</span>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setHierarchyLevel('pack')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  hierarchyLevel === 'pack'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Battery Pack (System)</span>
                  <span className="text-xs font-mono text-cyan-400">94.2 kWh · 720V</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Extruded aluminum casing with liquid cold plate, pyrofuse, contactors, and BMS master ECU.
                </p>
              </div>

              <div
                onClick={() => setHierarchyLevel('module')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  hierarchyLevel === 'module'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Module (16 in series)</span>
                  <span className="text-xs font-mono text-cyan-400">5.88 kWh · 45.0V</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Contains 12 cell groups in series (12S2P), laser-welded busbars, thermistors, and CSC monitoring IC.
                </p>
              </div>

              <div
                onClick={() => setHierarchyLevel('cell_group')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  hierarchyLevel === 'cell_group'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Parallel Cell Group (2P)</span>
                  <span className="text-xs font-mono text-cyan-400">100 Ah · 3.75V</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  2 cells connected in parallel share current equally and self-balance in voltage.
                </p>
              </div>

              <div
                onClick={() => setHierarchyLevel('cell')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  hierarchyLevel === 'cell'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Individual Cell</span>
                  <span className="text-xs font-mono text-cyan-400">50 Ah · 3.75V</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Basic electrochemical unit with anode, cathode, separator, and electrolyte.
                </p>
              </div>
            </div>
          </div>

          {/* Form Factor Switcher */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-2">Cell Form Factor:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'prismatic', label: 'Prismatic' },
                { id: 'cylindrical4680', label: 'Cylindrical (4680)' },
                { id: 'pouch', label: 'Pouch' },
              ].map((ff) => (
                <button
                  key={ff.id}
                  onClick={() => setFormFactor(ff.id as any)}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    formFactor === ff.id
                      ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {ff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Electrochemistry & Cell Construction Breakdown */}
        <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Chemistry Comparison Engine
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['NMC811', 'LFP', 'NCA'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedChemistry(c)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedChemistry === c
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-white">{chem.name}</h4>
                <span className="text-xs font-mono text-cyan-300">{chem.voltageRange}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{chem.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Specific Energy</span>
                  <span className="text-cyan-300 font-bold">{chem.energyDensity}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Cycle Life</span>
                  <span className="text-emerald-300 font-bold">{chem.cycleLife}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Thermal Stability</span>
                  <span className="text-amber-300 font-bold">{chem.thermalRunawayTemp}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Nominal Potential</span>
                  <span className="text-slate-200 font-bold">{chem.nominalVoltage} V</span>
                </div>
              </div>
            </div>

            {/* Internal Anatomical Layers of a Cell */}
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Physical Cross-Section Layers:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  +
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block">Cathode (Positive Electrode)</span>
                  <span className="text-[11px] text-slate-400">{chem.cathode} coated onto Aluminum foil current collector (15 µm).</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  -
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block">Anode (Negative Electrode)</span>
                  <span className="text-[11px] text-slate-400">{chem.anode} coated onto Copper foil current collector (8 µm).</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  S
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block">Separator Membrane</span>
                  <span className="text-[11px] text-slate-400">Micro-porous polyethylene with ceramic Al₂O₃ coating preventing physical shorts (12 µm).</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  E
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block">Liquid Electrolyte</span>
                  <span className="text-[11px] text-slate-400">LiPF₆ dissolved in organic carbonates (EC/DMC/EMC) enabling rapid Li⁺ ion transport.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Single-Cell Parameter Laboratory */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Interactive Real-Time Cell Physics Simulator</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Dynamically adjust cell variables to calculate terminal voltage drop & Joule heating
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Slider 1: State of Charge (SOC) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Cell SOC</span>
              <span className="text-cyan-300 font-bold">{cellSocPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cellSocPct}
              onChange={(e) => setCellSocPct(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[11px] text-slate-500 block">Open Circuit Voltage V_ocv = {ocv.toFixed(3)} V</span>
          </div>

          {/* Slider 2: Discharge Current (A) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Load Current</span>
              <span className="text-amber-300 font-bold">{cellCurrentA} A ({cRate.toFixed(2)}C)</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={cellCurrentA}
              onChange={(e) => setCellCurrentA(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[11px] text-slate-500 block">C-rate = I / C_rated</span>
          </div>

          {/* Slider 3: Internal Resistance R_i (mΩ) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Internal Resistance ($R_i$)</span>
              <span className="text-rose-300 font-bold">{cellInternalResistanceMOhm} mΩ</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="3.0"
              step="0.05"
              value={cellInternalResistanceMOhm}
              onChange={(e) => setCellInternalResistanceMOhm(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
            <span className="text-[11px] text-slate-500 block">Increases with aging/degradation (SOH fade)</span>
          </div>

          {/* Slider 4: Operating Temperature (°C) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Cell Temperature</span>
              <span className="text-emerald-300 font-bold">{cellTempC} °C</span>
            </div>
            <input
              type="range"
              min="-20"
              max="65"
              step="1"
              value={cellTempC}
              onChange={(e) => setCellTempC(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[11px] text-slate-500 block">Below 0°C increases $R_i$; &gt;45°C accelerates aging</span>
          </div>
        </div>

        {/* Calculated Physics Results Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Terminal Voltage (V_term)</span>
            <span className="text-lg text-cyan-300 font-bold">{terminalVoltage.toFixed(3)} V</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">IR drop: {(cellCurrentA * resistanceOhm).toFixed(3)} V</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Cell Delivered Power</span>
            <span className="text-lg text-amber-300 font-bold">{cellPowerW.toFixed(1)} W</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">At pack level: {((cellPowerW * 384) / 1000).toFixed(1)} kW</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Ohmic Heat ($I^2 R_i$)</span>
            <span className="text-lg text-rose-400 font-bold">{heatGenerationW.toFixed(2)} W</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Total Pack Heat: {((heatGenerationW * 384) / 1000).toFixed(2)} kW</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Cell Energy Efficiency</span>
            <span className="text-lg text-emerald-300 font-bold">{efficiencyPct.toFixed(1)} %</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{"η = V_term / V_ocv"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
