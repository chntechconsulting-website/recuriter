import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { candidateService } from '../services/candidateService';
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
  Award
} from 'lucide-react';

export const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await candidateService.getCandidateById(id);
      setCandidate(data);
      setNewStatus(data.status);
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

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setStatusModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Update Status
          </button>
          <Link
            to={`/candidates/${candidate.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <Edit className="w-4 h-4 text-blue-600" />
            Edit
          </Link>
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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
