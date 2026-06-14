// @ts-nocheck
/**
 * API Client Utilities
 * Helper functions extracted from apiClient.ts
 */

import { Platform } from 'react-native';
import { logger } from '@/utils/logger';
import { parseConnectionError, isConnectionError } from '@/utils/connectionUtils';
import { Sentry } from '@/config/sentry';

// Security patterns for error sanitization
const SENSITIVE_ERROR_PATTERNS = [
  /connection\s+(string|uri|url)/i,
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /token(?!s)/i,
  /credential/i,
  /mongodb:\/\//i,
  /redis:\/\//i,
  /postgres/i,
  /mysql:\/\//i,
  /stack\s*trace/i,
  /at\s+\w+\s*\(/i,
  /\.ts:\d+:\d+/i,
  /\/Users\//i,
  /\/home\//i,
];

const USER_FRIENDLY_ERRORS: Record<string, string> = {
  ENOTFOUND: 'Unable to connect to server. Please check your internet connection.',
  ECONNREFUSED: 'Server is temporarily unavailable. Please try again later.',
  ECONNRESET: 'Connection was interrupted. Please try again.',
  ETIMEDOUT: 'Request timed out. Please check your internet connection.',
};

/**
 * Sanitize error messages to prevent internal details leakage
 */
export function sanitizeErrorMessage(message: string, statusCode?: number): string {
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    if (statusCode === 400) return 'Invalid request. Please check your input.';
    if (statusCode === 401) return 'Session expired. Please log in again.';
    if (statusCode === 403) return 'Access denied.';
    if (statusCode === 404) return 'Resource not found.';
    if (statusCode === 422) return 'Validation failed. Please check your input.';
    if (statusCode === 429) return 'Too many requests. Please wait a moment and try again.';
  }

  if (statusCode && statusCode >= 500) {
    return 'Something went wrong on our end. Please try again later.';
  }

  let sanitized = message;
  for (const pattern of SENSITIVE_ERROR_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  for (const [code, friendly] of Object.entries(USER_FRIENDLY_ERRORS)) {
    if (sanitized.includes(code)) {
      return friendly;
    }
  }

  return sanitized;
}

// CSRF is only required on state-changing requests
const CSRF_MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Check if method requires CSRF token
 */
export function isCsrfRequired(method: string): boolean {
  return CSRF_MUTATING_METHODS.has(method);
}

/**
 * Read CSRF token from web document
 */
export function readCsrfTokenFromDocument(): string | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  try {
    const meta = document.querySelector('meta[name="csrf-token"]');
    const metaToken = meta?.getAttribute('content');
    if (metaToken) return metaToken;
  } catch { /* DOM query failed */ }
  try {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      return decodeURIComponent(cookieMatch[1]);
    }
  } catch { /* cookie read failed */ }
  return null;
}

// Track whether we've warned about missing CSRF token
let csrfMissingWarned = false;

export function resetCsrfWarning(): void {
  csrfMissingWarned = false;
}

export function shouldWarnAboutMissingCsrf(): boolean {
  return !csrfMissingWarned;
}

export function markCsrfWarningShown(): void {
  csrfMissingWarned = true;
}

/**
 * Emit CSRF warning log
 */
export function emitCsrfWarning(): void {
  if (!shouldWarnAboutMissingCsrf()) return;
  markCsrfWarningShown();
  logger.warn(
    '[apiClient] CSRF token missing: no <meta name="csrf-token"> and no csrf-token cookie. ' +
    'Mutating requests will be sent without X-CSRF-Token until this is fixed.'
  );
}

// Cached device fingerprint
let cachedDeviceFingerprint: string | null = null;
let fingerprintLoadPromise: Promise<string | null> | null = null;

/**
 * Get device fingerprint from SecureStore
 */
export async function getDeviceFingerprintHeader(): Promise<string | null> {
  if (cachedDeviceFingerprint) return cachedDeviceFingerprint;
  if (fingerprintLoadPromise) return fingerprintLoadPromise;

  fingerprintLoadPromise = (async () => {
    try {
      let stored: string | null = null;
      if (Platform.OS !== 'web') {
        const SecureStore = await import('expo-secure-store');
        stored = await SecureStore.default.getItemAsync('@security_device_fingerprint');
      } else {
        try {
          stored = sessionStorage.getItem('@security_device_fingerprint');
        } catch { /* non-critical */ }
      }
      if (stored) {
        const fp = JSON.parse(stored);
        cachedDeviceFingerprint = fp.hash || fp.id || null;
      }
    } catch { /* non-critical */ }
    return cachedDeviceFingerprint;
  })();

  return fingerprintLoadPromise;
}

/**
 * Resolve base URL for platform
 * Android emulator uses 10.0.2.2 to reach host localhost
 */
export function resolveBaseURL(url: string): string {
  if (__DEV__ && Platform.OS === 'android' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

/**
 * Compare semantic versions
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

/**
 * Parse connection error for user-friendly message
 */
export function parseConnectionErrorMessage(error: Error): string {
  if (isConnectionError(error)) {
    return parseConnectionError(error).message;
  }
  return error.message;
}

/**
 * Handle error with Sentry reporting
 */
export async function reportApiError(
  error: unknown,
  endpoint: string,
  method: string,
  subComputed?: unknown,
  priveEligibility?: unknown
): Promise<void> {
  try {
    const SentryScope = (await import('@/services/api/apiResponse')).SentryScope;

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
  } catch {
    // Sentry/store unavailable
  }
}
