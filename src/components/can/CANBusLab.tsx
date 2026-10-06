import React, { useState, useEffect } from 'react';
import { EVTelemetry, CANFrame } from '../../types/ev';
import {
  Radio,
  Activity,
  Layers,
  Zap,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';

interface CANBusLabProps {
  telemetry: EVTelemetry;
  onUpdateTelemetry: (partial: Partial<EVTelemetry>) => void;
}

export const CANBusLab: React.FC<CANBusLabProps> = ({ telemetry, onUpdateTelemetry }) => {
  const [frames, setFrames] = useState<CANFrame[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [selectedFrame, setSelectedFrame] = useState<CANFrame | null>(null);

  // CAN physical layer fault injection
  const [canFault, setCanFault] = useState<
    'normal' | 'canh_short_gnd' | 'canh_short_12v' | 'missing_term_resistor' | 'bus_off'
  >('normal');

  // Generate live realistic CAN frames streaming
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      interval = setInterval(() => {
        const now = Date.now();
        const voltHex = Math.round(telemetry.batteryVoltageV * 10).toString(16).padStart(4, '0').toUpperCase();
        const curHex = Math.round((telemetry.batteryCurrentA + 500) * 10).toString(16).padStart(4, '0').toUpperCase();
        const socHex = Math.round(telemetry.batterySoc).toString(16).padStart(2, '0').toUpperCase();
        const rpmHex = Math.round(telemetry.motorRpm).toString(16).padStart(4, '0').toUpperCase();
        const torqueHex = Math.round(telemetry.motorTorqueNm + 500).toString(16).padStart(4, '0').toUpperCase();

        const framePool: CANFrame[] = [
          {
            id: '0x180',
            node: 'BMS_Master',
            dlc: 8,
            data: [voltHex.slice(0, 2), voltHex.slice(2, 4), curHex.slice(0, 2), curHex.slice(2, 4), socHex, '1C', '00', '00'],
            signals: [
              { name: 'Battery_Voltage', value: telemetry.batteryVoltageV.toFixed(1), unit: 'V' },
              { name: 'Battery_Current', value: telemetry.batteryCurrentA.toFixed(1), unit: 'A' },
              { name: 'State_Of_Charge', value: telemetry.batterySoc.toFixed(0), unit: '%' },
              { name: 'Max_Cell_Temp', value: telemetry.batteryTempC.toFixed(0), unit: '°C' },
            ],
            timestamp: now,
            status: canFault === 'normal' ? 'ok' : 'error',
          },
          {
            id: '0x240',
            node: 'Inverter_MCU',
            dlc: 8,
            data: [rpmHex.slice(0, 2), rpmHex.slice(2, 4), torqueHex.slice(0, 2), torqueHex.slice(2, 4), '28', '01', '00', 'AA'],
            signals: [
              { name: 'Motor_Speed', value: telemetry.motorRpm, unit: 'RPM' },
              { name: 'Motor_Torque', value: telemetry.motorTorqueNm, unit: 'Nm' },
              { name: 'Inverter_Temp', value: telemetry.inverterTempC.toFixed(0), unit: '°C' },
              { name: 'Inverter_State', value: telemetry.hvReady ? 'RUN' : 'STOP', unit: '' },
            ],
            timestamp: now + 5,
            status: canFault === 'normal' ? 'ok' : 'error',
          },
          {
            id: '0x0C0',
            node: 'VCU_Gateway',
            dlc: 8,
            data: ['03', telemetry.gear === 'D' ? '04' : '01', '55', '00', '00', '00', '00', '12'],
            signals: [
              { name: 'Driver_Gear_Request', value: telemetry.gear, unit: '' },
              { name: 'Vehicle_Speed', value: telemetry.speedKmh.toFixed(1), unit: 'km/h' },
              { name: 'Brake_Pedal_Status', value: telemetry.regenPowerKw > 0 ? 'ACTIVE' : 'IDLE', unit: '' },
            ],
            timestamp: now + 10,
            status: canFault === 'normal' ? 'ok' : 'error',
          },
          {
            id: '0x320',
            node: 'OBC_Charger',
            dlc: 8,
            data: ['00', '00', '00', '00', '00', '00', '00', '00'],
            signals: [
              { name: 'Charging_State', value: 'DISCONNECTED', unit: '' },
              { name: 'Grid_AC_Voltage', value: 0, unit: 'V' },
              { name: 'Charge_Current_Limit', value: 32, unit: 'A' },
            ],
            timestamp: now + 15,
            status: canFault === 'normal' ? 'ok' : 'error',
          },
        ];

        setFrames((prev) => [...framePool, ...prev].slice(0, 40));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isStreaming, canFault, telemetry]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">CAN Bus Network Simulator & Packet Sniffer</h2>
            <p className="text-xs text-slate-400">
              High-speed CAN 2.0B / CAN-FD packet telemetry, differential voltage physical layer & fault injection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isStreaming
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow'
            }`}
          >
            {isStreaming ? 'PAUSE CAPTURE' : 'RESUME CAPTURE'}
          </button>
          <button
            onClick={() => setFrames([])}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Clear Buffer
          </button>
        </div>
      </div>

      {/* CAN Physical Layer Voltages (CAN-H vs CAN-L) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
              Physical Layer Differential Voltages
            </span>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">CAN-High (Dominant / Recessive)</span>
                <span className="text-cyan-300 font-bold">
                  {canFault === 'canh_short_gnd' ? '0.0 V (SHORT)' : canFault === 'canh_short_12v' ? '12.4 V (SHORT)' : '3.5 V / 2.5 V'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">CAN-Low (Dominant / Recessive)</span>
                <span className="text-amber-300 font-bold">1.5 V / 2.5 V</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Differential Voltage (V_diff)</span>
                <span className="text-emerald-300 font-bold">
                  {canFault === 'normal' ? '2.0 V (Dominant bit)' : '0.0 V (BUS ERROR)'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Bus Resistance (R_bus)</span>
                <span className="text-slate-200 font-bold">
                  {canFault === 'missing_term_resistor' ? '120.0 Ω (Missing Resistor!)' : '60.0 Ω (2x 120Ω Parallel)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fault Injector Panel */}
        <div className="md:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> CAN Bus Fault Injector
              </span>
              <span className="text-xs font-mono text-cyan-300">ISO 11898 Standard</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Inject wiring harness failures to evaluate error counters (TEC/REC) and observe how modern automotive microcontrollers transition into Bus-Off quarantine.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setCanFault('normal')}
                className={`p-2.5 rounded-xl border font-semibold transition-all ${
                  canFault === 'normal'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Normal (500 kbps OK)
              </button>
              <button
                onClick={() => setCanFault('canh_short_gnd')}
                className={`p-2.5 rounded-xl border font-semibold transition-all ${
                  canFault === 'canh_short_gnd'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                CAN-H Short to GND
              </button>
              <button
                onClick={() => setCanFault('canh_short_12v')}
                className={`p-2.5 rounded-xl border font-semibold transition-all ${
                  canFault === 'canh_short_12v'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                CAN-H Short to 12V
              </button>
              <button
                onClick={() => setCanFault('missing_term_resistor')}
                className={`p-2.5 rounded-xl border font-semibold transition-all ${
                  canFault === 'missing_term_resistor'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Missing 120Ω Terminator
              </button>
              <button
                onClick={() => setCanFault('bus_off')}
                className={`p-2.5 rounded-xl border font-semibold transition-all ${
                  canFault === 'bus_off'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Trigger Bus-Off State
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time CAN Frame Telemetry Sniffer Table */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Live CAN Frame Packet Sniffer Buffer
          </span>
          <span className="text-xs font-mono text-slate-400">Showing {frames.length} captured frames</span>
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">CAN ID</th>
                <th className="p-3">Transmitter ECU</th>
                <th className="p-3">DLC</th>
                <th className="p-3">Raw Payload Data (Hex)</th>
                <th className="p-3">Decoded Physical Signals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {frames.slice(0, 10).map((frame, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedFrame(frame)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-3 text-cyan-400 font-bold">{frame.id}</td>
                  <td className="p-3 text-slate-300 font-semibold">{frame.node}</td>
                  <td className="p-3 text-slate-400">{frame.dlc}</td>
                  <td className="p-3 text-amber-300 font-bold space-x-1">
                    {frame.data.map((b, bIdx) => (
                      <span key={bIdx}>{b}</span>
                    ))}
                  </td>
                  <td className="p-3 text-slate-300">
                    {frame.signals.map((s, sIdx) => (
                      <span key={sIdx} className="mr-3">
                        <span className="text-slate-500">{s.name}:</span>{' '}
                        <span className="text-emerald-400 font-bold">
                          {s.value} {s.unit}
                        </span>
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
