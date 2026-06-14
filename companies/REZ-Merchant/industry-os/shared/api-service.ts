/**
 * REZ Merchant API Service Layer
 * Provides standardized API calls to backend services
 */

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface RequestOptions {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null, loading: false };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      };
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null, loading: false };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      };
    }
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null, loading: false };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null, loading: false };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export type for use in components
export type { ApiResponse, RequestOptions };

// Restaurant API endpoints
export const restaurantApi = {
  getOrders: () => apiService.get<any[]>('/api/orders'),
  getOrder: (id: string) => apiService.get<any>(`/api/orders/${id}`),
  createOrder: (data: any) => apiService.post<any>('/api/orders', data),
  updateOrder: (id: string, data: any) => apiService.put<any>(`/api/orders/${id}`, data),

  getMenu: () => apiService.get<any[]>('/api/menu'),
  getMenuItem: (id: string) => apiService.get<any>(`/api/menu/${id}`),
  createMenuItem: (data: any) => apiService.post<any>('/api/menu', data),

  getTables: () => apiService.get<any[]>('/api/tables'),
  updateTable: (id: string, data: any) => apiService.put<any>(`/api/tables/${id}`, data),

  getStats: () => apiService.get<any>('/api/stats'),
};

// Hotel API endpoints
export const hotelApi = {
  getBookings: () => apiService.get<any[]>('/api/bookings'),
  getBooking: (id: string) => apiService.get<any>(`/api/bookings/${id}`),
  createBooking: (data: any) => apiService.post<any>('/api/bookings', data),
  updateBooking: (id: string, data: any) => apiService.put<any>(`/api/bookings/${id}`, data),

  getRooms: () => apiService.get<any[]>('/api/rooms'),
  updateRoom: (id: string, data: any) => apiService.put<any>(`/api/rooms/${id}`, data),

  getHousekeeping: () => apiService.get<any[]>('/api/housekeeping'),
  updateHousekeeping: (id: string, data: any) => apiService.put<any>(`/api/housekeeping/${id}`, data),

  getStats: () => apiService.get<any>('/api/stats'),
};

// Generic CRUD helpers
export const createCrudApi = <T>(endpoint: string) => ({
  list: () => apiService.get<T[]>(`/api/${endpoint}`),
  get: (id: string) => apiService.get<T>(`/api/${endpoint}/${id}`),
  create: (data: Partial<T>) => apiService.post<T>(`/api/${endpoint}`, data),
  update: (id: string, data: Partial<T>) => apiService.put<T>(`/api/${endpoint}/${id}`, data),
  delete: (id: string) => apiService.delete<T>(`/api/${endpoint}/${id}`),
});
