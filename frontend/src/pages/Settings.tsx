import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import { clearAuthCache } from '../lib/cache';
import Layout from '../components/Layout';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError('');
      
      await apiClient.deleteAccount();
      
      clearAuthCache();
      logout();
      navigate('/login');
    } catch (error: unknown) {
      setDeleteError((error as any)?.response?.data?.detail || (error as Error)?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400 text-sm">Manage your account and preferences</p>
          </div>

          {/* Account Info */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
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
                <label className="text-xs text-slate-400">Provider</label>
                <p className="text-white capitalize">{user?.provider || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400">Timezone</label>
                <p className="text-white">{user?.timezone || 'UTC'}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
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
                      {deleteError && (
                        <p className="text-xs text-red-400 mb-3">{deleteError}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError('');
                    }}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/10 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Yes, Delete My Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
