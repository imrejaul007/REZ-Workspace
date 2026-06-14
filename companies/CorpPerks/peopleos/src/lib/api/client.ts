// CorpPerks API Client
// Connects PeopleOS frontend to backend API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4006/api/v1';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  tenantId?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, tenantId } = options;

    const authHeaders: Record<string, string> = {};
    if (this.token) {
      authHeaders['Authorization'] = `Bearer ${this.token}`;
    }
    if (tenantId) {
      authHeaders['X-Tenant-ID'] = tenantId;
    }

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    // Create timeout controller
    const controller = new AbortController();
    config.signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        logger.error(`API Timeout [${method}] ${endpoint}: Request exceeded ${REQUEST_TIMEOUT}ms`);
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
      }
      logger.error(`API Error [${method}] ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; companyName: string }) {
    const response = await this.request<{ token: string; user: any; tenant: any }>('/auth/register', {
      method: 'POST',
      body: data,
    });
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async getProfile() {
    return this.request<{ user: any; employee: any }>('/auth/me');
  }

  async logout() {
    this.clearToken();
    return { success: true };
  }

  // Employees
  async getEmployees(params?: { page?: number; limit?: number; search?: string; department?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);

    return this.request<any[]>(`/employees?${query.toString()}`);
  }

  async getEmployee(id: string) {
    return this.request<any>(`/employees/${id}`);
  }

  async createEmployee(data: any) {
    return this.request<any>('/employees', { method: 'POST', body: data });
  }

  async updateEmployee(id: string, data: any) {
    return this.request<any>(`/employees/${id}`, { method: 'PUT', body: data });
  }

  async deleteEmployee(id: string) {
    return this.request<any>(`/employees/${id}`, { method: 'DELETE' });
  }

  // Leave
  async getLeaveRequests(params?: { page?: number; status?: string; leaveType?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.leaveType) query.set('leaveType', params.leaveType);

    return this.request<any[]>(`/leave?${query.toString()}`);
  }

  async getLeaveRequest(id: string) {
    return this.request<any>(`/leave/${id}`);
  }

  async createLeaveRequest(data: { employeeId: string; leaveType: string; startDate: string; endDate: string; reason: string }) {
    return this.request<any>('/leave', { method: 'POST', body: data });
  }

  async approveLeaveRequest(id: string, status: 'approved' | 'rejected', rejectionReason?: string) {
    return this.request<any>(`/leave/${id}/approve`, {
      method: 'PUT',
      body: { status, rejectionReason },
    });
  }

  async cancelLeaveRequest(id: string) {
    return this.request<any>(`/leave/${id}/cancel`, { method: 'PUT' });
  }

  async getLeaveBalances() {
    return this.request<any[]>('/leave/balances/all');
  }

  // Attendance
  async getAttendanceRecords(params?: { page?: number; date?: string; employeeId?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.date) query.set('date', params.date);
    if (params?.employeeId) query.set('employeeId', params.employeeId);

    return this.request<any[]>(`/attendance?${query.toString()}`);
  }

  async getTodayAttendance() {
    return this.request<any>('/attendance/today');
  }

  async getAttendanceStats() {
    return this.request<{ present: number; absent: number; late: number; onLeave: number }>('/attendance/stats');
  }

  async checkIn(latitude: number, longitude: number, address?: string) {
    return this.request<any>('/attendance/check-in', {
      method: 'POST',
      body: { latitude, longitude, address },
    });
  }

  async checkOut(latitude?: number, longitude?: number, address?: string) {
    return this.request<any>('/attendance/check-out', {
      method: 'POST',
      body: { latitude, longitude, address },
    });
  }

  // Shifts
  async getShifts(params?: { page?: number; date?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.date) query.set('date', params.date);
    if (params?.status) query.set('status', params.status);

    return this.request<any[]>(`/shifts?${query.toString()}`);
  }

  async getShiftStats() {
    return this.request<{ active: number; total: number; completed: number; late: number }>('/shifts/stats');
  }

  async getShiftTemplates() {
    return this.request<any[]>('/shifts/templates');
  }

  async createShift(data: { employeeId: string; date: string; startTime: string; endTime: string; breakMinutes?: number }) {
    return this.request<any>('/shifts', { method: 'POST', body: data });
  }

  async updateShift(id: string, data: any) {
    return this.request<any>(`/shifts/${id}`, { method: 'PUT', body: data });
  }

  async startShift(id: string) {
    return this.request<any>(`/shifts/${id}/start`, { method: 'PUT' });
  }

  async completeShift(id: string) {
    return this.request<any>(`/shifts/${id}/complete`, { method: 'PUT' });
  }

  async deleteShift(id: string) {
    return this.request<any>(`/shifts/${id}`, { method: 'DELETE' });
  }

  // Departments
  async getDepartments() {
    return this.request<any[]>('/departments');
  }

  async createDepartment(data: { name: string; code: string; description?: string }) {
    return this.request<any>('/departments', { method: 'POST', body: data });
  }

  // Users
  async getUsers(params?: { page?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.search) query.set('search', params.search);

    return this.request<any[]>(`/users?${query.toString()}`);
  }

  async updateUserRole(id: string, role: string) {
    return this.request<any>(`/users/${id}/role`, { method: 'PUT', body: { role } });
  }
}

export const api = new ApiClient();
export default api;
