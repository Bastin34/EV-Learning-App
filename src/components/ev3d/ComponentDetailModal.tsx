import React, { useState } from 'react';
import { EVComponentInfo, EVTelemetry } from '../../types/ev';
import { X, Activity, AlertTriangle, ShieldCheck, Cpu, Zap, Thermometer, Layers, Wrench, CheckCircle2 } from 'lucide-react';

interface ComponentDetailModalProps {
  component: EVComponentInfo | null;
  telemetry: EVTelemetry;
  onClose: () => void;
  onInjectFault?: (faultName: string) => void;
}

export const ComponentDetailModal: React.FC<ComponentDetailModalProps> = ({
  component,
  telemetry,
  onClose,
  onInjectFault
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'physics' | 'specs' | 'faults'>('overview');
  const [injectedStatus, setInjectedStatus] = useState<string | null>(null);

  if (!component) return null;

  const handleTestFault = (mode: string) => {
    setInjectedStatus(`Simulated: ${mode}`);
    if (onInjectFault) {
      onInjectFault(mode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              {component.category === 'energy' && <Zap className="w-5 h-5" />}
              {component.category === 'powertrain' && <Cpu className="w-5 h-5" />}
              {component.category === 'control' && <Activity className="w-5 h-5" />}
              {component.category === 'thermal' && <Thermometer className="w-5 h-5" />}
              {component.category === 'safety' && <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">{component.category} Subsystem</span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400 font-mono">ID: {component.id}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{component.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close component details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveTab('physics')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'physics'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Engineering Physics
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'specs'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Technical Specs
          </button>
          <button
            onClick={() => setActiveTab('faults')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'faults'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Failure Modes & Testing
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Component Function</h3>
                <p className="text-slate-300 leading-relaxed text-sm">{component.description}</p>
              </div>

              {/* Live Telemetry Snapshot for this component */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Live Telemetry Readings</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block mb-1">Voltage Rating</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">{component.voltageRating}</span>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block mb-1">Peak Power / Duty</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">{component.peakPower || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block mb-1">Operating Temp Range</span>
                    <span className="text-sm font-bold text-emerald-300 font-mono">{component.operatingTempRange}</span>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block mb-1">Component Mass</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">{component.massKg} kg</span>
                  </div>
                </div>
              </div>

              {/* Contextual dynamic live data based on component */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Real-Time Powertrain Bus Link</span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry Linked
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                  {component.id === 'battery_pack' && (
                    <>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Pack Terminal Voltage</span>
                        <span className="text-sm text-cyan-300 font-bold">{telemetry.batteryVoltageV.toFixed(1)} V</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Traction Current</span>
                        <span className="text-sm text-amber-300 font-bold">{telemetry.batteryCurrentA.toFixed(1)} A</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">State of Charge (SOC)</span>
                        <span className="text-sm text-emerald-300 font-bold">{telemetry.batterySoc.toFixed(1)} %</span>
                      </div>
                    </>
                  )}
                  {component.id === 'inverter' && (
                    <>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">DC-Link Voltage</span>
                        <span className="text-sm text-cyan-300 font-bold">{telemetry.dcLinkVoltageV.toFixed(1)} V</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">SiC Junction Temp</span>
                        <span className="text-sm text-amber-300 font-bold">{telemetry.inverterTempC.toFixed(1)} °C</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Inverter Efficiency</span>
                        <span className="text-sm text-emerald-300 font-bold">{(telemetry.inverterEfficiency * 100).toFixed(1)} %</span>
                      </div>
                    </>
                  )}
                  {component.id === 'pmsm_motor' && (
                    <>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Motor Rotor Speed</span>
                        <span className="text-sm text-cyan-300 font-bold">{telemetry.motorRpm} RPM</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Electromagnetic Torque</span>
                        <span className="text-sm text-amber-300 font-bold">{telemetry.motorTorqueNm.toFixed(1)} Nm</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Shaft Mechanical Power</span>
                        <span className="text-sm text-emerald-300 font-bold">{telemetry.motorPowerKw.toFixed(1)} kW</span>
                      </div>
                    </>
                  )}
                  {component.id === 'precharge_circuit' && (
                    <>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Pre-charge Status</span>
                        <span className="text-sm text-emerald-300 font-bold">{telemetry.hvReady ? 'COMPLETED (Main+ Closed)' : 'STANDBY'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">DC Bus Cap Delta</span>
                        <span className="text-sm text-cyan-300 font-bold">ΔV = {Math.abs(telemetry.batteryVoltageV - telemetry.dcLinkVoltageV).toFixed(1)} V</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Resistor Temp Est.</span>
                        <span className="text-sm text-slate-200 font-bold">29.4 °C</span>
                      </div>
                    </>
                  )}
                  {/* Default fallback metrics */}
                  {['battery_pack', 'inverter', 'pmsm_motor', 'precharge_circuit'].indexOf(component.id) === -1 && (
                    <>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Subsystem Operational</span>
                        <span className="text-sm text-emerald-300 font-bold">NORMAL (ASIL OK)</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Cooling System Loop</span>
                        <span className="text-sm text-cyan-300 font-bold">{component.coolingMethod.split(' ')[0]}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">12V LV Supply Rail</span>
                        <span className="text-sm text-slate-200 font-bold">{telemetry.aux12vVoltageV.toFixed(2)} V</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Fundamental Operating Principles</h3>
              <div className="space-y-3">
                {component.principles.map((pr, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                    <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{pr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Manufacturer OEM Engineering Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(component.specs).map(([specKey, specVal]) => (
                  <div key={specKey} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-slate-400">{specKey}</span>
                    <span className="text-xs font-mono font-semibold text-slate-100">{specVal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faults' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Failure Modes & Diagnostic Injection</h3>
                {injectedStatus && (
                  <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {injectedStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Inject realistic fault signatures into this component to observe powertrain behavior, diagnostic trouble codes (DTC), and safety cutoff responses.
              </p>
              <div className="space-y-2.5">
                {component.failureModes.map((fm, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">{fm}</span>
                    </div>
                    <button
                      onClick={() => handleTestFault(fm)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Inject Fault
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>ISO 26262 ASIL-D Compliant Hardware Model</span>
            <span>·</span>
            <span>VOLTX Engineering Twin v3.4</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
