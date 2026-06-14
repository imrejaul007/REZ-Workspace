import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // In the browser: route through the Next.js proxy to avoid CORS entirely.
    // On the server (SSR): call the backend directly.
    const isBrowser = typeof window !== 'undefined';
    let baseURL: string;
    if (isBrowser) {
      baseURL = '/api/proxy';
    } else {
      const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      baseURL = rawBase.endsWith('/api/v1') || rawBase.endsWith('/api/v1/')
        ? rawBase
        : `${rawBase.replace(/\/$/, '')}/api/v1`;
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // send httpOnly cookies on every request
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          // Clear legacy mock tokens if present
          if (localStorage.getItem('accessToken') === 'mock-jwt-token-for-development') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          // Attach Bearer token for all guarded endpoints
          const token = localStorage.getItem('accessToken');
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(error);
        }

        // Handle other errors
        if (error.response?.status >= 500) {
          toast.error('Server error occurred. Please try again later.');
        } else if (error.response?.status === 403) {
          toast.error('Access denied. You do not have permission to perform this action.');
        } else if (error.response?.status === 404) {
          toast.error('Resource not found.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('An unexpected error occurred.');
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = unknown>(
    url: string,
    data?,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = unknown>(
    url: string,
    data?,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = unknown>(
    url: string,
    data?,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload method
  async upload<T = unknown>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  }

  // Pagination helper
  async getPaginated<T = unknown>(
    url: string,
    params?: {
      page?: number;
      limit?: number;
      [key: string];
    }
  ): Promise<PaginatedResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  // Search helper
  async search<T = unknown>(
    url: string,
    query: string,
    filters?: Record<string, unknown>
  ): Promise<ApiResponse<T[]>> {
    const params = { q: query, ...filters };
    const response = await this.client.get(url, { params });
    return response.data;
  }
}

export const apiClient = new ApiClient();