import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Business,
  CreateBusinessData,
  UpdateBusinessData,
  IndustryType,
  ModuleType,
  IndustryWithModules,
  ModuleInfo,
  BusinessAnalytics,
  PlatformAnalytics,
  PaginatedResponse,
  ApiResponse,
  ModulesResponse,
  BusinessQueryParams,
  BusinessStats
} from '@/types';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4200';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token storage (in production, use httpOnly cookies or secure storage)
let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = (): string | null => authToken;

// Error handler
const handleApiError = (error: AxiosError): never => {
  if (error.response) {
    const data = error.response.data as { error?: string; message?: string };
    throw new Error(data?.error || data?.message || 'An error occurred');
  }
  if (error.request) {
    throw new Error('No response from server. Please check your connection.');
  }
  throw error;
};

// ============== INDUSTRY API ==============

export const industryApi = {
  /**
   * Get all industries with their modules
   */
  getAllIndustries: async (): Promise<IndustryWithModules[]> => {
    try {
      const response = await api.get<ApiResponse<IndustryWithModules[]>>('/industries');
      return response.data.data || [];
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Get industry by type
   */
  getIndustryByType: async (type: IndustryType): Promise<IndustryWithModules | null> => {
    try {
      const response = await api.get<ApiResponse<IndustryWithModules>>(`/industries/${type}`);
      return response.data.data || null;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Get modules for an industry
   */
  getModulesForIndustry: async (type: IndustryType): Promise<ModuleInfo[]> => {
    try {
      const response = await api.get<ApiResponse<ModuleInfo[]>>(`/industries/${type}/modules`);
      return response.data.data || [];
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============== BUSINESS API ==============

export const businessApi = {
  /**
   * Create a new business
   */
  createBusiness: async (data: CreateBusinessData): Promise<Business> => {
    try {
      const response = await api.post<ApiResponse<Business>>('/business', data);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create business');
      }
      return response.data.data!;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * List businesses with pagination
   */
  listBusinesses: async (params?: BusinessQueryParams): Promise<{
    data: Business[];
    pagination: PaginatedResponse<Business>['pagination'];
  }> => {
    try {
      const response = await api.get<PaginatedResponse<Business>>('/business', { params });
      return {
        data: response.data.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Get user's own businesses
   */
  getMyBusinesses: async (): Promise<Business[]> => {
    try {
      const response = await api.get<ApiResponse<Business[]>>('/business/my');
      return response.data.data || [];
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Get business by ID
   */
  getBusinessById: async (id: string): Promise<Business | null> => {
    try {
      const response = await api.get<ApiResponse<Business>>(`/business/${id}`);
      return response.data.data || null;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Update business
   */
  updateBusiness: async (id: string, data: UpdateBusinessData): Promise<Business> => {
    try {
      const response = await api.put<ApiResponse<Business>>(`/business/${id}`, data);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update business');
      }
      return response.data.data!;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Delete business (soft delete)
   */
  deleteBusiness: async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete<ApiResponse<Business>>(`/business/${id}`);
      return response.data.success;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Get business modules
   */
  getBusinessModules: async (id: string): Promise<ModulesResponse> => {
    try {
      const response = await api.get<ApiResponse<ModulesResponse>>(`/business/${id}/modules`);
      return response.data.data || { enabled: [], available: [] };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Enable a module for a business
   */
  enableModule: async (businessId: string, moduleId: ModuleType): Promise<Business> => {
    try {
      const response = await api.post<ApiResponse<Business>>(`/business/${businessId}/modules`, {
        moduleId
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to enable module');
      }
      return response.data.data!;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Disable a module for a business
   */
  disableModule: async (businessId: string, moduleId: ModuleType): Promise<Business> => {
    try {
      const response = await api.delete<ApiResponse<Business>>(
        `/business/${businessId}/modules/${moduleId}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to disable module');
      }
      return response.data.data!;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Update business stats
   */
  updateBusinessStats: async (
    businessId: string,
    stats: Partial<BusinessStats>
  ): Promise<Business> => {
    try {
      // This would typically be called internally by the system
      const response = await api.patch<ApiResponse<Business>>(
        `/business/${businessId}/stats`,
        stats
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update stats');
      }
      return response.data.data!;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============== ANALYTICS API ==============

export const analyticsApi = {
  /**
   * Get business analytics
   */
  getBusinessAnalytics: async (
    businessId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<BusinessAnalytics | null> => {
    try {
      const response = await api.get<ApiResponse<BusinessAnalytics>>(
        `/analytics/business/${businessId}`,
        { params: { period } }
      );
      return response.data.data || null;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Get platform analytics (admin)
   */
  getPlatformAnalytics: async (): Promise<PlatformAnalytics | null> => {
    try {
      const response = await api.get<ApiResponse<PlatformAnalytics>>('/analytics/platform');
      return response.data.data || null;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Get analytics summary for user's businesses
   */
  getAnalyticsSummary: async (): Promise<{
    totalBusinesses: number;
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
  }> => {
    try {
      const response = await api.get<ApiResponse<{
        totalBusinesses: number;
        totalRevenue: number;
        totalOrders: number;
        totalCustomers: number;
        averageOrderValue: number;
      }>>('/analytics/summary');
      return response.data.data || {
        totalBusinesses: 0,
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageOrderValue: 0
      };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  /**
   * Get analytics for an industry
   */
  getIndustryAnalytics: async (industry: IndustryType): Promise<{
    industry: string;
    businessCount: number;
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalStaff: number;
    averageOrderValue: number;
  }> => {
    try {
      const response = await api.get<ApiResponse<{
        industry: string;
        businessCount: number;
        totalRevenue: number;
        totalOrders: number;
        totalCustomers: number;
        totalStaff: number;
        averageOrderValue: number;
      }>>(`/analytics/industry/${industry}`);
      return response.data.data || {
        industry,
        businessCount: 0,
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalStaff: 0,
        averageOrderValue: 0
      };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============== HEALTH CHECK ==============

export const healthApi = {
  checkHealth: async (): Promise<{
    status: string;
    service: string;
    version: string;
    timestamp: string;
    uptime: number;
  } | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch {
      return null;
    }
  }
};

export default api;
