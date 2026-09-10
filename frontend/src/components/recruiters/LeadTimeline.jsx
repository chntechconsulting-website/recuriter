import React from 'react';
import { formatDateTime } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Clock, User } from 'lucide-react';

export const LeadTimeline = ({ histories = [] }) => {
  if (!histories.length) {
    return <p className="text-sm text-slate-400 py-4 italic">No status transitions recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {histories.map((h) => (
        <div key={h.id} className="relative group">
          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-100 group-hover:scale-125 transition" />
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                {h.old_status && (
                  <>
                    <Badge status={h.old_status} />
                    <span className="text-xs text-slate-400 font-bold">&rarr;</span>
                  </>
                )}
                <Badge status={h.new_status} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {formatDateTime(h.changed_at)}
              </div>
            </div>

            {h.remarks && (
              <p className="text-xs text-slate-600 mt-2 font-medium bg-white p-2.5 rounded-lg border border-slate-100">
                {h.remarks}
              </p>
            )}

            <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-500 font-medium">
              <User className="w-3 h-3 text-slate-400" />
              Changed by: <span className="font-semibold text-slate-700">{h.changed_by_name || 'System Admin'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
