/**
 * Security Constants
 * Named constants instead of magic numbers
 */

// Token lengths
export const TOKEN_CONFIG = {
  JWT_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
  API_KEY_LENGTH: 32,
  OTP_LENGTH: 6,
  HASH_ROUNDS: 12,
} as const;

// Rate limiting
export const RATE_LIMITS = {
  WINDOW_MS: 60 * 1000,
  MAX_REQUESTS: 100,
  STRICT_MAX: 10,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Timeouts (ms)
export const TIMEOUTS = {
  REQUEST: 30000,
  DATABASE: 10000,
  EXTERNAL_API: 10000,
} as const;

// Body size limits
export const BODY_LIMITS = {
  JSON: '100kb',
  URLENCODED: '100kb',
} as const;
