import { useState } from 'react';
import { LogOut, Shield, Smartphone, AlertTriangle } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { clearAuthCache } from '../lib/cache';

interface LogoutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutMenu({ isOpen, onClose }: LogoutMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { logout, user } = useAuthStore();

  const handleLogout = async (logoutAll = false) => {
    setIsLoading(true);
    try {
      const response = logoutAll 
        ? await apiClient.logoutAll() 
        : await apiClient.logout();
      
      // Complete session cleanup
      clearAuthCache();
      logout();
      sessionStorage.clear();
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_verifier');
      
      // If OAuth logout URL is provided, redirect to it
      if (response.logout_url && response.provider === 'outlook') {
        // For Microsoft, redirect to their logout endpoint
        window.location.href = response.logout_url;
      } else if (response.logout_url && response.provider === 'google') {
        // For Google, open logout in new tab and redirect to login
        window.open(response.logout_url, '_blank');
        window.location.replace('/login');
      } else {
        // Fallback: just redirect to login
        window.location.replace('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, clear local state and redirect
      clearAuthCache();
      logout();
      sessionStorage.clear();
      window.location.replace('/login');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-xl p-6 w-full max-w-md space-y-4 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Sign Out Confirmation</h3>
          <p className="text-sm text-muted-foreground">
            You are about to sign out from ChronosAI. Choose how you'd like to proceed.
          </p>
        </div>

        {user?.provider && (
          <div className="glass-card p-3 rounded-lg border border-primary/20">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">OAuth Provider: {user.provider === 'google' ? 'Google' : 'Microsoft'}</p>
                <p>Signing out will revoke your calendar access tokens and redirect you to {user.provider === 'google' ? 'Google' : 'Microsoft'} logout.</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => handleLogout(false)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-lg glass-card hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="h-5 w-5 text-primary" />
            <div className="text-left flex-1">
              <div className="text-sm font-medium text-foreground">Sign out this device</div>
              <div className="text-xs text-muted-foreground">Keep other sessions active</div>
            </div>
          </button>

          <button
            onClick={() => handleLogout(true)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-lg glass-card hover:border-destructive/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Smartphone className="h-5 w-5 text-destructive" />
            <div className="text-left flex-1">
              <div className="text-sm font-medium text-foreground">Sign out all devices</div>
              <div className="text-xs text-muted-foreground">End all active sessions everywhere</div>
            </div>
          </button>
        </div>

        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Signing out...</span>
          </div>
        )}
      </div>
    </div>
  );
}