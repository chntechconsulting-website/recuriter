import React from 'react';
import { LEAD_STATUSES } from '../../utils/constants';

export const Badge = ({ status, className = '' }) => {
  const match = LEAD_STATUSES.find((s) => s.value === status) || {
    label: status,
    color: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ring-1 ring-inset whitespace-nowrap shrink-0 ${match.color} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80 shrink-0" />
      {match.label}
    </span>
  );
};
