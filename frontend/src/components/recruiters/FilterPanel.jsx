import React from 'react';
import { INSTITUTION_TYPES, LEAD_STATUSES, DISTRICTS, SOURCING_CHANNELS } from '../../utils/constants';
import { RotateCcw } from 'lucide-react';

export const FilterPanel = ({ filters, onChange, onReset, users = [], isAdmin = true }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-scale-up space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Filter Institutions & Vendors
        </h4>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            {LEAD_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={filters.industry}
            onChange={(e) => onChange('industry', e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            {INSTITUTION_TYPES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            District
          </label>
          <select
            value={filters.district}
            onChange={(e) => onChange('district', e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Sourcing Channel
          </label>
          <select
            value={filters.lead_source}
            onChange={(e) => onChange('lead_source', e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Channels</option>
            {SOURCING_CHANNELS.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Lead Owner / Assigned Staff
          </label>
          {isAdmin ? (
            <select
              value={filters.assigned_to}
              onChange={(e) => onChange('assigned_to', e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Staff Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          ) : (
            <div className="w-full text-xs font-bold text-blue-700 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/60 truncate flex items-center">
              Assigned to You
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
