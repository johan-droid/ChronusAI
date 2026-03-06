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
      isLoading: false, // Changed from true to false
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
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null,
        isAuthenticated: false, 
        isLoading: false 
      }),
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
      window.location.href = '/login';
    }
  });
}
