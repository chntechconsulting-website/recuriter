import React from 'react';
import { Menu, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onOpenSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Tamil Nadu Placement & Skill Development Mission</span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Live Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-right">
          <div>
            <p className="font-bold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
