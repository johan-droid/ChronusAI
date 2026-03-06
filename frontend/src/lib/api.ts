import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { ChatRequest, ChatResponse, Meeting, User, AuthUrlResponse } from '../types';
import { cacheManager, clearAuthCache } from './cache';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const { refreshToken, updateAccessToken } = useAuthStore.getState();
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                headers: { Authorization: `Bearer ${refreshToken}` }
              });
              
              const { access_token } = response.data;
              updateAccessToken(access_token);
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            clearAuthCache();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        if (error.response?.status === 401) {
          clearAuthCache();
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async getAuthUrl(provider: 'google' | 'outlook'): Promise<AuthUrlResponse> {
    try {
      const response = await this.client.get(`/auth/${provider}/login`);
      return response.data;
    } catch (error: any) {
      console.error('Auth URL error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    const cached = cacheManager.get('user:current');
    if (cached) return cached;

    const response = await this.client.get('/users/me');
    cacheManager.set('user:current', response.data, 10 * 60 * 1000);
    return response.data;
  }

  async checkStatus(): Promise<{ online: boolean; latency: string }> {
    const response = await this.client.get('/status');
    return response.data;
  }

  // Chat endpoints
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post('/chat/message', request);
    return response.data;
  }

  // Meeting endpoints
  async getMeetings(): Promise<Meeting[]> {
    const cached = cacheManager.get('meetings:list');
    if (cached) return cached;

    const response = await this.client.get('/meetings');
    cacheManager.set('meetings:list', response.data, 2 * 60 * 1000);
    return response.data;
  }

  async getMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.client.get(`/meetings/${meetingId}`);
    return response.data;
  }

  async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting> {
    const response = await this.client.put(`/meetings/${meetingId}`, updates);
    return response.data;
  }

  async deleteMeeting(meetingId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/meetings/${meetingId}`);
    cacheManager.invalidatePattern('meetings');
    return response.data;
  }

  // Auth methods
  async logout(): Promise<{ message: string; logout_url?: string; provider?: string }> {
    const { refreshToken } = useAuthStore.getState();
    const response = await this.client.post('/auth/logout', {}, {
      headers: refreshToken ? { 'X-Refresh-Token': refreshToken } : {}
    });
    return response.data;
  }

  async logoutAll(): Promise<{ message: string; logout_url?: string; provider?: string }> {
    const response = await this.client.post('/auth/logout-all');
    // Broadcast logout to all tabs/windows
    localStorage.setItem('logout-all', Date.now().toString());
    return response.data;
  }

  async deleteAccount(): Promise<{ message: string; provider?: string }> {
    const response = await this.client.delete('/auth/account');
    return response.data;
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
    const response = await this.client.get(`/availability?${params.toString()}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
