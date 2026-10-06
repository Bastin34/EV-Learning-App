import React, { useState } from 'react';
import { CurriculumTopic } from '../../types/ev';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Play,
  Layers,
  Zap,
  Cpu,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  {
    id: 'beg_1',
    title: 'EV Fundamentals & Powertrain Energy Flow',
    level: 'Beginner',
    estimatedMinutes: 20,
    description: 'Learn the primary functional blocks of an Electric Vehicle: Battery, Inverter, Motor, Reduction Gear, and Wheels. Contrast power (kW) with energy (kWh).',
    keyLearningObjectives: [
      'Understand the continuous high-voltage energy pathway: Battery → Contactors → Inverter → Motor → Wheels.',
      'Differentiate Power (Rate of energy conversion in kW) from Energy (Capacity to do work in kWh).',
      'Explain why EVs use a single-speed reduction gear instead of multi-ratio manual/automatic transmissions.',
    ],
    equations: [
      { formula: 'E \\text{ (kWh)} = P \\text{ (kW)} \\times t \\text{ (hours)}', description: 'Total electrical energy stored' },
      { formula: 'P = V \\times I', description: 'Electric instantaneous power in Watts' },
    ],
    practicalExercise: 'Navigate to the 3D Vehicle view in X-Ray mode and follow the orange high-voltage cables from the battery pack to the rear inverter.',
  },
  {
    id: 'int_1',
    title: 'High-Voltage Traction Battery & BMS Fundamentals',
    level: 'Intermediate',
    estimatedMinutes: 35,
    description: 'Explore Lithium-ion cell electrochemistry, NMC 811 vs LFP characteristics, and why Battery Management Systems (BMS) are vital for safety.',
    keyLearningObjectives: [
      'Analyze the Cell → Module → Pack physical hierarchy.',
      'Contrast high-energy NMC 811 cells with ultra-stable, cobalt-free LFP chemistry.',
      'Understand Passive vs Active cell balancing and how voltage divergence develops.',
    ],
    equations: [
      { formula: 'V_{term} = V_{ocv} - I \\cdot R_i', description: 'Cell terminal voltage under load current' },
      { formula: 'P_{heat} = I^2 \\cdot R_i', description: 'Ohmic Joule heat generation inside cell' },
    ],
    practicalExercise: 'Open the Battery Lab and simulate cell internal resistance rise from 0.8 mΩ to 2.5 mΩ to observe the increased heat dissipation.',
  },
  {
    id: 'adv_1',
    title: 'Field Oriented Control (FOC) & Space Vector PWM',
    level: 'Advanced',
    estimatedMinutes: 45,
    description: 'Master vector control of Permanent Magnet Synchronous Motors using Clarke and Park mathematical transformations.',
    keyLearningObjectives: [
      'Deconstruct 3-phase AC stator currents into decoupled d-axis (Flux) and q-axis (Torque) DC quantities.',
      'Understand how negative d-axis current enables high-speed Flux Weakening beyond base motor speed.',
      'Analyze the Space Vector PWM (SVPWM) voltage hexagon and switching sector state transitions.',
    ],
    equations: [
      { formula: 'T_e = \\frac{3}{2} p [\\lambda_{pm} I_q + (L_d - L_q) I_d I_q]', description: 'Electromagnetic torque equation for salient IPM motor' },
      { formula: 'I_\\alpha = I_a, \\quad I_\\beta = \\frac{1}{\\sqrt{3}}(I_a + 2I_b)', description: 'Clarke coordinate transformation' },
    ],
    practicalExercise: 'Go to the Motor Control Lab, adjust the Iq torque slider to 300A, and view the rotating vector tip coordinate trajectory.',
  },
  {
    id: 'exp_1',
    title: '800V Architecture, Silicon Carbide & Functional Safety',
    level: 'Expert',
    estimatedMinutes: 50,
    description: 'Deep dive into 800V architectures, Silicon Carbide (SiC) semiconductor switching physics, and ISO 26262 ASIL-D safety interlocks.',
    keyLearningObjectives: [
      'Quantify the 75% copper resistive loss reduction achieved by doubling pack voltage to 800V.',
      'Evaluate SiC MOSFET switching dynamics and gate drive desaturation (DESAT) protection.',
      'Design pre-charge timing sequences to protect contactors from inrush welding.',
    ],
    equations: [
      { formula: 'P_{loss} = I^2 R = \\left(\\frac{P}{V}\\right)^2 R', description: 'Conductor loss inverse-square law with voltage' },
      { formula: '\\tau = R_{pre} \\cdot C_{dc}', description: 'Inrush RC charging time constant' },
    ],
    practicalExercise: 'Open the HV Architecture Lab and run the automated 9-step contactor pre-charge sequence while watching the live oscilloscope waveform.',
  },
];

export const CurriculumLab: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('beg_1');
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>(['beg_1']);

  const activeTopic = CURRICULUM_TOPICS.find((t) => t.id === selectedTopicId) || CURRICULUM_TOPICS[0];

  const toggleComplete = (id: string) => {
    if (completedTopicIds.includes(id)) {
      setCompletedTopicIds(completedTopicIds.filter((t) => t !== id));
    } else {
      setCompletedTopicIds([...completedTopicIds, id]);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Structured EV Engineering Curriculum</h2>
            <p className="text-xs text-slate-400">
              Progressive mastery roadmap from Beginner Fundamentals to Advanced Powertrain Engineering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-mono text-slate-300">
            Completed: {completedTopicIds.length} / {CURRICULUM_TOPICS.length} Courses
          </span>
        </div>
      </div>

      {/* Curriculum Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Course List Sidebar */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-2 block">
            Curriculum Modules:
          </span>

          <div className="space-y-2">
            {CURRICULUM_TOPICS.map((topic) => {
              const isSelected = topic.id === selectedTopicId;
              const isDone = completedTopicIds.includes(topic.id);

              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">{topic.level}</span>
                    <span className="text-[10px] text-slate-500">{topic.estimatedMinutes} mins</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-2">{topic.title}</h4>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Click to study</span>
                    {isDone && (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Lesson Viewer */}
        <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase font-mono text-cyan-400 font-bold">{activeTopic.level} Tier</span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-1">{activeTopic.title}</h3>
              </div>
              <button
                onClick={() => toggleComplete(activeTopic.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  completedTopicIds.includes(activeTopic.id)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{completedTopicIds.includes(activeTopic.id) ? 'Mark Incomplete' : 'Mark Completed'}</span>
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{activeTopic.description}</p>

            {/* Key Learning Objectives */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                Key Learning Objectives:
              </h4>
              <div className="space-y-2">
                {activeTopic.keyLearningObjectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mathematical Equations */}
            {activeTopic.equations && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  Core Engineering Equations:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeTopic.equations.map((eq, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-mono text-cyan-300 text-xs font-bold">$${eq.formula}$$</div>
                      <span className="text-[11px] text-slate-400 block">{eq.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Interactive Exercise */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
              <span className="text-xs uppercase font-mono font-bold text-cyan-400 block">
                Virtual Laboratory Assignment:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{activeTopic.practicalExercise}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
