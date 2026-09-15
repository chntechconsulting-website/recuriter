import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { candidateService } from '../services/candidateService';
import { recruiterActivityService } from '../services/recruiterActivityService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { CANDIDATE_STATUSES } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Building,
  Award,
  CalendarCheck,
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react';

export const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidateActivities, setCandidateActivities] = useState([]);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Quick Action: Schedule Interview
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewRound, setInterviewRound] = useState('Technical Round');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);

  // Quick Action: Add Note
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await candidateService.getCandidateById(id);
      setCandidate(data);
      setNewStatus(data.status);

      // Load activities for this candidate
      try {
        const allActs = await recruiterActivityService.getRecruiterActivities(data.assigned_to || 0, {
          search: data.name,
          page_size: 50
        });
        const matched = (allActs?.items || []).filter(
          (a) =>
            (a.candidate_id && a.candidate_id === data.candidate_id) ||
            (a.candidate_name && a.candidate_name.toLowerCase() === data.name.toLowerCase())
        );
        setCandidateActivities(matched);
      } catch {
        // Non-fatal
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to load candidate details';
      error(detail);
      navigate('/candidates', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setStatusUpdating(true);
    try {
      await candidateService.updateStatus(id, {
        status: newStatus,
        remarks: statusRemarks
      });
      success('Candidate status updated successfully');
      setStatusModalOpen(false);
      setStatusRemarks('');
      fetchDetails();
    } catch {
      error('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setInterviewSubmitting(true);
    try {
      const desc = `${interviewRound} scheduled on ${interviewDate} at ${interviewTime || 'TBD'}. Notes: ${interviewNotes || 'N/A'}`;
      await candidateService.updateStatus(id, {
        status: 'INTERVIEW_SCHEDULED',
        remarks: desc
      });
      success('Interview scheduled and logged successfully!');
      setInterviewModalOpen(false);
      setInterviewDate('');
      setInterviewTime('');
      setInterviewNotes('');
      fetchDetails();
    } catch {
      error('Failed to schedule interview');
    } finally {
      setInterviewSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteSubmitting(true);
    try {
      await recruiterActivityService.logActivity({
        recruiter_id: candidate.assigned_to,
        recruiter_name: candidate.assigned_user_name,
        action_type: 'Notes added',
        candidate_id: candidate.candidate_id,
        candidate_name: candidate.name,
        job_name: candidate.position_interested_in || 'General Pipeline',
        previous_status: candidate.status,
        new_status: candidate.status,
        description: noteText.trim()
      });
      success('Note added to activity timeline!');
      setNoteModalOpen(false);
      setNoteText('');
      fetchDetails();
    } catch {
      error('Failed to add note');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await candidateService.deleteCandidate(id);
      success('Candidate removed');
      navigate('/candidates');
    } catch {
      error('Failed to delete candidate');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading candidate details..." />
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Link
            to="/candidates"
            className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-2xl hover:bg-slate-100 transition mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{candidate.name}</h2>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                {candidate.candidate_id}
              </span>
              <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                candidate.status === 'PLACED' ? 'bg-emerald-100 text-emerald-800' :
                candidate.status === 'SELECTED' ? 'bg-green-100 text-green-800' :
                candidate.status === 'INTERVIEW_SCHEDULED' ? 'bg-indigo-100 text-indigo-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {candidate.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {candidate.location || 'Tamil Nadu'}, {candidate.state}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Sourcing SPOC: <strong className="text-slate-700">{candidate.assigned_user_name}</strong>
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Update Status
          </button>
          <button
            onClick={() => setInterviewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Schedule Interview
          </button>
          <button
            onClick={() => setNoteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Add Note
          </button>
          <Link
            to={`/candidates/${candidate.id}/edit`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            Edit
          </Link>
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Delete Candidate"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <Phone className="w-4 h-4" />
            <span>Contact Details</span>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Primary Mobile</span>
              <span className="text-slate-900 font-bold text-sm">{candidate.contact_number}</span>
            </div>
            {candidate.email && (
              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="text-slate-900 font-medium">{candidate.email}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block text-[11px]">Preferred Location</span>
              <span className="text-slate-900 font-medium">{candidate.location || 'Tamil Nadu'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Willing to Relocate?</span>
              <span className="text-slate-900 font-medium">{candidate.willing_to_relocate || 'Yes'}</span>
            </div>
          </div>
        </div>

        {/* Education Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Education</span>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Qualification</span>
              <span className="text-slate-900 font-bold text-sm">{candidate.educational_qualification || 'Degree'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Specialization / Branch</span>
              <span className="text-slate-900 font-medium">{candidate.specialization || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">College / Institute</span>
              <span className="text-slate-900 font-medium">{candidate.college_name || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Passout Year</span>
              <span className="text-slate-900 font-medium">{candidate.year_of_passout || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Career & CTC */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Briefcase className="w-4 h-4" />
            <span>Career & Compensation</span>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Target Position</span>
              <span className="text-slate-900 font-bold text-sm text-blue-700">{candidate.position_interested_in || 'Open Role'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Experience Profile</span>
              <span className="text-slate-900 font-medium">{candidate.experience_type || 'Fresher'} {candidate.total_years_experience ? `(${candidate.total_years_experience})` : ''}</span>
            </div>
            {candidate.designation_worked && (
              <div>
                <span className="text-slate-400 block text-[11px]">Designation Worked</span>
                <span className="text-slate-900 font-medium">{candidate.designation_worked}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Current CTC</span>
                <span className="text-slate-900 font-bold">{candidate.current_ctc || 'Fresher / N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Expected CTC</span>
                <span className="text-slate-900 font-bold text-emerald-700">{candidate.expected_ctc || 'Negotiable'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remarks */}
      {candidate.remarks && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2 text-xs">
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Remarks & Sourcing Notes</h4>
          <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">{candidate.remarks}</p>
        </div>
      )}

      {/* Candidate Activity History Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              Candidate Activity & Status Audit Trail ({candidateActivities.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Chronological history for {candidate.candidate_id}</span>
        </div>

        {candidateActivities.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No activity records logged for this candidate yet.</p>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pt-1">
            {candidateActivities.map((act) => (
              <div key={act.id} className="relative pl-5 text-xs">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-slate-800">{act.action_type}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDateTime(act.created_at)}
                    </span>
                  </div>
                  {act.previous_status && act.new_status && act.previous_status !== act.new_status && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-1">
                      <span className="text-slate-400">{act.previous_status}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-blue-700">{act.new_status}</span>
                    </div>
                  )}
                  <p className="text-slate-600">{act.description}</p>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Logged by <strong className="text-slate-600">{act.recruiter_name}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {interviewModalOpen && (
        <Modal
          isOpen={interviewModalOpen}
          onClose={() => setInterviewModalOpen(false)}
          title={`Schedule Interview: ${candidate.name}`}
        >
          <form onSubmit={handleScheduleInterview} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Interview Date *
                </label>
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Interview Round / Type *
              </label>
              <select
                value={interviewRound}
                onChange={(e) => setInterviewRound(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800"
              >
                <option value="Initial Screening Round">Initial Screening Round</option>
                <option value="Technical Interview Round">Technical Interview Round</option>
                <option value="Client Manager Round">Client Manager Round</option>
                <option value="HR Evaluation Round">HR Evaluation Round</option>
                <option value="Final Selection Round">Final Selection Round</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Interview Details & Panel Notes
              </label>
              <textarea
                rows="3"
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                placeholder="Meeting link, client contact, venue, or evaluation requirements..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInterviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={interviewSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm shadow-indigo-200 cursor-pointer"
              >
                {interviewSubmitting ? 'Scheduling...' : 'Schedule & Log Interview'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Recruiter Note Modal */}
      {noteModalOpen && (
        <Modal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          title={`Add Recruiter Note: ${candidate.name}`}
        >
          <form onSubmit={handleAddNote} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Activity Note / Call Summary *
              </label>
              <textarea
                rows="4"
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter details of conversation with candidate, feedback, availability, or salary negotiation..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={noteSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm shadow-amber-200 cursor-pointer"
              >
                {noteSubmitting ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Modal */}
      {statusModalOpen && (
        <Modal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          title={`Update Status: ${candidate.name}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Pipeline Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-800"
              >
                {CANDIDATE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Remarks / Placement Notes</label>
              <textarea
                rows="3"
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="e.g. Cleared technical interview, offered 4.5 LPA..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={statusUpdating}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-200 cursor-pointer"
              >
                {statusUpdating ? 'Saving...' : 'Update Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete Candidate Record"
        message={`Are you sure you want to permanently delete candidate ${candidate.name}?`}
        confirmText="Delete Candidate"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
};
