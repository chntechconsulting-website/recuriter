import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { COMMUNICATION_TYPES } from '../../utils/constants';
import { communicationService } from '../../services/communicationService';
import { useToast } from '../../context/ToastContext';

export const AddCommunicationModal = ({ isOpen, onClose, recruiterId, companyName, onCreated }) => {
  const [commType, setCommType] = useState('Phone');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('Interested');
  const [nextAction, setNextAction] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recruiterId || !notes.trim()) return;

    setLoading(true);
    try {
      const res = await communicationService.createCommunication({
        recruiter_id: recruiterId,
        communication_type: commType,
        subject,
        notes,
        outcome,
        next_action: nextAction
      });
      success(`Communication logged for ${companyName}`);
      if (onCreated) onCreated(res);
      onClose();
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to log communication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Communication: ${companyName || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Channel *
            </label>
            <select
              value={commType}
              onChange={(e) => setCommType(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white"
            >
              {COMMUNICATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject / Topic
            </label>
            <input
              type="text"
              placeholder="e.g. Job role discussion"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Conversation Notes *
          </label>
          <textarea
            rows={3}
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details of what was discussed with recruiter..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Outcome
            </label>
            <input
              type="text"
              placeholder="e.g. Recruiter interested"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Next Action
            </label>
            <input
              type="text"
              placeholder="e.g. Send job fair schedule"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
            />
          </div>
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
            {loading ? 'Saving...' : 'Record Communication'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
