/**
 * authStore — User-domain state only.
 *
 * Security model
 * ──────────────
 * • Access token is held purely in Zustand memory (no localStorage, no
 *   sessionStorage).  It starts as null on every page load and is repopulated
 *   by the silent-refresh interceptor in axios.ts.
 * • Refresh token lives in an HttpOnly cookie set by the backend — JS never
 *   reads or writes it directly.
 * • Only non-sensitive profile data (id, email, full_name, timezone) is
 *   persisted to localStorage so the UI can render without a round-trip.
 *
 * Organization data lives in organizationStore.ts (strictly separate).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  /** Short-lived access token — in memory only, NEVER persisted. */
  accessToken: string | null;
  /** Refresh token — in memory only, NEVER persisted. Used as fallback when HttpOnly cookie is unavailable (cross-origin). */
  refreshToken: string | null;
  /** Authenticated user's profile — safe to persist. */
  user: User | null;
  isAuthenticated: boolean;
  /** True while the initial silent-refresh check is in progress. */
  isLoading: boolean;
  /** Convenience alias pulled from user.timezone. */
  timezone: string;

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Called after a successful login / register / token refresh. */
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  /** Update just the access token (token rotation). */
  updateAccessToken: (accessToken: string) => void;
  /** Update the refresh token (token rotation). */
  updateRefreshToken: (refreshToken: string) => void;
  /** Merge partial user profile updates. */
  updateUser: (updates: Partial<User>) => void;
  setTimezone: (tz: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

/**
 * Persisted slice — only stable, non-sensitive fields.
 * The access token is intentionally excluded.
 */
interface PersistedSlice {
  user: User | null;
  timezone: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,       // ← NEVER persisted
      refreshToken: null,      // ← NEVER persisted
      user: null,
      isAuthenticated: false,
      isLoading: true,
      timezone: 'UTC',

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken: refreshToken ?? null,
          timezone: user.timezone ?? 'UTC',
          isAuthenticated: true,
          isLoading: false,
        }),

      updateAccessToken: (accessToken) => set({ accessToken }),

      updateRefreshToken: (refreshToken) => set({ refreshToken }),

      updateUser: (updates) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...updates } : null,
          timezone: updates.timezone ?? s.timezone,
        })),

      setTimezone: (tz) =>
        set((s) => ({
          timezone: tz,
          user: s.user ? { ...s.user, timezone: tz } : null,
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          timezone: 'UTC',
        });

        // Clear persisted user profile from localStorage.
        if (typeof window !== 'undefined') {
          localStorage.removeItem('chronos-auth');
          sessionStorage.clear();

          // Replace history so the user cannot navigate back to protected pages.
          window.history.replaceState({}, document.title, '/login');
          window.location.href = '/login';
        }
      },
    }),

    {
      name: 'chronos-auth',
      storage: createJSONStorage(() => localStorage),
      // ↓ Persist ONLY safe, non-sensitive fields.
      partialize: (state): PersistedSlice => ({
        user: state.user,
        timezone: state.timezone,
      }),
      // Rehydrate: mark as unauthenticated until a silent refresh confirms validity.
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Access token was wiped — require a silent refresh before acting.
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.isLoading = true;
        }
      },
    },
  ),
);

