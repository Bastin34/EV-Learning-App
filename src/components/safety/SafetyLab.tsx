import React, { useState } from 'react';
import { EVTelemetry } from '../../types/ev';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Power,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';

interface SafetyLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const SafetyLab: React.FC<SafetyLabProps> = ({ telemetry, onUpdateTelemetry }) => {
  // Safety devices state
  const [msdPlugged, setMsdPlugged] = useState<boolean>(true);
  const [pyrofuseTriggered, setPyrofuseTriggered] = useState<boolean>(false);
  const [hvilConnectorUnplugged, setHvilConnectorUnplugged] = useState<string | null>(null);

  // Isolation Resistance Value (kΩ)
  const [isoResistanceKOhm, setIsoResistanceKOhm] = useState<number>(850); // Normal: 850 kΩ (> 400 kΩ threshold)

  const isHvilBroken = hvilConnectorUnplugged !== null;
  const isHvSafe = msdPlugged && !pyrofuseTriggered && !isHvilBroken && isoResistanceKOhm >= 400;

  const handleTripPyrofuse = () => {
    setPyrofuseTriggered(true);
    onUpdateTelemetry({ hvReady: false, dcLinkVoltageV: 0 });
  };

  const handleResetSafety = () => {
    setMsdPlugged(true);
    setPyrofuseTriggered(false);
    setHvilConnectorUnplugged(null);
    setIsoResistanceKOhm(850);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">High-Voltage Safety, HVIL & Pyrofuse Lab</h2>
            <p className="text-xs text-slate-400">
              High-Voltage Interlock Loop (HVIL), pyrofuse triggering & isolation barrier validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSafety}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Safety Interlocks</span>
          </button>
        </div>
      </div>

      {/* High-Voltage Safety Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
          isHvSafe
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {isHvSafe ? (
            <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-7 h-7 text-rose-400 shrink-0" />
          )}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              {isHvSafe ? 'All High-Voltage Safety Barriers Secured' : 'HIGH-VOLTAGE HAZARD DETECTED / SYSTEM ISOLATED'}
            </span>
            <span className="text-xs text-slate-300 font-mono">
              {isHvSafe
                ? 'HVIL Loop Complete (12V Active) · Isolation > 500 Ω/V · Pyrofuse Intact · MSD Locked'
                : !msdPlugged
                ? 'Manual Service Disconnect (MSD) Removed - Pack Physically Open-Circuited'
                : pyrofuseTriggered
                ? 'Pyrofuse Detonated - Solid Copper Busbar Severed by Chemical Actuator'
                : isHvilBroken
                ? `HVIL Interlock Broken at [${hvilConnectorUnplugged}] - Contactors Opened in <10ms`
                : 'Insulation Resistance Below Regulatory Limit (R_iso < 400 kΩ)'}
            </span>
          </div>
        </div>
      </div>

      {/* Safety Mechanisms Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. HVIL Loop */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
              1. High-Voltage Interlock Loop (HVIL)
            </span>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              A dedicated low-voltage pilot loop running through every high-voltage connector. Unplugging any HV cable opens the HVIL circuit first, allowing the BMS to de-energize the bus before human contact.
            </p>

            <div className="space-y-2 text-xs">
              {[
                { id: 'inverter_plug', name: 'Inverter HV Power Connector' },
                { id: 'battery_lid', name: 'Battery Pack Service Cover' },
                { id: 'dc_charge_port', name: 'DC Fast Charge Connector' },
              ].map((conn) => (
                <div
                  key={conn.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-slate-300">{conn.name}</span>
                  <button
                    onClick={() =>
                      setHvilConnectorUnplugged(hvilConnectorUnplugged === conn.id ? null : conn.id)
                    }
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                      hvilConnectorUnplugged === conn.id
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {hvilConnectorUnplugged === conn.id ? 'UNPLUGGED' : 'MATED OK'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Pyro-Fuse */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
              2. Chemical Pyrofuse Disconnect
            </span>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Unlike thermal fuses that take seconds to melt, an active pyrofuse uses a microscopic pyrotechnic charge to drive a ceramic chisel through the copper busbar within 2.0 ms during short-circuits or crash deceleration.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xs mb-4">
              <span className="text-slate-400 block mb-1">Pyrofuse State:</span>
              <span
                className={`text-lg font-bold ${
                  pyrofuseTriggered ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {pyrofuseTriggered ? 'DETONATED (BUSBAR SEVERED)' : 'INTACT (CONTINUITY OK)'}
              </span>
            </div>

            <button
              onClick={handleTripPyrofuse}
              disabled={pyrofuseTriggered}
              className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            >
              Trigger Pyrofuse Detonation
            </button>
          </div>
        </div>

        {/* 3. Manual Service Disconnect (MSD) */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
              3. Manual Service Disconnect (MSD)
            </span>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              A high-visibility orange manual plug that physically cuts the battery pack in half (splitting an 800V pack into two non-hazardous 400V sections) so technicians can service the vehicle safely.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xs mb-4">
              <span className="text-slate-400 block mb-1">MSD Interlock Status:</span>
              <span className={`text-lg font-bold ${msdPlugged ? 'text-emerald-400' : 'text-amber-400'}`}>
                {msdPlugged ? 'INSERTED & LOCKED' : 'PULLED / OPEN-CIRCUIT'}
              </span>
            </div>

            <button
              onClick={() => setMsdPlugged(!msdPlugged)}
              className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all"
            >
              {msdPlugged ? 'Pull MSD Lever (Service Mode)' : 'Re-insert & Lock MSD'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
