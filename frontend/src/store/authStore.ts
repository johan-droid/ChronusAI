import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  timezone: string;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  updateRefreshToken: (refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  setTimezone: (timezone: string) => void;
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
      timezone: 'UTC',
      setAuth: (user, accessToken, refreshToken) => set({ 
        user, 
        accessToken, 
        refreshToken,
        timezone: user.timezone || 'UTC',
        isAuthenticated: true, 
        isLoading: false 
      }),
      updateAccessToken: (accessToken) => set((state) => ({
        ...state,
        accessToken
      })),
      updateRefreshToken: (refreshToken) => set((state) => ({
        ...state,
        refreshToken
      })),
      updateUser: (userData) => set((state) => ({
        ...state,
        user: state.user ? { ...state.user, ...userData } : null,
        timezone: userData.timezone || state.timezone
      })),
      setTimezone: (timezone) => set((state) => ({
        ...state,
        timezone,
        user: state.user ? { ...state.user, timezone } : null
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
        isAuthenticated: state.isAuthenticated,
        timezone: state.timezone
      }),
      onRehydrateStorage: () => (state) => {
        // Set loading to false after rehydration, while verifying exp claims
        if (state) {
          let isValid = false;
          if (state.accessToken) {
            try {
              const payload = JSON.parse(atob(state.accessToken.split('.')[1]));
              if (payload.exp && payload.exp * 1000 > Date.now()) {
                isValid = true;
              }
            } catch (e) {
              isValid = false;
            }
          }
          if (!isValid) {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
          }
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
