import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Stethoscope, Shield, HeartPulse, Activity, Menu, X } from 'lucide-react';

const roleConfig = {
  admin: {
    label: 'Admin',
    Icon: Shield,
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    avatarBg: 'bg-amber-600 text-white',
  },
  doctor: {
    label: 'Doctor',
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

const Navbar = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const cfg = user ? (roleConfig[user.role] || roleConfig.admin) : null;
  const RoleIcon = cfg?.Icon;

  const cleanName = user?.name
    ?.replace(/ \(Admin\)| \(Doctor\)| \(Nurse\)/g, '');

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-5 shadow-xs">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {user && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation drawer"
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <Menu className="w-5 h-5 text-slate-800" />
            )}
          </button>
        )}

        <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-teal-600 text-white shadow-xs">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-slate-900 font-bold text-base sm:text-lg tracking-tight font-display">VirusCare</span>
          <span className="text-slate-500 text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold">Hospital Portal</span>
        </div>
        <div className="hidden lg:block ml-3 h-4 border-l border-slate-300" />
        <span className="hidden lg:inline text-slate-500 text-xs font-medium">
          Quarantine &amp; Treatment Facility · 74 Bed Unit
        </span>
      </div>

      {/* Right — session info */}
      {user && cfg && (
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role + Name Pill */}
          <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-xs font-semibold ${cfg.badgeBg}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${cfg.avatarBg}`}>
              <RoleIcon className="h-3 w-3" />
            </div>
            <div className="leading-tight text-left">
              <span className="font-bold text-[11px] sm:text-xs truncate max-w-[85px] sm:max-w-none block">
                {cleanName}
              </span>
              <span className="text-[9px] uppercase font-semibold opacity-75 hidden sm:block">
                ({cfg.label})
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition cursor-pointer"
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
