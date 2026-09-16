import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  GraduationCap,
  UserCheck,
  PlusCircle,
  Calendar,
  FileSpreadsheet,
  BarChart2,
  Users,
  History,
  Settings,
  LogOut,
  Activity
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    ...(isAdmin ? [
      { to: '/admin/recruiters-activity', icon: Activity, label: 'Recruiter Activity' }
    ] : []),
    { to: '/recruiters', icon: GraduationCap, label: 'Colleges & Vendors' },
    { to: '/candidates', icon: UserCheck, label: 'Candidate Pool' },
    { to: '/follow-ups', icon: Calendar, label: 'Follow-ups' },
    { to: '/import', icon: FileSpreadsheet, label: 'Bulk Import Data' },
    { to: '/reports', icon: BarChart2, label: 'Reports & Analytics' },
    ...(isAdmin ? [
      { to: '/users', icon: Users, label: 'Staff Management' },
      { to: '/activity-logs', icon: History, label: 'Activity Logs' }
    ] : []),
    { to: '/settings', icon: Settings, label: 'System Settings' },
  ];

  const isItemActive = (to) => {
    const currentPath = location.pathname;
    if (to === '/dashboard') {
      return currentPath === '/dashboard' || currentPath === '/';
    }
    if (to === '/recruiters') {
      return currentPath.startsWith('/recruiters');
    }
    if (to === '/candidates') {
      return currentPath.startsWith('/candidates');
    }
    return currentPath === to || currentPath.startsWith(`${to}/`);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#030712] border-r border-slate-900/80 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-900/90">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/25 text-white shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide text-white uppercase leading-tight">
                EduVendor Lead
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                College & Vendor Portal
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs transition-all duration-150 ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                      : 'text-slate-400 font-semibold hover:text-white hover:bg-slate-900/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out */}
        <div className="p-5 border-t border-slate-900/90 bg-[#030712]">
          <div className="mb-3 px-1">
            <p className="text-xs font-bold text-white truncate">
              {user?.name || 'System Administrator'}
            </p>
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">
              {user?.role || 'ADMIN'}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0a1120] hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80 rounded-2xl text-xs font-bold transition shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
