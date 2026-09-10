import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-white border-t border-slate-100 text-sm text-slate-600">
      <div>
        Showing <span className="font-semibold text-slate-900">{start}</span> to{' '}
        <span className="font-semibold text-slate-900">{end}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) {
            pageNum = currentPage - 3 + i;
            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
