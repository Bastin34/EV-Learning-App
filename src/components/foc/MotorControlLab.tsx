import React, { useState } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  Compass,
  Activity,
  Layers,
  Zap,
  Sliders,
  RotateCw,
  Info,
  CheckCircle2
} from 'lucide-react';

interface MotorControlLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const MotorControlLab: React.FC<MotorControlLabProps> = ({
  telemetry,
  onUpdateTelemetry,
}) => {
  // Id (Flux component) slider: 0 to -150 A (negative for flux weakening at high speeds)
  const [idCurrentA, setIdCurrentA] = useState<number>(0);
  // Iq (Torque component) slider: 0 to 450 A
  const [iqCurrentA, setIqCurrentA] = useState<number>(280);
  // Rotor electrical angle theta_e (degrees)
  const [rotorThetaDeg, setRotorThetaDeg] = useState<number>(45);

  const thetaRad = (rotorThetaDeg * Math.PI) / 180;

  // Inverse Park Transformation: (d, q) -> (alpha, beta)
  // I_alpha = I_d * cos(theta) - I_q * sin(theta)
  // I_beta  = I_d * sin(theta) + I_q * cos(theta)
  const iAlpha = idCurrentA * Math.cos(thetaRad) - iqCurrentA * Math.sin(thetaRad);
  const iBeta = idCurrentA * Math.sin(thetaRad) + iqCurrentA * Math.cos(thetaRad);

  // Inverse Clarke Transformation: (alpha, beta) -> (a, b, c)
  // I_a = I_alpha
  // I_b = -1/2 * I_alpha + sqrt(3)/2 * I_beta
  // I_c = -1/2 * I_alpha - sqrt(3)/2 * I_beta
  const iA = iAlpha;
  const iB = -0.5 * iAlpha + (Math.sqrt(3) / 2) * iBeta;
  const iC = -0.5 * iAlpha - (Math.sqrt(3) / 2) * iBeta;

  // Electromagnetic Torque from FOC components:
  // T_e = 3/2 * p * [ lambda_pm * I_q + (L_d - L_q) * I_d * I_q ]
  const p = 4; // 4 pole pairs
  const lambdaPm = 0.085; // Wb flux linkage
  const ld = 0.00015; // H (150 µH)
  const lq = 0.00028; // H (280 µH - salient IPM rotor L_q > L_d)
  const torqueNm = 1.5 * p * (lambdaPm * iqCurrentA + (ld - lq) * idCurrentA * iqCurrentA);

  // SVPWM Sector Calculation based on voltage angle
  const voltageAngleDeg = (Math.atan2(iBeta, iAlpha) * 180) / Math.PI;
  const normalizedAngle = (voltageAngleDeg + 360) % 360;
  const sector = Math.floor(normalizedAngle / 60) + 1;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Field Oriented Control (FOC) & SVPWM Lab</h2>
            <p className="text-xs text-slate-400">
              Clarke / Park mathematical coordinate transformations & rotating d-q reference frame
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-400 block">SVPWM Space Vector Sector</span>
          <span className="text-cyan-300 font-bold text-sm">Sector #{sector} (Angle: {Math.round(normalizedAngle)}°)</span>
        </div>
      </div>

      {/* Interactive FOC Transformations Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rotating Reference Frame Vector Plane (d-q vs alpha-beta) */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> Rotating $(d, q)$ Stator Current Vector
            </span>
            <span className="text-xs font-mono text-cyan-300">θ_e = {rotorThetaDeg}°</span>
          </div>

          {/* SVG Vector Coordinate Display */}
          <div className="relative w-72 h-72 my-2 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 240 240">
              {/* Stationary Alpha / Beta Axes */}
              <line x1="20" y1="120" x2="220" y2="120" stroke="#334155" strokeWidth="1.5" />
              <line x1="120" y1="20" x2="120" y2="220" stroke="#334155" strokeWidth="1.5" />
              <text x="222" y="124" fill="#64748b" fontSize="10" fontFamily="monospace">α</text>
              <text x="122" y="16" fill="#64748b" fontSize="10" fontFamily="monospace">β</text>

              {/* Space Vector Hexagon Perimeter */}
              <polygon
                points="200,120 160,51 80,51 40,120 80,189 160,189"
                fill="none"
                stroke="#1e293b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Rotating d-q Axis Grid */}
              <g transform={`rotate(${-rotorThetaDeg} 120 120)`}>
                {/* d-axis (Flux, Blue) */}
                <line x1="120" y1="120" x2="210" y2="120" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="214" y="124" fill="#3b82f6" fontSize="10" fontFamily="monospace">d (Flux)</text>

                {/* q-axis (Torque, Emerald) */}
                <line x1="120" y1="120" x2="120" y2="30" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="124" y="26" fill="#10b981" fontSize="10" fontFamily="monospace">q (Torque)</text>

                {/* Resultant Stator Current Vector I_s */}
                <line
                  x1="120"
                  y1="120"
                  x2={120 + (idCurrentA / 300) * 80}
                  y2={120 - (iqCurrentA / 300) * 80}
                  stroke="#00f0ff"
                  strokeWidth="3.5"
                  markerEnd="url(#arrow)"
                />
              </g>

              {/* Vector tip circle */}
              <circle
                cx={120 + (iAlpha / 300) * 80}
                cy={120 - (iBeta / 300) * 80}
                r="5"
                fill="#00f0ff"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 text-xs font-mono pt-4 border-t border-slate-800">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Stationary α-β Frame</span>
              <span className="text-cyan-300 font-bold">I_α: {Math.round(iAlpha)} A · I_β: {Math.round(iBeta)} A</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">3-Phase Stator Phase</span>
              <span className="text-emerald-300 font-bold">I_a: {Math.round(iA)} A · I_b: {Math.round(iB)} A</span>
            </div>
          </div>
        </div>

        {/* Dynamic Parameter Sliders & Mathematical Breakdown */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              FOC Decoupled Current Vector Controllers
            </h3>

            {/* Iq Slider (Torque-producing) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Torque Current Component ($I_q$)</span>
                <span className="text-emerald-300 font-bold">{iqCurrentA} A</span>
              </div>
              <input
                type="range"
                min="0"
                max="450"
                step="10"
                value={iqCurrentA}
                onChange={(e) => setIqCurrentA(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-[11px] text-slate-500 block">Directly governs output shaft torque $T_e$.</span>
            </div>

            {/* Id Slider (Flux / Field Weakening) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Flux Current Component ($I_d$)</span>
                <span className="text-cyan-300 font-bold">{idCurrentA} A</span>
              </div>
              <input
                type="range"
                min="-150"
                max="0"
                step="5"
                value={idCurrentA}
                onChange={(e) => setIdCurrentA(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[11px] text-slate-500 block">Negative $I_d$ opposes rotor permanent magnet flux, allowing high-speed motor operation (Flux Weakening).</span>
            </div>

            {/* Rotor Angle Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Rotor Electrical Position ($\theta_e$)</span>
                <span className="text-amber-300 font-bold">{rotorThetaDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={rotorThetaDeg}
                onChange={(e) => setRotorThetaDeg(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[11px] text-slate-500 block">Measured continuously by high-precision motor resolver or optical encoder.</span>
            </div>

            {/* Calculated Torque */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Electromagnetic Motor Torque ($T_e$):</span>
                <span className="text-lg font-bold text-amber-300">{Math.round(torqueNm)} Nm</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {"T_e = (3/2) · p · [λ_pm · I_q + (L_d - L_q) · I_d · I_q]"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-2.5 mt-4">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Clarke Transform:</strong> Converts 3-phase currents $(a, b, c)$ into 2 orthogonal stationary components $(\alpha, \beta)$.<br/>
              <strong>Park Transform:</strong> Projects $(\alpha, \beta)$ onto the rotating rotor frame $(d, q)$, turning sinusoidal AC quantities into constant DC values that standard PI controllers can easily regulate!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
