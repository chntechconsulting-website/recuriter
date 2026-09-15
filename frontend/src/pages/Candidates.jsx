import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { candidateService } from '../services/candidateService';
import { userService } from '../services/userService';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { DISTRICTS, CANDIDATE_STATUSES, QUALIFICATIONS, EXPERIENCE_TYPES, PASSOUT_YEARS } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const Candidates = () => {
  const { user, isPrivileged } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [expTab, setExpTab] = useState('ALL'); // ALL, Fresher, Experienced
  
  const [filters, setFilters] = useState({
    status: 'ALL',
    location: 'ALL',
    qualification: 'ALL',
    experience_type: 'ALL',
    passout_year: 'ALL',
    assigned_to: '',
    sort_by: 'id',
    sort_order: 'asc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Modal & Delete
  const [statusModalCandidate, setStatusModalCandidate] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { success, error } = useToast();

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      let finalExp = filters.experience_type !== 'ALL' ? filters.experience_type : undefined;
      if (expTab !== 'ALL' && filters.experience_type === 'ALL') {
        finalExp = expTab;
      }

      const data = await candidateService.getCandidates({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        location: filters.location !== 'ALL' ? filters.location : undefined,
        qualification: filters.qualification !== 'ALL' ? filters.qualification : undefined,
        experience_type: finalExp,
        passout_year: filters.passout_year !== 'ALL' ? filters.passout_year : undefined,
        assigned_to: filters.assigned_to || undefined,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });

      setCandidates(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      error('Failed to load candidate profiles');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filters, expTab, error]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    userService.getSimpleUsers().then(setUsers).catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSort = (column) => {
    setFilters((prev) => {
      if (prev.sort_by === column) {
        return { ...prev, sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc' };
      }
      return { ...prev, sort_by: column, sort_order: 'asc' };
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'ALL',
      location: 'ALL',
      qualification: 'ALL',
      experience_type: 'ALL',
      passout_year: 'ALL',
      assigned_to: '',
      sort_by: 'id',
      sort_order: 'desc'
    });
    setExpTab('ALL');
    setSearch('');
    setPage(1);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalCandidate || !newStatus) return;
    setStatusUpdating(true);
    try {
      await candidateService.updateStatus(statusModalCandidate.id, {
        status: newStatus,
        remarks: statusRemarks
      });
      success(`Candidate status updated to ${newStatus}`);
      setStatusModalCandidate(null);
      setNewStatus('');
      setStatusRemarks('');
      fetchCandidates();
    } catch {
      error('Failed to update candidate status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      error('Please select an Excel or CSV file to import');
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await candidateService.importCandidates(formData);
      success(res.message || 'Candidates imported successfully!');
      setImportModalOpen(false);
      setImportFile(null);
      fetchCandidates();
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to import candidates');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await candidateService.deleteCandidate(deleteTarget.id);
      success(`Candidate ${deleteTarget.name} removed`);
      setDeleteTarget(null);
      fetchCandidates();
    } catch {
      error('Failed to delete candidate');
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasActiveFilters =
    filters.status !== 'ALL' ||
    filters.location !== 'ALL' ||
    filters.qualification !== 'ALL' ||
    filters.passout_year !== 'ALL' ||
    filters.assigned_to !== '' ||
    expTab !== 'ALL' ||
    search.trim() !== '';

  const activeExp = filters.experience_type !== 'ALL' ? filters.experience_type : (expTab !== 'ALL' ? expTab : undefined);

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Candidate Sourcing Pool
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span>Total {total} candidates</span>
            {!isPrivileged && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Assigned to you ({user?.name})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/candidates/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </Link>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Import Excel
          </button>

          <button
            onClick={() => candidateService.exportCandidates('xlsx', { ...filters, search: search.trim(), experience_type: activeExp })}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Export
          </button>
        </div>
      </div>

      {/* Experience Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Candidates' },
          { key: 'Fresher', label: 'Freshers (Campus & Recent)' },
          { key: 'Experienced', label: 'Experienced Professionals' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setExpTab(tab.key);
              setFilters((prev) => ({ ...prev, experience_type: 'ALL' }));
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              expTab === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search candidate name, mobile, email, college, specialization, position interested in..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
            showFilters
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          )}
        </button>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
          <span className="font-bold text-slate-500">Active filters:</span>
          {search.trim() && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
              Search: "{search.trim()}"
              <button onClick={() => setSearch('')} className="hover:text-blue-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.status !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
              Status: {filters.status}
              <button onClick={() => handleFilterChange('status', 'ALL')} className="hover:text-purple-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.location !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              Location: {filters.location}
              <button onClick={() => handleFilterChange('location', 'ALL')} className="hover:text-emerald-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.qualification !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              Qualification: {filters.qualification}
              <button onClick={() => handleFilterChange('qualification', 'ALL')} className="hover:text-amber-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.passout_year !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold">
              Batch: {filters.passout_year}
              <button onClick={() => handleFilterChange('passout_year', 'ALL')} className="hover:text-cyan-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.assigned_to && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
              Staff: {users.find((u) => u.id === Number(filters.assigned_to))?.name || filters.assigned_to}
              <button onClick={() => handleFilterChange('assigned_to', '')} className="hover:text-indigo-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {expTab !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 font-semibold">
              Exp: {expTab}
              <button onClick={() => setExpTab('ALL')} className="hover:text-slate-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-red-600 hover:text-red-800 font-bold ml-1 underline cursor-pointer text-[11px]"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Filter Dropdowns Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="ALL">All Statuses</option>
              {CANDIDATE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="ALL">All Locations</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qualification</label>
            <select
              value={filters.qualification}
              onChange={(e) => handleFilterChange('qualification', e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="ALL">All Qualifications</option>
              {QUALIFICATIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Passout Year</label>
            <select
              value={filters.passout_year}
              onChange={(e) => handleFilterChange('passout_year', e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="ALL">All Batches</option>
              {PASSOUT_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Sourcing Staff</label>
            <select
              value={filters.assigned_to}
              onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="">All Staff</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner text="Loading candidate profiles..." />
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No Candidates Found"
            description="No candidate matches your active filter or search query. Click Add Candidate to register a candidate or Import Excel."
            actionLabel="Add New Candidate"
            onAction={() => window.location.href = '/candidates/new'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-3 w-12 text-center text-slate-400 font-bold">#</th>
                  <th
                    onClick={() => handleSort('candidate_id')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Candidate ID</span>
                      {filters.sort_by === 'candidate_id' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Candidate Name</span>
                      {filters.sort_by === 'name' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('location')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Contact & Location</span>
                      {filters.sort_by === 'location' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('educational_qualification')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Education & College</span>
                      {filters.sort_by === 'educational_qualification' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Position / Role</th>
                  <th
                    onClick={() => handleSort('experience_type')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Experience & CTC</span>
                      {filters.sort_by === 'experience_type' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Sourcing SPOC</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {filters.sort_by === 'status' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {candidates.map((cand, idx) => (
                  <tr key={cand.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      <Link to={`/candidates/${cand.id}`} className="hover:underline">
                        {cand.candidate_id}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <Link to={`/candidates/${cand.id}`} className="font-bold text-slate-900 hover:text-blue-600 block">
                        {cand.name}
                      </Link>
                      <span className="text-[11px] text-slate-500">
                        {cand.specialization || 'General'} {cand.year_of_passout ? `(${cand.year_of_passout})` : ''}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="font-semibold text-slate-800">{cand.contact_number}</div>
                      <div className="text-[11px] text-slate-500">{cand.location || 'Tamil Nadu'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block truncate max-w-[160px]">
                        {cand.educational_qualification || 'Degree'}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block max-w-[160px]" title={cand.college_name}>
                        {cand.college_name || '-'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-bold block truncate max-w-[140px]">
                        {cand.position_interested_in || 'Open Role'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Relocate: {cand.willing_to_relocate || 'Yes'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">
                        {cand.experience_type || 'Fresher'} {cand.total_years_experience ? `(${cand.total_years_experience})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Exp: {cand.expected_ctc || 'Negotiable'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">
                        {cand.assigned_user_name || 'Unassigned'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setStatusModalCandidate(cand);
                          setNewStatus(cand.status);
                        }}
                        title="Click to update status"
                        className="cursor-pointer transition transform hover:scale-105"
                      >
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          cand.status === 'PLACED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          cand.status === 'SELECTED' ? 'bg-green-100 text-green-800 border border-green-200' :
                          cand.status === 'INTERVIEW_SCHEDULED' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          cand.status === 'SCREENED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          cand.status === 'CONTACTED' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {cand.status.replace('_', ' ')}
                        </span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/candidates/${cand.id}`}
                          title="View Profile"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/candidates/${cand.id}/edit`}
                          title="Edit Profile"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(cand)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
        {!loading && candidates.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              totalItems={total}
            />
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {statusModalCandidate && (
        <Modal
          isOpen={!!statusModalCandidate}
          onClose={() => setStatusModalCandidate(null)}
          title={`Update Status: ${statusModalCandidate.name}`}
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
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interview / Screening Notes</label>
              <textarea
                rows="3"
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="e.g. Cleared 1st technical round, scheduled for client drive..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalCandidate(null)}
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

      {/* Import Excel Modal */}
      {importModalOpen && (
        <Modal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="Import Candidate Excel / CSV"
        >
          <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-900 space-y-1">
              <p className="font-bold">Supported Columns Header Format:</p>
              <p className="text-[11px] text-blue-700">
                `Si No`, `Name`, `Contact Number`, `Location`, `Email ID`, `Educational Qualification`, `Specialization`, `College Name`, `Year of Passout`, `Position Interested IN`, `Willing to Relocate?`, `Experience`, `Total Years of Experience`, `Designation Worked`, `Current CTC`, `Expected CTC`
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Choose File (.xlsx, .xls, .csv) *</label>
              <input
                type="file"
                required
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-200 cursor-pointer"
              >
                {importing ? 'Importing...' : 'Upload & Import'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Candidate Record"
        message={`Are you sure you want to delete candidate ${deleteTarget?.name} (${deleteTarget?.candidate_id})? This action cannot be undone.`}
        confirmText="Delete Candidate"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
