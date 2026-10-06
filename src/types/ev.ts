export type ViewMode = 
  | 'exterior'
  | 'interior'
  | 'underbody'
  | 'xray'
  | 'electrical'
  | 'thermal'
  | 'can'
  | 'drivetrain'
  | 'battery_exploded';

export type ActiveModule =
  | '3d_vehicle'
  | 'dashboard'
  | 'battery'
  | 'bms'
  | 'hv_architecture'
  | 'precharge'
  | 'inverter'
  | 'motor'
  | 'motor_control'
  | 'regen'
  | 'vcu'
  | 'can_network'
  | 'thermal'
  | 'charging'
  | 'dynamics'
  | 'calculators'
  | 'designer'
  | 'fault_lab'
  | 'virtual_tools'
  | 'curriculum'
  | 'ai_tutor'
  | 'interview'
  | 'projects'
  | 'safety'
  | 'progress';

export interface EVTelemetry {
  speedKmh: number;
  motorRpm: number;
  motorTorqueNm: number;
  motorPowerKw: number;
  motorTempC: number;
  inverterTempC: number;
  inverterEfficiency: number;
  batterySoc: number; // 0 - 100%
  batteryVoltageV: number;
  batteryCurrentA: number;
  batteryPowerKw: number;
  batteryTempC: number;
  batterySoh: number; // 0 - 100%
  gear: 'P' | 'R' | 'N' | 'D';
  driveMode: 'Eco' | 'Normal' | 'Sport' | 'Ludicrous';
  acceleratorPct: number; // 0 - 100%
  brakePct: number; // 0 - 100%
  regenPowerKw: number;
  coolantFlowLpm: number;
  coolantTempC: number;
  hvReady: boolean;
  isolationResistanceKOhm: number;
  dcLinkVoltageV: number;
  aux12vVoltageV: number;
  odometerKm: number;
  rangeKm: number;
}

export interface EVComponentInfo {
  id: string;
  name: string;
  category: 'energy' | 'powertrain' | 'control' | 'thermal' | 'safety';
  description: string;
  voltageRating: string;
  peakPower?: string;
  massKg: number;
  operatingTempRange: string;
  coolingMethod: string;
  principles: string[];
  specs: Record<string, string | number>;
  failureModes: string[];
}

export interface CANFrame {
  id: string; // e.g. "0x180"
  node: string; // e.g. "BMS"
  dlc: number; // Data Length Code (usually 8)
  data: string[]; // e.g. ["42", "01", "A8", ...]
  signals: { name: string; value: string | number; unit: string }[];
  timestamp: number; // ms
  status: 'ok' | 'warning' | 'error';
}

export interface FaultScenario {
  id: string;
  title: string;
  severity: 'Warning' | 'Critical Shutdown' | 'Limp Mode';
  subsystem: 'HV Battery' | 'Pre-charge' | 'Inverter' | 'Motor' | 'CAN Bus' | 'Thermal' | 'Isolation';
  symptoms: string[];
  dtcCodes: string[];
  multimeterReadings: { probeLocation: string; reading: string; expected: string }[];
  canDataLog: string[];
  possibleCauses: string[];
  correctCauseIndex: number;
  troubleshootingSteps: string[];
  engineeringExplanation: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'Battery & BMS' | 'Power Electronics' | 'Motor & Control' | 'HV Architecture' | 'CAN & VCU' | 'Thermal & Safety';
  level: 'Entry' | 'Mid' | 'Senior / Principal';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  oemReference?: string; // e.g. "Tesla Powertrain Interview", "Lucid Motors Battery Engineer"
}

export interface CurriculumTopic {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  estimatedMinutes: number;
  description: string;
  keyLearningObjectives: string[];
  equations?: { formula: string; description: string }[];
  practicalExercise: string;
}

export interface ProjectBrief {
  id: string;
  title: string;
  difficulty: 'Undergraduate' | 'Final Year' | 'Industry Prototype';
  targetDomain: string;
  problemStatement: string;
  architectureComponents: string[];
  simulationObjectives: string[];
  specsToVerify: { parameter: string; target: string; measured: string; pass: boolean }[];
}
