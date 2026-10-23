import React from 'react';

// A clinical stat block — left-border accent, dense data
const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'teal', alert = false, onClick }) => {
  const borderColor = {
    teal:   'border-teal-500',
    amber:  'border-amber-500',
    rose:   'border-rose-500',
    sky:    'border-sky-500',
    stone:  'border-stone-400',
    slate:  'border-slate-400',
    indigo: 'border-indigo-500',
    emerald:'border-emerald-500',
    purple: 'border-purple-500',
    blue:   'border-blue-500',
  }[color] || 'border-teal-500';

  const iconColor = {
    teal:   'text-teal-600',
    amber:  'text-amber-600',
    rose:   'text-rose-600',
    sky:    'text-sky-600',
    stone:  'text-stone-500',
    slate:  'text-slate-500',
    indigo: 'text-indigo-600',
    emerald:'text-emerald-600',
    purple: 'text-purple-600',
    blue:   'text-blue-600',
  }[color] || 'text-teal-600';

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-stone-200 rounded-lg p-4 border-l-4 ${borderColor} ${
        alert ? 'ring-2 ring-rose-300/50' : ''
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-500 leading-tight">
          {title}
        </p>
        {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor} mt-0.5 opacity-70`} />}
      </div>
      <p className="mt-2 text-2xl font-bold text-stone-900 leading-none tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-1.5 text-[11px] text-stone-400 leading-tight">{subtitle}</p>
      )}
    </div>
  );
};

export default MetricCard;
