import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Loader2, Shield, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import { clearAllCache } from '../lib/cache';
import NavigationBar from '../components/NavigationBar';
import LogoutMenu from '../components/LogoutMenu';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError('');

      await apiClient.deleteAccount();

      // Show success message briefly before redirecting
      setShowDeleteSuccess(true);

      // Clear all cache and storage
      clearAllCache();

      // Small delay to show success message
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (error: unknown) {
      setDeleteError((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error)?.message || 'Failed to delete account');
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteError('');
    setDeleteConfirmText('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050510] relative overflow-x-hidden">
      <div className="page-bg" />
      <div className="page-grid-overlay" />

      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />

      <main className="flex-1 relative z-10 p-4 sm:p-6 mb-20 lg:mb-0">
        <div className="max-w-2xl mx-auto space-y-6">
          <header className="fade-in-up">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400 text-sm">Manage your account and preferences</p>
          </header>

          {/* Account Info */}
          <section className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 fade-in-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Name</label>
                <p className="text-white">{user?.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400">Email</label>
                <p className="text-white">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400">Primary Provider</label>
                <p className="text-white capitalize">{user?.provider || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400">Timezone</label>
                <p className="text-white">{user?.timezone || 'UTC'}</p>
              </div>
            </div>
          </section>

          {/* Connected Services */}
          <section className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Connected Services</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <span className="text-blue-400 font-bold">Z</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Zoom</p>
                    <p className="text-xs text-slate-400">Enable AI to create Zoom meetings</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const { auth_url } = await apiClient.getAuthUrl('zoom');
                      window.location.href = auth_url;
                    } catch (error) {
                      console.error('Failed to connect Zoom:', error);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Connect
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 opacity-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${user?.provider === 'google' ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'
                    }`}>
                    <span className={user?.provider === 'google' ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
                      {user?.provider === 'google' ? 'G' : 'M'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{user?.provider}</p>
                    <p className="text-xs text-slate-400 text-green-400">Primary Account Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-red-400 mb-1">Danger Zone</h2>
                <p className="text-sm text-slate-400">
                  Once you delete your account, there is no going back. This will permanently delete your account and revoke access from Google/Microsoft.
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            ) : showDeleteSuccess ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <p className="text-green-400 font-medium">Account deleted successfully!</p>
                <p className="text-sm text-slate-400 mt-1">Redirecting to login...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-400 font-medium mb-2">
                        Are you absolutely sure?
                      </p>
                      <p className="text-xs text-slate-400 mb-3">
                        This action will:
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1 mb-3 list-disc list-inside">
                        <li>Permanently delete your account data</li>
                        <li>Delete all your meetings and calendar events</li>
                        <li>Revoke access from {user?.provider === 'google' ? 'Google' : 'Microsoft'}</li>
                        <li>Log you out from all devices</li>
                      </ul>

                      <div className="mb-3">
                        <label className="text-xs text-slate-400 mb-1.5 block">
                          Type <span className="text-red-400 font-bold">DELETE</span> to confirm:
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE here"
                          className="w-full px-3 py-2 bg-black/30 border border-red-500/30 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
                          autoFocus
                        />
                      </div>

                      {deleteError && (
                        <p className="text-xs text-red-400">{deleteError}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelDelete}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/10 text-white rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
