import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Start with true to check initial auth state
      setAuth: (user, accessToken, refreshToken) => set({ 
        user, 
        accessToken, 
        refreshToken,
        isAuthenticated: true, 
        isLoading: false 
      }),
      updateAccessToken: (accessToken) => set((state) => ({
        ...state,
        accessToken
      })),
      logout: () => {
        // Clear auth state
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null,
          isAuthenticated: false, 
          isLoading: false 
        });

        // Clear browser storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          sessionStorage.clear();
          
          // Clear browser history to prevent back button navigation issues
          // Replace current history entry with login page
          window.history.replaceState({}, document.title, '/login');
          
          // Push a new history entry for login to prevent going back to OAuth URLs
          window.history.pushState({}, document.title, '/login');
          
          // Force redirect to login page
          window.location.href = '/login';
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // Set loading to false after rehydration
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);

// Listen for logout-all broadcast
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'logout-all' && e.newValue) {
      useAuthStore.getState().logout();
      
      // Additional history clearing for cross-tab logout
      window.history.replaceState({}, document.title, '/login');
      window.history.pushState({}, document.title, '/login');
      window.location.href = '/login';
    }
  });
}
