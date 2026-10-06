import React, { useState, useEffect } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  RotateCw,
  Activity,
  Layers,
  Zap,
  Sliders,
  CheckCircle2,
  Info,
  Maximize2
} from 'lucide-react';

interface MotorLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const MotorLab: React.FC<MotorLabProps> = ({ telemetry, onUpdateTelemetry }) => {
  // Motor type selection
  const [motorType, setMotorType] = useState<'PMSM' | 'IM' | 'BLDC' | 'SRM'>('PMSM');
  // Manual rotor angle rotation (degrees)
  const [rotorAngleDeg, setRotorAngleDeg] = useState<number>(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(true);
  const [commandSpeedRpm, setCommandSpeedRpm] = useState<number>(6500);

  // Motor database
  const motorTypes = {
    PMSM: {
      name: 'Interior Permanent Magnet Synchronous Motor (IPMSM)',
      efficiency: '97.2%',
      torqueDensity: 'High (4.8 Nm/kg)',
      description: 'Synchronous motor with embedded NdFeB magnets providing high continuous torque density, low rotor thermal losses, and wide constant-power speed range.',
      rotorConstruction: 'V-shaped or Double-V NdFeB Neodymium magnets embedded inside laminated silicon steel rotor.',
      controlMethod: 'Field Oriented Control (FOC) with Maximum Torque Per Ampere (MTPA) & Flux Weakening.',
      advantages: 'Highest efficiency, compact package, wide constant power speed range (CPSR) via negative d-axis demagnetizing current.',
      drawbacks: 'High raw material cost (Rare-earth Neodymium & Dysprosium), risk of magnet thermal demagnetization above 180°C.',
      usedIn: 'Tesla Model 3/Y rear, Porsche Taycan, Lucid Air, Hyundai Ioniq 5/6.',
    },
    IM: {
      name: 'AC Asynchronous Induction Motor (Squirrel Cage)',
      efficiency: '94.5%',
      torqueDensity: 'Medium (3.2 Nm/kg)',
      description: 'Rugged asynchronous machine inducing rotor currents through electromagnetic induction. Highly resilient with zero cogging or residual drag when unpowered.',
      rotorConstruction: 'Copper or die-cast Aluminum conductor bars shorted by end rings in laminated rotor core.',
      controlMethod: 'Direct Torque Control (DTC) or Rotor Flux Oriented Control (RFOC).',
      advantages: 'Zero rare-earth magnets, zero drag torque when coasting unenergized (ideal for dual-motor front secondary axle disconnection), indestructible.',
      drawbacks: 'Rotor I²R copper losses generate significant heat inside the rotor, lower partial-load efficiency.',
      usedIn: 'Tesla Model S/X front axle, Audi e-tron quattro, Mercedes EQ.',
    },
    BLDC: {
      name: 'Brushless DC Motor (BLDC with Trapezoidal Back-EMF)',
      efficiency: '93.8%',
      torqueDensity: 'Medium (3.6 Nm/kg)',
      description: 'Electrically commutated DC motor with surface-mounted permanent magnets producing trapezoidal back-EMF waveforms.',
      rotorConstruction: 'Surface-mounted permanent magnets (SPM).',
      controlMethod: 'Six-step 120° electrical commutation using 3 digital Hall effect sensors.',
      advantages: 'Simple low-cost microcontroller requirements, straightforward gate driving.',
      drawbacks: 'High torque ripple during commutation transitions, acoustic noise.',
      usedIn: 'Light electric vehicles, electric scooters, e-bikes, automotive auxiliary fans/pumps.',
    },
    SRM: {
      name: 'Switched Reluctance Motor (SRM)',
      efficiency: '92.0%',
      torqueDensity: 'Moderate (2.8 Nm/kg)',
      description: 'Doubly salient reluctance motor operating purely on magnetic reluctance minimization without permanent magnets or rotor windings.',
      rotorConstruction: 'Doubly salient iron steel rotor with no magnets, no windings, and no squirrel cage bars.',
      controlMethod: 'Sequential phase pulse energization based on high-resolution rotor position.',
      advantages: 'Extremely rugged, capable of ultra-high RPMs (>30,000 RPM), zero rare-earth elements, tolerant of phase coil shorts.',
      drawbacks: 'Significant acoustic noise and radial magnetic force vibrations.',
      usedIn: 'Heavy industrial off-road machinery, aerospace prototypes, future low-cost EV research.',
    },
  };

  const currentMotor = motorTypes[motorType];

  // Auto rotation loop
  useEffect(() => {
    let anim: NodeJS.Timeout;
    if (isAutoSpinning) {
      anim = setInterval(() => {
        setRotorAngleDeg((prev) => (prev + (commandSpeedRpm / 6000) * 12) % 360);
      }, 30);
    }
    return () => clearInterval(anim);
  }, [isAutoSpinning, commandSpeedRpm]);

  // Torque and Back-EMF calculation
  const polePairs = 4;
  const electricalAngleRad = (rotorAngleDeg * polePairs * Math.PI) / 180;
  // Back EMF: E = k_e * omega * sin(theta_e)
  const angularVelocity = (commandSpeedRpm * 2 * Math.PI) / 60;
  const backEmfV = Math.round(0.045 * angularVelocity * Math.sin(electricalAngleRad) * 10) / 10;
  // Torque: T = 3/2 * p * (lambda_pm * I_q + (L_d - L_q)*I_d*I_q)
  const calculatedTorqueNm = Math.round(Math.min(520, 240 + Math.cos(electricalAngleRad) * 15));

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <RotateCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Electric Traction Motor Virtual Laboratory</h2>
            <p className="text-xs text-slate-400">
              Internal cross-section, magnetic flux dynamics, Back-EMF & motor topology comparison
            </p>
          </div>
        </div>

        {/* Motor Type Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          {(['PMSM', 'IM', 'BLDC', 'SRM'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMotorType(m)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                motorType === m ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Rotating Stator & Rotor Cross-Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Animated Stator/Rotor Magnetic Flux Visualizer */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> Stator / Rotor Electromagnetic Cross-Section
            </span>
            <span className="text-xs font-mono text-cyan-300">θ_mech = {Math.round(rotorAngleDeg)}°</span>
          </div>

          {/* SVG Rotating Motor */}
          <div className="relative w-64 h-64 my-4 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {/* Outer Stator Lamination Housing */}
              <circle cx="100" cy="100" r="92" fill="#1e293b" stroke="#334155" strokeWidth="4" />
              <circle cx="100" cy="100" r="68" fill="#0f172a" stroke="#475569" strokeWidth="2" />

              {/* Stator Hairpin Copper Coils (12 Slots) */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x = 100 + Math.cos(angle) * 80;
                const y = 100 + Math.sin(angle) * 80;
                const phaseColor = i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#f59e0b' : '#10b981';
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="6.5"
                    fill={phaseColor}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Air Gap (0.7 mm) */}
              <circle cx="100" cy="100" r="62" fill="none" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

              {/* Rotating Rotor */}
              <g transform={`rotate(${rotorAngleDeg} 100 100)`}>
                {/* Rotor Steel Core */}
                <circle cx="100" cy="100" r="60" fill="#334155" stroke="#64748b" strokeWidth="2" />

                {/* Permanent Magnets (8 Poles: 4 North, 4 South) */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * 45 * Math.PI) / 180;
                  const x = 100 + Math.cos(angle) * 44;
                  const y = 100 + Math.sin(angle) * 44;
                  const isNorth = i % 2 === 0;
                  return (
                    <rect
                      key={i}
                      x={x - 6}
                      y={y - 10}
                      width="12"
                      height="20"
                      transform={`rotate(${i * 45} ${x} ${y})`}
                      fill={isNorth ? '#ef4444' : '#3b82f6'}
                      rx="2"
                    />
                  );
                })}

                {/* Center Stainless Steel Drive Shaft */}
                <circle cx="100" cy="100" r="18" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
                <circle cx="100" cy="100" r="4" fill="#0f172a" />
              </g>
            </svg>
          </div>

          {/* Speed & Controls */}
          <div className="w-full flex items-center justify-between text-xs font-mono pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsAutoSpinning(!isAutoSpinning)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              {isAutoSpinning ? 'Pause Rotation' : 'Auto Rotate'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Rotor Speed:</span>
              <span className="text-cyan-300 font-bold">{commandSpeedRpm} RPM</span>
            </div>
          </div>
        </div>

        {/* Detailed Motor Physics & Back-EMF Telemetry */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">{currentMotor.name}</h3>
              <span className="text-xs font-mono text-emerald-400">Peak η: {currentMotor.efficiency}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">{currentMotor.description}</p>

            <div className="space-y-3 mb-6 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Instantaneous Back-EMF (e_back)</span>
                <span className="text-sm font-bold text-cyan-300">{backEmfV} V (Peak: {Math.round(0.045 * angularVelocity)} V)</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{"E = k_e · ω_m · sin(p · θ_m)"}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Electromagnetic Output Torque</span>
                <span className="text-sm font-bold text-amber-300">{calculatedTorqueNm} Nm</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Reluctance + Alignment Torque</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓ Advantages:</span>
                <span className="text-slate-300">{currentMotor.advantages}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✗ Trade-offs:</span>
                <span className="text-slate-300">{currentMotor.drawbacks}</span>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-slate-800">
                <span className="text-cyan-400 font-bold">OEM Usage:</span>
                <span className="text-slate-400">{currentMotor.usedIn}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
