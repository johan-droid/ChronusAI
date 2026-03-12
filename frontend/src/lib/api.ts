import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { ChatRequest, ChatResponse, Meeting, User, AuthUrlResponse, Attendee } from '../types';
import { cacheManager, clearAuthCache } from './cache';
import { useAuthStore } from '../store/authStore';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  // Ensure it always ends with /api/v1 (avoid double versioning or missing versioning)
  let url = envUrl.replace(/\/$/, '');
  if (!url.endsWith('/api/v1') && !url.endsWith('/api')) {
    url = `${url}/api/v1`;
  } else if (url.endsWith('/api')) {
    url = `${url}/v1`;
  }
  return url; // Return without trailing slash
};

const API_BASE_URL = getBaseUrl();

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    // Guards against infinite 401 → refresh → 401 loops
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        const isRefreshRequest = originalRequest?.url?.includes('auth/refresh');
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
          if (isRefreshing) {
            return new Promise((resolve) => {
              subscribeTokenRefresh((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const { updateAccessToken, updateRefreshToken, refreshToken: storedRefreshToken } = useAuthStore.getState();
            // Send refresh token via header as fallback for cross-origin deployments
            // where the HttpOnly cookie may not be available.
            const headers: Record<string, string> = {};
            if (storedRefreshToken) {
              headers.Authorization = `Bearer ${storedRefreshToken}`;
            }
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
              withCredentials: true,
              headers,
            });

              const { access_token, refresh_token: newRefreshToken } = response.data;
              updateAccessToken(access_token);
              if (newRefreshToken) {
                updateRefreshToken(newRefreshToken);
              }

              isRefreshing = false;
              onRefreshed(access_token);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            isRefreshing = false;
            refreshSubscribers = [];
            clearAuthCache();
            useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          }
        }

        // If this is a retried request that still got 401, or a refresh request that failed,
        // force logout without trying to refresh again
        if (error.response?.status === 401 && (originalRequest._retry || isRefreshRequest)) {
          clearAuthCache();
          useAuthStore.getState().logout();
        }

        // Extract backend error detail for React Query hooks
        if (error.response?.data?.detail) {
          error.message = typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail);
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async getAuthUrl(provider: 'google' | 'outlook' | 'zoom'): Promise<AuthUrlResponse> {
    try {
      const response = await this.client.get(`auth/${provider}/login`);
      return response.data;
    } catch (error: unknown) {
      console.error('Auth URL error:', error);
      throw error;
    }
  }

  async login(data: Record<string, unknown>): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const response = await this.client.post('auth/login', data);
    return response.data;
  }

  async signup(data: Record<string, unknown>): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const response = await this.client.post('auth/signup', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const cached = cacheManager.get('user:current') as User | null;
    if (cached) return cached;

    const response = await this.client.get('users/me');
    cacheManager.set('user:current', response.data, 10 * 60 * 1000);
    return response.data;
  }

  async checkStatus(): Promise<{ online: boolean; latency: string }> {
    const response = await this.client.get('status');
    return response.data;
  }

  async detectTimezone(): Promise<{
    timezone: string;
    detected: boolean;
    source: string;
  }> {
    const response = await this.client.post('users/detect-timezone');
    // Clear user cache since timezone was updated
    cacheManager.invalidate('user:current');
    return response.data;
  }

  async getIndianContext(): Promise<{
    is_indian: boolean;
    cultural_context: string;
    festivals: Record<string, string[]>;
    preferences: Record<string, unknown>;
    timezone: string;
  }> {
    const response = await this.client.get('users/indian-context');
    return response.data;
  }

  async getPersonalizedGreeting(timezone?: string): Promise<{
    greeting: string;
    time_period: string;
    local_time: string;
    timezone: string;
    is_indian: boolean;
    cultural_context: string;
  }> {
    const params = new URLSearchParams();
    if (timezone) params.append('timezone', timezone);
    const response = await this.client.get(`greetings/personalized?${params.toString()}`);
    return response.data;
  }

  async updateUser(data: { full_name?: string; timezone?: string }): Promise<User> {
    const response = await this.client.put('users/me', data);
    cacheManager.invalidate('user:current');
    return response.data;
  }

  // Chat endpoints
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post('chat/message', request);
    return response.data;
  }

  // Meeting endpoints
  async getMeetings(): Promise<Meeting[]> {
    const cached = cacheManager.get('meetings:list') as Meeting[] | null;
    if (cached) return cached;

    const response = await this.client.get('meetings');
    cacheManager.set('meetings:list', response.data, 2 * 60 * 1000);
    return response.data;
  }


  async getMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.client.get(`meetings/${meetingId}`);
    return response.data;
  }

  async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting> {
    const response = await this.client.put(`meetings/${meetingId}`, updates);
    cacheManager.invalidatePattern('meetings');
    return response.data;
  }

  async deleteMeeting(meetingId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`meetings/${meetingId}`);
    cacheManager.invalidatePattern('meetings');
    return response.data;
  }

  // Auth methods
  async logout(): Promise<{ message: string; logout_url?: string; provider?: string }> {
    // Refresh token is in HttpOnly cookie — backend reads it automatically.
    const response = await this.client.post('auth/logout', {});
    return response.data;
  }

  async logoutAll(): Promise<{ message: string; logout_url?: string; provider?: string }> {
    const response = await this.client.post('auth/logout-all');
    // Broadcast logout to all tabs/windows
    localStorage.setItem('logout-all', Date.now().toString());
    return response.data;
  }

  async deleteAccount(): Promise<{ message: string; provider?: string }> {
    const response = await this.client.delete('auth/account');
    return response.data;
  }

  // Create meeting directly (non-chat path)
  async createMeeting(data: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    attendees: Attendee[];
    provider: string;
    reminder_schedule_minutes?: number[];
    reminder_methods?: string[];
  }): Promise<Meeting> {
    const response = await this.client.post('meetings', data);
    cacheManager.invalidatePattern('meetings');
    return response.data;
  }

  // Generic methods
  async get(url: string): Promise<unknown> {
    const response = await this.client.get(url);
    return response;
  }

  async delete(url: string): Promise<unknown> {
    const response = await this.client.delete(url);
    return response;
  }

  // Availability endpoints
  async getAvailability(date: string, timezone?: string): Promise<{
    date: string;
    timezone: string;
    slots: Array<{
      start_time: string;
      end_time: string;
      is_available: boolean;
      timezone: string;
    }>;
    available_count: number;
    busy_count: number;
  }> {
    const params = new URLSearchParams({ date });
    if (timezone) params.append('timezone', timezone);
    const response = await this.client.get(`availability?${params.toString()}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
