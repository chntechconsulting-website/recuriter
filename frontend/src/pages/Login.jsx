import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Briefcase, Lock, Mail, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('admin@jobfair.com');
  const [password, setPassword] = useState('Admin@123Password');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ username, password, remember_me: rememberMe });
      success('Logged in successfully. Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      error(err.response?.data?.detail || 'Invalid email/username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 text-white font-black mb-4">
            <Briefcase className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Recruiter Lead Portal
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
            Job Fair & Campus Recruitment Cell
          </p>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@jobfair.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/30"
                />
                Remember Me
              </label>
              <span className="text-slate-500 font-semibold">JWT Auth</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin@jobfair.com');
                  setPassword('Admin@123Password');
                }}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-left hover:border-blue-500 transition group"
              >
                <p className="font-bold text-white group-hover:text-blue-400">Admin</p>
                <p className="text-[10px] text-slate-500 truncate">admin@jobfair.com</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('rahul.verma@jobfair.com');
                  setPassword('Staff@123Password');
                }}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-left hover:border-blue-500 transition group"
              >
                <p className="font-bold text-white group-hover:text-blue-400">Staff</p>
                <p className="text-[10px] text-slate-500 truncate">rahul.verma@jobfair.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
