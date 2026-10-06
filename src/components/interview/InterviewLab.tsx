import React, { useState } from 'react';
import { InterviewQuestion } from '../../types/ev';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'q1',
    category: 'HV Architecture',
    level: 'Mid',
    question:
      'Why is a high-voltage pre-charge circuit required prior to closing the main traction contactor?',
    options: [
      'To verify the 12V auxiliary lead-acid battery voltage.',
      'To prevent catastrophic inrush current arcing across contactor contacts while charging uncharged DC-link capacitors.',
      'To pre-heat the electric motor stator windings before current flow.',
      'To balance individual lithium-ion cell voltages in the pack.',
    ],
    correctIndex: 1,
    explanation:
      'Uncharged inverter DC-link capacitors act like a dead short (0V). Closing the main contactor directly across an 800V pack would trigger thousands of Amps of inrush current (I = V/R), welding the copper contacts. Pre-charge limits current via a series resistor until ΔV < 20V.',
    oemReference: 'Tesla Powertrain Engineering Interview',
  },
  {
    id: 'q2',
    category: 'Battery & BMS',
    level: 'Senior / Principal',
    question:
      'Why is open-circuit voltage (OCV) lookup insufficient for accurate real-time SOC estimation in Lithium Iron Phosphate (LFP) cells?',
    options: [
      'LFP cells have no open circuit voltage.',
      'LFP exhibits an extremely flat voltage plateau between 20% and 80% SOC where ΔV is negligible, causing small voltage errors to produce massive SOC errors.',
      'LFP cells degrade rapidly if measured with an ADC.',
      'LFP chemistry has zero internal resistance.',
    ],
    correctIndex: 1,
    explanation:
      'In LFP cells, the phase transition between LiFePO4 and FePO4 occurs at a constant electrochemical potential (~3.25V per cell across 60% of the capacity range). Hence, the derivative dV/dSOC ≈ 0, requiring Coulomb counting combined with Extended Kalman Filtering (EKF).',
    oemReference: 'Lucid Motors Battery Systems Interview',
  },
  {
    id: 'q3',
    category: 'Power Electronics',
    level: 'Senior / Principal',
    question:
      'What is the primary physical advantage of Silicon Carbide (SiC) MOSFETs over Silicon (Si) IGBTs in 800V traction inverters?',
    options: [
      'SiC MOSFETs have zero switching losses and require no cooling.',
      'Wide bandgap energy (3.26 eV vs 1.12 eV) eliminates minority carrier tail currents and permits switching frequencies >16 kHz with ~70% lower switching losses.',
      'SiC MOSFETs do not require gate driver ICs.',
      'SiC allows bidirectional mechanical gear rotation.',
    ],
    correctIndex: 1,
    explanation:
      'Silicon IGBTs are bipolar devices that suffer from minority carrier recombination tail current during turn-off, causing high E_off losses. SiC MOSFETs are unipolar, enabling ultra-fast switching transients (high dV/dt), dramatically reducing thermal dissipation.',
    oemReference: 'Porsche Taycan High-Voltage Inverter Team',
  },
  {
    id: 'q4',
    category: 'Motor & Control',
    level: 'Mid',
    question:
      'In Field Oriented Control (FOC) of an interior permanent magnet synchronous motor (IPMSM), what is the function of applying negative d-axis current (Id < 0)?',
    options: [
      'To reverse vehicle driving direction from forward to reverse.',
      'Flux Weakening: To oppose rotor permanent magnet flux, reducing back-EMF below the inverter DC bus voltage to reach higher RPMs.',
      'To execute regenerative braking at zero speed.',
      'To measure winding temperature.',
    ],
    correctIndex: 1,
    explanation:
      'As motor speed increases, back-EMF rises linearly until it hits the DC-link voltage ceiling (voltage limit ellipse). Injecting negative Id current produces an opposing stator demagnetizing field, weakening net airgap flux and extending maximum rotor RPM.',
    oemReference: 'Rivian Electric Drive Unit Interview',
  },
  {
    id: 'q5',
    category: 'Thermal & Safety',
    level: 'Entry',
    question:
      'What is the international regulatory minimum isolation resistance required for electric vehicles per UN ECE R100?',
    options: [
      'At least 100 Ω per Volt for AC and 500 Ω per Volt for DC circuits.',
      'At least 5 Ω total resistance.',
      'Zero isolation resistance required.',
      'At least 10,000 Ω total resistance regardless of voltage.',
    ],
    correctIndex: 0,
    explanation:
      'UN ECE R100 specifies a minimum of 500 Ω/V for high-voltage DC systems. On an 800V pack, isolation resistance to chassis ground must exceed 400 kΩ; anything lower trips an ASIL-D safety shutdown.',
    oemReference: 'Automotive Functional Safety Certification',
  },
];

export const InterviewLab: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const question = INTERVIEW_QUESTIONS[currentIdx];
  const isCorrect = selectedOption === question.correctIndex;

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === question.correctIndex) {
      setScore((s) => s + 1);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    }
  };

  const handleNext = () => {
    if (currentIdx < INTERVIEW_QUESTIONS.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">EV Engineering Interview Simulator</h2>
            <p className="text-xs text-slate-400">
              Technical screening challenges from Tesla, Lucid, Rivian, and Porsche engineering teams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Question {currentIdx + 1} of {INTERVIEW_QUESTIONS.length}
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg">
            Score: {score} / {INTERVIEW_QUESTIONS.length}
          </span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              {question.category}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-amber-400">{question.level} Level</span>
          </div>

          {question.oemReference && (
            <span className="text-xs font-mono text-slate-400">
              Source: <span className="text-slate-200 font-semibold">{question.oemReference}</span>
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-white leading-relaxed">{question.question}</h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = idx === question.correctIndex;

            let cardStyle = 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white';
            if (isAnswerSubmitted) {
              if (isCorrectOption) {
                cardStyle = 'bg-emerald-950/30 border-emerald-500 text-emerald-200 font-bold';
              } else if (isSelected) {
                cardStyle = 'bg-rose-950/30 border-rose-500 text-rose-200';
              }
            } else if (isSelected) {
              cardStyle = 'bg-cyan-500/10 border-cyan-500 text-white font-semibold';
            }

            return (
              <div
                key={idx}
                onClick={() => !isAnswerSubmitted && setSelectedOption(idx)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs leading-relaxed ${cardStyle}`}
              >
                <span>{opt}</span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                    isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restart Quiz
          </button>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-40"
            >
              Confirm Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <span>{currentIdx < INTERVIEW_QUESTIONS.length - 1 ? 'Next Question' : 'Completed!'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Detailed Engineering Explanation */}
        {isAnswerSubmitted && (
          <div
            className={`p-5 rounded-2xl border space-y-2 animate-in fade-in ${
              isCorrect ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    Correct Answer!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                    Incorrect Solution
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
