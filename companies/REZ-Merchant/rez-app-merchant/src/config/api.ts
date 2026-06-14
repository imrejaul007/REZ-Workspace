// API Base URL for merchant service
// In production, this should come from environment variables
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://rez-merchant-service.onrender.com/api/v1';

/**
 * Get the configured API URL, ensuring no trailing slash
 */
export function getApiUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://rez-merchant-service.onrender.com/api/v1';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * API configuration constants
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 second request timeout
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;
