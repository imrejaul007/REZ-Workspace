/**
 * API Client — Singleton Axios instance for all backend API calls.
 *
 * Separated from index.ts to break circular imports.
 * Service files import from here, index.ts re-exports from here.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import { storageService, COOKIE_AUTH_ENABLED } from '../storage';
import { logger } from '../../utils/logger';

const API_BASE_URL = getApiUrl();
const API_TIMEOUT = API_CONFIG.TIMEOUT;

// rez-merchant-service base URL.
// AC2-H4 fix: removed hardcoded Render URL fallback — it bypasses the API gateway
// (no rate-limiting, no CORS enforcement, no security headers) and silently breaks
// if the Render service is renamed or scaled.
// In production EXPO_PUBLIC_MERCHANT_SERVICE_URL MUST be set. In dev, localhost is used.
// Order of precedence:
//   1. EXPO_PUBLIC_MERCHANT_SERVICE_URL env var (set in Vercel / EAS build) — REQUIRED in prod
//   2. localhost:4005 in dev (matches render.yaml PORT)
const MERCHANT_SERVICE_BASE_URL: string | null =
  process.env.EXPO_PUBLIC_MERCHANT_SERVICE_URL || (__DEV__ ? 'http://localhost:4005' : null);

if (!__DEV__ && !MERCHANT_SERVICE_BASE_URL) {
  // Hard error in production — do not silently route to a stale/wrong URL.
  throw new Error(
    '[CONFIG] EXPO_PUBLIC_MERCHANT_SERVICE_URL is required in production. ' +
      'Set it in Vercel environment variables or EAS build secrets.'
  );
}

// Path prefixes that should hit rez-merchant-service instead of the monolith.
// Mirrors the comments in rez-backend/src/config/routes.ts:828-866 — everything under
// /api/merchant/* except qr/* and invoices/* is owned by rez-merchant-service.

function shouldRouteToMerchantService(cleanUrl: string): boolean {
  // MERCH-FIX: MERCHANT_SERVICE_BASE_URL aligned to localhost:4005
  // to match render.yaml PORT and merchant-service default
  if (!MERCHANT_SERVICE_BASE_URL) return false;
  if (!cleanUrl.startsWith('merchant/')) return false;
  // Exceptions: these are still on the monolith
  if (cleanUrl.startsWith('merchant/qr/')) return false;
  if (cleanUrl.startsWith('merchant/invoices')) return false;
  if (cleanUrl.startsWith('merchant/trials')) return false;
  // Phase C — /api/merchant/campaign-templates lives on the monolith.
  if (cleanUrl.startsWith('merchant/campaign-templates')) return false;
  // Phase E — /api/merchant/daily-actions lives on the monolith.
  if (cleanUrl.startsWith('merchant/daily-actions')) return false;
  // Phase G — /api/merchant/roi-summary lives on the monolith.
  if (cleanUrl.startsWith('merchant/roi-summary')) return false;
  // Phase H — /api/merchant/growth-score lives on the monolith.
  if (cleanUrl.startsWith('merchant/growth-score')) return false;
  // Phase J — /api/merchant/cpa-billing lives on the monolith.
  if (cleanUrl.startsWith('merchant/cpa-billing')) return false;
  return true;
}

// Canonical API types — imported locally and re-exported for consumers
import type { ApiResponse, PaginatedResponse, Pagination } from '../../types/api';
export type { ApiResponse, PaginatedResponse, Pagination };

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isTokenInvalid: boolean = false;
  private cachedToken: string | null = null;
  private tokenInitPromise: Promise<void> | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;
  private refreshSubscribers: Array<{
    resolve: (token: string) => void;
    reject: (err: Error) => void;
  }> = [];
  private onLogoutCallback: (() => void) | null = null;
  private readonly MAX_REFRESH_SUBSCRIBERS = 50; // MERCH-005: Limit queue size

  constructor() {
    const baseURL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

    this.axiosInstance = axios.create({
      baseURL,
      timeout: API_TIMEOUT,
      headers: {},
      // Phase 6: withCredentials ensures the browser sends the httpOnly cookie (rez_access_token)
      // on cross-origin requests. On native, axios ignores this option — no behaviour change.
      withCredentials: true,
      xsrfCookieName: 'csrf-token',
      xsrfHeaderName: 'x-csrf-token',
    });

    this.tokenInitPromise = this.initializeToken();
    this.setupInterceptors();
  }

  private async initializeToken(): Promise<void> {
    try {
      this.cachedToken = await storageService.getAuthToken();
    } catch {
      this.cachedToken = null;
    }
  }

  setToken(token: string | null): void {
    this.cachedToken = token;
    // MERCH-044: Reset token invalid flag when a new token is set (successful auth)
    this.isTokenInvalid = false;
  }

  setOnLogoutCallback(callback: () => void): void {
    this.onLogoutCallback = callback;
  }

  /**
   * Refresh the authentication token
   */
  private async refreshToken(): Promise<string> {
    try {
      // Try to get refresh token from storage
      const refreshToken = await storageService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update stored tokens
      if (accessToken) {
        this.cachedToken = accessToken;
        await storageService.setAuthToken(accessToken);
      }
      if (newRefreshToken) {
        await storageService.setRefreshToken(newRefreshToken);
      }

      return accessToken;
    } catch (error) {
      // Refresh failed - clear auth state
      this.isTokenInvalid = true;
      this.cachedToken = null;
      await storageService.removeAuthToken();
      await storageService.removeRefreshToken();
      await storageService.removeUserData();
      await storageService.removeMerchantData();
      if (this.onLogoutCallback) {
        this.onLogoutCallback();
      }
      throw error;
    }
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Path-based routing: send /merchant/* (except qr & invoices) to rez-merchant-service.
        // Mirrors nginx behavior in production. No-op when MERCHANT_SERVICE_BASE_URL is unset.
        const reqUrl = (config.url || '').replace(/^\/+/, '');
        if (shouldRouteToMerchantService(reqUrl)) {
          const merchantUrl = MERCHANT_SERVICE_BASE_URL!;
          config.baseURL = merchantUrl.endsWith('/') ? merchantUrl.slice(0, -1) : merchantUrl;
        }

        // MERCH-004: Pre-flight token expiry check before making API calls
        if (this.isTokenInvalid && !config.url?.includes('/auth/')) {
          return Promise.reject(new Error('Token is invalid, please login again'));
        }

        if (this.tokenInitPromise) {
          await this.tokenInitPromise;
          this.tokenInitPromise = null;
        }

        const token = this.cachedToken;
        // Phase 6: When COOKIE_AUTH_ENABLED, the browser sends the httpOnly cookie automatically
        // via withCredentials:true. Skip injecting the Authorization header from the in-memory
        // token cache to avoid double-sending credentials.
        // On native, COOKIE_AUTH_ENABLED is still true but the bearer header is the only path —
        // native http clients don't use browser cookies. So for native we always send the header.
        const isWeb = typeof document !== 'undefined'; // crude platform check for client.ts
        if (token && !this.isTokenInvalid && (!COOKIE_AUTH_ENABLED || !isWeb)) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Manually attach CSRF token since Axios built-in xsrf prevention ignores cross-origin URLs
        if (isWeb) {
          const match = document.cookie.match(new RegExp('(?:^|; )csrf-token=([^;]+)'));
          if (match) {
            config.headers = config.headers || {};
            config.headers['x-csrf-token'] = match[1];
          }
        }

        // Add device fingerprint header for backend security tracking
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const stored = await AsyncStorage.getItem('@security_merchant_fingerprint');
          if (stored) {
            const fp = JSON.parse(stored);
            const hash = fp.hash || fp.id || fp;
            if (hash && typeof hash === 'string') {
              config.headers['X-Device-Fingerprint'] = hash;
            }
          }
        } catch (e) {
          // Non-critical — fingerprint not available
        }

        config.headers = config.headers || {};
        const isFormData =
          config.data instanceof FormData ||
          (typeof FormData !== 'undefined' && config.data instanceof FormData) ||
          (config.data &&
            typeof config.data === 'object' &&
            config.data.constructor?.name === 'FormData');

        if (isFormData) {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        } else if (config.data && !config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => response,
      async (error) => {
        const originalRequest = error.config;

        // MED-08 FIX: Handle 429 Too Many Requests with exponential backoff retry.
        // Rate limiting is applied by the API gateway (Redis). The Retry-After header
        // is respected if present; otherwise a default 2s base with exponential backoff is used.
        if (error.response?.status === 429 && originalRequest) {
          const retryCount = (originalRequest._retryCount as number) || 0;
          const MAX_RETRIES = 3;

          if (retryCount >= MAX_RETRIES) {
            logger.warn('[Merchant API] 429: max retries exceeded, giving up');
            return Promise.reject(
              new Error('Too many requests. Please wait a moment and try again.')
            );
          }

          // Read Retry-After header if present; otherwise compute backoff delay.
          const retryAfter = error.response.headers?.['retry-after'];
          let delayMs: number;
          if (retryAfter) {
            const retrySecs = parseInt(retryAfter, 10);
            delayMs = Number.isFinite(retrySecs) ? retrySecs * 1000 : 5000;
          } else {
            // Exponential backoff: 2s, 4s, 8s
            delayMs = Math.pow(2, retryCount + 1) * 1000;
          }

          logger.info(
            `[Merchant API] 429: retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
          );

          await new Promise((resolve) => setTimeout(resolve, delayMs));

          originalRequest._retryCount = retryCount + 1;
          return this.axiosInstance(originalRequest);
        }

        // Only attempt refresh on 401, not on auth endpoints, and not already retried
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/')
        ) {
          originalRequest._retry = true;

          // FIX (145): Mutex pattern — if refresh is already in-flight, wait for it instead of
          // spawning a duplicate refresh. This prevents multiple simultaneous 401-triggered refreshes
          // (which can happen if several requests race to the 401 response). The refreshPromise
          // acts as the mutex: if set, all concurrent requests share the same in-flight promise.
          if (this.refreshPromise) {
            return new Promise((resolve, reject) => {
              // MERCH-005: Limit queue size to prevent unbounded growth
              if (this.refreshSubscribers.length < this.MAX_REFRESH_SUBSCRIBERS) {
                this.refreshSubscribers.push({
                  resolve: (newToken: string) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    resolve(this.axiosInstance(originalRequest));
                  },
                  reject,
                });
              } else {
                // Queue is full, reject this request
                reject(new Error('Token refresh queue full'));
              }
            });
          }

          this.isRefreshing = true;
          // Store the promise so concurrent 401s share the same refresh flow
          this.refreshPromise = this.refreshToken();

          try {
            const newToken = await this.refreshPromise;
            // Refresh succeeded — notify all queued requests
            this.refreshSubscribers.forEach(({ resolve: cb }) => cb(newToken));
            this.refreshSubscribers = [];
            this.refreshPromise = null;

            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed — reject all queued requests
            const error =
              refreshError instanceof Error ? refreshError : new Error('Token refresh failed');
            this.refreshSubscribers.forEach(({ reject: rej }) => rej(error));
            this.refreshSubscribers = [];
            this.refreshPromise = null;

            // Clear auth state so user is logged out
            this.isTokenInvalid = true;
            this.cachedToken = null;
            await storageService.removeAuthToken();
            await storageService.removeRefreshToken();
            await storageService.removeUserData();
            await storageService.removeMerchantData();
            if (this.onLogoutCallback) {
              this.onLogoutCallback();
            }
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const response = await this.axiosInstance.get<ApiResponse<T>>(cleanUrl, config);
    return response.data;
  }

  async post<T = unknown>(
    url: string,
    data?,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const isFormData =
      data instanceof FormData ||
      (typeof FormData !== 'undefined' && data instanceof FormData) ||
      (data && typeof data === 'object' && data.constructor?.name === 'FormData');

    let requestConfig: AxiosRequestConfig = { ...config };
    if (isFormData) {
      requestConfig = {
        ...config,
        headers: { ...config?.headers, 'Content-Type': undefined },
        transformRequest: [(d) => d],
      };
    }

    const response = await this.axiosInstance.post<ApiResponse<T>>(cleanUrl, data, requestConfig);
    return response.data;
  }

  async put<T = unknown>(
    url: string,
    data?,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const response = await this.axiosInstance.put<ApiResponse<T>>(cleanUrl, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const response = await this.axiosInstance.delete<ApiResponse<T>>(cleanUrl, config);
    return response.data;
  }

  async patch<T = unknown>(
    url: string,
    data?,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const response = await this.axiosInstance.patch<ApiResponse<T>>(cleanUrl, data, config);
    return response.data;
  }

  async getPaginated<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    const response = await this.axiosInstance.get<PaginatedResponse<T>>(url, config);
    return response.data;
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const response = await this.axiosInstance.get('/health');
    return response.data;
  }

  // MA-GAP-160: Blob download that passes through the request interceptor (token injection,
  // device fingerprint, CSRF, path routing) but returns the raw binary data directly.
  async downloadBlob(
    url: string,
    responseType: 'blob' | 'arraybuffer' = 'blob'
  ): Promise<Blob | ArrayBuffer> {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const response = await this.axiosInstance.get(cleanUrl, { responseType });
    return response.data;
  }

  resetTokenStatus(): void {
    this.isTokenInvalid = false;
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
