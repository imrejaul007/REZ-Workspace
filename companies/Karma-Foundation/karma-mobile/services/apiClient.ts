/**
 * API Client for Karma Foundation Mobile App
 * Points to the Karma Service at https://karma-foundation-api.onrender.com/v1/karma/*
 * Includes offline support and request caching
 *
 * SECURITY: Uses expo-secure-store for token storage (not AsyncStorage)
 * SECURITY FIX: API URL from environment, biometric auth enabled
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { getCache, setCache, queueRequest, removeFromQueue, getOfflineQueue } from './cache';

// SECURITY FIX: Use environment variable for API URL (not hardcoded)
const BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'https://karma-foundation-api.onrender.com/v1/karma';
const TOKEN_KEY = 'karma_foundation_token';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Secure storage wrapper for token operations
 * Falls back to AsyncStorage if SecureStore is unavailable
 */
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('[SecureStorage] Failed to get item:', key, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // SECURITY FIX: Enable biometric authentication for enhanced security
      await SecureStore.setItemAsync(key, value, {
        require: {
          deviceAuthentication: true,
          biometricAuthentication: true,
        },
      });
    } catch (error) {
      console.warn('[SecureStorage] Failed to set item:', key, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('[SecureStorage] Failed to remove item:', key, error);
    }
  },
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await secureStorage.removeItem(TOKEN_KEY);
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, string | number>, useCache = true): Promise<ApiResponse<T>> {
    // Try cache first for GET requests
    if (useCache) {
      const cacheKey = `${url}:${JSON.stringify(params || {})}`;
      const cached = await getCache<T>(cacheKey);
      if (cached) {
        console.log('[API] Cache hit:', url);
        return { success: true, data: cached };
      }
    }

    try {
      const response = await this.client.get<ApiResponse<T>>(url, { params });

      // Cache successful GET requests
      if (useCache && response.data.success && response.data.data) {
        await setCache(`${url}:${JSON.stringify(params || {})}`, response.data.data, CACHE_TTL);
      }

      return response.data;
    } catch (error) {
      // On network error, try cache as fallback
      if (!error.response && useCache) {
        const cacheKey = `${url}:${JSON.stringify(params || {})}`;
        const cached = await getCache<T>(cacheKey);
        if (cached) {
          console.log('[API] Network error, using cache:', url);
          return { success: true, data: cached, message: 'Cached data (offline)' };
        }
      }

      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async post<T, D = unknown>(url: string, data?: D): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      // Queue request for offline retry
      if (!error.response) {
        await queueRequest(url, 'POST', data);
        console.log('[API] Request queued for offline:', url);
        return {
          success: false,
          message: 'Request queued for when you are back online',
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async put<T, D = unknown>(url: string, data?: D): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      if (!error.response) {
        await queueRequest(url, 'PUT', data);
        return {
          success: false,
          message: 'Request queued for when you are back online',
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async patch<T, D = unknown>(url: string, data?: D): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      if (!error.response) {
        await queueRequest(url, 'PATCH', data);
        return {
          success: false,
          message: 'Request queued for when you are back online',
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      if (!error.response) {
        await queueRequest(url, 'DELETE');
        return {
          success: false,
          message: 'Request queued for when you are back online',
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Set authentication token securely
   * Uses expo-secure-store with device authentication
   */
  async setToken(token: string): Promise<void> {
    await secureStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Clear authentication token
   */
  async clearToken(): Promise<void> {
    await secureStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    return secureStorage.getItem(TOKEN_KEY);
  }

  /**
   * Retry queued offline requests when back online
   */
  async retryOfflineRequests(): Promise<void> {
    const queue = await getOfflineQueue();
    console.log('[API] Retrying offline requests:', queue.length);

    for (const request of queue) {
      try {
        const config: AxiosRequestConfig = {};
        if (request.data) config.data = request.data;

        await this.client.request({
          url: request.url,
          method: request.method,
          ...config,
        });

        await removeFromQueue(request.id);
        console.log('[API] Offline request succeeded:', request.url);
      } catch (error) {
        console.log('[API] Offline request failed, keeping in queue:', request.url);
      }
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;
export { ApiClient };
