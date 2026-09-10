import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'danger', loading = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-slate-600 text-sm leading-relaxed pt-1">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition disabled:opacity-50 ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
