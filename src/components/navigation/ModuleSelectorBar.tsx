import React from 'react';
import { ActiveModule } from '../../types/ev';
import {
  Layers,
  Gauge,
  Battery,
  Cpu,
  Zap,
  RotateCw,
  Compass,
  TrendingDown,
  Radio,
  Thermometer,
  BatteryCharging,
  Calculator,
  Wrench,
  Activity,
  BookOpen,
  Sparkles,
  Award,
  FileText,
  ShieldCheck,
  BarChart3
} from 'lucide-react';

interface ModuleSelectorBarProps {
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
}

export const ModuleSelectorBar: React.FC<ModuleSelectorBarProps> = ({
  activeModule,
  onSelectModule,
}) => {
  const modules: { id: ActiveModule; label: string; icon: any; category: string }[] = [
    { id: '3d_vehicle', label: '3D Vehicle Twin', icon: Layers, category: 'Twin' },
    { id: 'dashboard', label: 'Cockpit Cluster', icon: Gauge, category: 'Twin' },

    { id: 'battery', label: 'Battery Pack', icon: Battery, category: 'Energy' },
    { id: 'bms', label: 'BMS Simulator', icon: Cpu, category: 'Energy' },
    { id: 'charging', label: 'Charging Lab', icon: BatteryCharging, category: 'Energy' },

    { id: 'hv_architecture', label: 'HV & Pre-charge', icon: Zap, category: 'Powertrain' },
    { id: 'inverter', label: 'SiC Inverter', icon: Activity, category: 'Powertrain' },
    { id: 'motor', label: 'PMSM Motor', icon: RotateCw, category: 'Powertrain' },
    { id: 'motor_control', label: 'FOC Vector Control', icon: Compass, category: 'Powertrain' },
    { id: 'regen', label: 'Regenerative Brake', icon: TrendingDown, category: 'Powertrain' },

    { id: 'vcu', label: 'VCU Logic', icon: Cpu, category: 'Vehicle' },
    { id: 'can_network', label: 'CAN Bus Lab', icon: Radio, category: 'Vehicle' },
    { id: 'thermal', label: 'Thermal TMS', icon: Thermometer, category: 'Vehicle' },
    { id: 'dynamics', label: 'Vehicle Dynamics', icon: Gauge, category: 'Vehicle' },

    { id: 'calculators', label: 'Calculators', icon: Calculator, category: 'Tools' },
    { id: 'designer', label: 'EV Design Studio', icon: Wrench, category: 'Tools' },
    { id: 'virtual_tools', label: 'Multimeter & DSO', icon: Activity, category: 'Tools' },
    { id: 'fault_lab', label: 'Fault Diagnosis', icon: ShieldCheck, category: 'Tools' },
    { id: 'safety', label: 'Safety & HVIL', icon: ShieldCheck, category: 'Tools' },

    { id: 'curriculum', label: 'Curriculum', icon: BookOpen, category: 'Learn' },
    { id: 'ai_tutor', label: 'AI Tutor', icon: Sparkles, category: 'Learn' },
    { id: 'interview', label: 'Interview Prep', icon: Award, category: 'Learn' },
    { id: 'projects', label: 'Capstone Projects', icon: FileText, category: 'Learn' },
    { id: 'progress', label: 'Skill Map', icon: BarChart3, category: 'Learn' },
  ];

  return (
    <div className="w-full bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1.5 min-w-max">
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectModule(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
