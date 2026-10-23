import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Stethoscope, Shield, HeartPulse, Activity } from 'lucide-react';

const roleConfig = {
  admin: {
    label: 'Administrator',
    Icon: Shield,
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    avatarBg: 'bg-amber-600 text-white',
  },
  doctor: {
    label: 'Physician',
    Icon: Stethoscope,
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatarBg: 'bg-emerald-600 text-white',
  },
  nurse: {
    label: 'Nurse',
    Icon: HeartPulse,
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    avatarBg: 'bg-blue-600 text-white',
  },
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const cfg = user ? (roleConfig[user.role] || roleConfig.admin) : null;
  const RoleIcon = cfg?.Icon;

  const cleanName = user?.name
    ?.replace(/ \(Admin\)| \(Doctor\)| \(Nurse\)/g, '');

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-white border-b border-slate-200 flex items-center justify-between px-5 shadow-xs">
      {/* Brand mark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-600 text-white shadow-xs">
          <Activity className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-slate-900 font-bold text-base tracking-tight">VirusCare</span>
          <span className="text-slate-500 text-[10px] tracking-wider uppercase font-semibold">Hospital Management</span>
        </div>
        <div className="hidden sm:block ml-3 h-4 border-l border-slate-300" />
        <span className="hidden sm:inline text-slate-500 text-xs font-medium">
          Quarantine &amp; Treatment Facility · 74 Bed Unit
        </span>
      </div>

      {/* Right — session info */}
      {user && cfg && (
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Role + Name Pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg.badgeBg}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${cfg.avatarBg}`}>
              <RoleIcon className="h-3 w-3" />
            </div>
            <div className="leading-tight text-left">
              <span className="font-bold">{cleanName}</span>
              <span className="text-[10px] uppercase font-semibold opacity-75 block">({cfg.label})</span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
