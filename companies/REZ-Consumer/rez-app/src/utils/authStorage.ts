/**
 * Auth Token Storage Integration
 * Bridges secure storage with the API authentication system
 *
 * @packageDocumentation
 */

import { secureStorage, authSecureStorage, STORAGE_KEYS } from './secureStorage';
import { validateCertificatePin } from './certificatePinning';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API configuration
const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Token data structure
 */
interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * JWT payload structure (base64 decoded)
 */
interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  role?: string;
}

/**
 * Decode JWT without signature verification (for expiry check only)
 * WARNING: Never use this for security-critical operations - only for token refresh timing
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token needs refresh (expires within threshold)
 */
function isTokenExpiringSoon(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true; // Treat invalid tokens as needing refresh

  const now = Date.now() / 1000;
  const timeUntilExpiry = payload.exp - now;
  return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_MS / 1000;
}

/**
 * Get remaining token lifetime in milliseconds
 */
function getTokenLifetime(token: string): number {
  const payload = decodeJWT(token);
  if (!payload) return 0;

  const now = Date.now() / 1000;
  return Math.max(0, (payload.exp - now) * 1000);
}

/**
 * Auth Storage API client with automatic token management
 */
export class AuthStorageClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: AUTH_URL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors for token management
   */
  private setupInterceptors() {
    // Request interceptor - attach token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Skip auth header for auth endpoints
        if (config.url?.includes('/auth/')) {
          return config;
        }

        const tokens = await authSecureStorage.getTokens();
        if (tokens.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for refresh to complete
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.refreshSubscribers.forEach(cb => cb(newToken));
            this.refreshSubscribers = [];

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Store authentication tokens securely
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    const payload = decodeJWT(accessToken);
    const expiresAt = payload ? payload.exp * 1000 : Date.now() + 15 * 60 * 1000;

    await authSecureStorage.setTokens(accessToken, refreshToken);

    // Validate certificate pinning for auth endpoint
    await validateCertificatePin('auth.rez.app');
  }

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    const { accessToken } = await authSecureStorage.getTokens();
    return accessToken;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    const { refreshToken, accessToken } = await authSecureStorage.getTokens();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Check if current token is still valid (avoid unnecessary refresh)
    if (accessToken && !isTokenExpiringSoon(accessToken)) {
      return accessToken;
    }

    const response = await axios.post(`${AUTH_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

    // Store new tokens
    await this.setTokens(newAccessToken, newRefreshToken);

    return newAccessToken;
  }

  /**
   * Clear all authentication data
   */
  async logout(): Promise<void> {
    await authSecureStorage.clearTokens();
    await authSecureStorage.clearSession();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return false;

    // Check if token is expired
    const payload = decodeJWT(accessToken);
    if (!payload) return false;

    return payload.exp * 1000 > Date.now();
  }

  /**
   * Get current user ID from stored token
   */
  async getUserId(): Promise<string | null> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return null;

    const payload = decodeJWT(accessToken);
    return payload?.sub || null;
  }

  /**
   * Get Axios client instance for API calls
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Get token lifetime information
   */
  async getTokenInfo(): Promise<{ lifetime: number; expiresAt: Date; isExpiringSoon: boolean } | null> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return null;

    const payload = decodeJWT(accessToken);
    if (!payload) return null;

    return {
      lifetime: getTokenLifetime(accessToken),
      expiresAt: new Date(payload.exp * 1000),
      isExpiringSoon: isTokenExpiringSoon(accessToken),
    };
  }
}

// Singleton instance
let authStorageClient: AuthStorageClient | null = null;

export function getAuthStorageClient(): AuthStorageClient {
  if (!authStorageClient) {
    authStorageClient = new AuthStorageClient();
  }
  return authStorageClient;
}

export default getAuthStorageClient;
