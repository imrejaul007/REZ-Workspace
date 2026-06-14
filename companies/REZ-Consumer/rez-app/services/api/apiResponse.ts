/**
 * API Response Types
 * Extracted from apiClient.ts for cleaner separation
 */

// Core response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  errors?: { [key: string]: string[] };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp?: string;
    [key: string]: unknown;
  };
}

// Request options type
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  deduplicate?: boolean;
  signal?: AbortSignal;
}

// Timeout constants for per-request-type configuration
export const API_TIMEOUTS = {
  DEFAULT: 8000,
  UPLOAD: 30000,
  LONG_RUNNING: 15000,
  PAYMENT: 20000,
  BILL_FETCH: 12000,
  AUTH: 60000,
} as const;

// Sentry scope interface (subset used by ApiClient)
export interface SentryScope {
  setTag(key: string, value: string): void;
}
