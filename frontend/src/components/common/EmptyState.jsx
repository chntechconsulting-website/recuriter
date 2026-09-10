import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({ title = 'No records found', description = 'There are no items matching your criteria.', icon: Icon = FolderOpen, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 my-4">
      <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
};
