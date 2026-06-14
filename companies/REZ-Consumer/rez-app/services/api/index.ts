// @ts-nocheck
/**
 * API Client Module
 * Re-exports from split modules for backward compatibility
 */

// Main export - singleton instance
export { default as apiClient } from './apiClientCore';

// Class export for testing/custom instances
export { ApiClient } from './apiClientCore';

// Utilities
export {
  sanitizeErrorMessage,
  isCsrfRequired,
  readCsrfTokenFromDocument,
  getDeviceFingerprintHeader,
  resolveBaseURL,
  compareVersions,
  parseConnectionErrorMessage,
  reportApiError,
  setRegionGetter,
  resetCsrfWarning,
} from './apiUtilities';

// Types
export type { ApiResponse, RequestOptions, SentryScope } from './apiResponse';
export { API_TIMEOUTS } from './apiResponse';
