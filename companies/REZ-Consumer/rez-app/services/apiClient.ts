// @ts-nocheck
/**
 * API Client - Backward Compatibility Re-export
 *
 * This file re-exports from the new modular structure in services/api/
 * to maintain backward compatibility with existing imports.
 *
 * NEW SPLIT STRUCTURE:
 * services/api/
 *   ├── index.ts          - Module entry point
 *   ├── apiClientCore.ts  - Main ApiClient class
 *   ├── apiResponse.ts    - Types and timeouts
 *   └── apiUtilities.ts   - Helper functions
 */

// Re-export everything from the new modular structure
export {
  default as apiClient,
  ApiClient,
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
  API_TIMEOUTS,
} from './api/index';

export type { ApiResponse, RequestOptions, SentryScope } from './api/index';

// For direct imports like: import apiClient, { ApiResponse } from '@/services/apiClient'
export { default } from './api/index';
