import { logger } from '../../shared/logger';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ClientUser,
  DashboardStats,
  ClientProject,
  ClientInvoice,
  ClientMessage,
  ClientDocument,
  ClientProfile,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4726';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('client_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('client_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('client_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return data;
    } catch (error) {
      logger.error('API Error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Auth
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async verifyToken(): Promise<ApiResponse<{ userId: string; clientId: string; email: string }>> {
    return this.request('/api/auth/verify');
  }

  logout() {
    this.clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Dashboard
  async getDashboard(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/api/client/dashboard');
  }

  // Profile
  async getProfile(): Promise<ApiResponse<ClientProfile>> {
    return this.request<ClientProfile>('/api/client/profile');
  }

  async updateProfile(data: Partial<ClientProfile>): Promise<ApiResponse<ClientProfile>> {
    return this.request<ClientProfile>('/api/client/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Projects
  async getProjects(): Promise<ApiResponse<ClientProject[]>> {
    return this.request<ClientProject[]>('/api/client/projects');
  }

  async getProject(id: string): Promise<ApiResponse<ClientProject>> {
    return this.request<ClientProject>(`/api/client/projects/${id}`);
  }

  // Invoices
  async getInvoices(): Promise<ApiResponse<ClientInvoice[]>> {
    return this.request<ClientInvoice[]>('/api/client/invoices');
  }

  async getInvoice(id: string): Promise<ApiResponse<ClientInvoice>> {
    return this.request<ClientInvoice>(`/api/client/invoices/${id}`);
  }

  // Messages
  async getMessages(): Promise<ApiResponse<ClientMessage[]>> {
    return this.request<ClientMessage[]>('/api/client/messages');
  }

  async sendMessage(content: string, attachments?: any[]): Promise<ApiResponse<ClientMessage>> {
    return this.request<ClientMessage>('/api/client/messages', {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    });
  }

  async markMessageRead(id: string): Promise<ApiResponse<ClientMessage>> {
    return this.request<ClientMessage>(`/api/client/messages/${id}/read`);
  }

  // Documents
  async getDocuments(): Promise<ApiResponse<ClientDocument[]>> {
    return this.request<ClientDocument[]>('/api/client/documents');
  }

  async getDocument(id: string): Promise<ApiResponse<ClientDocument>> {
    return this.request<ClientDocument>(`/api/client/documents/${id}`);
  }
}

export const api = new ApiClient();
export default api;
