import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recruiterActivityService } from '../services/recruiterActivityService';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDateTime } from '../utils/formatters';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Award,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Activity,
  PhoneCall,
  CalendarCheck,
  Building,
  AlertCircle
} from 'lucide-react';

export const RecruiterActivityList = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [includeAdmins, setIncludeAdmins] = useState(true);

  const navigate = useNavigate();
  const { error } = useToast();

  const fetchRecruiters = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await recruiterActivityService.getAllRecruitersWithKpis({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        includeAdmins
      });
      setRecruiters(data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load recruiter performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, includeAdmins, error]);

  useEffect(() => {
    fetchRecruiters();
  }, [fetchRecruiters]);

  // Overall Aggregate KPIs
  const totalRecruiters = recruiters.length;
  const activeRecruiters = recruiters.filter((r) => r.status === 'ACTIVE').length;
  const totalAssignedCandidates = recruiters.reduce((sum, r) => sum + (r.assigned_candidates_count || 0), 0);
  const totalAssignedCollegesVendors = recruiters.reduce(
    (sum, r) => sum + (r.assigned_colleges_count || 0) + (r.assigned_vendors_count || 0),
    0
  );
  const totalJoined = recruiters.reduce((sum, r) => sum + (r.joined_count || 0), 0);
  const totalActions = recruiters.reduce((sum, r) => sum + (r.total_activities_count || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-600/10 text-blue-600 rounded-xl border border-blue-200/60 shadow-xs">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Recruiter Activity & Performance Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Complete operational audit of Candidates and Colleges & Vendors managed by each recruiter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRecruiters(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer disabled:opacity-50"
            title="Refresh Recruiter Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Top Aggregate KPI Cards (Candidates & Colleges/Vendors) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Total Recruiters</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{totalRecruiters}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              {activeRecruiters} Active
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs bg-gradient-to-b from-blue-50/40 to-white">
          <p className="text-[11px] font-bold uppercase text-blue-600">Candidate Pool</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-700">{totalAssignedCandidates.toLocaleString()}</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs bg-gradient-to-b from-indigo-50/40 to-white">
          <p className="text-[11px] font-bold uppercase text-indigo-600">Colleges & Vendors</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-indigo-700">{totalAssignedCollegesVendors.toLocaleString()}</span>
            <Building className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs bg-gradient-to-b from-teal-50/40 to-white">
          <p className="text-[11px] font-bold uppercase text-teal-600">Joined / Hired</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-teal-700">{totalJoined.toLocaleString()}</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Total Activity Logs</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">{totalActions.toLocaleString()}</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recruiter name, employee ID, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeAdmins}
              onChange={(e) => setIncludeAdmins(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span>Include Admins</span>
          </label>
        </div>
      </div>

      {/* Main Recruiter Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Aggregating recruiter metrics & live activity audit..." />
          </div>
        ) : recruiters.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No recruiters found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <th className="py-4 px-4">Recruiter Name</th>
                  <th className="py-4 px-3">Employee ID</th>
                  <th className="py-4 px-3">Email</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-2 text-center text-blue-700">Candidates</th>
                  <th className="py-4 px-2 text-center text-indigo-700">Colleges & Vendors</th>
                  <th className="py-4 px-2 text-center text-purple-600">Contacted</th>
                  <th className="py-4 px-2 text-center text-amber-600">Shortlisted</th>
                  <th className="py-4 px-2 text-center text-indigo-600">Interview</th>
                  <th className="py-4 px-2 text-center text-emerald-600">Selected</th>
                  <th className="py-4 px-2 text-center text-rose-600">Rejected</th>
                  <th className="py-4 px-2 text-center text-teal-600">Joined</th>
                  <th className="py-4 px-3">Last Activity</th>
                  <th className="py-4 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recruiters.map((recruiter) => {
                  const initials = recruiter.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const collegesVendorsTotal =
                    (recruiter.assigned_colleges_count || 0) + (recruiter.assigned_vendors_count || 0);

                  return (
                    <tr
                      key={recruiter.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/recruiters-activity/${recruiter.id}`)}
                    >
                      {/* Recruiter Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-200 text-blue-700 font-black flex items-center justify-center text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {initials}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              <span>{recruiter.name}</span>
                              {recruiter.role === 'ADMIN' && (
                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[9px] font-black">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {recruiter.assigned_candidates_count} Candidates • {collegesVendorsTotal} Colleges & Vendors
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-4 px-3 font-mono font-bold text-slate-700">
                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-[11px] text-slate-800 border border-slate-200">
                          {recruiter.employee_id}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-3 text-slate-600 font-medium truncate max-w-[180px]" title={recruiter.email}>
                        {recruiter.email}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            recruiter.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              recruiter.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {recruiter.status}
                        </span>
                      </td>

                      {/* Assigned Candidates */}
                      <td className="py-4 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold border border-blue-100">
                          {recruiter.assigned_candidates_count}
                        </span>
                      </td>

                      {/* Assigned Colleges & Vendors */}
                      <td className="py-4 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-bold border border-indigo-100" title={`${recruiter.assigned_colleges_count || 0} Colleges, ${recruiter.assigned_vendors_count || 0} Vendors`}>
                          <span>{collegesVendorsTotal}</span>
                          <span className="text-[10px] font-medium text-indigo-500">
                            ({recruiter.assigned_colleges_count || 0}C / {recruiter.assigned_vendors_count || 0}V)
                          </span>
                        </span>
                      </td>

                      {/* Contacted */}
                      <td className="py-4 px-3 text-center font-bold text-purple-700">
                        {recruiter.contacted_count > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100">
                            {recruiter.contacted_count}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Shortlisted */}
                      <td className="py-4 px-3 text-center font-bold text-amber-700">
                        {recruiter.shortlisted_count > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100">
                            {recruiter.shortlisted_count}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Interview Scheduled */}
                      <td className="py-4 px-3 text-center font-bold text-indigo-700">
                        {recruiter.interview_scheduled_count > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                            {recruiter.interview_scheduled_count}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Selected */}
                      <td className="py-4 px-3 text-center font-bold text-emerald-700">
                        {recruiter.selected_count > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
                            {recruiter.selected_count}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Rejected */}
                      <td className="py-4 px-3 text-center font-bold text-rose-700">
                        {recruiter.rejected_count > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100">
                            {recruiter.rejected_count}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="py-4 px-3 text-center font-bold text-teal-700">
                        {recruiter.joined_count > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-100 font-extrabold">
                            {recruiter.joined_count}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="py-4 px-4 text-slate-500 min-w-[170px]">
                        {recruiter.last_activity ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 text-[11px] truncate max-w-[160px]">
                              {recruiter.last_activity.action_type}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{formatDateTime(recruiter.last_activity.created_at)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No activity yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/admin/recruiters-activity/${recruiter.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span>View Full Activity</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
