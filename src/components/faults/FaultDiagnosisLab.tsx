import React, { useState } from 'react';
import { FaultScenario } from '../../types/ev';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Wrench,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info
} from 'lucide-react';

export const FAULT_SCENARIOS: FaultScenario[] = [
  {
    id: 'fault_1',
    title: 'Vehicle Fails to Enter READY Mode (Startup Timeout)',
    severity: 'Critical Shutdown',
    subsystem: 'Pre-charge',
    symptoms: [
      'Dashboard displays "Powertrain System Error - Pull Over Safely".',
      'Audible pre-charge relay click heard, but main contactor fails to close.',
      'Vehicle remains in Park and cannot shift to Drive.',
    ],
    dtcCodes: ['P0AE6 - Pre-charge Contactor Circuit Malfunction', 'P0A0F - Engine / Motor Failed to Start'],
    multimeterReadings: [
      { probeLocation: '12V Auxiliary Battery Terminals', reading: '12.6 V', expected: '12.4V - 12.8V' },
      { probeLocation: 'Pre-charge Resistor Terminals (R_pre)', reading: 'Open Loop (OL / ∞ Ω)', expected: '33.0 Ω ± 5%' },
      { probeLocation: 'Inverter DC-Link Bus after 400ms', reading: '1.2 V', expected: '> 680.0 V' },
    ],
    canDataLog: [
      'CAN ID 0x185 [VCU_Status]: Pre-charge Initiated, Target Voltage: 720V',
      'CAN ID 0x180 [BMS_Pack]: Contactor Neg: CLOSED, Pre-charge Relay: CLOSED',
      'CAN ID 0x240 [Inverter_Status]: Bus Voltage: 1.2V (TIMEOUT 500ms EXPIRED)',
      'CAN ID 0x0C0 [VCU_Fault]: EMERGENCY SHUTDOWN COMMAND SENT',
    ],
    possibleCauses: [
      'Pre-charge resistor has burned open (infinite resistance), preventing capacitor inrush charging.',
      'The 12V auxiliary lead-acid battery is completely drained.',
      'Rotor permanent magnets have demagnetized.',
      'Tire pressure monitoring sensor is faulty.',
    ],
    correctCauseIndex: 0,
    troubleshootingSteps: [
      'Disconnect High-Voltage Manual Service Disconnect (MSD) and verify 0V with calibrated HV probe.',
      'Measure resistance across the 33 Ω pre-charge resistor located in the HVJB.',
      'Inspect for physical ceramic crack or thermal discoloration on the resistor casing.',
      'Replace the burned out 33 Ω wirewound resistor and inspect inverter DC bus for short circuits.',
    ],
    engineeringExplanation:
      'Because the pre-charge resistor blew open, zero current could flow into the 920 µF DC-link capacitor. The BMS timer measured |V_pack - V_dclink| > 20V after 500ms, correctly identifying a pre-charge failure and aborting startup to prevent welding the main positive contactor.',
  },
  {
    id: 'fault_2',
    title: 'High-Voltage Isolation Breakdown (UN ECE R100 Fault)',
    severity: 'Critical Shutdown',
    subsystem: 'Isolation',
    symptoms: [
      'High Voltage Isolation Warning light illuminated on instrument cluster.',
      'DC fast charging immediately terminates after cable lock.',
      'BMS refuses to close contactors upon vehicle key-on.',
    ],
    dtcCodes: ['P0AA6 - Hybrid / EV Battery Voltage System Isolation Fault', 'P0A0A - High Voltage System Interlock Circuit'],
    multimeterReadings: [
      { probeLocation: 'HV Positive Terminal to Chassis Ground', reading: '42 kΩ', expected: '> 500 kΩ (> 500 Ω/V)' },
      { probeLocation: 'HV Negative Terminal to Chassis Ground', reading: '850 kΩ', expected: '> 500 kΩ' },
      { probeLocation: 'Battery Cold Plate Coolant Cavity', reading: 'Moisture Detected', expected: 'Dry Sealed Cavity' },
    ],
    canDataLog: [
      'CAN ID 0x180 [BMS_Iso]: Flying Cap Voltage: 184V (Isolation Resistance: 42 kΩ)',
      'CAN ID 0x180 [BMS_Iso]: ASIL-D Isolation Fault Threshold Tripped (< 500 Ω/V)',
      'CAN ID 0x0C0 [VCU_Supervisor]: HV Interlock Trip - Contactors Inhibited',
    ],
    possibleCauses: [
      'Coolant leakage into battery pack tray creating a conductive bridge between the 800V busbar and chassis ground.',
      'The AC compressor belt snapped.',
      'Brake pads are worn down to the wear indicator.',
      'CAN bus termination resistor missing.',
    ],
    correctCauseIndex: 0,
    troubleshootingSteps: [
      'Depower high-voltage system per SAE J1766 lock-out / tag-out protocol.',
      'Perform Megohmmeter (Hi-Pot) insulation test at 1000V DC on isolated sub-circuits.',
      'Inspect battery pack lower tray for ethylene glycol coolant pooling.',
      'Pressure test the aluminum cold plate at 2.0 bar to locate plate fissure.',
    ],
    engineeringExplanation:
      'UN ECE R100 requires at least 500 Ω per Volt of isolation resistance (400 kΩ for an 800V system). A coolant leak inside the pack floor provided an ionic conductive path between the positive HV bus and the grounded vehicle chassis, dropping isolation to 42 kΩ and presenting an electrocution hazard.',
  },
  {
    id: 'fault_3',
    title: 'Main Positive Contactor Welded Closed',
    severity: 'Warning',
    subsystem: 'HV Battery',
    symptoms: [
      'Vehicle drives normally, but warning alert triggers when switching vehicle OFF.',
      'High-voltage remains present on the inverter DC-bus even after vehicle is powered down.',
      'Warning: "HV Contactor Stuck - Do Not Disconnect Battery".',
    ],
    dtcCodes: ['P0AA1 - Hybrid Battery Positive Contactor Stuck Closed', 'P0A0C - High Voltage System Interlock Circuit Low'],
    multimeterReadings: [
      { probeLocation: 'Contactor (+) Coil Command Voltage', reading: '0.0 V (OFF)', expected: '0.0 V (OFF)' },
      { probeLocation: 'Contactor (+) Aux Microswitch Feedback', reading: 'CLOSED (Continuity)', expected: 'OPEN (No Continuity)' },
      { probeLocation: 'Voltage across Contactor (+) Main Terminals', reading: '0.0 V (Direct Short)', expected: '> 700 V across open contacts' },
    ],
    canDataLog: [
      'CAN ID 0x180 [BMS]: Contactor (+) Commanded: OPEN',
      'CAN ID 0x180 [BMS]: Aux Feedback Sense: CLOSED (DISCREPANCY)',
      'CAN ID 0x185 [VCU]: Inverter Bus Voltage Remains 720V after Shutdown',
      'CAN ID 0x180 [BMS]: FAULT LATCHED: Contactor Welded!',
    ],
    possibleCauses: [
      'The positive main contactor copper contacts have physically welded together due to an earlier unmitigated inrush arc.',
      'The electric motor has demagnetized.',
      'The windshield wiper motor fuse blown.',
      'The vehicle has run out of battery charge.',
    ],
    correctCauseIndex: 0,
    troubleshootingSteps: [
      'Do NOT attempt to manually separate welded contacts with screwdrivers.',
      'Trip the pyrofuse or pull the Manual Service Disconnect (MSD) to break the series loop.',
      'Replace the high-voltage contactor assembly with new hermetically sealed vacuum relays.',
      'Inspect the pre-charge resistor to determine why inrush current was not adequately damped.',
    ],
    engineeringExplanation:
      'High-voltage contactors feature auxiliary microswitches mechanically tied to the main armature. When the BMS commanded 0V to the coil, the auxiliary contacts remained closed and terminal voltage was 0V, proving the copper pads had melted and welded together.',
  },
];

export const FaultDiagnosisLab: React.FC = () => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [userGuessIndex, setUserGuessIndex] = useState<number | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);

  const scenario = FAULT_SCENARIOS[selectedScenarioIndex];
  const isCorrect = userGuessIndex === scenario.correctCauseIndex;

  const handleSelectScenario = (idx: number) => {
    setSelectedScenarioIndex(idx);
    setUserGuessIndex(null);
    setHasEvaluated(false);
  };

  const handleTestHypothesis = () => {
    if (userGuessIndex !== null) {
      setHasEvaluated(true);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">EV Troubleshooting & Fault Diagnosis Lab</h2>
            <p className="text-xs text-slate-400">
              Interactive OEM fault investigation cases: DTC scan tool, CAN logs & multimeter verification
            </p>
          </div>
        </div>

        {/* Case selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          {FAULT_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(idx)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                selectedScenarioIndex === idx
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Case #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Case Details Banner */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              {scenario.severity}
            </span>
            <span className="text-xs text-slate-400">Subsystem: {scenario.subsystem}</span>
          </div>
          <span className="text-xs font-mono text-cyan-400">DTC: {scenario.dtcCodes[0].split(' - ')[0]}</span>
        </div>

        <h3 className="text-lg font-bold text-white">{scenario.title}</h3>

        {/* Customer Symptoms */}
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
            Customer Symptoms & Warning Messages:
          </span>
          <div className="space-y-1.5">
            {scenario.symptoms.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Measurements & CAN Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virtual Multimeter Readings */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-4">
            Virtual Multimeter Test Point Probes
          </span>
          <div className="space-y-3 font-mono text-xs">
            {scenario.multimeterReadings.map((r, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">{r.probeLocation}</span>
                <div className="flex justify-between items-center">
                  <span className="text-rose-400 font-bold text-sm">Measured: {r.reading}</span>
                  <span className="text-slate-500 text-[11px]">Expected: {r.expected}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic CAN Log */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-4">
            Diagnostic CAN Frame Log During Fault Event
          </span>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
            {scenario.canDataLog.map((log, idx) => (
              <div key={idx} className="border-b border-slate-800/80 pb-1.5 last:border-0 last:pb-0">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Root Cause Diagnosis Decision */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Select Your Root Cause Hypothesis:</h3>

        <div className="space-y-2">
          {scenario.possibleCauses.map((cause, idx) => (
            <div
              key={idx}
              onClick={() => {
                setUserGuessIndex(idx);
                setHasEvaluated(false);
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                userGuessIndex === idx
                  ? 'bg-cyan-500/10 border-cyan-500 text-white font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span>{cause}</span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  userGuessIndex === idx ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                }`}
              >
                {userGuessIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleTestHypothesis}
            disabled={userGuessIndex === null}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-40"
          >
            Submit & Verify Diagnosis
          </button>
        </div>

        {/* Evaluation Feedback */}
        {hasEvaluated && (
          <div
            className={`p-5 rounded-2xl border space-y-3 animate-in fade-in ${
              isCorrect ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-red-950/20 border-red-500/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">Diagnosis Correct! Outstanding Engineering!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-bold text-red-400">Incorrect Diagnosis. Re-examine the multimeter readings.</span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{scenario.engineeringExplanation}</p>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
                Prescribed OEM Repair Procedure:
              </span>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                {scenario.troubleshootingSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
