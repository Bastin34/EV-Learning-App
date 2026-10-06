import React, { useState } from 'react';
import { ActiveModule, ViewMode, EVTelemetry } from './types/ev';
import { TopNavBar } from './components/navigation/TopNavBar';
import { ModuleSelectorBar } from './components/navigation/ModuleSelectorBar';
import { EVVehicle3D } from './components/ev3d/EVVehicle3D';
import { VehicleCluster } from './components/dashboard/VehicleCluster';
import { BatteryLab } from './components/battery/BatteryLab';
import { BMSLab } from './components/bms/BMSLab';
import { HVArchitectureLab } from './components/hv/HVArchitectureLab';
import { InverterLab } from './components/inverter/InverterLab';
import { MotorLab } from './components/motor/MotorLab';
import { MotorControlLab } from './components/foc/MotorControlLab';
import { RegenLab } from './components/regen/RegenLab';
import { VCULab } from './components/vcu/VCULab';
import { CANBusLab } from './components/can/CANBusLab';
import { ThermalLab } from './components/thermal/ThermalLab';
import { ChargingLab } from './components/charging/ChargingLab';
import { VehicleDynamicsLab } from './components/dynamics/VehicleDynamicsLab';
import { CalculatorsLab } from './components/calculators/CalculatorsLab';
import { EVDesignWorkspace } from './components/designer/EVDesignWorkspace';
import { FaultDiagnosisLab } from './components/faults/FaultDiagnosisLab';
import { VirtualLabTools } from './components/tools/VirtualLabTools';
import { CurriculumLab } from './components/learning/CurriculumLab';
import { AITutorLab } from './components/tutor/AITutorLab';
import { InterviewLab } from './components/interview/InterviewLab';
import { ProjectsLab } from './components/projects/ProjectsLab';
import { SafetyLab } from './components/safety/SafetyLab';
import { ProgressDashboard } from './components/progress/ProgressDashboard';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('3d_vehicle');
  const [viewMode, setViewMode] = useState<ViewMode>('exterior');

  // Synchronized Master EV Digital Twin Telemetry State
  const [telemetry, setTelemetry] = useState<EVTelemetry>({
    speedKmh: 0,
    motorRpm: 0,
    motorTorqueNm: 0,
    motorPowerKw: 0,
    motorTempC: 38.5,
    inverterTempC: 35.2,
    inverterEfficiency: 0.988,
    batterySoc: 84.0,
    batteryVoltageV: 724.8,
    batteryCurrentA: 0.8, // Parasitic LV DC/DC quiescent
    batteryPowerKw: 0.6,
    batteryTempC: 28.4,
    batterySoh: 98.5,
    gear: 'P',
    driveMode: 'Normal',
    acceleratorPct: 0,
    brakePct: 0,
    regenPowerKw: 0,
    coolantFlowLpm: 18.5,
    coolantTempC: 26.8,
    hvReady: false,
    isolationResistanceKOhm: 850,
    dcLinkVoltageV: 0,
    aux12vVoltageV: 13.82,
    odometerKm: 1420.5,
    rangeKm: 524,
  });

  const handleUpdateTelemetry = (partial: Partial<EVTelemetry>) => {
    setTelemetry((prev) => ({ ...prev, ...partial }));
  };

  const handleToggleHv = () => {
    handleUpdateTelemetry({
      hvReady: !telemetry.hvReady,
      dcLinkVoltageV: telemetry.hvReady ? 0 : telemetry.batteryVoltageV,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar Navigation (Strict 3-zone contract) */}
      <TopNavBar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        hvReady={telemetry.hvReady}
        onToggleHv={handleToggleHv}
        batterySoc={telemetry.batterySoc}
      />

      {/* 24-Module Switching Ribbon */}
      <ModuleSelectorBar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Module View: 3D Vehicle Digital Twin */}
        {activeModule === '3d_vehicle' && (
          <div className="space-y-6">
            <div className="h-[620px] w-full">
              <EVVehicle3D
                telemetry={telemetry}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
            {/* Real-time cockpit dashboard docked beneath 3D twin */}
            <VehicleCluster
              telemetry={telemetry}
              onUpdateTelemetry={handleUpdateTelemetry}
              onNavigateToModule={(mod) => setActiveModule(mod as ActiveModule)}
            />
          </div>
        )}

        {/* Module View: Real-time Cockpit Cluster */}
        {activeModule === 'dashboard' && (
          <VehicleCluster
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
            onNavigateToModule={(mod) => setActiveModule(mod as ActiveModule)}
          />
        )}

        {/* Module View: Battery Pack & Cell Electrochemistry */}
        {activeModule === 'battery' && (
          <BatteryLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: BMS Simulator */}
        {activeModule === 'bms' && (
          <BMSLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: HV Architecture & Pre-Charge Contactor Sequencing */}
        {activeModule === 'hv_architecture' && (
          <HVArchitectureLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: SiC 3-Phase Inverter Lab */}
        {activeModule === 'inverter' && (
          <InverterLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: PMSM Motor Lab */}
        {activeModule === 'motor' && (
          <MotorLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: FOC Vector Control & SVPWM */}
        {activeModule === 'motor_control' && (
          <MotorControlLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: Regenerative Braking Simulator */}
        {activeModule === 'regen' && (
          <RegenLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: Vehicle Control Unit (VCU) */}
        {activeModule === 'vcu' && (
          <VCULab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: CAN Bus Network Simulator & Packet Sniffer */}
        {activeModule === 'can_network' && (
          <CANBusLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: Thermal Management Digital Twin */}
        {activeModule === 'thermal' && (
          <ThermalLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: Charging Systems Lab */}
        {activeModule === 'charging' && (
          <ChargingLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: Vehicle Longitudinal Dynamics */}
        {activeModule === 'dynamics' && (
          <VehicleDynamicsLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: Engineering Calculators */}
        {activeModule === 'calculators' && <CalculatorsLab />}

        {/* Module View: EV Design Studio */}
        {activeModule === 'designer' && <EVDesignWorkspace />}

        {/* Module View: Fault Diagnosis & Troubleshooting Lab */}
        {activeModule === 'fault_lab' && <FaultDiagnosisLab />}

        {/* Module View: Virtual Multimeter & Digital Storage Oscilloscope */}
        {activeModule === 'virtual_tools' && (
          <VirtualLabTools
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: High-Voltage Safety, HVIL & Pyrofuse */}
        {activeModule === 'safety' && (
          <SafetyLab
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
          />
        )}

        {/* Module View: Structured Curriculum */}
        {activeModule === 'curriculum' && <CurriculumLab />}

        {/* Module View: AI EV Engineering Tutor */}
        {activeModule === 'ai_tutor' && <AITutorLab />}

        {/* Module View: Technical Interview Simulator */}
        {activeModule === 'interview' && <InterviewLab />}

        {/* Module View: Capstone Projects */}
        {activeModule === 'projects' && <ProjectsLab />}

        {/* Module View: Competency Matrix & Skill Map */}
        {activeModule === 'progress' && <ProgressDashboard />}
      </main>

      {/* Minimal clean footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        VOLTX EV Virtual Laboratory & Simulation Twin · ISO 26262 ASIL-D Compliant Architecture
      </footer>
    </div>
  );
}
