import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FOLLOWUP_TYPES } from '../../utils/constants';
import { followUpService } from '../../services/followUpService';
import { useToast } from '../../context/ToastContext';

export const AddFollowUpModal = ({ isOpen, onClose, recruiterId, companyName, onCreated }) => {
  const [followUpDate, setFollowUpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [followUpType, setFollowUpType] = useState('Phone Call');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recruiterId) return;

    setLoading(true);
    try {
      const res = await followUpService.createFollowUp({
        recruiter_id: recruiterId,
        follow_up_date: followUpDate,
        follow_up_time: followUpTime,
        follow_up_type: followUpType,
        status: 'Pending',
        notes
      });
      success(`Follow-up scheduled for ${followUpDate}`);
      if (onCreated) onCreated(res);
      onClose();
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to schedule follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule Follow-up: ${companyName || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Follow-up Date *
            </label>
            <input
              type="date"
              required
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Time
            </label>
            <input
              type="text"
              placeholder="e.g. 11:30 AM"
              value={followUpTime}
              onChange={(e) => setFollowUpTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Follow-up Type
          </label>
          <select
            value={followUpType}
            onChange={(e) => setFollowUpType(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white"
          >
            {FOLLOWUP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Action Notes / Objective
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Call recruiter to verify shortlist requirement and finalize campus visit time."
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
            {loading ? 'Scheduling...' : 'Save Follow-up'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
