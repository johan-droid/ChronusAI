import { useState } from 'react';
import { LogOut, Shield, Smartphone } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { clearAuthCache } from '../lib/cache';
import { useNavigate } from 'react-router-dom';

interface LogoutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutMenu({ isOpen, onClose }: LogoutMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async (logoutAll = false) => {
    setIsLoading(true);
    try {
      if (logoutAll) {
        await apiClient.logoutAll();
      } else {
        await apiClient.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Complete session cleanup
      clearAuthCache();
      logout();
      sessionStorage.clear();
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_verifier');
      
      // Clear browser history completely and redirect
      window.history.replaceState(null, '', '/login');
      window.location.replace('/login');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-xl p-6 w-full max-w-sm space-y-4 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Sign Out</h3>
          <p className="text-sm text-muted-foreground">Choose how you'd like to sign out</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleLogout(false)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg glass-card hover:border-primary/50 transition-all disabled:opacity-50"
          >
            <LogOut className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="text-sm font-medium text-foreground">Sign out this device</div>
              <div className="text-xs text-muted-foreground">Keep other sessions active</div>
            </div>
          </button>

          <button
            onClick={() => handleLogout(true)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg glass-card hover:border-destructive/50 transition-all disabled:opacity-50"
          >
            <Smartphone className="h-5 w-5 text-destructive" />
            <div className="text-left">
              <div className="text-sm font-medium text-foreground">Sign out all devices</div>
              <div className="text-xs text-muted-foreground">End all active sessions</div>
            </div>
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}