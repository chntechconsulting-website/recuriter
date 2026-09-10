import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { followUpService } from '../services/followUpService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarCheck,
  Building,
  Phone,
  Trash2
} from 'lucide-react';

export const FollowUps = () => {
  const { isAdmin } = useAuth();
  const [followups, setFollowups] = useState([]);
  const [category, setCategory] = useState('all'); // all, today, upcoming, overdue, completed
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await followUpService.getFollowUps({
        category: category !== 'all' ? category : undefined
      });
      setFollowups(data);
    } catch {
      error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [category, error]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await followUpService.updateFollowUp(id, { status: newStatus });
      success(`Follow-up marked as ${newStatus}`);
      fetchFollowups();
    } catch {
      error('Failed to update follow-up status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await followUpService.deleteFollowUp(id);
      success('Follow-up deleted');
      fetchFollowups();
    } catch {
      error('Failed to delete follow-up');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Follow-up Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage scheduled calls, meetings, and interview confirmations</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Follow-ups', icon: CalendarClock },
          { key: 'today', label: "Today's", icon: Clock, color: 'text-amber-600' },
          { key: 'upcoming', label: 'Upcoming', icon: CalendarCheck, color: 'text-blue-600' },
          { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-rose-600' },
          { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                category === tab.key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color || ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        {loading ? (
          <LoadingSpinner text="Fetching follow-ups..." />
        ) : followups.length === 0 ? (
          <EmptyState
            title="No follow-ups found"
            description="There are no follow-ups under this category."
            icon={CalendarClock}
          />
        ) : (
          <div className="space-y-3">
            {followups.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-100/60 transition"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/recruiters/${f.recruiter_id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 text-sm"
                    >
                      {f.recruiter_company || 'Recruiter'}
                    </Link>
                    {f.lead_id && (
                      <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {f.lead_id}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                      {f.follow_up_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      f.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {f.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    Scheduled on <span className="font-bold text-slate-900">{formatDate(f.follow_up_date)}</span> at {f.follow_up_time || '11:00 AM'}
                    {f.recruiter_name && ` • Recruiter: ${f.recruiter_name}`}
                    {f.recruiter_mobile && ` (${f.recruiter_mobile})`}
                  </p>

                  {f.notes && (
                    <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-100 mt-2">
                      {f.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => handleToggleComplete(f.id, f.status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                      f.status === 'Completed'
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {f.status === 'Completed' ? 'Reopen' : 'Mark Done'}
                  </button>

                  <Link
                    to={`/recruiters/${f.recruiter_id}`}
                    className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition"
                    title="View Recruiter Profile"
                  >
                    <Building className="w-4 h-4" />
                  </Link>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                      title="Delete Follow-up"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
