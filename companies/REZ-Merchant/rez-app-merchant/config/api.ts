import Constants from 'expo-constants';
import { logger } from '@/utils/logger';

// Environment detection
const isDevelopment = process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production';
const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

// Production guard: warn if API URL env var is missing
if (!process.env.EXPO_PUBLIC_API_URL && !__DEV__) {
  logger.error('[CRITICAL] EXPO_PUBLIC_API_URL not set in production!');
}

// API Configuration
export const API_CONFIG = {
  // Fail loudly in production when EXPO_PUBLIC_API_BASE_URL is missing rather than
  // silently falling back to a non-existent domain (matches rez-app-admin pattern).
  BASE_URL: (() => {
    if (isProduction && !process.env.EXPO_PUBLIC_API_BASE_URL) {
      throw new Error('[config/api] FATAL: EXPO_PUBLIC_API_BASE_URL not set in production');
    }

    const url =
      Constants.expoConfig?.extra?.apiBaseUrl ||
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      (isDevelopment ? 'http://localhost:5001/api' : null);

    if (!url) {
      // Should be unreachable given the guard above, but keep a defensive error.
      throw new Error('[MERCHANT API] FATAL: API URL must be configured');
    }

    // In production, enforce HTTPS to prevent credential leakage over plaintext
    if (isProduction && !url.startsWith('https://')) {
      throw new Error(`[MERCHANT API] FATAL: Production API URL must use HTTPS. Got: ${url}`);
    }
    return url;
  })(),

  // Environment-specific URLs
  DEV_URL: process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:5001/api',
  PROD_URL: process.env.EXPO_PUBLIC_PROD_API_URL,

  TIMEOUT: parseInt(
    Constants.expoConfig?.extra?.apiTimeout || process.env.EXPO_PUBLIC_API_TIMEOUT || '60000'
  ),

  // Socket configuration
  SOCKET_URL: (() => {
    if (isProduction && !process.env.EXPO_PUBLIC_SOCKET_URL) {
      throw new Error('[config/api] FATAL: EXPO_PUBLIC_SOCKET_URL not set in production');
    }

    const url =
      Constants.expoConfig?.extra?.socketUrl ||
      process.env.EXPO_PUBLIC_SOCKET_URL ||
      (isDevelopment ? 'http://localhost:5001' : null);

    if (!url) {
      throw new Error('[MERCHANT API] FATAL: Socket URL must be configured');
    }

    // In production, enforce HTTPS to prevent credential leakage
    if (isProduction && !url.startsWith('https://')) {
      throw new Error(`[MERCHANT API] FATAL: Production Socket URL must use HTTPS. Got: ${url}`);
    }
    return url;
  })(),
  SOCKET_TIMEOUT: parseInt(
    Constants.expoConfig?.extra?.socketTimeout || process.env.EXPO_PUBLIC_SOCKET_TIMEOUT || '5000'
  ),
};

// Helper function to get the correct API URL based on environment
// If endpoint is provided, constructs the full URL; otherwise returns base URL
export const getApiUrl = (endpoint?: string): string => {
  const baseUrl = (() => {
    if (isProduction && API_CONFIG.PROD_URL) {
      return API_CONFIG.PROD_URL;
    }
    if (isDevelopment && API_CONFIG.DEV_URL) {
      return API_CONFIG.DEV_URL;
    }
    return API_CONFIG.BASE_URL;
  })();

  // If no endpoint provided, return base URL
  if (!endpoint) {
    return baseUrl;
  }

  // Otherwise, construct full URL with endpoint
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure base URL doesn't end with slash and endpoint doesn't start with slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  const fullUrl = `${cleanBaseUrl}/${cleanEndpoint}`;
  return fullUrl;
};

// Helper function to construct API URLs with endpoint
// AC2-H5 fix: use PROD_URL in production (matching getApiUrl behaviour) so token
// refresh and other buildApiUrl callers don't hit the wrong server in production.
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Mirror getApiUrl: prefer PROD_URL in production, DEV_URL in dev
  const rawBase =
    (isProduction && API_CONFIG.PROD_URL ? API_CONFIG.PROD_URL : null) ||
    (isDevelopment && API_CONFIG.DEV_URL ? API_CONFIG.DEV_URL : null) ||
    API_CONFIG.BASE_URL;

  const baseUrl = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

  const fullUrl = `${baseUrl}/${cleanEndpoint}`;
  return fullUrl;
};

// Log the current configuration for debugging
logger.debug('🔧 [MERCHANT API] Configuration:', {
  environment: isProduction ? 'production' : 'development',
  baseUrl: API_CONFIG.BASE_URL,
  devUrl: API_CONFIG.DEV_URL,
  prodUrl: API_CONFIG.PROD_URL,
  timeout: API_CONFIG.TIMEOUT,
  socketUrl: API_CONFIG.SOCKET_URL,
  socketTimeout: API_CONFIG.SOCKET_TIMEOUT,
  resolvedUrl: getApiUrl(),
});
