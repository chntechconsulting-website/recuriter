import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { LEAD_STATUSES } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';
import { recruiterService } from '../../services/recruiterService';

export const StatusUpdateModal = ({ isOpen, onClose, recruiter, onUpdated }) => {
  const [status, setStatus] = useState(recruiter?.status || 'YET_TO_CONNECT');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recruiter?.id) return;

    setLoading(true);
    try {
      const updated = await recruiterService.updateStatus(recruiter.id, status, remarks);
      success(`Status updated to ${status} for ${recruiter.company_name}`);
      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Status: ${recruiter?.company_name || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select New Status *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LEAD_STATUSES.map((s) => (
              <label
                key={s.value}
                className={`flex items-center p-3 rounded-xl border cursor-pointer transition ${
                  status === s.value
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  checked={status === s.value}
                  onChange={(e) => setStatus(e.target.value)}
                  className="sr-only"
                />
                <span className="text-xs font-semibold text-slate-800">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Remarks / Audit Notes
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Recruiter requested job description template and student candidate count."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900"
          />
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
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Status & Log'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
