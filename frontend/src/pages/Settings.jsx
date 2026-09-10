import React, { useState, useEffect } from 'react';
import { settingService } from '../services/settingService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Settings as SettingsIcon, Shield, Lock, Save, CheckCircle2 } from 'lucide-react';

export const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    settingService.getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await settingService.updateSettings(settings);
      success('System configuration saved successfully');
    } catch {
      error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      error('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 6) {
      error('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      success('Password changed successfully!');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading system parameters..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System Settings & Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">System preferences, portal branding, and security parameters</p>
          </div>
        </div>
      </div>

      {/* System Settings Form (Admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Shield className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Organization & Portal Configurations</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Organization / Mission Name
                </label>
                <input
                  type="text"
                  name="organization_name"
                  value={settings.organization_name || ''}
                  onChange={handleSettingChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Portal Title
                </label>
                <input
                  type="text"
                  name="portal_title"
                  value={settings.portal_title || ''}
                  onChange={handleSettingChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={settings.contact_email || ''}
                  onChange={handleSettingChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Helpline Phone
                </label>
                <input
                  type="text"
                  name="contact_phone"
                  value={settings.contact_phone || ''}
                  onChange={handleSettingChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lead ID Prefix
                </label>
                <input
                  type="text"
                  name="lead_id_prefix"
                  value={settings.lead_id_prefix || 'REC-'}
                  onChange={handleSettingChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default State
                </label>
                <input
                  type="text"
                  name="default_state"
                  value={settings.default_state || 'Karnataka'}
                  onChange={handleSettingChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Saving...' : 'Save System Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Security Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Change Account Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={passwordData.old_password}
              onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password *
            </label>
            <input
              type="password"
              required
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
