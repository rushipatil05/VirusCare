import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Thermometer, Stethoscope,
  CheckCircle2, BarChart3, FileText, HeartPulse, Shield, Info,
} from 'lucide-react';

const navByRole = {
  admin: [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Patients', to: '/patients', icon: Users },
    { name: 'Discharges', to: '/discharges', icon: CheckCircle2 },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Audit Logs', to: '/audit-logs', icon: FileText },
  ],
  doctor: [
    { name: 'My Rounds', to: '/', icon: Stethoscope },
    { name: 'Doctor Visits', to: '/doctor-visits', icon: Stethoscope },
    { name: 'Patient Records', to: '/patients', icon: Users },
  ],
  nurse: [
    { name: 'My Tasks', to: '/', icon: HeartPulse },
    { name: 'Temperature Records', to: '/temperatures', icon: Thermometer },
    { name: 'Patient List', to: '/patients', icon: Users },
  ],
};

const permissionsByRole = {
  admin: [
    'Register & admit patients',
    'Assign & release rooms',
    'Confirm discharges',
    'Mark deceased outcomes',
    'View analytics & audit trail',
    'Adjust fever threshold',
  ],
  doctor: [
    'Conduct daily doctor rounds',
    'Record clinical observations',
    'View patient fever history',
    'View temperature trends',
  ],
  nurse: [
    'Record daily temperatures',
    'Submit audited corrections',
    'View admitted patient list',
  ],
};

const roleStyles = {
  admin: {
    label: 'Admin Panel',
    tagBg: 'bg-amber-100 text-amber-900 border-amber-300',
    activeBorder: 'border-amber-600',
    activeText: 'text-amber-950 font-bold bg-amber-50/80',
    activeIcon: 'text-amber-700',
  },
  doctor: {
    label: 'Physician Portal',
    tagBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    activeBorder: 'border-emerald-600',
    activeText: 'text-emerald-950 font-bold bg-emerald-50/80',
    activeIcon: 'text-emerald-700',
  },
  nurse: {
    label: 'Nurse Station',
    tagBg: 'bg-blue-100 text-blue-900 border-blue-300',
    activeBorder: 'border-blue-600',
    activeText: 'text-blue-950 font-bold bg-blue-50/80',
    activeIcon: 'text-blue-700',
  },
};

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'nurse';
  const navItems = navByRole[role] || [];
  const style = roleStyles[role] || roleStyles.nurse;
  const perms = permissionsByRole[role] || [];

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-3.5rem)] flex flex-col justify-between py-5">
      {/* Role tag */}
      <div className="px-4 space-y-4">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider ${style.tagBg}`}>
          <span>{style.label}</span>
        </div>

        {/* Nav links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to + item.name}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? `${style.activeText} border-l-4 ${style.activeBorder} shadow-xs`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? style.activeIcon : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Permissions / Role capabilities card */}
      <div className="mx-4 mt-6 border border-slate-200 rounded-lg p-3.5 bg-slate-50 text-xs space-y-2">
        <div className="text-slate-800 font-bold flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-600" />
          <span>Role Capabilities</span>
        </div>
        <div className="space-y-1">
          {perms.map((p, i) => (
            <div key={i} className="flex items-start gap-1.5 text-slate-600 leading-tight">
              <span className="text-slate-400 font-bold">›</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
