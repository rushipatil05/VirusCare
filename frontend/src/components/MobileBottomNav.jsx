import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Thermometer, Stethoscope,
  CheckCircle2, BarChart3, HeartPulse, Menu
} from 'lucide-react';

const mobileNavByRole = {
  admin: [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Patients', to: '/patients', icon: Users },
    { name: 'Discharges', to: '/discharges', icon: CheckCircle2 },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  ],
  doctor: [
    { name: 'Rounds', to: '/', icon: Stethoscope },
    { name: 'Visits', to: '/doctor-visits', icon: Stethoscope },
    { name: 'Patients', to: '/patients', icon: Users },
  ],
  nurse: [
    { name: 'Tasks', to: '/', icon: HeartPulse },
    { name: 'Temps', to: '/temperatures', icon: Thermometer },
    { name: 'Patients', to: '/patients', icon: Users },
  ],
};

const MobileBottomNav = ({ onOpenMenu }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role || 'nurse';
  const items = mobileNavByRole[role] || mobileNavByRole.nurse;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around select-none">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to + item.name}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-teal-700 bg-teal-50 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}

      {/* Menu Drawer button */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
