import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  LayoutDashboard, Users, Thermometer, Stethoscope,
  CheckCircle2, BarChart3, FileText, HeartPulse,
  ChevronLeft, ChevronRight, Sliders, Check, X
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

const Sidebar = ({ isMobile = false, onCloseMobile }) => {
  const { user } = useAuth();
  const role = user?.role || 'nurse';
  const navItems = navByRole[role] || [];
  const style = roleStyles[role] || roleStyles.nurse;

  // Sidebar slide collapse state (persisted for desktop)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (isMobile) return false;
    return localStorage.getItem('viruscare_sidebar_collapsed') === 'true';
  });

  // Clinical Fever Threshold Slider state
  const [feverThreshold, setFeverThreshold] = useState(38.0);
  const [initialThreshold, setInitialThreshold] = useState(38.0);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [thresholdSaved, setThresholdSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axiosClient.get('/config');
        if (res.data?.config?.feverThreshold) {
          const val = Number(res.data.config.feverThreshold);
          setFeverThreshold(val);
          setInitialThreshold(val);
        }
      } catch (err) {
        console.error('Failed to load facility config for sidebar slider:', err);
      }
    };
    fetchConfig();
  }, []);

  const toggleSidebar = () => {
    if (isMobile) return;
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('viruscare_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleSaveThreshold = async () => {
    if (role !== 'admin') return;
    try {
      setSavingThreshold(true);
      await axiosClient.put('/config', { feverThreshold: Number(feverThreshold) });
      setInitialThreshold(feverThreshold);
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 2500);
    } catch (err) {
      console.error('Failed to update fever threshold via sidebar slider:', err);
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleLinkClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const collapsedMode = !isMobile && isCollapsed;

  return (
    <aside
      className={`relative flex-shrink-0 bg-white min-h-[calc(100vh-3.5rem)] flex flex-col justify-between py-5 transition-all duration-300 ease-in-out ${
        isMobile
          ? 'w-full h-full border-r-0'
          : `border-r border-slate-200 ${collapsedMode ? 'w-20' : 'w-64'}`
      }`}
    >
      {/* ── Slide Toggle Button on the desktop sidebar border only ── */}
      {!isMobile && (
        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsedMode ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="absolute -right-3.5 top-6 bg-white border border-slate-300 shadow-md rounded-full p-1 hover:bg-slate-50 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 z-30 transition cursor-pointer"
        >
          {collapsedMode ? (
            <ChevronRight className="w-4 h-4 text-slate-700" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          )}
        </button>
      )}

      {/* Top Navigation Links */}
      <div className={`space-y-4 ${collapsedMode ? 'px-2' : 'px-4'}`}>
        {/* Mobile Header with Close Button */}
        {isMobile && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Navigation</span>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Role tag badge */}
        {!collapsedMode ? (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider ${style.tagBg}`}
          >
            <span>{style.label}</span>
          </div>
        ) : (
          <div className="flex justify-center" title={style.label}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase border ${style.tagBg}`}>
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to + item.name}
                to={item.to}
                end={item.to === '/'}
                onClick={handleLinkClick}
                title={collapsedMode ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    collapsedMode ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? `${style.activeText} border-l-4 ${style.activeBorder} shadow-xs`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? style.activeIcon : 'text-slate-500'}`} />
                    {!collapsedMode && <span className="truncate">{item.name}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ── Interactive Slider Widget in Sidebar ── */}
      <div className={`${collapsedMode ? 'px-2' : 'px-4'} pt-4 border-t border-slate-200/80`}>
        {!collapsedMode ? (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                Fever Threshold
              </span>
              <span
                className={`text-xs font-extrabold px-1.5 py-0.5 rounded font-mono ${
                  feverThreshold >= 38.0
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {Number(feverThreshold).toFixed(1)}°C
              </span>
            </div>

            {/* Slider Track */}
            <div className="space-y-1.5 mt-2">
              <input
                type="range"
                min="36.5"
                max="39.5"
                step="0.1"
                disabled={role !== 'admin'}
                value={feverThreshold}
                onChange={(e) => setFeverThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>36.5°C</span>
                <span className="font-semibold text-slate-500">Alert Line</span>
                <span>39.5°C</span>
              </div>
            </div>

            {/* Admin Apply Button if changed */}
            {role === 'admin' ? (
              feverThreshold !== initialThreshold ? (
                <button
                  type="button"
                  onClick={handleSaveThreshold}
                  disabled={savingThreshold}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  {savingThreshold ? 'Saving...' : 'Apply Threshold'}
                </button>
              ) : thresholdSaved ? (
                <div className="mt-2 text-center text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" /> Updated successfully!
                </div>
              ) : (
                <div className="mt-1 text-[10px] text-slate-400 text-center">
                  Drag slider to tune fever alert line
                </div>
              )
            ) : (
              <div className="mt-1 text-[10px] text-slate-400 text-center">
                Facility standard: &ge; {Number(feverThreshold).toFixed(1)}°C triggers fever protocol
              </div>
            )}
          </div>
        ) : (
          /* Collapsed mini indicator */
          <div className="flex flex-col items-center gap-1 text-center" title={`Fever Threshold: ${Number(feverThreshold).toFixed(1)}°C`}>
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-mono font-bold text-slate-600">
              {Number(feverThreshold).toFixed(1)}°
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
