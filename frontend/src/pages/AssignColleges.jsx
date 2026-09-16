import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { assignmentService } from '../services/assignmentService';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { formatDateTime } from '../utils/formatters';
import { DISTRICTS } from '../utils/constants';
import {
  GraduationCap,
  School,
  Building,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Users,
  Shield,
  Layers,
  ArrowLeft
} from 'lucide-react';

export const AssignColleges = () => {
  const { success, error } = useToast();

  // Active View Tab: 'assigned' or 'available'
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'available'

  // Recruiters list
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState('ALL');

  // Assigned Colleges State
  const [assignedList, setAssignedList] = useState([]);
  const [assignedTotal, setAssignedTotal] = useState(0);
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize, setAssignedPageSize] = useState(10);
  const [assignedTotalPages, setAssignedTotalPages] = useState(1);
  const [assignedSearch, setAssignedSearch] = useState('');
  const [assignedDistrict, setAssignedDistrict] = useState('ALL');

  // Available Colleges State
  const [availableList, setAvailableList] = useState([]);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [availablePage, setAvailablePage] = useState(1);
  const [availablePageSize, setAvailablePageSize] = useState(10);
  const [availableTotalPages, setAvailableTotalPages] = useState(1);
  const [availableSearch, setAvailableSearch] = useState('');
  const [availableDistrict, setAvailableDistrict] = useState('ALL');
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  // Multi-Selection for Assignment
  const [selectedCollegeIds, setSelectedCollegeIds] = useState([]);
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
      const recs = list.filter((u) => u.status === 'ACTIVE' && (u.role === 'STAFF' || u.role === 'RECRUITER'));
      setRecruiters(recs);
    } catch {
      // Non-fatal
    }
  }, []);

  // Fetch Assigned Colleges
  const fetchAssignedColleges = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await assignmentService.getCollegeAssignments({
        recruiter_id: selectedRecruiter !== 'ALL' ? selectedRecruiter : undefined,
        search: assignedSearch.trim() || undefined,
        district: assignedDistrict !== 'ALL' ? assignedDistrict : undefined,
        page: assignedPage,
        page_size: assignedPageSize
      });
      setAssignedList(res.items || []);
      setAssignedTotal(res.total || 0);
      setAssignedTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
      error('Failed to load assigned colleges');
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, [selectedRecruiter, assignedSearch, assignedDistrict, assignedPage, assignedPageSize, error]);

  // Fetch Available Colleges
  const fetchAvailableColleges = useCallback(async () => {
    try {
      const res = await assignmentService.getAvailableColleges({
        search: availableSearch.trim() || undefined,
        district: availableDistrict !== 'ALL' ? availableDistrict : undefined,
        unassigned_only: unassignedOnly,
        page: availablePage,
        page_size: availablePageSize
      });
      setAvailableList(res.items || []);
      setAvailableTotal(res.total || 0);
      setAvailableTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
      error('Failed to load colleges list');
    }
  }, [availableSearch, availableDistrict, unassignedOnly, availablePage, availablePageSize, error]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadRecruiters(), fetchAssignedColleges(), fetchAvailableColleges()]).finally(() => {
      setLoading(false);
    });
  }, [loadRecruiters, fetchAssignedColleges, fetchAvailableColleges]);

  // Toggle selection
  const handleToggleSelectCollege = (id) => {
    setSelectedCollegeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllAvailable = (e) => {
    if (e.target.checked) {
      const allIds = availableList.map((c) => c.id);
      setSelectedCollegeIds(Array.from(new Set([...selectedCollegeIds, ...allIds])));
    } else {
      const currentIds = new Set(availableList.map((c) => c.id));
      setSelectedCollegeIds(selectedCollegeIds.filter((id) => !currentIds.has(id)));
    }
  };

  // Perform Assignment
  const handleAssignColleges = async (e) => {
    e.preventDefault();
    if (!targetRecruiterId) {
      error('Please select a recruiter to assign to.');
      return;
    }
    if (selectedCollegeIds.length === 0) {
      error('Please select at least one college to assign.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await assignmentService.assignColleges({
        recruiter_id: targetRecruiterId,
        college_ids: selectedCollegeIds,
        notes: assignmentNotes
      });

      success(`Successfully assigned ${res.count} college(s) to recruiter.`);
      setSelectedCollegeIds([]);
      setAssignmentNotes('');
      setActiveTab('assigned');
      fetchAssignedColleges(true);
      fetchAvailableColleges();
    } catch (err) {
      error(err.message || 'Failed to assign colleges.');
    } finally {
      setSubmitting(false);
    }
  };

  // Perform Reassignment
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignRecruiterId) {
      error('Please select the target recruiter.');
      return;
    }
    setReassignSubmitting(true);
    try {
      await assignmentService.reassignCollege({
        college_id: reassignTarget.college_id,
        new_recruiter_id: reassignRecruiterId,
        notes: reassignNotes
      });
      success(`College successfully reallocated.`);
      setReassignTarget(null);
      setReassignRecruiterId('');
      setReassignNotes('');
      fetchAssignedColleges(true);
      fetchAvailableColleges();
    } catch (err) {
      error(err.message || 'Failed to reassign college.');
    } finally {
      setReassignSubmitting(false);
    }
  };

  // Perform Unassignment
  const handleUnassignSubmit = async () => {
    if (!unassignTarget) return;
    setUnassignSubmitting(true);
    try {
      await assignmentService.unassignCollege(unassignTarget.assignment_id, unassignTarget.college_id);
      success(`College assignment removed.`);
      setUnassignTarget(null);
      fetchAssignedColleges(true);
      fetchAvailableColleges();
    } catch (err) {
      error(err.message || 'Failed to remove college assignment.');
    } finally {
      setUnassignSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <LoadingSpinner text="Loading College Allocation Workspace..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assign Colleges</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Allocate higher education colleges, engineering institutions, and polytechnics to sourcing recruiters.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'assigned') fetchAssignedColleges(true);
              else fetchAvailableColleges();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'assigned'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Assigned Colleges Directory</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-200 font-mono">
            {assignedTotal}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'available'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Colleges</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {availableTotal}
          </span>
        </button>
      </div>

      {/* VIEW 1: ASSIGNED COLLEGES DIRECTORY */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search college name, code, contact person, or recruiter..."
                  value={assignedSearch}
                  onChange={(e) => {
                    setAssignedSearch(e.target.value);
                    setAssignedPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              {/* Recruiter Filter */}
              <div className="min-w-[180px]">
                <select
                  value={selectedRecruiter}
                  onChange={(e) => {
                    setSelectedRecruiter(e.target.value);
                    setAssignedPage(1);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700"
                >
                  <option value="ALL">All Recruiters</option>
                  {recruiters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.employee_id || `EMP-${r.id}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* District Filter */}
              <div className="min-w-[160px]">
                <select
                  value={assignedDistrict}
                  onChange={(e) => {
                    setAssignedDistrict(e.target.value);
                    setAssignedPage(1);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
                >
                  <option value="ALL">All Districts</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('available')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Assign College</span>
            </button>
          </div>

          {/* Assigned Colleges Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {assignedList.length === 0 ? (
              <div className="p-12 text-center">
                <School className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No college assignments found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try clearing your search filters or click "Assign New Colleges".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">College Details</th>
                      <th className="py-3.5 px-3">District / Location</th>
                      <th className="py-3.5 px-3">Contact Person & Phone</th>
                      <th className="py-3.5 px-3">Assigned Recruiter</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-3">Assigned Date & Admin</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {assignedList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* College Details */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-extrabold text-slate-900 leading-snug">
                            {item.college_name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                              {item.college_code}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {item.college_type}
                            </span>
                          </div>
                        </td>

                        {/* District / Location */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.district}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 pl-4.5">{item.location}</div>
                        </td>

                        {/* Contact Person */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800">{item.contact_person}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.contact_number}</span>
                          </div>
                          {item.email && item.email !== '-' && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {item.email}
                            </div>
                          )}
                        </td>

                        {/* Assigned Recruiter */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                              {item.recruiter_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-blue-700 hover:underline">
                                <Link to={`/admin/recruiters-activity/${item.recruiter_id}`}>
                                  {item.recruiter_name}
                                </Link>
                              </div>
                              <div className="font-mono text-[10px] text-slate-400">
                                {item.recruiter_emp_id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{item.assignment_status}</span>
                          </span>
                        </td>

                        {/* Assigned Date & Admin */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDateTime(item.assigned_date)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            By: {item.assigned_by_name}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setReassignTarget(item);
                                setReassignRecruiterId(String(item.recruiter_id));
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-lg border border-slate-200 text-xs transition cursor-pointer"
                              title="Reassign to another recruiter"
                            >
                              Reassign
                            </button>

                            <button
                              onClick={() => setUnassignTarget(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Remove assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {assignedTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100">
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

      {/* VIEW 2: ASSIGN NEW COLLEGES (MULTI-SELECT) */}
      {activeTab === 'available' && (
        <div className="space-y-5">
          {/* Top Assignment Action Bar */}
          <form
            onSubmit={handleAssignColleges}
            className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-md space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800 pb-3">
              <div>
                <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <span>College Assignment Controller</span>
                </h2>
                <p className="text-xs text-indigo-200">
                  Select a recruiter below and check one or multiple colleges to assign.
                </p>
              </div>

              <div className="font-mono text-xs font-bold bg-indigo-800 px-3 py-1 rounded-xl text-indigo-100 self-start sm:self-auto">
                {selectedCollegeIds.length} College(s) Selected
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Recruiter Selector */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200 mb-1">
                  1. Select Recruiter *
                </label>
                <select
                  required
                  value={targetRecruiterId}
                  onChange={(e) => setTargetRecruiterId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white text-slate-900 rounded-xl text-xs font-bold border-0 focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">-- Choose Recruiter --</option>
                  {recruiters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.employee_id || `EMP-${r.id}`}) - {r.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Notes */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200 mb-1">
                  2. Allocation Directive / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Campus drive outreach, MOU renewal, 2026 batch pool"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-800 border border-indigo-700 text-white rounded-xl text-xs placeholder:text-indigo-400/60 focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Action Button */}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={submitting || selectedCollegeIds.length === 0 || !targetRecruiterId}
                  className="w-full py-2.5 px-4 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Assigning...'
                      : selectedCollegeIds.length > 1
                      ? `Assign ${selectedCollegeIds.length} Colleges`
                      : 'Assign College'}
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* Available Colleges Search & Filter */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by college name, code, contact person..."
                  value={availableSearch}
                  onChange={(e) => {
                    setAvailableSearch(e.target.value);
                    setAvailablePage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div className="min-w-[160px]">
                <select
                  value={availableDistrict}
                  onChange={(e) => {
                    setAvailableDistrict(e.target.value);
                    setAvailablePage(1);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
                >
                  <option value="ALL">All Districts</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => {
                    setUnassignedOnly(e.target.checked);
                    setAvailablePage(1);
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Unassigned Only</span>
              </label>
            </div>
          </div>

          {/* Colleges Selection Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAllAvailable}
                        checked={
                          availableList.length > 0 &&
                          availableList.every((c) => selectedCollegeIds.includes(c.id))
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3.5 px-3">College Name & Code</th>
                    <th className="py-3.5 px-3">District</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-3">Placement SPOC</th>
                    <th className="py-3.5 px-3">Contact</th>
                    <th className="py-3.5 px-3">Current Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {availableList.map((college) => {
                    const isSelected = selectedCollegeIds.includes(college.id);

                    return (
                      <tr
                        key={college.id}
                        onClick={() => handleToggleSelectCollege(college.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectCollege(college.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-slate-900">{college.college_name}</div>
                          <div className="font-mono text-[10px] text-indigo-700">
                            {college.college_code}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {college.district}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                            {college.college_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-800">
                          {college.contact_person}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-mono text-[11px]">{college.contact_number}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {college.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          {college.is_assigned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span>Assigned to: {college.assigned_recruiter_name}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>Unassigned</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {availableTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={availablePage}
                  totalPages={availableTotalPages}
                  onPageChange={setAvailablePage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* REASSIGN MODAL */}
      {reassignTarget && (
        <Modal
          isOpen={!!reassignTarget}
          onClose={() => setReassignTarget(null)}
          title={`Reassign College: ${reassignTarget.college_name}`}
        >
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">
                College Code: <strong className="text-slate-800">{reassignTarget.college_code}</strong>
              </div>
              <div className="text-slate-500">
                District: <strong className="text-slate-800">{reassignTarget.district}</strong>
              </div>
              <div className="text-slate-500">
                Currently Assigned to:{' '}
                <strong className="text-blue-700">{reassignTarget.recruiter_name}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select New Recruiter *
              </label>
              <select
                required
                value={reassignRecruiterId}
                onChange={(e) => setReassignRecruiterId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              >
                <option value="">-- Choose Target Recruiter --</option>
                {recruiters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.employee_id || `EMP-${r.id}`}) - {r.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Reallocation (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Reason or portfolio rebalancing notes..."
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReassignTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reassignSubmitting || !reassignRecruiterId}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {reassignSubmitting ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* UNASSIGN CONFIRM MODAL */}
      {unassignTarget && (
        <Modal
          isOpen={!!unassignTarget}
          onClose={() => setUnassignTarget(null)}
          title="Remove College Assignment"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Are you sure you want to unassign{' '}
              <strong className="text-slate-900">{unassignTarget.college_name}</strong> from{' '}
              <strong className="text-blue-700">{unassignTarget.recruiter_name}</strong>?
            </p>
            <p className="text-slate-400 text-[11px]">
              The college will return to the unassigned pool and can be reallocated to another
              recruiter at any time.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUnassignTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnassignSubmit}
                disabled={unassignSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {unassignSubmitting ? 'Removing...' : 'Unassign College'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssignColleges;
