import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    darkgreen: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate" title={title}>
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl border shrink-0 ${colorMap[color] || colorMap.blue} transition-transform group-hover:scale-110`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </h4>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 font-medium truncate">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center text-xs font-medium text-slate-600">
          {trend}
        </div>
      )}
    </div>
  );
};

