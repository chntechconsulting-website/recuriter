import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { recruiterService } from '../services/recruiterService';
import { followUpService } from '../services/followUpService';
import { communicationService } from '../services/communicationService';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusUpdateModal } from '../components/recruiters/StatusUpdateModal';
import { AddFollowUpModal } from '../components/recruiters/AddFollowUpModal';
import { AddCommunicationModal } from '../components/recruiters/AddCommunicationModal';
import { LeadTimeline } from '../components/recruiters/LeadTimeline';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatDate, formatDateTime } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  MessageSquare,
  Globe,
  CheckCircle2,
  CalendarPlus,
  Users2
} from 'lucide-react';

export const RecruiterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { isAdmin } = useAuth();

  const [lead, setLead] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, followups, communications, history
  const [loading, setLoading] = useState(true);

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadLeadDetails = useCallback(async () => {
    try {
      const [leadData, commData, histData] = await Promise.all([
        recruiterService.getRecruiterById(id),
        communicationService.getCommunications(id),
        recruiterService.getStatusHistory(id)
      ]);
      setLead(leadData);
      setCommunications(commData);
      setStatusHistory(histData);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to load partner details';
      error(detail);
      navigate('/recruiters', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, error]);

  useEffect(() => {
    loadLeadDetails();
  }, [loadLeadDetails]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await recruiterService.deleteRecruiter(id);
      success('Partner contact removed successfully');
      navigate('/recruiters');
    } catch (err) {
      error('Failed to delete contact');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCompleteFollowUp = async (followUpId) => {
    try {
      await followUpService.updateFollowUp(followUpId, { status: 'Completed' });
      success('Follow-up marked as completed');
      loadLeadDetails();
    } catch {
      error('Failed to complete follow-up');
    }
  };

  if (loading) return <LoadingSpinner text="Loading partner profile..." />;
  if (!lead) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              to="/recruiters"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition shrink-0 mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {lead.lead_id}
                </span>
                <Badge status={lead.status} />
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {lead.industry || 'College / Institution'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {lead.company_name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-bold text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  SPOC: {lead.recruiter_name && lead.recruiter_name !== '-' ? lead.recruiter_name : 'Not Specified'} {lead.designation && lead.designation !== '-' ? `(${lead.designation})` : ''}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {lead.district || 'District N/A'} {lead.taluk ? `(${lead.taluk})` : ''}, {lead.state || 'Tamil Nadu'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update Status
            </button>

            <button
              onClick={() => setShowFollowUpModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Schedule Follow-up
            </button>

            <button
              onClick={() => setShowCommModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Log Activity
            </button>

            <Link
              to={`/recruiters/${lead.id}/edit`}
              className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              title="Edit Details"
            >
              <Edit className="w-4 h-4" />
            </Link>

            {isAdmin && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100 overflow-x-auto">
          {[
            { key: 'overview', label: 'Institution & Programs', count: null },
            { key: 'followups', label: 'Follow-ups', count: lead.follow_ups?.length || 0 },
            { key: 'communications', label: 'Communication Log', count: communications.length },
            { key: 'history', label: 'Status History', count: statusHistory.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.key ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Student Pool & Program Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Candidate / Student Pool</span>
                  <span className="text-base font-extrabold text-blue-700 mt-1 block">
                    {lead.candidates_required ? `${lead.candidates_required} Students` : 'Open Batch'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Key Programs / Streams</span>
                  <span className="text-base font-extrabold text-slate-900 mt-1 block">
                    {lead.job_role || 'Not specified'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Expected CTC / Stipend</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">{lead.salary_range || 'Standard'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Qualification / Degree</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">{lead.qualification || 'Diploma / Graduate'}</span>
                </div>
              </div>

              {lead.job_description && (
                <div className="pt-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Batch / Center Highlights</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {lead.job_description}
                  </p>
                </div>
              )}
            </div>

            {lead.remarks && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks & Meeting Summary</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{lead.remarks}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">SPOC & Campus Contact</h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact Number</span>
                    <a href={`tel:${lead.mobile}`} className="font-bold text-slate-900 hover:text-blue-600">
                      {lead.mobile}
                    </a>
                  </div>
                </div>

                {lead.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                      <a href={`mailto:${lead.email}`} className="font-semibold text-slate-800 hover:text-blue-600">
                        {lead.email}
                      </a>
                    </div>
                  </div>
                )}

                {lead.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Website</span>
                      <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline truncate max-w-[200px] block">
                        {lead.website}
                      </a>
                    </div>
                  </div>
                )}

                {lead.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Campus Address</span>
                      <p className="text-slate-700">{lead.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Partnership Metadata</h3>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Sourcing Channel</span>
                <span className="font-bold text-slate-800">{lead.lead_source || 'Field Visit'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Lead Sourced By</span>
                <span className="font-bold text-blue-700">{lead.sourcer?.name || lead.sourced_user_name || 'Not Specified'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Assigned To / Lead Owner</span>
                <span className="font-bold text-slate-800">{lead.assignee?.name || lead.assigned_user_name || 'Unassigned'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Sourcing Date</span>
                <span className="font-semibold text-slate-700">{formatDate(lead.first_contact_date)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Last Connected</span>
                <span className="font-semibold text-slate-700">{formatDateTime(lead.last_contacted_date)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Registered On</span>
                <span className="font-semibold text-slate-700">{formatDateTime(lead.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Follow-ups */}
      {activeTab === 'followups' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Follow-up Schedule</h3>
              <p className="text-xs text-slate-400">Track campus visits, calls, and MOU meetings</p>
            </div>
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Schedule Follow-up
            </button>
          </div>

          <div className="space-y-3">
            {(!lead.follow_ups || lead.follow_ups.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">No follow-ups recorded yet.</p>
            ) : (
              lead.follow_ups.map((f) => (
                <div key={f.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-xs">{f.follow_up_type}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        f.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Date: <span className="font-bold text-slate-800">{formatDate(f.follow_up_date)}</span> at {f.follow_up_time || 'TBD'}
                    </p>
                    {f.notes && <p className="text-xs text-slate-500 mt-1 italic">{f.notes}</p>}
                  </div>

                  {f.status !== 'Completed' && (
                    <button
                      onClick={() => handleCompleteFollowUp(f.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Communications */}
      {activeTab === 'communications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Communication History</h3>
              <p className="text-xs text-slate-400">Record of calls, visits, WhatsApp messages, and meetings</p>
            </div>
            <button
              onClick={() => setShowCommModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Log Communication
            </button>
          </div>

          <div className="space-y-4">
            {communications.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">No communication logs recorded yet.</p>
            ) : (
              communications.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold">
                        {c.communication_type}
                      </span>
                      {c.subject && <span className="font-bold text-slate-900 text-xs">{c.subject}</span>}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(c.communication_date || c.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 font-medium">
                    {c.notes}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    {c.outcome && (
                      <div>
                        Outcome: <span className="font-semibold text-slate-800">{c.outcome}</span>
                      </div>
                    )}
                    {c.next_action && (
                      <div>
                        Next Action: <span className="font-semibold text-blue-700">{c.next_action}</span>
                      </div>
                    )}
                    <div className="ml-auto">
                      Logged by: <span className="font-bold text-slate-700">{c.created_by_name || 'Staff'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Status Audit Trail</h3>
            <p className="text-xs text-slate-400">Non-destructive chronological record of all engagement status updates</p>
          </div>

          <LeadTimeline histories={statusHistory} />
        </div>
      )}

      {/* Modals */}
      {showStatusModal && (
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          recruiter={lead}
          onUpdated={loadLeadDetails}
        />
      )}

      {showFollowUpModal && (
        <AddFollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => setShowFollowUpModal(false)}
          recruiterId={lead.id}
          companyName={lead.company_name}
          onCreated={loadLeadDetails}
        />
      )}

      {showCommModal && (
        <AddCommunicationModal
          isOpen={showCommModal}
          onClose={() => setShowCommModal(false)}
          recruiterId={lead.id}
          companyName={lead.company_name}
          onCreated={loadLeadDetails}
        />
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          loading={deleteLoading}
          title="Delete Contact"
          message={`Are you sure you want to remove "${lead.company_name}" (${lead.lead_id})?`}
          confirmText="Yes, Delete"
        />
      )}
    </div>
  );
};
