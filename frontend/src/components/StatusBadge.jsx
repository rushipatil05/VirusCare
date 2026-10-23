import React from 'react';

const StatusBadge = ({ status, text }) => {
  const label = text || status;

  const base = 'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border';

  switch (status) {
    case 'Admitted':
      return <span className={`${base} bg-sky-50 text-sky-700 border-sky-200`}>Admitted</span>;
    case 'Discharge Eligible':
      return <span className={`${base} bg-teal-50 text-teal-700 border-teal-300 font-bold`}>↑ Discharge Eligible</span>;
    case 'Discharged':
      return <span className={`${base} bg-stone-100 text-stone-600 border-stone-300`}>Discharged</span>;
    case 'Deceased':
      return <span className={`${base} bg-rose-50 text-rose-700 border-rose-300`}>Deceased</span>;
    case 'Fever Detected':
    case 'Fever':
      return <span className={`${base} bg-amber-50 text-amber-800 border-amber-300`}>⚠ Fever</span>;
    case 'Afebrile':
    case 'Normal':
      return <span className={`${base} bg-teal-50 text-teal-700 border-teal-200`}>✓ Afebrile</span>;
    case 'Completed':
      return <span className={`${base} bg-teal-50 text-teal-700 border-teal-200`}>✓ Done</span>;
    case 'Pending':
      return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>Pending</span>;
    case 'Critical':
      return <span className={`${base} bg-rose-100 text-rose-800 border-rose-400`}>Critical</span>;
    case 'Guarded':
      return <span className={`${base} bg-orange-50 text-orange-800 border-orange-300`}>Guarded</span>;
    case 'Improving':
      return <span className={`${base} bg-teal-50 text-teal-700 border-teal-200`}>Improving</span>;
    case 'Stable':
    default:
      return <span className={`${base} bg-stone-100 text-stone-600 border-stone-200`}>{label}</span>;
  }
};

export default StatusBadge;
