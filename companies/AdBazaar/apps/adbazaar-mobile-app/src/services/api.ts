import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, Draft, AnalyticsData, CalendarEvent, ScheduledPost, ApiResponse } from '../types';

// Base API URL - update this for production
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use(async (config) => {
      if (!this.token) {
        this.token = await AsyncStorage.getItem('auth_token');
      }
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  // Posts API
  async getPosts(): Promise<Post[]> {
    const response = await this.client.get<ApiResponse<Post[]>>('/posts');
    return response.data.data || [];
  }

  async getPost(id: string): Promise<Post | null> {
    const response = await this.client.get<ApiResponse<Post>>(`/posts/${id}`);
    return response.data.data || null;
  }

  async createPost(post: Partial<Post>): Promise<Post> {
    const response = await this.client.post<ApiResponse<Post>>('/posts', post);
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  async updatePost(id: string, post: Partial<Post>): Promise<Post> {
    const response = await this.client.patch<ApiResponse<Post>>(`/posts/${id}`, post);
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  async deletePost(id: string): Promise<void> {
    await this.client.delete(`/posts/${id}`);
  }

  async schedulePost(id: string, scheduledAt: string): Promise<Post> {
    const response = await this.client.post<ApiResponse<Post>>(`/posts/${id}/schedule`, {
      scheduledAt,
    });
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  async publishPost(id: string): Promise<Post> {
    const response = await this.client.post<ApiResponse<Post>>(`/posts/${id}/publish`);
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  // Drafts API
  async getDrafts(): Promise<Draft[]> {
    const response = await this.client.get<ApiResponse<Draft[]>>('/drafts');
    return response.data.data || [];
  }

  async saveDraft(draft: Partial<Draft>): Promise<Draft> {
    const response = await this.client.post<ApiResponse<Draft>>('/drafts', draft);
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  async updateDraft(id: string, draft: Partial<Draft>): Promise<Draft> {
    const response = await this.client.patch<ApiResponse<Draft>>(`/drafts/${id}`, draft);
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  async deleteDraft(id: string): Promise<void> {
    await this.client.delete(`/drafts/${id}`);
  }

  // Calendar API
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const response = await this.client.get<ApiResponse<CalendarEvent[]>>('/calendar', {
      params: { startDate, endDate },
    });
    return response.data.data || [];
  }

  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.client.post<ApiResponse<CalendarEvent>>('/calendar', event);
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  async updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.client.patch<ApiResponse<CalendarEvent>>(`/calendar/${id}`, event);
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await this.client.delete(`/calendar/${id}`);
  }

  // Analytics API
  async getAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsData> {
    const response = await this.client.get<ApiResponse<AnalyticsData>>('/analytics', {
      params: { period },
    });
    return response.data.data || {
      totalPosts: 0,
      totalEngagement: 0,
      totalReach: 0,
      engagementRate: 0,
      postsByDay: [],
      engagementByPlatform: [],
      recentActivity: [],
    };
  }

  async getPostAnalytics(id: string): Promise<PostAnalytics | null> {
    const response = await this.client.get<ApiResponse<PostAnalytics>>(`/posts/${id}/analytics`);
    return response.data.data || null;
  }

  // Scheduled Posts API
  async getScheduledPosts(): Promise<ScheduledPost[]> {
    const response = await this.client.get<ApiResponse<ScheduledPost[]>>('/posts/scheduled');
    return response.data.data || [];
  }

  // Post Queue API
  async getPostQueue(): Promise<Post[]> {
    const response = await this.client.get<ApiResponse<Post[]>>('/queue');
    return response.data.data || [];
  }

  async approvePost(id: string): Promise<Post> {
    const response = await this.client.post<ApiResponse<Post>>(`/queue/${id}/approve`);
    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data;
  }

  async rejectPost(id: string): Promise<void> {
    await this.client.post(`/queue/${id}/reject`);
  }

  // Media API
  async uploadMedia(uri: string, type: 'image' | 'video'): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: type === 'image' ? 'image/jpeg' : 'video/mp4',
      name: `media_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`,
    } as any);

    const response = await this.client.post<ApiResponse<{ url: string }>>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!response.data.data) throw new Error(response.data.error);
    return response.data.data.url;
  }
}

export const api = new ApiService();
