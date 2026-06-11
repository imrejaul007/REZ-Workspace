import { API_CONFIG, buildApiUrl } from '../../config/api';
import { storageService } from '../storage';
import Constants from 'expo-constants';

// Canonical API types — inlined to avoid local file path dependency
import type { ApiResponse } from '../../types/rez-shared-types';
export type { ApiResponse };

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

class ApiClient {
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string | null> | null = null;
  private onLogoutCallback: (() => void) | null = null;

  /**
   * Register a callback to be invoked when a token refresh fails and the user
   * must be redirected to the login screen. Wire this up from AuthContext.
   */
  setOnLogoutCallback(callback: () => void) {
    this.onLogoutCallback = callback;
  }

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * Returns the new access token on success, or null on failure.
   */
  private async attemptTokenRefresh(): Promise<string | null> {
    // Deduplicate concurrent refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await storageService.getRefreshToken();
        if (!refreshToken) return null;

        const url = buildApiUrl('admin/auth/refresh-token');
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include', // Phase 6: send httpOnly cookies cross-origin
        });

        const data = await response.json();

        if (response.ok && data?.success && data?.data?.token) {
          await storageService.setAuthToken(data.data.token);
          if (data.data.refreshToken) {
            await storageService.setRefreshToken(data.data.refreshToken);
          }
          if (data.data.user) {
            await storageService.setUserData(data.data.user);
          }
          if (__DEV__) console.log('[Admin API] Token refreshed successfully');
          return data.data.token as string;
        }

        return null;
      } catch (err) {
        if (__DEV__) console.error('[Admin API] Token refresh failed:', err);
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async getHeaders(
    customHeaders?: Record<string, string>
  ): Promise<Record<string, string>> {
    const token = await storageService.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // BUG-048: Read version from app config instead of hardcoding it.
      'X-App-Version':
        Constants.expoConfig?.version ?? (Constants.manifest as any)?.version ?? '1.0.0',
      ...customHeaders,
    };

    // Always set the Authorization header when a token is available.
    // On web, cookies (rez_access_token) are also sent via credentials:'include' and act as a
    // supplement. On native, cookies are not sent automatically, so the Bearer token is the
    // only auth mechanism — omitting it when COOKIE_AUTH_ENABLED=true caused all native
    // requests to return 401.
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // BUG-058 FIX: body is now generic <B> so callers get type safety and the
  // internal `any` is confined to the JSON serialisation call.
  private async request<T, B = Record<string, unknown>>(
    method: string,
    endpoint: string,
    body?: B,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    const headers = await this.getHeaders(options?.headers);
    const timeout = options?.timeout || API_CONFIG.TIMEOUT;

    if (__DEV__) console.log(`🌐 [Admin API] ${method} ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: 'include', // Phase 6: send httpOnly cookies cross-origin
      });

      const data = await response.json();

      if (!response.ok) {
        if (__DEV__)
          console.error(
            `❌ [Admin API] ${method} ${endpoint} failed:`,
            data.message || response.statusText
          );

        // Handle 401 - attempt token refresh before logging out
        if (response.status === 401 && !endpoint.includes('/auth/')) {
          if (__DEV__) console.log('[Admin API] Token expired, attempting refresh...');
          const newToken = await this.attemptTokenRefresh();
          if (newToken) {
            // Retry the original request with the refreshed token.
            // Always inject the Authorization header — on native there are no cookies,
            // so the Bearer token is the only auth mechanism. On web the cookie is also
            // sent via credentials:'include' as a supplement, which is harmless.
            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            // Add AbortController with timeout for retry request
            const retryController = new AbortController();
            const retryTimeoutId = setTimeout(() => retryController.abort(), timeout);
            try {
              const retryResponse = await fetch(url, {
                method,
                headers: retryHeaders,
                body: body ? JSON.stringify(body) : undefined,
                signal: retryController.signal,
                credentials: 'include', // Phase 6: send httpOnly cookies cross-origin
              });
              const retryData = await retryResponse.json();
              if (retryResponse.ok) {
                if (__DEV__)
                  console.log(`✅ [Admin API] ${method} ${endpoint} success (after refresh)`);
                return retryData;
              }
            } catch (retryError: any) {
              if (retryError.name !== 'AbortError') throw retryError;
              throw new Error('Retry request timeout');
            } finally {
              clearTimeout(retryTimeoutId);
            }
          }

          // Refresh failed — log out and redirect to login
          if (__DEV__) console.log('[Admin API] Token refresh failed, clearing auth data');
          await storageService.logout();
          // Invoke the registered logout callback so the auth context can
          // dispatch LOGOUT and trigger navigation to the login screen.
          if (this.onLogoutCallback) {
            this.onLogoutCallback();
          }
          return {
            success: false,
            message: 'Session expired. Please log in again.',
          };
        }

        // Handle 429 - rate limited, retry once with server-requested delay + jitter
        if (response.status === 429 && !(options as any)?._retryCount) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
          // Math.random() is acceptable here for jitter to prevent thundering herd (not for ID generation)
          const jitter = Math.random() * 2000; // 0-2s jitter to avoid thundering herd
          const delay = retryAfter * 1000 + jitter;
          if (__DEV__)
            console.log(
              `⏳ [Admin API] Rate limited, retrying in ${(delay / 1000).toFixed(1)}s...`
            );
          await new Promise((r) => setTimeout(r, delay));
          return this.request<T, B>(method, endpoint, body, { ...options, _retryCount: 1 } as any);
        }

        // Spread all fields so callers can inspect extra flags (e.g. requiresTotp: true).
        return {
          ...data,
          success: false,
          message: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      if (__DEV__) console.log(`✅ [Admin API] ${method} ${endpoint} success`);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (__DEV__) console.error(`❌ [Admin API] ${method} ${endpoint} timeout`);
        return {
          success: false,
          message: 'Request timeout',
        };
      }

      if (__DEV__) console.error(`❌ [Admin API] ${method} ${endpoint} error:`, error.message);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    } finally {
      // ADMIN-004: Clear timeout once, using finally block
      clearTimeout(timeoutId);
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  // BUG-058 FIX: body params typed as Record<string, unknown> by default;
  // callers can still pass a specific type via the generic: post<Response, Body>.
  async post<T, B = Record<string, unknown>>(
    endpoint: string,
    body?: B,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T, B>('POST', endpoint, body, options);
  }

  async put<T, B = Record<string, unknown>>(
    endpoint: string,
    body?: B,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T, B>('PUT', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  async patch<T, B = Record<string, unknown>>(
    endpoint: string,
    body?: B,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T, B>('PATCH', endpoint, body, options);
  }

  /**
   * Upload file using FormData
   * @param endpoint API endpoint
   * @param formData FormData with file(s)
   * @param options Request options
   */
  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    const token = await storageService.getAuthToken();
    const timeout = options?.timeout || 60000; // 60 second timeout for uploads

    if (__DEV__) console.log(`📤 [Admin API] UPLOAD ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        ...options?.headers,
      };

      // Always set the Authorization header when a token is available.
      // On native, cookies are not sent automatically so the Bearer token is required.
      // On web, the httpOnly cookie is also sent via credentials:'include' as a supplement.
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Don't set Content-Type for FormData - let the browser set it with boundary
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
        credentials: 'include', // Phase 6: send httpOnly cookies cross-origin
      });

      const data = await response.json();

      if (!response.ok) {
        if (__DEV__)
          console.error(
            `❌ [Admin API] UPLOAD ${endpoint} failed:`,
            data.message || response.statusText
          );

        if (response.status === 401 && !endpoint.includes('/auth/')) {
          if (__DEV__)
            console.log('[Admin API] Token expired during upload, attempting refresh...');
          const newToken = await this.attemptTokenRefresh();
          if (newToken) {
            // ADMIN-008: FormData stream is consumed after first use.
            // Cannot retry since the stream body was already read by the first fetch.
            // Token was refreshed successfully — tell user to re-upload.
            return {
              success: false,
              message: 'Your session was refreshed. Please try uploading again.',
            };
          }

          if (__DEV__) console.log('[Admin API] Token refresh failed, clearing auth data');
          await storageService.logout();
        }

        return {
          success: false,
          message: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      if (__DEV__) console.log(`✅ [Admin API] UPLOAD ${endpoint} success`);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (__DEV__) console.error(`❌ [Admin API] UPLOAD ${endpoint} timeout`);
        return {
          success: false,
          message: 'Upload timeout',
        };
      }

      if (__DEV__) console.error(`❌ [Admin API] UPLOAD ${endpoint} error:`, error.message);
      return {
        success: false,
        message: error.message || 'Upload failed',
      };
    } finally {
      // ADMIN-007: Clear FormData on failure to prevent memory leak
      clearTimeout(timeoutId);
      // FormData will be garbage collected when reference is lost
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
