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
  Building2,
  Briefcase,
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
  Building
} from 'lucide-react';

export const AssignVendors = () => {
  const { success, error } = useToast();

  // Active View Tab: 'assigned' or 'available'
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'available'

  // Recruiters list
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState('ALL');

  // Assigned Vendors State
  const [assignedList, setAssignedList] = useState([]);
  const [assignedTotal, setAssignedTotal] = useState(0);
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize, setAssignedPageSize] = useState(10);
  const [assignedTotalPages, setAssignedTotalPages] = useState(1);
  const [assignedSearch, setAssignedSearch] = useState('');

  // Available Vendors State
  const [availableList, setAvailableList] = useState([]);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [availablePage, setAvailablePage] = useState(1);
  const [availablePageSize, setAvailablePageSize] = useState(10);
  const [availableTotalPages, setAvailableTotalPages] = useState(1);
  const [availableSearch, setAvailableSearch] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  // Multi-Selection for Assignment
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
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

  // Fetch Assigned Vendors
  const fetchAssignedVendors = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await assignmentService.getVendorAssignments({
        recruiter_id: selectedRecruiter !== 'ALL' ? selectedRecruiter : undefined,
        search: assignedSearch.trim() || undefined,
        page: assignedPage,
        page_size: assignedPageSize
      });
      setAssignedList(res.items || []);
      setAssignedTotal(res.total || 0);
      setAssignedTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
      error('Failed to load assigned vendors');
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, [selectedRecruiter, assignedSearch, assignedPage, assignedPageSize, error]);

  // Fetch Available Vendors
  const fetchAvailableVendors = useCallback(async () => {
    try {
      const res = await assignmentService.getAvailableVendors({
        search: availableSearch.trim() || undefined,
        unassigned_only: unassignedOnly,
        page: availablePage,
        page_size: availablePageSize
      });
      setAvailableList(res.items || []);
      setAvailableTotal(res.total || 0);
      setAvailableTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
      error('Failed to load vendors list');
    }
  }, [availableSearch, unassignedOnly, availablePage, availablePageSize, error]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadRecruiters(), fetchAssignedVendors(), fetchAvailableVendors()]).finally(() => {
      setLoading(false);
    });
  }, [loadRecruiters, fetchAssignedVendors, fetchAvailableVendors]);

  // Toggle selection
  const handleToggleSelectVendor = (id) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllAvailable = (e) => {
    if (e.target.checked) {
      const allIds = availableList.map((v) => v.id);
      setSelectedVendorIds(Array.from(new Set([...selectedVendorIds, ...allIds])));
    } else {
      const currentIds = new Set(availableList.map((v) => v.id));
      setSelectedVendorIds(selectedVendorIds.filter((id) => !currentIds.has(id)));
    }
  };

  // Perform Assignment
  const handleAssignVendors = async (e) => {
    e.preventDefault();
    if (!targetRecruiterId) {
      error('Please select a recruiter to assign to.');
      return;
    }
    if (selectedVendorIds.length === 0) {
      error('Please select at least one vendor to assign.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await assignmentService.assignVendors({
        recruiter_id: targetRecruiterId,
        vendor_ids: selectedVendorIds,
        notes: assignmentNotes
      });

      success(`Successfully assigned ${res.count} vendor(s) to recruiter.`);
      setSelectedVendorIds([]);
      setAssignmentNotes('');
      setActiveTab('assigned');
      fetchAssignedVendors(true);
      fetchAvailableVendors();
    } catch (err) {
      error(err.message || 'Failed to assign vendors.');
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
      await assignmentService.reassignVendor({
        vendor_id: reassignTarget.vendor_id,
        new_recruiter_id: reassignRecruiterId,
        notes: reassignNotes
      });
      success(`Vendor successfully reallocated.`);
      setReassignTarget(null);
      setReassignRecruiterId('');
      setReassignNotes('');
      fetchAssignedVendors(true);
      fetchAvailableVendors();
    } catch (err) {
      error(err.message || 'Failed to reassign vendor.');
    } finally {
      setReassignSubmitting(false);
    }
  };

  // Perform Unassignment
  const handleUnassignSubmit = async () => {
    if (!unassignTarget) return;
    setUnassignSubmitting(true);
    try {
      await assignmentService.unassignVendor(unassignTarget.assignment_id, unassignTarget.vendor_id);
      success(`Vendor assignment removed.`);
      setUnassignTarget(null);
      fetchAssignedVendors(true);
      fetchAvailableVendors();
    } catch (err) {
      error(err.message || 'Failed to remove vendor assignment.');
    } finally {
      setUnassignSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <LoadingSpinner text="Loading Vendor Allocation Workspace..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assign Vendors</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Allocate staffing agencies, corporate vendors, and recruitment partners to individual recruiters.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'assigned') fetchAssignedVendors(true);
              else fetchAvailableVendors();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
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
          <span>Assigned Vendors Directory</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-200 font-mono">
            {assignedTotal}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'available'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Vendors</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {availableTotal}
          </span>
        </button>
      </div>

      {/* VIEW 1: ASSIGNED VENDORS DIRECTORY */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search vendor name, ID, contact person, or recruiter..."
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
            </div>

            <button
              onClick={() => setActiveTab('available')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Vendor</span>
            </button>
          </div>

          {/* Assigned Vendors Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {assignedList.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No vendor assignments found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try clearing your search filters or click "Assign New Vendors".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Vendor Details</th>
                      <th className="py-3.5 px-3">Location & Type</th>
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
                        {/* Vendor Details */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-extrabold text-slate-900 leading-snug">
                            {item.vendor_name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {item.vendor_code}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {item.company_name}
                            </span>
                          </div>
                        </td>

                        {/* Location & Type */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 pl-4.5">{item.vendor_type}</div>
                        </td>

                        {/* Contact Person */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800">{item.contact_person}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.phone_number}</span>
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
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                              {item.recruiter_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-emerald-800 hover:underline">
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
                              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-lg border border-slate-200 text-xs transition cursor-pointer"
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

      {/* VIEW 2: ASSIGN NEW VENDORS (MULTI-SELECT) */}
      {activeTab === 'available' && (
        <div className="space-y-5">
          {/* Top Assignment Action Bar */}
          <form
            onSubmit={handleAssignVendors}
            className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white p-5 rounded-3xl shadow-md space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
              <div>
                <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                  <span>Vendor Assignment Controller</span>
                </h2>
                <p className="text-xs text-emerald-200">
                  Select a recruiter below and check one or multiple vendors to assign.
                </p>
              </div>

              <div className="font-mono text-xs font-bold bg-emerald-800 px-3 py-1 rounded-xl text-emerald-100 self-start sm:self-auto">
                {selectedVendorIds.length} Vendor(s) Selected
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Recruiter Selector */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-1">
                  1. Select Recruiter *
                </label>
                <select
                  required
                  value={targetRecruiterId}
                  onChange={(e) => setTargetRecruiterId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white text-slate-900 rounded-xl text-xs font-bold border-0 focus:ring-2 focus:ring-emerald-400"
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-1">
                  2. Allocation Directive / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Staffing SLA outreach, Contract negotiation, Sourcing partner"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-800 border border-emerald-700/80 text-white rounded-xl text-xs placeholder:text-emerald-400/60 focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Action Button */}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={submitting || selectedVendorIds.length === 0 || !targetRecruiterId}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Building2 className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Assigning...'
                      : selectedVendorIds.length > 1
                      ? `Assign ${selectedVendorIds.length} Vendors`
                      : 'Assign Vendor'}
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* Available Vendors Search & Filter */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by vendor name, code, contact person..."
                  value={availableSearch}
                  onChange={(e) => {
                    setAvailableSearch(e.target.value);
                    setAvailablePage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => {
                    setUnassignedOnly(e.target.checked);
                    setAvailablePage(1);
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Unassigned Only</span>
              </label>
            </div>
          </div>

          {/* Vendors Selection Table */}
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
                          availableList.every((v) => selectedVendorIds.includes(v.id))
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="py-3.5 px-3">Vendor Name & ID</th>
                    <th className="py-3.5 px-3">Company Name</th>
                    <th className="py-3.5 px-3">Location</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-3">Contact Person</th>
                    <th className="py-3.5 px-3">Phone & Email</th>
                    <th className="py-3.5 px-3">Current Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {availableList.map((vendor) => {
                    const isSelected = selectedVendorIds.includes(vendor.id);

                    return (
                      <tr
                        key={vendor.id}
                        onClick={() => handleToggleSelectVendor(vendor.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectVendor(vendor.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-slate-900">{vendor.vendor_name}</div>
                          <div className="font-mono text-[10px] text-emerald-700">
                            {vendor.vendor_code}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {vendor.company_name}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{vendor.location}</td>
                        <td className="py-3.5 px-3 text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                            {vendor.vendor_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-800">
                          {vendor.contact_person}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-mono text-[11px]">{vendor.phone_number}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {vendor.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          {vendor.is_assigned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span>Assigned to: {vendor.assigned_recruiter_name}</span>
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
          title={`Reassign Vendor: ${reassignTarget.vendor_name}`}
        >
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">
                Vendor ID: <strong className="text-slate-800">{reassignTarget.vendor_code}</strong>
              </div>
              <div className="text-slate-500">
                Location: <strong className="text-slate-800">{reassignTarget.location}</strong>
              </div>
              <div className="text-slate-500">
                Currently Assigned to:{' '}
                <strong className="text-emerald-700">{reassignTarget.recruiter_name}</strong>
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
                placeholder="Reason or vendor portfolio rebalancing notes..."
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
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50"
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
          title="Remove Vendor Assignment"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Are you sure you want to unassign{' '}
              <strong className="text-slate-900">{unassignTarget.vendor_name}</strong> from{' '}
              <strong className="text-emerald-700">{unassignTarget.recruiter_name}</strong>?
            </p>
            <p className="text-slate-400 text-[11px]">
              The vendor partner will return to the unassigned pool and can be reallocated to another
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
                {unassignSubmitting ? 'Removing...' : 'Unassign Vendor'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssignVendors;
