import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Stethoscope, HeartPulse, RefreshCw } from 'lucide-react';

const DemoRoleSwitcher = ({ compact = false }) => {
  const { role, demoLogin, loading } = useAuth();
  const [switching, setSwitching] = useState(false);

  const roles = [
    { id: 'admin', label: 'Admin', icon: Shield, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'nurse', label: 'Nurse', icon: HeartPulse, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ];

  const handleSwitch = async (targetRole) => {
    if (targetRole === role || switching) return;
    try {
      setSwitching(true);
      await demoLogin(targetRole);
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    } finally {
      setSwitching(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <span className="text-[10px] font-semibold text-slate-500 uppercase px-1.5 hidden sm:inline">
          Demo:
        </span>
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleSwitch(r.id)}
              disabled={switching}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={`Switch role to ${r.label}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Demo Role Quick Switcher
          </span>
        </div>
        <span className="text-[11px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
          Demo Auth (Not for Production)
        </span>
      </div>
      <p className="text-xs text-amber-700 mb-3">
        Switch directly between staff personas to test role-specific workflows (Admin admission & discharge, Nurse temperature checks, Doctor rounds).
      </p>
      <div className="grid grid-cols-3 gap-2">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleSwitch(r.id)}
              disabled={switching}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition ${
                isActive
                  ? 'bg-white border-amber-500 text-amber-900 shadow-sm ring-2 ring-amber-300/50'
                  : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{r.label}</span>
              {isActive && (
                <span className="mt-1 text-[10px] text-emerald-600 font-semibold">Active</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoRoleSwitcher;
