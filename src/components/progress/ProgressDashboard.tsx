import React from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  Layers,
  Zap,
  Activity,
  Cpu,
  ShieldCheck,
  Download
} from 'lucide-react';

export const ProgressDashboard: React.FC = () => {
  const skills = [
    { name: 'Traction Battery & Cell Electrochemistry', level: 85, color: '#06b6d4' },
    { name: 'Battery Management Systems (BMS & EKF)', level: 75, color: '#10b981' },
    { name: 'Power Electronics & SiC Inverters', level: 80, color: '#f59e0b' },
    { name: 'Electric Motors & FOC Vector Control', level: 90, color: '#3b82f6' },
    { name: 'CAN Bus Networking & Signal Telemetry', level: 68, color: '#8b5cf6' },
    { name: 'Thermal Management & Heat Exchangers', level: 72, color: '#ec4899' },
    { name: 'High-Voltage Safety & Fault Diagnosis', level: 88, color: '#ef4444' },
  ];

  const overallMastery = Math.round(
    skills.reduce((acc, s) => acc + s.level, 0) / skills.length
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Engineering Competency & Skill Matrix</h2>
            <p className="text-xs text-slate-400">
              Verified virtual laboratory completions, simulation benchmarks & interview readiness
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-400 block">Overall Mastery Index</span>
          <span className="text-2xl font-bold text-cyan-300">{overallMastery}%</span>
          <span className="text-emerald-400 font-semibold block">Senior EV Engineer Ready</span>
        </div>
      </div>

      {/* Main Skill Radar / Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            EV Domain Competency Breakdown
          </h3>

          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-medium">{skill.name}</span>
                  <span className="text-cyan-400 font-bold">{skill.level}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${skill.level}%`,
                      backgroundColor: skill.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate of Competency Box */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Certificate of Completion</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Awarded upon completing all 24 virtual lab simulations, passing the technical interview gauntlet, and verifying a capstone vehicle design.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Verification ID:</span>
                <span className="text-cyan-400">VOLTX-EV-2026-ASIL-D</span>
              </div>
              <div className="flex justify-between">
                <span>Standard:</span>
                <span>ISO 26262 & SAE J1772</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Certificate verified! You have demonstrated advanced electric powertrain competency.')}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Verified Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
