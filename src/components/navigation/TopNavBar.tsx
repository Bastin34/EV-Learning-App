import React from 'react';
import { ActiveModule } from '../../types/ev';
import {
  Sparkles,
  Power,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

interface TopNavBarProps {
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  hvReady: boolean;
  onToggleHv: () => void;
  batterySoc: number;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeModule,
  onSelectModule,
  hvReady,
  onToggleHv,
  batterySoc
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (4-6 Links) - Zone 3 (1-2 Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title, single text element */}
        <div
          onClick={() => onSelectModule('3d_vehicle')}
          className="text-lg font-extrabold tracking-tight text-white cursor-pointer select-none flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>VOLTX</span>
        </div>

        {/* Zone 2: 4-6 Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
          {[
            { id: '3d_vehicle', label: '3D Vehicle Twin' },
            { id: 'dashboard', label: 'Cockpit' },
            { id: 'battery', label: 'Battery Lab' },
            { id: 'bms', label: 'BMS' },
            { id: 'hv_architecture', label: 'HV & Pre-Charge' },
            { id: 'inverter', label: 'Inverter' },
            { id: 'motor', label: 'Motor' },
          ].map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id as ActiveModule)}
                className={`transition-colors py-1 relative ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 Primary actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>SOC {batterySoc.toFixed(0)}%</span>
          </div>

          <button
            onClick={() => onSelectModule('ai_tutor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeModule === 'ai_tutor'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tutor</span>
          </button>
        </div>
      </div>
    </header>
  );
};
