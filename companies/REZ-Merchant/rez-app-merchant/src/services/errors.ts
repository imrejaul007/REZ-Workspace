// Shared Error Types and Utilities
// Provides error handling, retry logic, and toast notifications for all services

import { toast } from 'react-native-toast-message';

// ============================================
// Error Types
// ============================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection failed. Please check your internet connection.', originalError?: Error) {
    super(message, 'NETWORK_ERROR', undefined, originalError);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed. Please log in again.', originalError?: Error) {
    super(message, 'AUTH_ERROR', 401, originalError);
    this.name = 'AuthError';
  }
}

export class ServerError extends AppError {
  constructor(message = 'Server error. Please try again later.', statusCode = 500, originalError?: Error) {
    super(message, 'SERVER_ERROR', statusCode, originalError);
    this.name = 'ServerError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string, originalError?: Error) {
    super(message, 'VALIDATION_ERROR', 400, originalError);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timed out. Please try again.', originalError?: Error) {
    super(message, 'TIMEOUT_ERROR', undefined, originalError);
    this.name = 'TimeoutError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', originalError?: Error) {
    super(`${resource} not found.`, 'NOT_FOUND', 404, originalError);
    this.name = 'NotFoundError';
  }
}

// ============================================
// Error Classification
// ============================================

export function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('econnreset') ||
      message.includes('enotfound')
    ) {
      return new NetworkError(undefined, error);
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return new TimeoutError(undefined, error);
    }

    // Default to generic AppError for unknown errors
    return new AppError(error.message, 'UNKNOWN_ERROR', undefined, error);
  }

  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR');
}

// ============================================
// Retry Logic
// ============================================

export interface RetryOptions {
  retries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryCondition?: (error: AppError) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  retries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  retryCondition: (error: AppError) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      (error.statusCode !== undefined && error.statusCode >= 500)
    );
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: AppError;
  let currentDelay = opts.retryDelay;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = classifyError(error);

      // Check if we should retry
      const shouldRetry =
        attempt < opts.retries &&
        opts.retryCondition(lastError);

      if (!shouldRetry) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      if (attempt < opts.retries) {
        await sleep(currentDelay);
        currentDelay = Math.min(currentDelay * opts.backoffMultiplier, opts.maxDelay);
      }
    }
  }

  throw lastError!;
}

// ============================================
// Loading State Management
// ============================================

export interface LoadingState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => Promise<void>;
}

export function createLoadingState<T>(
  data: T | null = null,
  loading = false,
  error: AppError | null = null
): LoadingState<T> {
  return {
    data,
    loading,
    error,
    refetch: async () => {},
  };
}

// ============================================
// Toast Notifications
// ============================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(type: ToastType, title: string, message?: string) {
  toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime: type === 'error' ? 5000 : 3000,
    autoHide: true,
  });
}

export function showErrorToast(error: unknown, fallbackMessage = 'Something went wrong') {
  const appError = classifyError(error);
  showToast('error', appError.message, fallbackMessage);
}

export function showSuccessToast(message: string, title = 'Success') {
  showToast('success', title, message);
}

export function showNetworkErrorToast() {
  showToast('error', 'Connection Error', 'Please check your internet connection');
}

export function showAuthErrorToast() {
  showToast('error', 'Session Expired', 'Please log in again to continue');
}

// ============================================
// Service Result Wrapper
// ============================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    showToastOnError?: boolean;
    returnNullOnError?: boolean;
    retry?: RetryOptions;
  } = {}
): Promise<ServiceResult<T>> {
  try {
    const data = options.retry
      ? await withRetry(fn, options.retry)
      : await fn();
    return { success: true, data };
  } catch (error) {
    const appError = classifyError(error);

    if (options.showToastOnError !== false) {
      if (appError instanceof NetworkError) {
        showNetworkErrorToast();
      } else if (appError instanceof AuthError) {
        showAuthErrorToast();
      } else {
        showErrorToast(appError);
      }
    }

    if (options.returnNullOnError) {
      return { success: false, error: appError };
    }

    return { success: false, error: appError };
  }
}

// ============================================
// Pull to Refresh Handler
// ============================================

export interface RefreshableResult<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: AppError | null;
  onRefresh: () => Promise<void>;
}

export async function withRefresh<T>(
  fetchFn: () => Promise<T>,
  setState: (updater: (prev: { data: T | null; loading: boolean; refreshing: boolean; error: AppError | null }) => {
    data: T | null;
    loading: boolean;
    refreshing: boolean;
    error: AppError | null;
  }) => void,
  options: { showToastOnError?: boolean; retry?: RetryOptions } = {}
): Promise<void> {
  // Set refreshing state
  setState((prev) => ({ ...prev, refreshing: true, error: null }));

  try {
    const data = options.retry
      ? await withRetry(fetchFn, options.retry)
      : await fetchFn();
    setState({ data, loading: false, refreshing: false, error: null });
  } catch (error) {
    const appError = classifyError(error);
    if (options.showToastOnError !== false) {
      showErrorToast(appError);
    }
    setState((prev) => ({ ...prev, refreshing: false, error: appError }));
  }
}

// ============================================
// HTTP Client with Error Handling
// ============================================

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = 10000, retries = 3, ...fetchOptions } = options;

  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');

        if (response.status === 401) {
          throw new AuthError();
        }
        if (response.status === 404) {
          throw new NotFoundError();
        }
        if (response.status >= 500) {
          throw new ServerError(`Server error: ${response.status}`, response.status);
        }
        throw new AppError(
          `Request failed: ${response.statusText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError();
      }
      throw error;
    }
  }, { retries });
}

// ============================================
// Helper Functions
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isOnline(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      resolve(navigator.onLine);
    } else {
      // Default to online if we can't determine
      resolve(true);
    }
  });
}

export function formatErrorForDisplay(error: unknown): string {
  const appError = classifyError(error);
  return appError.message;
}
