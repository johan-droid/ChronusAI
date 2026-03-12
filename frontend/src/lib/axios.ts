/**
 * axios.ts — Centralized Axios instance with silent refresh token rotation.
 *
 * Security model
 * ──────────────
 * • Access tokens are read from authStore (memory only).
 * • Refresh tokens live in an HttpOnly cookie — we never read them, but
 *   `withCredentials: true` ensures the browser sends them automatically.
 * • On 401, we attempt ONE silent refresh.  If that fails we force logout.
 * • Concurrent requests that 401 during a refresh are queued and replayed
 *   with the new token once the refresh completes.
 *
 * Usage
 * ─────
 * import { api } from '@/lib/axios';
 * const data = await api.get('/users/me');
 */
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';

// ── Base URL ──────────────────────────────────────────────────────────────────

const getBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';
  const url = raw.replace(/\/$/, '');
  if (url.endsWith('/api/v1')) return url;
  if (url.endsWith('/api')) return `${url}/v1`;
  return `${url}/api/v1`;
};

// ── Queue for concurrent refresh waits ───────────────────────────────────────

type Resolver = (token: string) => void;
type Rejector = (err: unknown) => void;

let _isRefreshing = false;
const _queue: Array<{ resolve: Resolver; reject: Rejector }> = [];

function _drainQueue(token: string) {
  _queue.splice(0).forEach(({ resolve }) => resolve(token));
}

function _rejectQueue(err: unknown) {
  _queue.splice(0).forEach(({ reject }) => reject(err));
}

// ── Axios instance ────────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30_000,
  withCredentials: true, // sends the HttpOnly refresh cookie automatically
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor — attach access token ─────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Attach active org context header when available.
    const { activeOrg } = useOrganizationStore.getState();
    if (activeOrg) {
      config.headers['X-Org-Id'] = activeOrg.id;
    }

    return config;
  },
  (err) => Promise.reject(err),
);

// ── Response interceptor — silent refresh on 401 ─────────────────────────────

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const is401 = error.response?.status === 401;
    const isRefreshEndpoint =
      typeof original?.url === 'string' && original.url.includes('auth/refresh');

    // ── Silent refresh path ────────────────────────────────────────────────
    if (is401 && !original._retry && !isRefreshEndpoint) {
      if (_isRefreshing) {
        // Queue the request and replay it once the refresh resolves.
        return new Promise<AxiosResponse>((resolve, reject) => {
          _queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        // Send refresh token via header as fallback for cross-origin deployments
        // where the HttpOnly cookie may not be available.
        const { refreshToken: storedRefreshToken } = useAuthStore.getState();
        const headers: Record<string, string> = {};
        if (storedRefreshToken) {
          headers.Authorization = `Bearer ${storedRefreshToken}`;
        }
        // The refresh token is in the HttpOnly cookie — no body needed.
        const { data } = await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          {},
          { withCredentials: true, headers },
        );

        const newAccessToken: string = data.access_token;
        useAuthStore.getState().updateAccessToken(newAccessToken);
        if (data.refresh_token) {
          useAuthStore.getState().updateRefreshToken(data.refresh_token);
        }
        _drainQueue(newAccessToken);

        // Replay the original request.
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshErr) {
        _rejectQueue(refreshErr);
        useAuthStore.getState().logout();
        useOrganizationStore.getState().clearOrgs();
        return Promise.reject(refreshErr);
      } finally {
        _isRefreshing = false;
      }
    }

    // ── Hard 401 after retry or on refresh endpoint — force logout ─────────
    if (is401 && (original._retry || isRefreshEndpoint)) {
      useAuthStore.getState().logout();
      useOrganizationStore.getState().clearOrgs();
    }

    // Unwrap backend's `detail` string for convenient error handling.
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      error.message =
        typeof detail === 'string' ? detail : JSON.stringify(detail);
    }

    return Promise.reject(error);
  },
);

// ── Typed convenience wrappers ────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  /** Trigger a silent refresh — cookie is sent automatically. */
  refresh: () => api.post('/auth/refresh', {}),

  logout: () => api.post('/auth/logout', {}),

  requestPasswordReset: (email: string) =>
    api.post('/auth/request-password-reset', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
};

export const userApi = {
  me: () => api.get('/users/me'),
  update: (data: { full_name?: string; timezone?: string }) =>
    api.patch('/users/me', data),
};

export const orgApi = {
  list: () => api.get('/organizations'),
  create: (data: { name: string; slug?: string }) =>
    api.post('/organizations', data),
  get: (orgId: string) => api.get(`/organizations/${orgId}`),
  update: (orgId: string, data: { name?: string; logo_url?: string }) =>
    api.patch(`/organizations/${orgId}`, data),
  delete: (orgId: string) => api.delete(`/organizations/${orgId}`),

  listMembers: (orgId: string) => api.get(`/organizations/${orgId}/members`),
  invite: (orgId: string, data: { email: string; role?: string }) =>
    api.post(`/organizations/${orgId}/members`, data),
  updateMemberRole: (orgId: string, userId: string, role: string) =>
    api.patch(`/organizations/${orgId}/members/${userId}/role`, { role }),
  removeMember: (orgId: string, userId: string) =>
    api.delete(`/organizations/${orgId}/members/${userId}`),
};
