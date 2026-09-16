import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recruiterActivityService } from '../services/recruiterActivityService';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { formatDateTime, formatExactTime, formatExactDate } from '../utils/formatters';
import { RECRUITER_ACTION_TYPES, CANDIDATE_STATUSES } from '../utils/constants';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  PlusCircle,
  FileText,
  UserCheck,
  Award,
  XCircle,
  CalendarCheck,
  TrendingUp,
  Building,
  Tag,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  GraduationCap,
  School,
  Users
} from 'lucide-react';

export const RecruiterActivityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  // Main Data States
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Activities & Pagination
  const [activities, setActivities] = useState([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [channel, setChannel] = useState('ALL'); // ALL, candidate, college, vendor
  const [assignedViewTab, setAssignedViewTab] = useState('candidates'); // candidates, colleges, vendors
  const [dateRange, setDateRange] = useState('ALL'); // ALL, today, yesterday, last_7_days, last_30_days, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState('ALL');
  const [candidateStatus, setCandidateStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Dropdown options
  const [filterOptions, setFilterOptions] = useState({
    actionTypes: [],
    candidateStatuses: [],
    jobs: []
  });

  // Log Activity Modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logForm, setLogForm] = useState({
    action_type: 'Candidate contacted',
    candidate_name: '',
    candidate_id: '',
    job_name: '',
    previous_status: 'NEW',
    new_status: 'CONTACTED',
    description: ''
  });

  // Fetch recruiter overview & details
  const fetchOverview = useCallback(async () => {
    try {
      const data = await recruiterActivityService.getRecruiterDetails(id);
      setDetails(data);
    } catch (err) {
      console.error(err);
      error('Failed to load recruiter details');
      navigate('/admin/recruiters-activity', { replace: true });
    }
  }, [id, error, navigate]);

  // Fetch filter options
  const fetchOptions = useCallback(async () => {
    try {
      const opts = await recruiterActivityService.getFilterOptions(id);
      setFilterOptions(opts);
    } catch {
      // Non-fatal
    }
  }, [id]);

  // Fetch timeline activities with current filter state
  const fetchActivities = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const res = await recruiterActivityService.getRecruiterActivities(id, {
          page,
          page_size: pageSize,
          channel: channel !== 'ALL' ? channel : undefined,
          dateRange: dateRange !== 'ALL' ? dateRange : undefined,
          startDate: dateRange === 'custom' && startDate ? startDate : undefined,
          endDate: dateRange === 'custom' && endDate ? endDate : undefined,
          action_type: actionType !== 'ALL' ? actionType : undefined,
          job: selectedJob !== 'ALL' ? selectedJob : undefined,
          candidate_status: candidateStatus !== 'ALL' ? candidateStatus : undefined,
          search: search.trim() || undefined
        });

        setActivities(res.items || []);
        setTotalActivities(res.total || 0);
        setTotalPages(res.total_pages || 1);
      } catch (err) {
        console.error(err);
        error('Failed to load recruiter activity timeline');
      } finally {
        if (isRefresh) setRefreshing(false);
      }
    },
    [id, page, pageSize, channel, dateRange, startDate, endDate, actionType, selectedJob, candidateStatus, search, error]
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOverview(), fetchOptions()])
      .then(() => fetchActivities())
      .finally(() => setLoading(false));
  }, [id]);

  // Refetch activities on filter changes
  useEffect(() => {
    if (!loading) {
      fetchActivities();
    }
  }, [fetchActivities]);

  const handleResetFilters = () => {
    setChannel('ALL');
    setDateRange('ALL');
    setStartDate('');
    setEndDate('');
    setActionType('ALL');
    setSelectedJob('ALL');
    setCandidateStatus('ALL');
    setSearch('');
    setPage(1);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setLogSubmitting(true);
    try {
      const isCollegeAction = logForm.action_type.toLowerCase().includes('college') || logForm.action_type.toLowerCase().includes('mou');
      const isVendorAction = logForm.action_type.toLowerCase().includes('vendor');

      await recruiterActivityService.logActivity({
        recruiter_id: Number(id),
        recruiter_name: details?.profile?.name || 'Recruiter',
        action_type: logForm.action_type,
        candidate_name: !isCollegeAction && !isVendorAction ? logForm.candidate_name : undefined,
        candidate_id: !isCollegeAction && !isVendorAction ? logForm.candidate_id : undefined,
        job_name: isCollegeAction || isVendorAction 
          ? (logForm.job_name || logForm.candidate_name || 'Partner')
          : (logForm.job_name || (details?.assigned_jobs?.[0]?.company_name ? `${details.assigned_jobs[0].company_name} - ${details.assigned_jobs[0].job_role}` : 'General Role')),
        job_id: isCollegeAction || isVendorAction ? logForm.candidate_id : undefined,
        previous_status: !isCollegeAction && !isVendorAction ? logForm.previous_status : undefined,
        new_status: !isCollegeAction && !isVendorAction ? logForm.new_status : undefined,
        description: logForm.description
      });
      success('Activity record saved successfully!');
      setLogModalOpen(false);
      setLogForm({
        action_type: 'Candidate contacted',
        candidate_name: '',
        candidate_id: '',
        job_name: '',
        previous_status: 'NEW',
        new_status: 'CONTACTED',
        description: ''
      });
      fetchActivities(true);
      fetchOverview();
    } catch {
      error('Failed to log activity record');
    } finally {
      setLogSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <LoadingSpinner text="Loading recruiter profile and complete activity timeline..." />
      </div>
    );
  }

  if (!details) return null;

  const { profile, kpis, assigned_candidates = [], assigned_colleges = [], assigned_vendors = [], assigned_jobs = [] } = details;

  // Format action badges
  const getActionBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('mou')) {
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Award };
    }
    if (t.includes('college visit')) {
      return { bg: 'bg-teal-100 text-teal-800 border-teal-200', icon: School };
    }
    if (t.includes('college')) {
      return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: GraduationCap };
    }
    if (t.includes('vendor meeting')) {
      return { bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Briefcase };
    }
    if (t.includes('vendor')) {
      return { bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: Building };
    }
    if (t.includes('join') || t.includes('placed')) {
      return { bg: 'bg-teal-100 text-teal-800 border-teal-200', icon: CheckCircle2 };
    }
    if (t.includes('select')) {
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Award };
    }
    if (t.includes('interview')) {
      return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: CalendarCheck };
    }
    if (t.includes('shortlist') || t.includes('screen')) {
      return { bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: UserCheck };
    }
    if (t.includes('contact')) {
      return { bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: Phone };
    }
    if (t.includes('reject')) {
      return { bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle };
    }
    if (t.includes('add') || t.includes('assign')) {
      return { bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: PlusCircle };
    }
    return { bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: FileText };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/recruiters-activity"
            className="p-2.5 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-xs"
            title="Back to Recruiter List"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recruiter Activity</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-blue-600">{profile.name}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{profile.name}</span>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {profile.employee_id}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLogModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Activity</span>
          </button>
          <button
            onClick={() => fetchActivities(true)}
            disabled={refreshing}
            className="p-2.5 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Timeline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Recruiter Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Avatar & Identity */}
          <div className="lg:col-span-5 flex items-center gap-4.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 truncate">{profile.name}</h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    profile.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      profile.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {profile.status}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                  {profile.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {profile.phone}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-400 pt-0.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  Last Login:{' '}
                  <strong className="text-slate-700 font-semibold">
                    {profile.last_login ? formatDateTime(profile.last_login) : 'Never logged in'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Assigned Portfolio (Candidates, Colleges & Vendors) Tabbed Card */}
          <div className="lg:col-span-7 bg-slate-50/90 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAssignedViewTab('candidates')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    assignedViewTab === 'candidates'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Candidates</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    assignedViewTab === 'candidates' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {assigned_candidates.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignedViewTab('colleges_vendors')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    assignedViewTab === 'colleges_vendors' || assignedViewTab === 'colleges' || assignedViewTab === 'vendors'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Colleges & Vendors</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    assignedViewTab === 'colleges_vendors' || assignedViewTab === 'colleges' || assignedViewTab === 'vendors'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {assigned_colleges.length + assigned_vendors.length}
                  </span>
                </button>
              </div>

              {assignedViewTab === 'candidates' ? (
                <Link
                  to={`/candidates?assigned_to=${id}`}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>View All ({assigned_candidates.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <Link
                  to={`/recruiters?assigned_to=${id}`}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>View All ({assigned_colleges.length + assigned_vendors.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {assignedViewTab === 'candidates' ? (
              assigned_candidates.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400 italic mb-2">No candidates assigned to this recruiter yet.</p>
                  <Link
                    to="/candidates"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Assign Candidates</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                  {assigned_candidates.map((cand) => (
                    <Link
                      key={cand.id}
                      to={`/candidates/${cand.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs group"
                      title={`${cand.name} (${cand.candidate_id}) - ${cand.educational_qualification} | Status: ${cand.status} | Phone: ${cand.contact_number}`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-bold text-slate-900 truncate max-w-[150px] group-hover:text-blue-600">{cand.name}</span>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold">
                        {cand.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              (assigned_colleges.length === 0 && assigned_vendors.length === 0) ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400 italic mb-2">No colleges or vendors assigned to this recruiter yet.</p>
                  <Link
                    to="/recruiters"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>View Colleges & Vendors</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                  {assigned_colleges.map((col) => {
                    const isNgo = (col.college_type || '').toLowerCase().includes('ngo');
                    const isTraining = (col.college_type || '').toLowerCase().includes('training');
                    const badgeColor = isNgo
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isTraining
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    const label = col.college_type || 'College';

                    return (
                      <div
                        key={`col-${col.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs"
                        title={`[${label}] ${col.college_name} (${col.college_code}) - ${col.district} | SPOC: ${col.contact_person} (${col.mobile})`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold text-slate-900 truncate max-w-[150px]">{col.college_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${badgeColor}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                  {assigned_vendors.map((ven) => (
                    <div
                      key={`ven-${ven.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs"
                      title={`[Vendor] ${ven.vendor_name} (${ven.vendor_code}) - ${ven.district} | Contact: ${ven.contact_person} (${ven.mobile})`}
                    >
                      <Building className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">{ven.vendor_name}</span>
                      <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold border border-purple-200">
                        Vendor
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* KPI Section - Row 1: Assigned Portfolio & Activities Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Assigned Candidates */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Assigned Candidates</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{kpis.assigned_candidates_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In recruiter pool</div>
        </div>

        {/* 2. Assigned Colleges & Vendors */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs bg-gradient-to-b from-indigo-50/40 to-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">Colleges & Vendors</p>
            <Building className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {(kpis.assigned_colleges_count || 0) + (kpis.assigned_vendors_count || 0)}
          </div>
          <div className="text-[11px] text-indigo-500 mt-0.5">
            {kpis.assigned_colleges_count || 0} Colleges • {kpis.assigned_vendors_count || 0} Vendors
          </div>
        </div>

        {/* 3. Candidate Activities */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">Candidate Actions</p>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-900 mt-1">{kpis.candidate_activities_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged candidate events</div>
        </div>

        {/* 4. College & Vendor Activities */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">College & Vendor Actions</p>
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {(kpis.college_activities_count || 0) + (kpis.vendor_activities_count || 0)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {kpis.college_activities_count || 0} College • {kpis.vendor_activities_count || 0} Vendor logs
          </div>
        </div>
      </div>

      {/* KPI Section - Row 2: Candidate Recruitment Funnel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Contacted */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">Contacted</p>
          <div className="text-xl font-black text-purple-700 mt-1">{kpis.contacted}</div>
          <div className="text-[10px] text-purple-500 mt-0.5">
            {kpis.total_assigned > 0 ? `${Math.round((kpis.contacted / kpis.total_assigned) * 100)}% reached` : '0%'}
          </div>
        </div>

        {/* Shortlisted */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Shortlisted</p>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.shortlisted}</div>
          <div className="text-[10px] text-amber-500 mt-0.5">Profile screened</div>
        </div>

        {/* Interview Scheduled */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">Interviewed</p>
          <div className="text-xl font-black text-indigo-700 mt-1">{kpis.interview_scheduled}</div>
          <div className="text-[10px] text-indigo-500 mt-0.5">Rounds scheduled</div>
        </div>

        {/* Selected */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Selected</p>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.selected}</div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Offer stage</div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Rejected</p>
          <div className="text-xl font-black text-rose-700 mt-1">{kpis.rejected}</div>
          <div className="text-[10px] text-rose-400 mt-0.5">Declined / unmatched</div>
        </div>

        {/* Joined */}
        <div className="bg-white p-3.5 rounded-2xl border border-teal-200 shadow-xs bg-gradient-to-b from-teal-50/50 to-white">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600">Joined / Hired</p>
          <div className="text-xl font-black text-teal-700 mt-1">{kpis.joined}</div>
          <div className="text-[10px] font-bold text-teal-600 mt-0.5">{kpis.conversion_rate}% placement</div>
        </div>
      </div>

      {/* Activity Channel Tracking Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'ALL', label: 'All Activities', count: kpis.total_activities, icon: Layers, color: 'text-slate-700' },
          { id: 'candidate', label: 'Candidate Activity Tracking', count: kpis.candidate_activities_count, icon: Users, color: 'text-blue-700' },
          {
            id: 'colleges_vendors',
            label: 'Colleges & Vendors Activity Tracking',
            count: (kpis.college_activities_count || 0) + (kpis.vendor_activities_count || 0),
            icon: Building,
            color: 'text-indigo-700'
          }
        ].map((t) => {
          const TabIcon = t.icon;
          const isActive = channel === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setChannel(t.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isActive ? t.color : 'text-slate-400'}`} />
              <span>{t.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {t.count || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Panel for Timeline */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Date Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last_7_days', label: 'Last 7 Days' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom Range' }
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDateRange(d.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  dateRange === d.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {(dateRange !== 'ALL' || actionType !== 'ALL' || selectedJob !== 'ALL' || candidateStatus !== 'ALL' || search) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Custom Date Range Picker when custom selected */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
            <span className="text-xs font-bold text-slate-700">Custom Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>
        )}

        {/* Secondary Filters & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by candidate name or job */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search candidate or job name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Activity Type Filter */}
          <div>
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Activity Types</option>
              {RECRUITER_ACTION_TYPES.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Institution / Partner Filter */}
          <div>
            <select
              value={selectedJob}
              onChange={(e) => {
                setSelectedJob(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Associated Colleges / Institutions</option>
              {filterOptions.jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          {/* Candidate Status Filter */}
          <div>
            <select
              value={candidateStatus}
              onChange={(e) => {
                setCandidateStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Candidate Statuses</option>
              {CANDIDATE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recruiter Activity Timeline Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Activity History & Audit Trail ({totalActivities} Total Actions)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Page {page} of {totalPages}
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No activity records match your filter criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try broadening your date range or clearing filters.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {activities.map((act) => {
                const badge = getActionBadge(act.action_type);
                const IconComponent = badge.icon;
                const exactTime = formatExactTime(act.created_at);
                const exactDate = formatExactDate(act.created_at);

                return (
                  <div key={act.id} className="relative pl-6 group">
                    {/* Timeline Node Bullet */}
                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-500 group-hover:scale-110 flex items-center justify-center transition shadow-xs">
                      <IconComponent className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors" />
                    </div>

                    {/* Timeline Activity Card */}
                    <div className="bg-slate-50/70 hover:bg-white p-4.5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${badge.bg}`}
                          >
                            <IconComponent className="w-3 h-3" />
                            <span>{act.action_type}</span>
                          </span>

                          {act.previous_status && act.new_status && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                              <span className="text-slate-400">{act.previous_status}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="text-blue-700">{act.new_status}</span>
                            </div>
                          )}
                        </div>

                        {/* Date and Exact Time */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{exactDate}</span>
                          <span>•</span>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{exactTime}</span>
                        </div>
                      </div>

                      {/* Candidate, College, or Vendor Context */}
                      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-semibold text-slate-700 mb-2">
                        {act.candidate_name ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-normal">Candidate:</span>
                            <span className="font-extrabold text-blue-700">{act.candidate_name}</span>
                            {act.candidate_id && (
                              <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                {act.candidate_id}
                              </span>
                            )}
                          </div>
                        ) : (act.action_type || '').toLowerCase().includes('vendor') ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                              <Building className="w-3.5 h-3.5" />
                              <span>Vendor / Partner</span>
                            </span>
                            <span className="font-extrabold text-purple-900 text-sm">{act.job_name || 'Vendor Partner'}</span>
                            {act.job_id && (
                              <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                {act.job_id}
                              </span>
                            )}
                          </div>
                        ) : (act.action_type || '').toLowerCase().includes('college') || act.job_name ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>College / Institution</span>
                            </span>
                            <span className="font-extrabold text-indigo-900 text-sm">{act.job_name || 'College Partner'}</span>
                            {act.job_id && (
                              <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                {act.job_id}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {act.candidate_name ? (
                          act.candidate_college ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-normal">College:</span>
                              <span className="font-bold text-slate-800">{act.candidate_college}</span>
                            </div>
                          ) : null
                        ) : null}

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-normal">Logged by:</span>
                          <span className="font-bold text-slate-800">{act.recruiter_name}</span>
                        </div>
                      </div>

                      {/* Description & Relevant Details */}
                      {act.description && (
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/70 leading-relaxed font-normal">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-slate-100 mt-6 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Activity Log Modal */}
      {logModalOpen && (
        <Modal
          isOpen={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          title={`Log Recruiter Action: ${profile.name}`}
        >
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Action Type *
              </label>
              <select
                value={logForm.action_type}
                onChange={(e) => setLogForm({ ...logForm, action_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
                required
              >
                <optgroup label="College Actions">
                  <option value="College assigned">College assigned</option>
                  <option value="College updated">College updated</option>
                  <option value="College contacted">College contacted</option>
                  <option value="College visit completed">College visit completed</option>
                  <option value="College contact details updated">College contact details updated</option>
                  <option value="College status changed">College status changed</option>
                  <option value="College follow-up scheduled">College follow-up scheduled</option>
                  <option value="MOU signed">MOU signed</option>
                </optgroup>
                <optgroup label="Vendor Actions">
                  <option value="Vendor assigned">Vendor assigned</option>
                  <option value="Vendor updated">Vendor updated</option>
                  <option value="Vendor contacted">Vendor contacted</option>
                  <option value="Vendor meeting completed">Vendor meeting completed</option>
                  <option value="Vendor status changed">Vendor status changed</option>
                </optgroup>
                <optgroup label="Candidate Actions">
                  <option value="Candidate assigned">Candidate assigned</option>
                  <option value="Candidate status changed">Candidate status changed</option>
                  <option value="Candidate added">Candidate added</option>
                  <option value="Candidate updated">Candidate updated</option>
                  <option value="Candidate contacted">Candidate contacted</option>
                  <option value="Candidate shortlisted">Candidate shortlisted</option>
                  <option value="Interview scheduled">Interview scheduled</option>
                  <option value="Interview status updated">Interview status updated</option>
                  <option value="Candidate rejected">Candidate rejected</option>
                  <option value="Candidate selected">Candidate selected</option>
                  <option value="Candidate joined">Candidate joined</option>
                  <option value="Resume uploaded">Resume uploaded</option>
                  <option value="Job assigned">Job assigned</option>
                  <option value="Notes added">Notes added</option>
                </optgroup>
              </select>
            </div>

            {/* If College Action */}
            {logForm.action_type.toLowerCase().includes('college') || logForm.action_type.toLowerCase().includes('mou') ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      College Name *
                    </label>
                    <input
                      type="text"
                      list="assigned-colleges-list"
                      required
                      placeholder="Type or select college name..."
                      value={logForm.job_name}
                      onChange={(e) => setLogForm({ ...logForm, job_name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                    <datalist id="assigned-colleges-list">
                      {assigned_colleges.map((c) => (
                        <option key={c.id} value={c.college_name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      College Code / ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. REC-000045"
                      value={logForm.candidate_id}
                      onChange={(e) => setLogForm({ ...logForm, candidate_id: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : logForm.action_type.toLowerCase().includes('vendor') ? (
              /* If Vendor Action */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      list="assigned-vendors-list"
                      required
                      placeholder="Type or select vendor name..."
                      value={logForm.job_name}
                      onChange={(e) => setLogForm({ ...logForm, job_name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                    <datalist id="assigned-vendors-list">
                      {assigned_vendors.map((v) => (
                        <option key={v.id} value={v.vendor_name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Vendor Code / ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VEN-000012"
                      value={logForm.candidate_id}
                      onChange={(e) => setLogForm({ ...logForm, candidate_id: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* If Candidate Action */
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Candidate Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={logForm.candidate_name}
                      onChange={(e) => setLogForm({ ...logForm, candidate_name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Candidate ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CAN-000025"
                      value={logForm.candidate_id}
                      onChange={(e) => setLogForm({ ...logForm, candidate_id: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Associated College / Institution
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. K.L.N. College of Engineering"
                    value={logForm.job_name}
                    onChange={(e) => setLogForm({ ...logForm, job_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Previous Status
                    </label>
                    <select
                      value={logForm.previous_status}
                      onChange={(e) => setLogForm({ ...logForm, previous_status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      {CANDIDATE_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      New Status
                    </label>
                    <select
                      value={logForm.new_status}
                      onChange={(e) => setLogForm({ ...logForm, new_status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      {CANDIDATE_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Relevant Activity Details / Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Enter notes, outcome, interview details, meeting summary, or follow-up action..."
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLogModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={logSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
              >
                {logSubmitting ? 'Saving...' : 'Record Activity'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
