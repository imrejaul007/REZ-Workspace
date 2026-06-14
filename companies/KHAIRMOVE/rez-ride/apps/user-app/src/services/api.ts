import { logger } from '../../shared/logger';
/**
 * Enhanced API Service
 * - Network retry with exponential backoff
 * - Offline queue integration
 * - Token refresh handling
 */

import Constants from 'expo-constants';
import { secureStorage } from './secure-storage';
import { offlineQueue } from './offline-queue';

// API Configuration
const getApiUrl = (): string => {
  if (Constants.expoConfig?.extra?.API_URL) {
    return Constants.expoConfig.extra.API_URL;
  }
  if (__DEV__) {
    return 'http://localhost:4000';
  }
  return 'https://api.rezride.com';
};

export const API_BASE_URL = getApiUrl();

// Retry configuration
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  /**
   * Initialize API service
   */
  async initialize(): Promise<void> {
    this.token = await secureStorage.getToken();
    offlineQueue.onConnectivityChange((online) => {
      if (online) {
        logger.info('Back online - processing queue');
      }
    });
  }

  /**
   * Set auth token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear auth token
   */
  clearToken(): void {
    this.token = null;
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 0
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle different status codes
      switch (response.status) {
        case 429: {
          // Rate limited
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : BASE_RETRY_DELAY * Math.pow(2, retries);
          await this.delay(delay);
          return this.executeRequest(endpoint, options, retries + 1);
        }

        case 401: {
          // Unauthorized - try token refresh
          if (retries === 0) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
              return this.executeRequest(endpoint, options, retries + 1);
            }
          }
          throw new ApiError('Unauthorized', 401, 'AUTH_FAILED');
        }

        case 500:
        case 502:
        case 503: {
          // Server errors - retry with exponential backoff
          if (retries < MAX_RETRIES) {
            const delay = Math.min(
              BASE_RETRY_DELAY * Math.pow(2, retries) + Math.random() * 1000,
              MAX_RETRY_DELAY
            );
            await this.delay(delay);
            return this.executeRequest(endpoint, options, retries + 1);
          }
          throw new ApiError('Server error', response.status);
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || 'Request failed',
          response.status,
          data.code
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error - queue if offline
      const isOffline = !navigator.onLine;
      if (isOffline && (options.method === 'POST' || options.method === 'PUT')) {
        await offlineQueue.addToQueue({
          endpoint: url,
          method: (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
          body: options.body ? JSON.parse(options.body as string) : undefined,
          headers,
        });
        throw new ApiError('Request queued for when online', 0, 'QUEUED');
      }

      // Retry on network errors
      if (retries < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, retries);
        await this.delay(delay);
        return this.executeRequest(endpoint, options, retries + 1);
      }

      throw new ApiError('Network error', 0, 'NETWORK_ERROR');
    }
  }

  /**
   * Try to refresh the auth token
   */
  private async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          this.token = data.token;
          await secureStorage.setToken(data.token);
          if (data.refreshToken) {
            await secureStorage.setRefreshToken(data.refreshToken);
          }
          return true;
        }
      }
    } catch (error) {
      logger.error('Token refresh failed:', error);
    }

    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============ HTTP Methods ============

  async get<T>(endpoint: string): Promise<T> {
    return this.executeRequest<T>(endpoint);
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.executeRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.executeRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.executeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // ============ Auth ============

  async requestOTP(phone: string) {
    return this.post('/api/auth/request-otp', { phone, type: 'login' });
  }

  async verifyOTP(phone: string, otp: string) {
    const response = await this.post<{ success: boolean; token: string; refreshToken?: string; user: any }>(
      '/api/auth/verify-otp',
      { phone, otp }
    );

    if (response.token) {
      await secureStorage.setToken(response.token);
      if (response.refreshToken) {
        await secureStorage.setRefreshToken(response.refreshToken);
      }
      this.token = response.token;
    }

    return response;
  }

  // ============ Rides ============

  async createRide(params: {
    pickup: { lat: number; lng: number; address: string };
    drop: { lat: number; lng: number; address: string };
    vehicleType: string;
    paymentMethod?: string;
    voucherId?: string;
  }) {
    return this.post('/api/rides', params);
  }

  async getRide(rideId: string) {
    return this.get(`/api/rides/${rideId}`);
  }

  async cancelRide(rideId: string, reason?: string) {
    return this.post(`/api/rides/${rideId}/cancel`, { reason });
  }

  async getRideHistory(limit = 20, offset = 0) {
    return this.get(`/api/rides/history?limit=${limit}&offset=${offset}`);
  }

  async rateRide(rideId: string, rating: number, comment?: string) {
    return this.post(`/api/rides/${rideId}/rate`, { rating, comment });
  }

  // ============ Fares ============

  async getFareEstimate(params: {
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
    vehicleType: string;
  }) {
    const query = new URLSearchParams({
      pickupLat: params.pickupLat.toString(),
      pickupLng: params.pickupLng.toString(),
      dropLat: params.dropLat.toString(),
      dropLng: params.dropLng.toString(),
      vehicleType: params.vehicleType,
    }).toString();
    return this.get(`/api/fares/estimate?${query}`);
  }

  // ============ Wallet ============

  async getWalletBalance() {
    return this.get('/api/vouchers/wallet');
  }

  // ============ Vouchers ============

  async getVouchers() {
    return this.get('/api/vouchers');
  }

  async applyVoucher(code: string) {
    return this.post('/api/vouchers/apply', { code });
  }
}

export const apiService = new ApiService();
export default apiService;
