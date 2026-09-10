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
  CalendarPlus,
  RefreshCw,
  GraduationCap,
  Building,
  School,
  Briefcase,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { recruiterService } from '../services/recruiterService';
import { userService } from '../services/userService';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { FilterPanel } from '../components/recruiters/FilterPanel';
import { StatusUpdateModal } from '../components/recruiters/StatusUpdateModal';
import { AddFollowUpModal } from '../components/recruiters/AddFollowUpModal';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const RecruiterLeads = () => {
  const { isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL, College, Training Center, Vendor
  const [filters, setFilters] = useState({
    status: 'ALL',
    district: 'ALL',
    lead_source: 'ALL',
    industry: 'ALL',
    assigned_to: '',
    sort_by: 'id',
    sort_order: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [statusModalLead, setStatusModalLead] = useState(null);
  const [followUpModalLead, setFollowUpModalLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { success, error } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      let finalIndustry = filters.industry !== 'ALL' ? filters.industry : undefined;
      if (categoryFilter !== 'ALL' && filters.industry === 'ALL') {
        finalIndustry = categoryFilter;
      }

      const data = await recruiterService.getRecruiters({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        district: filters.district !== 'ALL' ? filters.district : undefined,
        lead_source: filters.lead_source !== 'ALL' ? filters.lead_source : undefined,
        industry: finalIndustry,
        assigned_to: filters.assigned_to || undefined,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });

      setLeads(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      error('Failed to load institution and vendor records');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filters, categoryFilter, error]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    userService.getSimpleUsers().then(setUsers).catch(() => {});
  }, []);

  const handleSort = (field) => {
    setFilters((prev) => {
      if (prev.sort_by === field) {
        return { ...prev, sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc' };
      }
      return { ...prev, sort_by: field, sort_order: 'asc' };
    });
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'ALL',
      district: 'ALL',
      lead_source: 'ALL',
      industry: 'ALL',
      assigned_to: '',
      sort_by: 'id',
      sort_order: 'asc'
    });
    setCategoryFilter('ALL');
    setSearch('');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await recruiterService.deleteRecruiter(deleteTarget.id);
      success(`Lead ${deleteTarget.lead_id} removed`);
      setDeleteTarget(null);
      fetchLeads();
    } catch {
      error('Failed to delete lead');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Colleges, Training Centers & Vendors</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {total} institutions, colleges, and vendor contacts registered
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/recruiters/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Contact
          </Link>

          <Link
            to="/import"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Import Excel
          </Link>

          <button
            onClick={() => recruiterService.exportRecruiters('xlsx', filters)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Export
          </button>
        </div>
      </div>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Categories' },
          { key: 'College', label: 'College' },
          { key: 'Training Center', label: 'Training Center' },
          { key: 'NGO & Community', label: 'NGO & Community' },
          { key: 'Vendors', label: 'Vendors' }
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setCategoryFilter(cat.key);
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              categoryFilter === cat.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Trigger */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search College / Vendor name, SPOC name, mobile, email, district, zone, CHN staff..."
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
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition ${
            showFilters || Object.values(filters).some((v) => v && v !== 'ALL' && v !== 'created_at' && v !== 'desc')
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Advanced Filters</span>
        </button>

        <button
          onClick={fetchLeads}
          title="Refresh table"
          className="p-2.5 bg-white text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          users={users}
          isAdmin={isAdmin}
        />
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading institutions & vendors..." />
        ) : leads.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Try changing your search terms or filters."
            icon={GraduationCap}
            action={
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
              >
                Clear All Filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider select-none whitespace-nowrap">
                  <th className="py-3.5 px-3 w-12 text-center text-slate-400 font-bold whitespace-nowrap">#</th>
                  <th
                    onClick={() => handleSort('id')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Lead ID</span>
                      {filters.sort_by === 'id' || filters.sort_by === 'lead_id' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('company_name')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap min-w-[220px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Institution / Vendor</span>
                      {filters.sort_by === 'company_name' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">SPOC & Designation</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact Info</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Category / Channel</th>
                  <th
                    onClick={() => handleSort('candidates_required')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Capacity & Role</span>
                      {filters.sort_by === 'candidates_required' ? (
                        filters.sort_order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Assigned Owner</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
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
                  <th className="py-3.5 px-4 whitespace-nowrap">Next Follow-up</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {leads.map((lead, idx) => (
                  <tr key={lead.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3.5 px-3 text-center font-bold text-slate-400 whitespace-nowrap">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      <Link to={`/recruiters/${lead.id}`} className="hover:underline">
                        {lead.lead_id}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 min-w-[200px]">
                      <Link to={`/recruiters/${lead.id}`} className="font-bold text-slate-900 hover:text-blue-600 block">
                        {lead.company_name}
                      </Link>
                      <span className="text-[11px] text-slate-500">
                        {lead.district || 'Tamil Nadu'} {lead.taluk ? `(${lead.taluk})` : ''}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {lead.recruiter_name && lead.recruiter_name !== '-' ? (
                        <>
                          <span className="font-bold text-slate-800 block capitalize">{lead.recruiter_name}</span>
                          {lead.designation && lead.designation !== '-' && (
                            <span className="text-[11px] text-slate-500 capitalize">{lead.designation}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Not Specified</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{lead.mobile}</div>
                      {lead.email && <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{lead.email}</div>}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-semibold block truncate max-w-[140px]">
                        {lead.industry || 'College'}
                      </span>
                      <span className="text-[10px] text-slate-400">{lead.lead_source || 'Field Visit'}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-blue-700 block">
                        {lead.candidates_required ? `${lead.candidates_required} Students` : 'Open Pool'}
                      </span>
                      {lead.job_role && <span className="text-[10px] text-slate-500 truncate block max-w-[120px]">{lead.job_role}</span>}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">
                        {lead.assigned_user_name || 'Unassigned'}
                      </span>
                      {lead.sourced_user_name && lead.sourced_user_name !== lead.assigned_user_name && (
                        <span className="text-[10.5px] text-blue-600 font-medium block">
                          Sourced: {lead.sourced_user_name}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => setStatusModalLead(lead)}
                        title="Click to change status"
                        className="cursor-pointer transition transform hover:scale-105 inline-block"
                      >
                        <Badge status={lead.status} />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {lead.next_follow_up_date ? (
                        <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                          {formatDate(lead.next_follow_up_date)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/recruiters/${lead.id}`}
                          title="View Profile"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setStatusModalLead(lead)}
                          title="Update Status"
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setFollowUpModalLead(lead)}
                          title="Add Follow-up"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/recruiters/${lead.id}/edit`}
                          title="Edit Contact"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(lead)}
                            title="Delete"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {statusModalLead && (
        <StatusUpdateModal
          isOpen={!!statusModalLead}
          onClose={() => setStatusModalLead(null)}
          recruiter={statusModalLead}
          onUpdated={fetchLeads}
        />
      )}

      {followUpModalLead && (
        <AddFollowUpModal
          isOpen={!!followUpModalLead}
          onClose={() => setFollowUpModalLead(null)}
          recruiterId={followUpModalLead.id}
          companyName={followUpModalLead.company_name}
          onCreated={fetchLeads}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          title="Delete Institution / Vendor"
          message={`Are you sure you want to remove "${deleteTarget.company_name}" (${deleteTarget.lead_id})?`}
          confirmText="Yes, Delete"
        />
      )}
    </div>
  );
};
