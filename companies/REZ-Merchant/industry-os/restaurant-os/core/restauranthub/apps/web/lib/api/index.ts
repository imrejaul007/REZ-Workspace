// Core API Client
export { apiClient, type ApiResponse, type PaginatedResponse } from './client';

// Authentication API
export { authApi } from './auth';
export { authApi as authApiClient } from './auth-api';

// User Management API
export * from './users';

// Restaurant Management API
export * from './restaurants';

// Job Management API
export * from './jobs';

// Vendor & Product Management API
export * from './vendors';

// Order Management API
export * from './orders';

// Community API
export * from './community';

// Admin API
export * from './admin';

// API Client Instances
import { apiClient } from './client';
import { restaurantsApi } from './restaurants';
import { jobsApi } from './jobs';
import { usersApi } from './users';
import { vendorsApi } from './vendors';
import { communityApi } from './community';
import { adminApi } from './admin';

// Centralized API object
export const api = {
  // Core client
  client: apiClient,

  // Service APIs
  restaurants: restaurantsApi,
  jobs: jobsApi,
  users: usersApi,
  vendors: vendorsApi,
  community: communityApi,
  admin: adminApi,

  // Common utility methods
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string; services: Record<string, boolean> }> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {}
      };
    }
  },

  async getServerInfo(): Promise<{ version: string; environment: string; uptime: number }> {
    try {
      const response = await apiClient.get('/info');
      return response.data;
    } catch (error) {
      return {
        version: 'unknown',
        environment: 'unknown',
        uptime: 0
      };
    }
  },

  // Utility for handling API errors
  handleError(error): string {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
};

// Default export
export default api;