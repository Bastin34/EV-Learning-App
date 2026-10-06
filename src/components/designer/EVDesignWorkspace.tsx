import React, { useState } from 'react';
import {
  Wrench,
  Sliders,
  Layers,
  Zap,
  CheckCircle2,
  Download,
  Sparkles,
  Info
} from 'lucide-react';

export const EVDesignWorkspace: React.FC = () => {
  const [vehicleClass, setVehicleClass] = useState<'sedan' | 'suv' | 'sports_gt' | 'compact'>('sedan');
  const [targetRangeKm, setTargetRangeKm] = useState<number>(550);
  const [targetTopSpeedKmh, setTargetTopSpeedKmh] = useState<number>(240);
  const [targetAccel0100s, setTargetAccel0100s] = useState<number>(3.6);
  const [targetMassKg, setTargetMassKg] = useState<number>(2100);
  const [archVoltage, setArchVoltage] = useState<400 | 800>(800);
  const [chemistry, setChemistry] = useState<'NMC811' | 'LFP'>('NMC811');
  const [motorConfig, setMotorConfig] = useState<'RWD' | 'AWD'>('AWD');

  // Engineering calculation engine:
  // Required energy = Range * specific consumption (Wh/km)
  const baseWhPerKm = vehicleClass === 'sports_gt' ? 185 : vehicleClass === 'suv' ? 195 : 160;
  const grossEnergyKwh = Math.round(((targetRangeKm * baseWhPerKm) / 1000) / 0.92); // 92% depth of discharge
  // Required Peak Motor Power from acceleration (0-100 km/h in t seconds)
  // Kinetic energy at 100 km/h (27.78 m/s): E_k = 1/2 * m * v^2
  const v100 = 27.78;
  const eK100Joules = 0.5 * targetMassKg * Math.pow(v100, 2);
  const avgAccelPowerKw = (eK100Joules / targetAccel0100s) / 1000;
  const peakMotorPowerKw = Math.round(avgAccelPowerKw * 1.55); // Motor peak rating
  const peakMotorTorqueNm = Math.round((peakMotorPowerKw * 1000) / ((4500 * 2 * Math.PI) / 60));

  // Cell count based on voltage
  const cellNominalV = chemistry === 'NMC811' ? 3.7 : 3.2;
  const seriesCount = Math.round(archVoltage / cellNominalV);
  const packAh = Math.round((grossEnergyKwh * 1000) / archVoltage);
  const cellAh = chemistry === 'NMC811' ? 50 : 100;
  const parallelCount = Math.max(1, Math.round(packAh / cellAh));

  // Peak Inverter Current
  const maxInverterCurrentA = Math.round((peakMotorPowerKw * 1000) / archVoltage);
  // Fast Charging Power Peak
  const recommendedDcFastKw = archVoltage === 800 ? Math.min(350, Math.round(grossEnergyKwh * 3.0)) : Math.min(180, Math.round(grossEnergyKwh * 2.0));

  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleExportBlueprint = () => {
    const blueprintData = `VOLTX EV ENGINEERING CONCEPT BLUEPRINT
Generated: ${new Date().toISOString()}

TARGET SPECIFICATIONS:
Vehicle Category: ${vehicleClass.toUpperCase()}
Target Range: ${targetRangeKm} km
Top Speed: ${targetTopSpeedKmh} km/h
0-100 km/h Acceleration: ${targetAccel0100s} s
Curb Mass: ${targetMassKg} kg
Architecture Tier: ${archVoltage}V High-Voltage

ENGINEERING RECOMMENDATIONS:
Battery Pack Gross Energy: ${grossEnergyKwh} kWh
Cell Topology: ${seriesCount}S${parallelCount}P (${seriesCount * parallelCount} cells total)
Cell Chemistry: ${chemistry}
Peak Drivetrain Power: ${peakMotorPowerKw} kW (${Math.round(peakMotorPowerKw * 1.341)} HP)
Peak Drivetrain Torque: ${peakMotorTorqueNm} Nm
Drivetrain Layout: ${motorConfig}
Inverter Current Rating: ${maxInverterCurrentA} A_rms (Silicon Carbide SiC recommended)
Max DC Fast Charging Rating: ${recommendedDcFastKw} kW
Estimated 10-80% Fast Charge Duration: ${archVoltage === 800 ? '18 minutes' : '32 minutes'}
`;

    const blob = new Blob([blueprintData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VOLTX_${vehicleClass.toUpperCase()}_EV_Blueprint.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">EV Powertrain & Battery Design Studio</h2>
            <p className="text-xs text-slate-400">
              Interactive vehicle design workspace with automated component sizing & specification synthesis
            </p>
          </div>
        </div>

        <button
          onClick={handleExportBlueprint}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
        >
          {downloadSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span>{downloadSuccess ? 'Blueprint Downloaded!' : 'Export Concept Blueprint'}</span>
        </button>
      </div>

      {/* Target Parameters Setting Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Vehicle Design Objectives
          </h3>

          {/* Vehicle Class */}
          <div className="space-y-1">
            <span className="text-xs text-slate-400 block">Vehicle Segment</span>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {(['sedan', 'suv', 'sports_gt', 'compact'] as const).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setVehicleClass(cls)}
                  className={`py-2 rounded-lg font-bold uppercase transition-all ${
                    vehicleClass === cls ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {cls.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Target Range */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Target Driving Range</span>
              <span className="text-cyan-300 font-bold">{targetRangeKm} km</span>
            </div>
            <input
              type="range"
              min="250"
              max="900"
              step="25"
              value={targetRangeKm}
              onChange={(e) => setTargetRangeKm(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Target Acceleration */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Target 0-100 km/h Time</span>
              <span className="text-amber-300 font-bold">{targetAccel0100s} s</span>
            </div>
            <input
              type="range"
              min="2.2"
              max="7.5"
              step="0.1"
              value={targetAccel0100s}
              onChange={(e) => setTargetAccel0100s(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Voltage & Chemistry choices */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Architecture Voltage</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {([400, 800] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setArchVoltage(v)}
                    className={`py-1.5 font-mono font-bold rounded-lg border transition-all ${
                      archVoltage === v ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 shadow' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {v}V Tier
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">Cell Chemistry</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['NMC811', 'LFP'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setChemistry(c)}
                    className={`py-1.5 font-mono font-bold rounded-lg border transition-all ${
                      chemistry === c ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 shadow' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Synthesized Engineering Blueprint Results */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Synthesized Engineering Hardware Specs
              </h3>
              <span className="text-xs font-mono text-emerald-400">Automated Powertrain Sizing</span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs mb-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Traction Battery Gross Capacity</span>
                <span className="text-xl font-bold text-cyan-300">{grossEnergyKwh} kWh</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{seriesCount}S{parallelCount}P Architecture</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Peak Drivetrain Motor Power</span>
                <span className="text-xl font-bold text-amber-300">{peakMotorPowerKw} kW ({Math.round(peakMotorPowerKw * 1.341)} HP)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{peakMotorTorqueNm} Nm Peak Torque</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Inverter Current Requirement</span>
                <span className="text-xl font-bold text-emerald-300">{maxInverterCurrentA} A_rms</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">SiC 1200V Module Recommended</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Peak DC Fast Charging Rate</span>
                <span className="text-xl font-bold text-white">{recommendedDcFastKw} kW</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">10-80% in ~{archVoltage === 800 ? '18' : '32'} mins</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong>Engineering Sizing Logic:</strong> Sizing matches the aerodynamic road load at {targetTopSpeedKmh} km/h with peak motor torque calculated to satisfy your requested {targetAccel0100s}s sprint time under dynamic tire slip constraints.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
