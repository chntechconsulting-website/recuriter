import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { recruiterService } from '../services/recruiterService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  TrendingUp
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const Reports = () => {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.getAnalytics(startDate, endDate);
      setData(res);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading && !data) return <LoadingSpinner text="Generating executive analytics..." />;

  const statusChartData = {
    labels: (data?.by_status || []).map((s) => s.status),
    datasets: [
      {
        label: 'Recruiter Companies',
        data: (data?.by_status || []).map((s) => s.count),
        backgroundColor: '#3B82F6',
        borderRadius: 8,
      },
      {
        label: 'Candidate Openings',
        data: (data?.by_status || []).map((s) => s.candidates),
        backgroundColor: '#10B981',
        borderRadius: 8,
      },
    ],
  };

  const districtChartData = {
    labels: (data?.by_district || []).slice(0, 8).map((d) => d.district),
    datasets: [
      {
        label: 'Recruiters Count',
        data: (data?.by_district || []).slice(0, 8).map((d) => d.count),
        backgroundColor: '#6366F1',
        borderRadius: 8,
      },
    ],
  };

  const industryChartData = {
    labels: (data?.by_industry || []).slice(0, 6).map((i) => i.industry),
    datasets: [
      {
        data: (data?.by_industry || []).slice(0, 6).map((i) => i.count),
        backgroundColor: [
          '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#14B8A6'
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Executive Reports & Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">Statistical breakdown and exportable metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={recruiterService.exportRecruitersUrl('xlsx')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition"
          >
            <Download className="w-4 h-4" /> Export Report (Excel)
          </a>
          <a
            href={recruiterService.exportRecruitersUrl('csv')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Clear Dates
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 font-medium">Auto-aggregated from live database records</span>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Follow-ups</p>
            <h4 className="text-2xl font-black text-slate-900">{data?.follow_ups_summary?.completed || 0}</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Follow-ups</p>
            <h4 className="text-2xl font-black text-amber-600">{data?.follow_ups_summary?.pending || 0}</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Follow-ups</p>
            <h4 className="text-2xl font-black text-rose-600">{data?.follow_ups_summary?.overdue || 0}</h4>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Recruiters & Vacancy Demands by Status</h3>
          <p className="text-xs text-slate-400 mb-4">Comparing recruiter volume against total candidate requirements</p>
          <div className="h-64">
            <Bar
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                },
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Recruiters by Industry Sector</h3>
          <p className="text-xs text-slate-400 mb-4">Sectoral demand distribution</p>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={industryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } },
                },
                cutout: '60%',
              }}
            />
          </div>
        </div>
      </div>

      {/* District & Source Table Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">District Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">District</th>
                  <th className="p-3 text-right">Recruiters</th>
                  <th className="p-3 text-right">Candidates Demand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(data?.by_district || []).map((d) => (
                  <tr key={d.district} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-800">{d.district}</td>
                    <td className="p-3 text-right text-blue-600 font-bold">{d.count}</td>
                    <td className="p-3 text-right text-emerald-600 font-bold">{d.candidates.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Lead Sourcing Effectiveness</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Source Channel</th>
                  <th className="p-3 text-right">Recruiters Attracted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(data?.by_source || []).map((s) => (
                  <tr key={s.source} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-800">{s.source}</td>
                    <td className="p-3 text-right text-indigo-600 font-bold">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
