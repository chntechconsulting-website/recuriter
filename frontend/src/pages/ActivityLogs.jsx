import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { activityService } from '../services/activityService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Pagination } from '../components/common/Pagination';
import { formatDateTime } from '../utils/formatters';
import { History, ShieldAlert, Filter, User, Clock } from 'lucide-react';

export const ActivityLogs = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activityService.getLogs({
        page,
        page_size: pageSize,
        module: moduleFilter !== 'ALL' ? moduleFilter : undefined
      });
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, moduleFilter]);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [fetchLogs, isAdmin]);
  if (authLoading) {
    return (
      <div className="py-16 text-center">
        <LoadingSpinner text="Checking authorization..." />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Trail & Activity Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Immutable record of all lead changes, status transitions, imports, and user logins</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">All Modules</option>
            <option value="Leads">Leads</option>
            <option value="Follow-ups">Follow-ups</option>
            <option value="Communications">Communications</option>
            <option value="Auth">Auth & Login</option>
            <option value="Import">Data Import</option>
            <option value="Export">Data Export</option>
            <option value="Users">Users</option>
            <option value="Settings">Settings</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching audit logs..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Record Ref</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800">{log.user_name || 'System'}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-blue-700">{log.action}</td>
                    <td className="p-4 font-mono font-semibold text-slate-600">
                      {log.record_id || '-'}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
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
    </div>
  );
};
