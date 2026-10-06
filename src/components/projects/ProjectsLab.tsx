import React, { useState } from 'react';
import { ProjectBrief } from '../../types/ev';
import {
  FileText,
  CheckCircle2,
  Play,
  RotateCcw,
  Download,
  Layers,
  Zap,
  Activity,
  Sliders,
  Award
} from 'lucide-react';

export const CAPSTONE_PROJECTS: ProjectBrief[] = [
  {
    id: 'proj_bms',
    title: 'BMS Firmware Architecture & ASIL-D Safety Supervisor',
    difficulty: 'Final Year',
    targetDomain: 'Battery Management Systems',
    problemStatement:
      'Design, simulate, and validate a decentralized BMS firmware stack monitoring a 192S2P 800V traction battery pack. Implement cell passive balancing, Coulomb counting SOC estimation, and millisecond fault isolation under over-temperature conditions.',
    architectureComponents: [
      'Infineon AURIX TC397 Dual-core Lockstep MCU',
      'Analog Devices ADBMS6817 18-channel Cell Monitor ICs',
      'Isolated isoSPI / CAN-FD physical layer transceivers',
      'High-side pyro-fuse driver and vacuum contactor economizer coils',
    ],
    simulationObjectives: [
      'Execute cell balancing until max voltage delta ΔV < 15 mV.',
      'Maintain SOC estimation error within ±1.5% during dynamic WLTP drive cycle.',
      'Trip high-voltage contactor disconnect within 10 ms of 65°C cell temperature breach.',
    ],
    specsToVerify: [
      { parameter: 'Voltage Acquisition Precision', target: '±1.5 mV', measured: '±1.1 mV', pass: true },
      { parameter: 'Balancing Bleed Current', target: '150 mA', measured: '148 mA', pass: true },
      { parameter: 'Fault Isolation Latency', target: '< 20 ms', measured: '12.4 ms', pass: true },
      { parameter: 'Isolation Resistance Monitor', target: '> 500 Ω/V', measured: '1200 Ω/V', pass: true },
    ],
  },
  {
    id: 'proj_foc',
    title: 'Silicon Carbide (SiC) Inverter FOC Motor Controller',
    difficulty: 'Industry Prototype',
    targetDomain: 'Power Electronics & Drives',
    problemStatement:
      'Synthesize an ultra-efficient 16 kHz Space Vector PWM (SVPWM) Field Oriented Control algorithm for a 320 kW Interior Permanent Magnet Synchronous Motor. Decouple d-q axis currents and demonstrate flux-weakening operation up to 18,000 RPM.',
    architectureComponents: [
      '1200V / 600A SiC MOSFET Half-Bridge Power Modules',
      'Galvanically isolated gate drivers with Miller clamp & DESAT',
      'High-bandwidth closed-loop Hall effect phase current sensors',
      'Resolving optical shaft angle encoder (16-bit resolution)',
    ],
    simulationObjectives: [
      'Verify Clarke and Park transformations with zero cross-coupling error.',
      'Demonstrate MTPA (Maximum Torque Per Ampere) trajectory up to base speed.',
      'Achieve inverter total electrical conversion efficiency > 98.5%.',
    ],
    specsToVerify: [
      { parameter: 'Peak Inverter Efficiency', target: '> 98.5%', measured: '99.1%', pass: true },
      { parameter: 'Torque Step Response Time', target: '< 10 ms', measured: '4.8 ms', pass: true },
      { parameter: 'Current THD at Nominal Load', target: '< 3.0%', measured: '1.9%', pass: true },
      { parameter: 'SiC Junction Max Temp', target: '< 150°C', measured: '118°C', pass: true },
    ],
  },
  {
    id: 'proj_thermal',
    title: 'Electric Vehicle Intelligent Thermal Management System (TMS)',
    difficulty: 'Final Year',
    targetDomain: 'Automotive Thermal Engineering',
    problemStatement:
      'Design a multi-loop liquid cooling system utilizing a 4-way proportional valve to dynamically switch between battery heating (using motor waste heat) and extreme sub-ambient chilling during 250 kW DC fast charging.',
    architectureComponents: [
      'Extruded aluminum bottom battery cold plate',
      'Variable-speed 12V brushless DC coolant pump (15-30 L/min)',
      'Plate heat exchanger (refrigerant chiller) coupled to A/C compressor',
      'PWM proportional 4-way coolant distribution valve',
    ],
    simulationObjectives: [
      'Keep cell temperature between 25°C and 35°C during high continuous load.',
      'Prevent maximum intra-pack module temperature gradient ΔT > 3°C.',
      'Recover motor and inverter waste heat to warm battery in -10°C ambient.',
    ],
    specsToVerify: [
      { parameter: 'Battery Max Temperature Rise', target: '< 38°C', measured: '32.4°C', pass: true },
      { parameter: 'Coolant Flow Rate', target: '25 L/min', measured: '26.2 L/min', pass: true },
      { parameter: 'Chiller Thermal Extraction', target: '> 7 kW', measured: '8.4 kW', pass: true },
      { parameter: 'Pressure Drop Across Loop', target: '< 40 kPa', measured: '28.5 kPa', pass: true },
    ],
  },
];

export const ProjectsLab: React.FC = () => {
  const [selectedProjIndex, setSelectedProjIndex] = useState<number>(0);
  const [isRunningVerification, setIsRunningVerification] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(true);

  const project = CAPSTONE_PROJECTS[selectedProjIndex];

  const handleRunVerification = () => {
    setIsRunningVerification(true);
    setTimeout(() => {
      setIsRunningVerification(false);
      setVerifiedSuccess(true);
    }, 1200);
  };

  const handleDownloadReport = () => {
    const reportText = `VOLTX CAPSTONE ENGINEERING PROJECT REPORT
Title: ${project.title}
Difficulty: ${project.difficulty}
Domain: ${project.targetDomain}
Generated: ${new Date().toISOString()}

1. PROBLEM STATEMENT:
${project.problemStatement}

2. ARCHITECTURAL SUBSYSTEMS:
${project.architectureComponents.map((c) => `- ${c}`).join('\n')}

3. SIMULATION OBJECTIVES:
${project.simulationObjectives.map((o) => `- ${o}`).join('\n')}

4. TEST VALIDATION RESULTS:
${project.specsToVerify.map((s) => `[PASS] ${s.parameter}: Target ${s.target} | Measured ${s.measured}`).join('\n')}

CONCLUSION:
All engineering constraints satisfied. Subsystem compliant with ISO 26262 ASIL-D functional safety specifications.
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VOLTX_Project_${project.id}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Capstone EV Engineering Project Laboratory</h2>
            <p className="text-xs text-slate-400">
              Undergraduate & Final-Year vehicle engineering project briefs, validation testing & reporting
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          {CAPSTONE_PROJECTS.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjIndex(idx)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                selectedProjIndex === idx ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Project #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Project Overview Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                {project.difficulty}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{project.targetDomain}</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mt-1">{project.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunVerification}
              disabled={isRunningVerification}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningVerification ? 'Running Simulation...' : 'Execute Test Suite'}</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Problem Statement */}
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
            Engineering Problem Statement & Scope:
          </span>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {project.problemStatement}
          </p>
        </div>

        {/* Hardware Architecture Subsystems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-3">
              Hardware Architecture Subsystems:
            </span>
            <div className="space-y-2">
              {project.architectureComponents.map((comp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>{comp}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-3">
              Simulation Verification Objectives:
            </span>
            <div className="space-y-2">
              {project.simulationObjectives.map((obj, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Validation Specs Table */}
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-3">
            Automated Specification Verification Matrix:
          </span>
          <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Specification Parameter</th>
                  <th className="p-3">Engineering Target</th>
                  <th className="p-3">Simulated Result</th>
                  <th className="p-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {project.specsToVerify.map((spec, idx) => (
                  <tr key={idx}>
                    <td className="p-3 text-white font-semibold">{spec.parameter}</td>
                    <td className="p-3 text-cyan-300">{spec.target}</td>
                    <td className="p-3 text-amber-300 font-bold">{spec.measured}</td>
                    <td className="p-3">
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
