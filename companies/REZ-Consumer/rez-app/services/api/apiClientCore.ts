// @ts-nocheck
/**
 * API Client Core
 * Main ApiClient class - split from apiClient.ts for better maintainability
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { logger } from '@/utils/logger';
import { Sentry } from '@/config/sentry';
import { API_CONFIG as ENV_API_CONFIG } from '@/config/env';
import { globalDeduplicator, createRequestKey } from '@/utils/requestDeduplicator';
import { globalConcurrencyLimiter } from '@/utils/concurrencyLimiter';
import * as SecureStore from 'expo-secure-store';
import { isPinnedEndpoint, getPinningStatus } from '../certificatePinning';
import { requestRegistry } from '@/utils/requestRegistry';
import { ApiResponse, RequestOptions, API_TIMEOUTS } from './apiResponse';
import {
  sanitizeErrorMessage,
  readCsrfTokenFromDocument,
  getDeviceFingerprintHeader,
  resolveBaseURL,
  compareVersions,
  isCsrfRequired,
  emitCsrfWarning,
  shouldWarnAboutMissingCsrf,
  markCsrfWarningShown,
  parseConnectionErrorMessage,
} from './apiUtilities';
import type { SentryScope } from './apiResponse';

// Lazy import for subscription/prive state
async function getSubscriptionAndPrive(): Promise<{ subComputed: unknown; priveEligibility: unknown }> {
  const { useSubscriptionStore } = await import('@/stores/subscriptionStore');
  const { usePriveStore } = await import('@/stores/priveStore');
  const subComputed = useSubscriptionStore.getState().computed;
  const priveEligibility = usePriveStore.getState().eligibility;
  return { subComputed, priveEligibility };
}

// Region getter
let getRegionFn: (() => string) | null = null;

export function setRegionGetter(fn: (() => string) | null) {
  getRegionFn = fn;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;
  private refreshTokenCallback: (() => Promise<boolean>) | null = null;
  private logoutCallback: (() => void | Promise<void>) | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private isLoggingOut: boolean = false;
  private maintenanceCallback: (() => void) | null = null;
  private appUpdateCallback: ((minVersion: string) => void) | null = null;
  private currentAppVersion: string = '1.0.0';
  private currentRegion: string = 'bangalore';
  private slowRequestCallback: ((endpoint: string) => void) | null = null;

  constructor() {
    const rawURL = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!rawURL) {
      if (__DEV__) {
        logger.error('[ApiClient] EXPO_PUBLIC_API_BASE_URL is not set. Defaulting to localhost for dev.');
      } else {
        logger.error('[ApiClient] WARNING: EXPO_PUBLIC_API_BASE_URL is not configured. API calls will fail at runtime.');
      }
    }

    if (!rawURL && !__DEV__) {
      throw new Error(
        'FATAL: EXPO_PUBLIC_API_BASE_URL is not set in production. ' +
        'API calls will fail. Set this environment variable in your production build config.'
      );
    }

    const resolvedURL = resolveBaseURL(rawURL || 'http://localhost:5001/api');

    if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production' && !resolvedURL.startsWith('https://')) {
      throw new Error(`[ApiClient] FATAL: Production API URL must use HTTPS. Got: ${resolvedURL}`);
    }

    const pinningStatus = getPinningStatus();
    if (pinningStatus.configured) {
      logger.debug('[ApiClient] Certificate pinning configured for:', pinningStatus.pinnedHosts);
    }

    this.baseURL = resolvedURL;
    const appVersion = Constants.expoConfig?.version ?? '1.0.0';
    this.currentAppVersion = appVersion;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-App-Version': appVersion,
    };
  }

  setRegion(region: string) {
    this.currentRegion = region;
    this.defaultHeaders['X-Rez-Region'] = region;
  }

  getRegion(): string {
    return this.currentRegion;
  }

  setAuthToken(token: string | null) {
    const hadToken = !!this.authToken;
    const isNewToken = !!token && token !== this.authToken;

    this.authToken = token;
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }

    // SECURITY EVENT LOGGING: Log auth changes for security monitoring
    if (__DEV__) {
      if (!hadToken && token) {
        logger.debug('[ApiClient] Auth: Token set');
      } else if (hadToken && !token) {
        logger.debug('[ApiClient] Auth: Token cleared (logout)');
      } else if (isNewToken) {
        logger.debug('[ApiClient] Auth: Token refreshed');
      }
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  setRefreshTokenCallback(callback: (() => Promise<boolean>) | null) {
    this.refreshTokenCallback = callback;
  }

  setLogoutCallback(callback: (() => void | Promise<void>) | null) {
    this.logoutCallback = callback;
  }

  setMaintenanceCallback(callback: (() => void) | null) {
    this.maintenanceCallback = callback;
  }

  setAppUpdateCallback(callback: ((minVersion: string) => void) | null) {
    this.appUpdateCallback = callback;
  }

  setCurrentAppVersion(version: string) {
    this.currentAppVersion = version;
    this.defaultHeaders['X-App-Version'] = version;
  }

  setSlowRequestCallback(callback: ((endpoint: string) => void) | null) {
    this.slowRequestCallback = callback;
  }

  handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshTokenCallback) {
      return Promise.resolve(false);
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshTokenCallback();

    return this.refreshPromise
      .then(success => {
        return success;
      })
      .catch(() => false)
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });
  }

  private async makeRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, timeout = ENV_API_CONFIG.timeout, signal: externalSignal } = options;

    const url = `${this.baseURL}${endpoint}`;
    const currentRegion = getRegionFn ? getRegionFn() : this.currentRegion;
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      'X-Rez-Region': currentRegion,
      ...headers
    };

    // CSRF protection on web
    if (typeof window !== 'undefined' && isCsrfRequired(method)) {
      const csrfToken = readCsrfTokenFromDocument();
      if (csrfToken) {
        requestHeaders['X-CSRF-Token'] = csrfToken;
      } else {
        const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
        if (isProduction) {
          throw new Error(
            '[apiClient] FATAL: CSRF token missing in production. ' +
            'Mutating request blocked for security. Ensure <meta name="csrf-token"> is set.'
          );
        }
        emitCsrfWarning();
      }
    }

    // Device fingerprint
    const fingerprint = await getDeviceFingerprintHeader();
    if (fingerprint) {
      requestHeaders['X-Device-Fingerprint'] = fingerprint;
      requestHeaders['X-Device-OS'] = `${Platform.OS} ${Platform.Version || ''}`.trim();
    }

    let slowWarningId: ReturnType<typeof setTimeout> | null = null;
    let registryId: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (externalSignal) {
        if (externalSignal.aborted) {
          controller.abort();
        } else {
          externalSignal.addEventListener('abort', () => controller.abort());
        }
      }

      registryId = requestRegistry.register(controller, `${method} ${endpoint}`);

      if (this.slowRequestCallback && timeout >= 5000) {
        slowWarningId = setTimeout(() => {
          this.slowRequestCallback?.(endpoint);
        }, 4000);
      }

      const config: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
        credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
      };

      if (body && method !== 'GET') {
        if (body instanceof FormData) {
          delete requestHeaders['Content-Type'];
          config.body = body;
        } else {
          config.body = JSON.stringify(body);
        }
      }

      // Certificate pinning
      const { isPinnedEndpoint, validatePinnedEndpoint } = await import('./certificatePinning');
      if (isPinnedEndpoint(url)) {
        const pinValidation = await validatePinnedEndpoint(url);
        if (!pinValidation.valid) {
          logger.error('[ApiClient] Certificate pinning validation failed for:', url);
          Sentry?.captureMessage?.('Certificate pinning failure', {
            extra: { url, reason: pinValidation.reason },
          });
          if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production') {
            return {
              success: false,
              error: 'Secure connection could not be established. Please try again.',
              statusCode: 0,
            };
          }
          logger.warn('[ApiClient] Dev mode: proceeding despite pin validation failure');
        }
      }

      // Firebase App Check
      const { getAppCheckToken } = await import('./AppCheckService');
      const appCheckToken = await getAppCheckToken();
      if (appCheckToken) {
        requestHeaders['X-Firebase-AppCheck'] = appCheckToken;
      }

      const response = await globalConcurrencyLimiter.execute(() => fetch(url, config));
      clearTimeout(timeoutId);
      if (slowWarningId) clearTimeout(slowWarningId);
      requestRegistry.unregister(registryId);

      const contentType = response.headers?.get('content-type') || '';
      let responseData;
      if (response.status === 204 || !contentType.includes('application/json')) {
        responseData = { success: response.ok, data: null };
      } else {
        responseData = await response.json();
      }

      if (!response.ok) {
        // Rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : null;

          if (retryAfterSeconds && !isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
            const delayMs = retryAfterSeconds * 1000;
            logger.warn(`[ApiClient] Rate limited (429). Waiting ${retryAfterSeconds}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return this.makeRequest<T>(endpoint, options);
          }

          const maxRetries = 3;
          let retryCount = 0;
          while (retryCount < maxRetries) {
            retryCount++;
            const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);
            logger.warn(`[ApiClient] Rate limited (429). Retry ${retryCount}/${maxRetries} in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));

            try {
              const healthResponse = await fetch(`${this.baseURL.replace('/api', '')}/health`, { signal: controller.signal });
              if (healthResponse.ok) {
                logger.log(`[ApiClient] Service recovered after ${retryCount} retries`);
                return this.makeRequest<T>(endpoint, options);
              }
            } catch { /* continue retrying */ }
          }

          return { success: false, error: 'Rate limit exceeded. Please try again later.', statusCode: 429 };
        }

        // Maintenance mode
        if (response.status === 503 && this.maintenanceCallback) {
          this.maintenanceCallback();
          return { success: false, error: 'Server is under maintenance. Please try again later.' };
        }

        // App version outdated
        if (response.status === 426 && this.appUpdateCallback) {
          const minVersion = responseData.minVersion || responseData.minimum_version || '1.0.0';
          this.appUpdateCallback(minVersion);
          return { success: false, error: 'Please update your app to continue.' };
        }

        const serverMinVersion = response.headers.get('X-Min-App-Version');
        if (serverMinVersion && this.appUpdateCallback) {
          if (compareVersions(this.currentAppVersion, serverMinVersion) < 0) {
            this.appUpdateCallback(serverMinVersion);
          }
        }

        // 401 handling
        if (response.status === 401 && this.authToken) {
          if (this.isLoggingOut) {
            return { success: false, error: 'Session expired' };
          }

          if (Platform.OS === 'web' && this.authToken === 'cookie-session') {
            if (this.refreshTokenCallback && !this.isLoggingOut) {
              const refreshSuccess = await this.handleTokenRefresh();
              if (refreshSuccess) return this.makeRequest<T>(endpoint, options);
            }
          }

          if (this.refreshTokenCallback && !this.isLoggingOut) {
            const refreshSuccess = await this.handleTokenRefresh();
            if (refreshSuccess) return this.makeRequest<T>(endpoint, options);
          } else if (!this.refreshTokenCallback) {
            if (this.logoutCallback && !this.isLoggingOut) {
              this.isLoggingOut = true;
              try {
                await this.logoutCallback();
              } catch {
                this.setAuthToken(null);
              } finally {
                this.isLoggingOut = false;
              }
            } else if (!this.logoutCallback) {
              this.setAuthToken(null);
            }
          }
        }

        return {
          success: false,
          error: sanitizeErrorMessage(
            responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`,
            response.status
          ),
          errors: responseData.errors
        };
      }

      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message,
        meta: responseData.meta
      };

    } catch (error) {
      if (slowWarningId) clearTimeout(slowWarningId);
      if (registryId !== null) requestRegistry.unregister(registryId);

      try {
        const { subComputed, priveEligibility } = await getSubscriptionAndPrive();

        Sentry?.withScope?.((scope: SentryScope) => {
          scope.setTag('endpoint', endpoint);
          scope.setTag('method', method);
          scope.setTag('user_tier', (subComputed as { isVIP?: boolean; isPremium?: boolean })?.isVIP ? 'vip'
            : (subComputed as { isVIP?: boolean; isPremium?: boolean })?.isPremium ? 'premium' : 'free');
          scope.setTag('prive_tier', (priveEligibility as { tier?: string })?.tier ?? 'none');
          scope.setTag('error_type',
            error instanceof Error && error.name === 'AbortError' ? 'timeout'
            : error instanceof Error && isConnectionError(error) ? 'network' : 'api');
          Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
        });
      } catch { /* Sentry unavailable */ }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timeout - Backend server may be slow or unresponsive' };
        }
        if (isConnectionError(error)) {
          return { success: false, error: sanitizeErrorMessage(parseConnectionErrorMessage(error)) };
        }
        return { success: false, error: sanitizeErrorMessage(error.message) };
      }

      return { success: false, error: 'Unknown error occurred' };
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: { deduplicate?: boolean; timeout?: number; headers?: Record<string, string>; signal?: AbortSignal }
  ): Promise<ApiResponse<T>> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, String(params[key]));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const requestOptions: RequestOptions = { method: 'GET' };
    if (options?.timeout) requestOptions.timeout = options.timeout;
    if (options?.headers) requestOptions.headers = options.headers;
    if (options?.signal) requestOptions.signal = options.signal;

    const shouldDeduplicate = options?.deduplicate !== false;

    if (shouldDeduplicate) {
      const currentRegion = getRegionFn ? getRegionFn() : this.currentRegion;
      const requestKey = createRequestKey(`${this.baseURL}${url}:region=${currentRegion}`, params);
      return globalDeduplicator.dedupe(requestKey, () => this.makeRequest<T>(url, requestOptions));
    }

    return this.makeRequest<T>(url, requestOptions);
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: { deduplicate?: boolean; timeout?: number; headers?: Record<string, string>; signal?: AbortSignal }
  ): Promise<ApiResponse<T>> {
    const shouldDeduplicate = options?.deduplicate === true;
    const requestOpts: RequestOptions = { method: 'POST', body: data as unknown as RequestOptions['body'] };
    if (options?.timeout) requestOpts.timeout = options.timeout;
    if (options?.headers) requestOpts.headers = options.headers;

    if (shouldDeduplicate) {
      const requestKey = createRequestKey(`POST:${this.baseURL}${endpoint}`, data);
      return globalDeduplicator.dedupe(requestKey, () => this.makeRequest<T>(endpoint, requestOpts));
    }

    return this.makeRequest<T>(endpoint, requestOpts);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: { deduplicate?: boolean; timeout?: number }
  ): Promise<ApiResponse<T>> {
    const shouldDeduplicate = options?.deduplicate === true;
    const requestOpts: RequestOptions = { method: 'PUT', body: data };
    if (options?.timeout) requestOpts.timeout = options.timeout;

    if (shouldDeduplicate) {
      const requestKey = createRequestKey(`PUT:${this.baseURL}${endpoint}`, data);
      return globalDeduplicator.dedupe(requestKey, () => this.makeRequest<T>(endpoint, requestOpts));
    }

    return this.makeRequest<T>(endpoint, requestOpts);
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: { deduplicate?: boolean; timeout?: number }
  ): Promise<ApiResponse<T>> {
    const shouldDeduplicate = options?.deduplicate === true;
    const requestOpts: RequestOptions = { method: 'PATCH', body: data as unknown as RequestOptions['body'] };
    if (options?.timeout) requestOpts.timeout = options.timeout;

    if (shouldDeduplicate) {
      const requestKey = createRequestKey(`PATCH:${this.baseURL}${endpoint}`, data);
      return globalDeduplicator.dedupe(requestKey, () => this.makeRequest<T>(endpoint, requestOpts));
    }

    return this.makeRequest<T>(endpoint, requestOpts);
  }

  async delete<T>(
    endpoint: string,
    data?: Record<string, unknown> | unknown[] | FormData,
    options?: { deduplicate?: boolean; timeout?: number }
  ): Promise<ApiResponse<T>> {
    const shouldDeduplicate = options?.deduplicate === true;
    const requestOpts: RequestOptions = { method: 'DELETE', body: data };
    if (options?.timeout) requestOpts.timeout = options.timeout;

    if (shouldDeduplicate) {
      const requestKey = createRequestKey(`DELETE:${this.baseURL}${endpoint}`, data);
      return globalDeduplicator.dedupe(requestKey, () => this.makeRequest<T>(endpoint, requestOpts));
    }

    return this.makeRequest<T>(endpoint, requestOpts);
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'POST', body: formData, timeout: API_TIMEOUTS.UPLOAD });
  }

  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      const data = await response.json();
      return { success: response.ok, data, error: response.ok ? undefined : data.error };
    } catch {
      return { success: false, error: 'Cannot connect to server' };
    }
  }

  setBaseURL(url: string) {
    this.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  getDeduplicationStats() {
    return globalDeduplicator.getStats();
  }

  printDeduplicationStats() {
    globalDeduplicator.printStats();
  }

  cancelAllRequests() {
    globalDeduplicator.cancelAll();
  }
}

// Singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };
