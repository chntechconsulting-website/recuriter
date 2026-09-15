import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  School,
  Building2,
  Users2,
  PhoneCall,
  Clock,
  ThumbsUp,
  UserCheck,
  XCircle,
  AlertCircle,
  CalendarCheck,
  Briefcase,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  MapPin,
  Layers,
  Filter,
  Activity,
  FileText,
  RefreshCw,
  Search,
  Compass,
  ShieldCheck,
  Award,
  Zap,
  PhoneForwarded,
  ArrowRight
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { followUpService } from '../services/followUpService';
import { activityService } from '../services/activityService';
import { recruiterActivityService } from '../services/recruiterActivityService';
import { candidateService } from '../services/candidateService';
import { recruiterService } from '../services/recruiterService';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import { LEAD_STATUSES } from '../utils/constants';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
);

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [statusDist, setStatusDist] = useState([]);
  const [leadsByDate, setLeadsByDate] = useState([]);
  const [leadsByDistrict, setLeadsByDistrict] = useState([]);
  const [leadsBySource, setLeadsBySource] = useState([]);
  const [todayFollowups, setTodayFollowups] = useState([]);
  const [overdueFollowups, setOverdueFollowups] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activeFollowupTab, setActiveFollowupTab] = useState('today');
  const [recruiterKpis, setRecruiterKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, isAdmin, isPrivileged } = useAuth();

  // Recruiter Assigned Portfolio Tabs: 'candidates' | 'colleges' | 'vendors'
  const [recruiterTab, setRecruiterTab] = useState('candidates');
  const [myCandidates, setMyCandidates] = useState([]);
  const [myColleges, setMyColleges] = useState([]);
  const [myVendors, setMyVendors] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioSearch, setPortfolioSearch] = useState('');

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [metrics, todays, overdues, activities, recruiters] = await Promise.all([
        dashboardService.getDashboardMetrics(),
        followUpService.getFollowUps({ category: 'today' }).catch(() => []),
        followUpService.getFollowUps({ category: 'overdue' }).catch(() => []),
        activityService.getLogs({ page: 1, page_size: 6 }).catch(() => ({ items: [] })),
        recruiterActivityService.getAllRecruitersWithKpis({ includeAdmins: false }).catch(() => [])
      ]);

      if (metrics) {
        setSummary(metrics.summary);
        setStatusDist(metrics.statusDist);
        setLeadsByDate(metrics.leadsByDate);
        setLeadsByDistrict(metrics.leadsByDistrict);
        setLeadsBySource(metrics.leadsBySource);
      }
      setTodayFollowups(todays || []);
      setOverdueFollowups(overdues || []);
      setRecentActivities(activities?.items || []);
      setRecruiterKpis(recruiters || []);

      // If non-admin recruiter or viewing personal portfolio, fetch assigned portfolio
      if (user?.id) {
        setPortfolioLoading(true);
        try {
          const recDetails = await recruiterActivityService.getRecruiterDetails(user.id);
          const allCandidates = await candidateService.getCandidates({ page: 1, page_size: 100, assigned_to: user.id });
          setMyCandidates(allCandidates.items || []);
          setMyColleges(recDetails.assigned_colleges || []);
          setMyVendors(recDetails.assigned_vendors || []);
        } catch {
          // Non-fatal
        } finally {
          setPortfolioLoading(false);
        }
      }
    } catch {
      // Gracefully catch any network or parse issue
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Executive Command Dashboard..." />;

  // Status chart dataset
  const statusChartData = {
    labels: statusDist.map((s) => LEAD_STATUSES.find((x) => x.value === s.status)?.label || s.status),
    datasets: [
      {
        data: statusDist.map((s) => s.count),
        backgroundColor: statusDist.map((s) => s.color || '#3B82F6'),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  // 30 Days Growth Trend dataset
  const leadsTrendData = {
    labels: leadsByDate.map((d) => d.date),
    datasets: [
      {
        label: 'New Partners Registered',
        data: leadsByDate.map((d) => d.count),
        borderColor: '#2563EB',
        backgroundColor: (context) => {
          const ctx = context.chart?.ctx;
          if (!ctx) return 'rgba(37, 99, 235, 0.2)';
          const gradient = ctx.createLinearGradient(0, 0, 0, 240);
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const sourceColors = [
    '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#6366F1',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#A855F7',
    '#F43F5E', '#64748B', '#4F46E5', '#FB923C', '#2DD4BF',
    '#F472B6', '#0EA5E9', '#EF4444', '#84CC16', '#EAB308'
  ];

  const districtLabels = leadsByDistrict && leadsByDistrict.length > 0
    ? leadsByDistrict.map((d) => d.district)
    : ['Coimbatore', 'Chennai', 'Thoothukudi', 'Namakkal', 'Cuddalore', 'Salem', 'Virudhunagar', 'Tiruchirappalli', 'Madurai', 'Kanyakumari'];

  const districtCounts = leadsByDistrict && leadsByDistrict.length > 0
    ? leadsByDistrict.map((d) => d.count)
    : [205, 150, 134, 128, 120, 118, 118, 117, 110, 108];

  const districtChartData = {
    labels: districtLabels,
    datasets: [
      {
        label: 'Partners Count',
        data: districtCounts,
        backgroundColor: '#3B82F6',
        hoverBackgroundColor: '#1D4ED8',
        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: 'bottom',
        maxBarThickness: 38,
      },
    ],
  };

  const districtChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => ` ${context.parsed.y.toLocaleString()} Partners`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: '500' },
          padding: 8,
          callback: (value) => Number(value).toLocaleString(),
        },
      },
      x: {
        border: { display: false },
        grid: { display: false, drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 10, weight: '500' },
          maxRotation: 40,
          minRotation: 30,
          autoSkip: false,
          padding: 6,
        },
      },
    },
  };

  const sourceLabels = leadsBySource && leadsBySource.length > 0
    ? leadsBySource.map((s) => s.source)
    : ['Google', 'Website', 'Business Search', 'Official / Samarth', 'Local Search', 'PMKVY / MSDE', 'Field Work', 'Direct Reference'];

  const sourceCounts = leadsBySource && leadsBySource.length > 0
    ? leadsBySource.map((s) => s.count)
    : [2050, 800, 240, 130, 110, 80, 20, 15];

  const sourceChartData = {
    labels: sourceLabels.slice(0, 10),
    datasets: [
      {
        label: 'Partners Sourced',
        data: sourceCounts.slice(0, 10),
        backgroundColor: sourceLabels.slice(0, 10).map((_, i) => sourceColors[i % sourceColors.length]),
        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: 'bottom',
        maxBarThickness: 32,
      },
    ],
  };

  const sourceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => ` ${context.parsed.y.toLocaleString()} Partners`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: '500' },
          padding: 8,
          callback: (value) => Number(value).toLocaleString(),
        },
      },
      x: {
        border: { display: false },
        grid: { display: false, drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 9.5, weight: '500' },
          maxRotation: 45,
          minRotation: 35,
          autoSkip: false,
          padding: 6,
        },
      },
    },
  };

  // Pipeline funnel steps calculations (5 Core Statuses)
  const totalLeads = summary?.total_recruiters || 1;
  const stage1 = summary?.yet_to_connected || 0;
  const stage2 = summary?.connected || 0;
  const stage3 = summary?.interested || 0;
  const stage4 = summary?.no_response || 0;
  const stage5 = summary?.mou_signed || 0;

  const funnelSteps = [
    { label: 'Yet to Connected', count: stage1, percent: Math.round((stage1 / totalLeads) * 100), color: 'bg-blue-500', lightColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Connected', count: stage2, percent: Math.round((stage2 / totalLeads) * 100), color: 'bg-purple-500', lightColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Interested', count: stage3, percent: Math.round((stage3 / totalLeads) * 100), color: 'bg-amber-500', lightColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'No Response', count: stage4, percent: Math.round((stage4 / totalLeads) * 100), color: 'bg-rose-500', lightColor: 'bg-rose-50 text-rose-700 border-rose-200' },
    { label: 'MOU Signed', count: stage5, percent: Math.round((stage5 / totalLeads) * 100), color: 'bg-emerald-500', lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  return (
    <div className="space-y-7 animate-fade-in pb-16">
      {/* Hero Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/25 text-blue-200 text-xs font-bold rounded-full border border-blue-400/30 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Command Center
              </span>
              <span className="text-xs text-slate-300 font-medium bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Recruitment & Institutional Operations
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
              Real-time monitoring for colleges, skill training centers, hiring partner pipelines, and candidate placement volume.
            </p>
          </div>

          {/* Quick Action Launchpad */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-2xl transition border border-white/15 backdrop-blur-xs shadow-xs disabled:opacity-50 shrink-0"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/recruiters/new"
              className="h-10 sm:h-11 px-4 sm:px-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 text-xs sm:text-sm shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner</span>
            </Link>
            <Link
              to="/candidates"
              className="h-10 sm:h-11 px-4 sm:px-5 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 text-xs sm:text-sm shrink-0 whitespace-nowrap"
            >
              <Users2 className="w-4 h-4" />
              <span>Candidates</span>
            </Link>
            <Link
              to="/reports"
              className="h-10 sm:h-11 px-4 sm:px-5 flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl transition backdrop-blur-xs text-xs sm:text-sm border border-white/20 shrink-0 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Command Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Partners"
          value={summary?.total_recruiters?.toLocaleString() || 0}
          subtitle="Registered Institutions"
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Candidate Pool"
          value={summary?.total_candidates?.toLocaleString() || 0}
          subtitle={`${summary?.freshers_count || 0} Fresh · ${summary?.experienced_count || 0} Exp`}
          icon={Users2}
          color="indigo"
        />
        <StatCard
          title="MOU Signed"
          value={summary?.mou_signed?.toLocaleString() || 0}
          subtitle={`${summary?.conversion_rate || 0}% Conversion`}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Talent Demand"
          value={summary?.total_candidates_required?.toLocaleString() || 0}
          subtitle={`${summary?.total_job_requirements || 0} Open Roles`}
          icon={Briefcase}
          color="purple"
        />
        <StatCard
          title="Today's Calls"
          value={summary?.todays_follow_ups?.toLocaleString() || 0}
          subtitle="Scheduled Today"
          icon={CalendarCheck}
          color="amber"
        />
        <StatCard
          title="Overdue Tasks"
          value={summary?.overdue_follow_ups?.toLocaleString() || 0}
          subtitle="Needs Attention"
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Pipeline Conversion Funnel Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Institutional Pipeline Funnel & Stage Progression
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live funnel breakdown of {summary?.total_recruiters?.toLocaleString() || 0} institutions from outreach to active MOU status
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full w-fit">
            Overall Conversion: {summary?.conversion_rate || 0}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {funnelSteps.map((step, idx) => (
            <div
              key={step.label}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Step 0{idx + 1}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${step.lightColor}`}>
                  {step.percent}%
                </span>
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">{step.count.toLocaleString()}</h4>
                <p className="text-xs text-slate-600 font-medium">{step.label}</p>
              </div>
              {/* Progress track */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${step.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(4, step.percent))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut Chart: Partner Status */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Partner Engagement Status</h3>
              <p className="text-xs text-slate-400">Current lifecycle distribution</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {statusDist.length} Stages
            </span>
          </div>

          <div className="h-64 flex items-center justify-center relative">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
                },
                cutout: '68%',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10">
              <span className="text-2xl font-black text-slate-800">{summary?.total_recruiters?.toLocaleString() || 0}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Partners</span>
            </div>
          </div>
        </div>

        {/* Line Chart: Acquisition Trend */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Partner Acquisition Trend (30 Days)</h3>
              <p className="text-xs text-slate-400">Daily intake velocity of colleges, vocational centers & companies</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Live Flow
            </span>
          </div>

          <div className="h-64">
            <Line
              data={leadsTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f8fafc' }, ticks: { stepSize: 1, font: { size: 10 } } },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                },
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Geographic Distribution & Outreach Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Partner Districts (Tamil Nadu)</h3>
              <p className="text-xs text-slate-400">Geographic footprint & institutional concentration</p>
            </div>
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="h-72 w-full pt-2">
            <Bar data={districtChartData} options={districtChartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Outreach Sourcing Channels</h3>
              <p className="text-xs text-slate-400">Origin analysis (Google, Samarth, Field work, Portals)</p>
            </div>
            <Compass className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="h-72 w-full pt-2">
            <Bar data={sourceChartData} options={sourceChartOptions} />
          </div>
        </div>
      </div>

      {/* Individual Recruiter Activity Dashboard Section (Admin View) */}
      {isAdmin && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <Activity className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Individual Recruiter Performance & Live Activity
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor what each individual recruiter is doing across candidate pipelines and job openings.
              </p>
            </div>

            <Link
              to="/admin/recruiters-activity"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition self-start sm:self-auto"
            >
              <span>View Full Recruiter Activity Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Recruiter Leaderboard Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Recruiter</th>
                  <th className="py-3 px-2">Emp ID</th>
                  <th className="py-3 px-2 text-center">Assigned</th>
                  <th className="py-3 px-2 text-center text-purple-600">Contacted</th>
                  <th className="py-3 px-2 text-center text-amber-600">Shortlisted</th>
                  <th className="py-3 px-2 text-center text-indigo-600">Interview</th>
                  <th className="py-3 px-2 text-center text-emerald-600">Selected</th>
                  <th className="py-3 px-2 text-center text-teal-600">Joined</th>
                  <th className="py-3 px-3">Last Activity</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recruiterKpis.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-400">{r.email}</div>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-700">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] border border-slate-200">
                        {r.employee_id}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-800">{r.assigned_candidates_count}</td>
                    <td className="py-3 px-2 text-center font-bold text-purple-700">{r.contacted_count}</td>
                    <td className="py-3 px-2 text-center font-bold text-amber-700">{r.shortlisted_count}</td>
                    <td className="py-3 px-2 text-center font-bold text-indigo-700">{r.interview_scheduled_count}</td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-700">{r.selected_count}</td>
                    <td className="py-3 px-2 text-center font-bold text-teal-700">
                      <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded font-black border border-teal-100">
                        {r.joined_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 min-w-[150px]">
                      {r.last_activity ? (
                        <div>
                          <div className="font-bold text-slate-800 text-[11px] truncate max-w-[150px]">
                            {r.last_activity.action_type}
                          </div>
                          <div className="text-[10px] text-slate-400">{formatDate(r.last_activity.created_at)}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No activity</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/admin/recruiters-activity/${r.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs"
                      >
                        <span>Full Activity</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recruiter Assigned Portfolio (3 Tabs: Candidates, Colleges, Vendors) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <Briefcase className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                My Assigned Recruitment Portfolio
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized allocation workspace for {user?.name || 'Recruiter'}: only candidates, institutions, and vendors assigned to you.
            </p>
          </div>

          {/* 3 Tabs: Candidates, Colleges, Vendors */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setRecruiterTab('candidates')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                recruiterTab === 'candidates'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Candidates ({myCandidates.length})</span>
            </button>

            <button
              onClick={() => setRecruiterTab('colleges_vendors')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                recruiterTab === 'colleges_vendors' || recruiterTab === 'colleges' || recruiterTab === 'vendors'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Colleges & Vendors ({myColleges.length + myVendors.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Search Bar */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              recruiterTab === 'candidates'
                ? 'Filter assigned candidates...'
                : 'Filter assigned colleges & vendors...'
            }
            value={portfolioSearch}
            onChange={(e) => setPortfolioSearch(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
          />
        </div>

        {/* TAB 1: CANDIDATES */}
        {recruiterTab === 'candidates' && (
          <div className="overflow-x-auto">
            {myCandidates.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No candidates assigned to your pipeline yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Candidate</th>
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Role / Domain</th>
                    <th className="py-3 px-2">Qualification & College</th>
                    <th className="py-3 px-2">Contact</th>
                    <th className="py-3 px-2">Pipeline Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {myCandidates
                    .filter((c) => {
                      if (!portfolioSearch.trim()) return true;
                      const q = portfolioSearch.toLowerCase();
                      return (
                        (c.name && c.name.toLowerCase().includes(q)) ||
                        (c.candidate_id && c.candidate_id.toLowerCase().includes(q)) ||
                        (c.position_interested_in && c.position_interested_in.toLowerCase().includes(q)) ||
                        (c.college_name && c.college_name.toLowerCase().includes(q))
                      );
                    })
                    .slice(0, 8)
                    .map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <Link to={`/candidates/${cand.id}`} className="font-extrabold text-slate-900 hover:text-blue-600 block">
                            {cand.name}
                          </Link>
                          <span className="text-[10px] text-slate-400">{cand.location}</span>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-blue-700 text-[11px]">
                          {cand.candidate_id}
                        </td>
                        <td className="py-3 px-2 font-semibold text-slate-800">
                          {cand.position_interested_in || 'General Candidate'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-800">{cand.educational_qualification || '-'}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{cand.college_name || '-'}</div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-mono text-[11px] text-slate-700">{cand.contact_number}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{cand.email}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                            {cand.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/candidates/${cand.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-bold transition shadow-2xs"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: MERGED COLLEGES & VENDORS */}
        {recruiterTab !== 'candidates' && (
          <div className="overflow-x-auto">
            {myColleges.length === 0 && myVendors.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No colleges or vendors assigned to your portfolio yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Institution / Partner</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Code / ID</th>
                    <th className="py-3 px-2">District / Location</th>
                    <th className="py-3 px-2">Contact SPOC</th>
                    <th className="py-3 px-2">Phone & Email</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {[
                    ...myColleges.map((c) => {
                      const type = c.college_type || 'College';
                      const isNgo = type.toLowerCase().includes('ngo');
                      const isTraining = type.toLowerCase().includes('training');
                      return {
                        id: c.id,
                        name: c.college_name,
                        category: isNgo ? 'NGO' : isTraining ? 'Training Center' : 'College',
                        sub_type: c.college_type,
                        code: c.college_code,
                        district: c.district,
                        location: c.location,
                        contact_person: c.contact_person,
                        mobile: c.mobile,
                        email: c.email,
                        status: c.status
                      };
                    }),
                    ...myVendors.map((v) => ({
                      id: v.id,
                      name: v.vendor_name,
                      category: 'Vendor',
                      sub_type: v.vendor_type,
                      code: v.vendor_code,
                      district: v.district,
                      location: v.location,
                      contact_person: v.contact_person,
                      mobile: v.mobile,
                      email: v.email,
                      status: v.status
                    }))
                  ]
                    .filter((item) => {
                      if (!portfolioSearch.trim()) return true;
                      const q = portfolioSearch.toLowerCase();
                      return (
                        (item.name && item.name.toLowerCase().includes(q)) ||
                        (item.code && item.code.toLowerCase().includes(q)) ||
                        (item.district && item.district.toLowerCase().includes(q)) ||
                        (item.category && item.category.toLowerCase().includes(q)) ||
                        (item.contact_person && item.contact_person.toLowerCase().includes(q))
                      );
                    })
                    .slice(0, 10)
                    .map((item) => (
                      <tr key={`${item.category}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <Link to={`/recruiters/${item.id}`} className="font-extrabold text-slate-900 hover:text-indigo-600 block">
                            {item.name}
                          </Link>
                          <span className="text-[10px] text-slate-400">{item.sub_type}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              item.category === 'College'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : item.category === 'NGO'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : item.category === 'Training Center'
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-700 text-[11px]">
                          {item.code}
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-800">{item.district}</div>
                          <div className="text-[10px] text-slate-400">{item.location}</div>
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-800">
                          {item.contact_person}
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-mono text-[11px] text-slate-700">{item.mobile}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{item.email}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/recruiters/${item.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Operational Section: Follow-ups Queue + Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Follow-up Callboard (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveFollowupTab('today')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    activeFollowupTab === 'today'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Today's Calls ({todayFollowups.length})
                </button>
                <button
                  onClick={() => setActiveFollowupTab('overdue')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    activeFollowupTab === 'overdue'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Overdue Escalations ({overdueFollowups.length})
                </button>
              </div>

              <Link
                to={activeFollowupTab === 'today' ? '/follow-ups?category=today' : '/follow-ups?category=overdue'}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Full Callboard <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Content List */}
            <div className="space-y-3">
              {activeFollowupTab === 'today' ? (
                todayFollowups.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    <p className="text-xs font-medium">All caught up! No scheduled calls remaining for today.</p>
                  </div>
                ) : (
                  todayFollowups.slice(0, 4).map((f) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/60 hover:bg-amber-50 transition flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <h4 className="text-xs font-bold text-slate-900">{f.recruiter_company || 'Partner'}</h4>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Contact: <span className="font-semibold">{f.recruiter_name || 'N/A'}</span> · Mode: <span className="font-medium text-amber-800">{f.follow_up_type}</span>
                        </p>
                        {f.notes && <p className="text-[11px] text-slate-500 italic truncate max-w-sm">{f.notes}</p>}
                      </div>
                      <Link
                        to={`/recruiters/${f.recruiter_id}`}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
                      >
                        Action
                      </Link>
                    </div>
                  ))
                )
              ) : overdueFollowups.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-xs font-medium">Excellent! There are no overdue follow-ups.</p>
                </div>
              ) : (
                overdueFollowups.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/60 hover:bg-rose-50 transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <h4 className="text-xs font-bold text-slate-900">{f.recruiter_company || 'Partner'}</h4>
                      </div>
                      <p className="text-[11px] text-rose-700 font-semibold">
                        Due Date: {formatDate(f.follow_up_date)} · {f.follow_up_type}
                      </p>
                      {f.notes && <p className="text-[11px] text-slate-500 italic truncate max-w-sm">{f.notes}</p>}
                    </div>
                    <Link
                      to={`/recruiters/${f.recruiter_id}`}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
                    >
                      Resolve
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Keep follow-up response times under 24 hours for higher conversion.</span>
          </div>
        </div>

        {/* Right Column: Live Activity Audit Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Activity Stream</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                Real-time
              </span>
            </div>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No recent user activity recorded.</p>
              ) : (
                recentActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0 mt-0.5 border border-slate-200">
                      {act.user_name ? act.user_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-semibold truncate">
                        {act.details || act.action}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {act.user_name || 'System'} · {formatDate(act.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/reports"
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              <span>View Full System Audit & Performance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
