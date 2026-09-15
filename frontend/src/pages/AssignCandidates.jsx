import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { assignmentService } from '../services/assignmentService';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { formatDateTime } from '../utils/formatters';
import {
  UserCheck,
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Shield,
  Layers,
  ArrowLeft
} from 'lucide-react';

export const AssignCandidates = () => {
  const { success, error } = useToast();

  // Active View Tab: 'assigned' or 'available'
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'available'

  // Recruiters list
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState('ALL');

  // Assigned Candidates State
  const [assignedList, setAssignedList] = useState([]);
  const [assignedTotal, setAssignedTotal] = useState(0);
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize, setAssignedPageSize] = useState(10);
  const [assignedTotalPages, setAssignedTotalPages] = useState(1);
  const [assignedSearch, setAssignedSearch] = useState('');
  const [assignedStatus, setAssignedStatus] = useState('ALL');

  // Available Candidates State
  const [availableList, setAvailableList] = useState([]);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [availablePage, setAvailablePage] = useState(1);
  const [availablePageSize, setAvailablePageSize] = useState(10);
  const [availableTotalPages, setAvailableTotalPages] = useState(1);
  const [availableSearch, setAvailableSearch] = useState('');
  const [availableStatus, setAvailableStatus] = useState('ALL');
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  // Multi-Selection for Assignment
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [targetRecruiterId, setTargetRecruiterId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reassign Modal State
  const [reassignTarget, setReassignTarget] = useState(null);
  const [reassignRecruiterId, setReassignRecruiterId] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  // Unassign Modal State
  const [unassignTarget, setUnassignTarget] = useState(null);
  const [unassignSubmitting, setUnassignSubmitting] = useState(false);

  // Loading
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Recruiters
  const loadRecruiters = useCallback(async () => {
    try {
      const data = await userService.getUsers();
      const list = Array.isArray(data) ? data : (data?.items || []);
      const recs = list.filter((u) => u.status === 'ACTIVE' && (u.role === 'STAFF' || u.role === 'RECRUITER' || u.role === 'ADMIN'));
      setRecruiters(recs);
    } catch {
      // Non-fatal
    }
  }, []);

  // Fetch Assigned Candidates
  const fetchAssignedCandidates = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await assignmentService.getCandidateAssignments({
        recruiter_id: selectedRecruiter,
        status: assignedStatus !== 'ALL' ? assignedStatus : undefined,
        search: assignedSearch.trim() || undefined,
        page: assignedPage,
        page_size: assignedPageSize
      });
      setAssignedList(res.items || []);
      setAssignedTotal(res.total || 0);
      setAssignedTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
      error('Failed to load assigned candidates');
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, [selectedRecruiter, assignedStatus, assignedSearch, assignedPage, assignedPageSize, error]);

  // Fetch Available Candidates
  const fetchAvailableCandidates = useCallback(async () => {
    try {
      const res = await assignmentService.getAvailableCandidates({
        search: availableSearch.trim() || undefined,
        status: availableStatus !== 'ALL' ? availableStatus : undefined,
        unassigned_only: unassignedOnly,
        page: availablePage,
        page_size: availablePageSize
      });
      setAvailableList(res.items || []);
      setAvailableTotal(res.total || 0);
      setAvailableTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
      error('Failed to load candidate pool');
    }
  }, [availableSearch, availableStatus, unassignedOnly, availablePage, availablePageSize, error]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadRecruiters(), fetchAssignedCandidates(), fetchAvailableCandidates()]).finally(() => {
      setLoading(false);
    });
  }, [loadRecruiters, fetchAssignedCandidates, fetchAvailableCandidates]);

  // Toggle selection
  const handleToggleSelectCandidate = (id) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllAvailable = (e) => {
    if (e.target.checked) {
      const allIds = availableList.map((c) => c.id);
      setSelectedCandidateIds(Array.from(new Set([...selectedCandidateIds, ...allIds])));
    } else {
      const currentIds = new Set(availableList.map((c) => c.id));
      setSelectedCandidateIds(selectedCandidateIds.filter((id) => !currentIds.has(id)));
    }
  };

  // Perform Assignment
  const handleAssignCandidates = async (e) => {
    e.preventDefault();
    if (!targetRecruiterId) {
      error('Please select a recruiter to assign to.');
      return;
    }
    if (selectedCandidateIds.length === 0) {
      error('Please select at least one candidate to assign.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await assignmentService.assignCandidates(
        targetRecruiterId,
        selectedCandidateIds,
        assignmentNotes
      );

      success(res.message || `Successfully assigned ${res.count} candidate(s) to recruiter.`);
      setSelectedCandidateIds([]);
      setAssignmentNotes('');
      setActiveTab('assigned');
      fetchAssignedCandidates(true);
      fetchAvailableCandidates();
    } catch (err) {
      error(err.message || 'Failed to assign candidates.');
    } finally {
      setSubmitting(false);
    }
  };

  // Perform Reassignment
  const handleConfirmReassign = async () => {
    if (!reassignRecruiterId) {
      error('Please select the new recruiter.');
      return;
    }
    setReassignSubmitting(true);
    try {
      await assignmentService.reassignCandidate(
        reassignTarget.id,
        reassignRecruiterId,
        reassignNotes
      );
      success(`Candidate reallocated successfully.`);
      setReassignTarget(null);
      setReassignRecruiterId('');
      setReassignNotes('');
      fetchAssignedCandidates(true);
      fetchAvailableCandidates();
    } catch (err) {
      error(err.message || 'Failed to reassign candidate.');
    } finally {
      setReassignSubmitting(false);
    }
  };

  // Perform Unassignment
  const handleConfirmUnassign = async () => {
    setUnassignSubmitting(true);
    try {
      const res = await assignmentService.unassignCandidate(unassignTarget.id);
      success(res.message || 'Candidate unassigned successfully.');
      setUnassignTarget(null);
      fetchAssignedCandidates(true);
      fetchAvailableCandidates();
    } catch (err) {
      error(err.message || 'Failed to unassign candidate.');
    } finally {
      setUnassignSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'NEW').toUpperCase();
    if (s === 'SELECTED' || s === 'JOINED') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>;
    }
    if (s === 'INTERVIEW_SCHEDULED') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">INTERVIEW</span>;
    }
    if (s === 'SHORTLISTED') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">SHORTLISTED</span>;
    }
    if (s === 'CONTACTED') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">CONTACTED</span>;
    }
    if (s === 'REJECTED') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">REJECTED</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">{s}</span>;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Candidate Allocation System..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/recruiters-activity"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Back to Recruiter Activity"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Assign Candidates</h1>
              <p className="text-sm text-slate-400">
                Allocate candidate portfolios to recruiters and oversee pipeline ownership
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/assign-colleges"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            Assign Colleges
          </Link>
          <Link
            to="/admin/assign-vendors"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4 text-purple-400" />
            Assign Vendors
          </Link>
          <button
            onClick={() => {
              if (activeTab === 'assigned') fetchAssignedCandidates(true);
              else fetchAvailableCandidates();
            }}
            disabled={refreshing}
            className="p-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'assigned'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Assigned Candidates
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 font-bold">
              {assignedTotal}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('available')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'available'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            Assign New Candidates
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 font-bold">
              {availableTotal}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: ASSIGNED CANDIDATES VIEW */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={assignedSearch}
                onChange={(e) => {
                  setAssignedSearch(e.target.value);
                  setAssignedPage(1);
                }}
                placeholder="Search candidate name, ID, qualification, location..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Recruiter Filter */}
            <div>
              <select
                value={selectedRecruiter}
                onChange={(e) => {
                  setSelectedRecruiter(e.target.value);
                  setAssignedPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Recruiters ({recruiters.length})</option>
                {recruiters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.employee_id || `EMP-${r.id}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={assignedStatus}
                onChange={(e) => {
                  setAssignedStatus(e.target.value);
                  setAssignedPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="SELECTED">Selected</option>
                <option value="REJECTED">Rejected</option>
                <option value="JOINED">Joined</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Candidate Information</th>
                    <th className="py-3 px-4">Qualification / College</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Recruiter</th>
                    <th className="py-3 px-4">Allocated Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {assignedList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-base font-medium text-slate-400">No candidates assigned yet</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Switch to &apos;Assign New Candidates&apos; tab to assign candidates to your recruiters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    assignedList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{item.name}</div>
                          <div className="text-xs font-mono text-blue-400">{item.candidate_id}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {item.location}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-slate-200">{item.educational_qualification}</div>
                          <div className="text-xs text-slate-400">{item.college_name || item.specialization}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.experience_type}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex items-center gap-1 text-slate-300">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {item.contact_number}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 mt-0.5 truncate max-w-[160px]">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {item.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/admin/recruiters-activity/${item.recruiter_id}`}
                            className="group block"
                          >
                            <div className="font-medium text-white group-hover:text-blue-400 transition flex items-center gap-1">
                              {item.recruiter_name}
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-blue-400" />
                            </div>
                            <div className="text-xs text-slate-400">{item.recruiter_emp_id}</div>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatDateTime(item.assigned_date)}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            By {item.assigned_by_name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setReassignTarget(item);
                                setReassignRecruiterId(String(item.recruiter_id));
                              }}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-blue-400 hover:border-blue-500/50 hover:bg-slate-700 transition"
                              title="Reassign to another recruiter"
                            >
                              Reassign
                            </button>
                            <button
                              onClick={() => setUnassignTarget(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title="Remove assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {assignedTotalPages > 1 && (
              <div className="p-4 border-t border-slate-800">
                <Pagination
                  currentPage={assignedPage}
                  totalPages={assignedTotalPages}
                  onPageChange={setAssignedPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AVAILABLE CANDIDATES FOR ASSIGNMENT */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidates List (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={availableSearch}
                  onChange={(e) => {
                    setAvailableSearch(e.target.value);
                    setAvailablePage(1);
                  }}
                  placeholder="Search candidate name, ID, qualification..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={unassignedOnly}
                    onChange={(e) => {
                      setUnassignedOnly(e.target.checked);
                      setAvailablePage(1);
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                  />
                  Unassigned only
                </label>
              </div>
            </div>

            {/* Candidates Selection Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            availableList.length > 0 &&
                            availableList.every((c) => selectedCandidateIds.includes(c.id))
                          }
                          onChange={handleSelectAllAvailable}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                        />
                      </th>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Qualification / Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Current Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {availableList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p>No candidates found matching filter.</p>
                        </td>
                      </tr>
                    ) : (
                      availableList.map((c) => {
                        const isSelected = selectedCandidateIds.includes(c.id);
                        return (
                          <tr
                            key={c.id}
                            onClick={() => handleToggleSelectCandidate(c.id)}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-3.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectCandidate(c.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                              />
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">{c.name}</div>
                              <div className="text-xs font-mono text-blue-400">{c.candidate_id}</div>
                              <div className="text-xs text-slate-400">{c.contact_number}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-xs font-medium text-slate-200">{c.educational_qualification}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {c.location}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {getStatusBadge(c.status)}
                            </td>
                            <td className="py-3.5 px-4">
                              {c.assigned_recruiter_name ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                                  {c.assigned_recruiter_name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Unassigned
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {availableTotalPages > 1 && (
                <div className="p-4 border-t border-slate-800">
                  <Pagination
                    currentPage={availablePage}
                    totalPages={availableTotalPages}
                    onPageChange={setAvailablePage}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Allocation Panel (1 Col) */}
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sticky top-6 shadow-xl">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Allocate Candidates</h3>
                  <p className="text-xs text-slate-400">
                    Assign selected candidates to a recruiter
                  </p>
                </div>
              </div>

              <form onSubmit={handleAssignCandidates} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    1. Target Recruiter *
                  </label>
                  <select
                    value={targetRecruiterId}
                    onChange={(e) => setTargetRecruiterId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Recruiter...</option>
                    {recruiters.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.employee_id || `EMP-${r.id}`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    2. Selected Candidates ({selectedCandidateIds.length})
                  </label>
                  <div className="max-h-44 overflow-y-auto p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5 text-xs">
                    {selectedCandidateIds.length === 0 ? (
                      <div className="text-center py-6 text-slate-500">
                        Click checkboxes on the table to pick candidates for this recruiter.
                      </div>
                    ) : (
                      selectedCandidateIds.map((id) => {
                        const cand = availableList.find((c) => c.id === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            <div className="truncate font-medium text-white">
                              {cand?.name || `Candidate #${id}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleSelectCandidate(id)}
                              className="text-slate-500 hover:text-rose-400 ml-2"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    3. Assignment Notes (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="E.g., High-priority candidate pipeline for campus recruitment batch..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || selectedCandidateIds.length === 0 || !targetRecruiterId}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Assign {selectedCandidateIds.length} Candidate(s)
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN MODAL */}
      {reassignTarget && (
        <Modal
          isOpen={true}
          onClose={() => setReassignTarget(null)}
          title="Reassign Candidate"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-white text-sm">{reassignTarget.name}</div>
              <div className="text-slate-400">Candidate ID: <span className="font-mono text-blue-400">{reassignTarget.candidate_id}</span></div>
              <div className="text-slate-400">Current Recruiter: <span className="text-slate-200">{reassignTarget.recruiter_name}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                New Target Recruiter *
              </label>
              <select
                value={reassignRecruiterId}
                onChange={(e) => setReassignRecruiterId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Recruiter...</option>
                {recruiters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.employee_id || `EMP-${r.id}`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Reason / Notes (Optional)
              </label>
              <textarea
                rows="2"
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                placeholder="Reason for reallocating candidate..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReassignTarget(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={reassignSubmitting || !reassignRecruiterId}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 flex items-center gap-1.5"
              >
                {reassignSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm Reassignment
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* UNASSIGN MODAL */}
      {unassignTarget && (
        <Modal
          isOpen={true}
          onClose={() => setUnassignTarget(null)}
          title="Unassign Candidate"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                Are you sure you want to unassign <strong className="text-white">{unassignTarget.name}</strong> from recruiter <strong className="text-white">{unassignTarget.recruiter_name}</strong>?
                The candidate will be returned to the unassigned candidate pool.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnassignTarget(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnassign}
                disabled={unassignSubmitting}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 flex items-center gap-1.5"
              >
                {unassignSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Yes, Unassign Candidate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssignCandidates;
