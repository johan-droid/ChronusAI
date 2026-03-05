import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { ChatRequest, ChatResponse, Meeting, User, AuthUrlResponse } from '../types';

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
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear it and redirect to login
          localStorage.removeItem('auth_token');
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
    const response = await this.client.get('/users/me');
    return response.data;
  }

  // Chat endpoints
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post('/chat/message', request);
    return response.data;
  }

  // Meeting endpoints
  async getMeetings(): Promise<Meeting[]> {
    const response = await this.client.get('/meetings');
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
    return response.data;
  }
}

export const apiClient = new ApiClient();
