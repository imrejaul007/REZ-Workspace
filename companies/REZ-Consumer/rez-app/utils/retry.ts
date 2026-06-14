// @ts-nocheck
/**
 * Unified Retry Utilities
 *
 * Consolidated module combining retry logic from multiple sources:
 * - Exponential/linear/constant backoff strategies
 * - Jitter implementation (crypto-based for arch-fitness compliance)
 * - Error classification predicates
 * - Request retry wrapper with timeout
 * - Circuit breaker pattern
 * - HTTP 429 retry with Retry-After header support
 *
 * @module retry
 *
 * @example
 * import { retryWithExponentialBackoff, isRetryableError } from '@/utils/retry';
 *
 * const result = await retryWithExponentialBackoff(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 */

// Type declarations for React Native environment
/* global Crypto */

import { ApiResponse } from '@/services/apiClient';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Core retry options used across all retry strategies
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Exponential backoff factor (default: 2) */
  backoffFactor?: number;
  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (_error, _attemptNumber: number) => boolean;
  /** Callback function called before each retry attempt */
  onRetry?: (_error, _attemptNumber: number, _delay: number) => void;
  /** Add random jitter to delay to prevent thundering herd (default: true) */
  jitter?: boolean;
}

/**
 * Request retry configuration (extended options)
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 8000) */
  maxDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Add random jitter to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Function to determine if error should trigger retry */
  shouldRetry?: (_error, _attempt: number) => boolean;
  /** Callback before each retry attempt */
  onRetry?: (_error, _attempt: number, _delay: number) => void;
  /** Enable detailed logging (development only) (default: __DEV__) */
  enableLogging?: boolean;
}

/**
 * Retry configuration for retryStrategy (alternative naming)
 */
export interface RetryStrategyConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs?: number;
}

/**
 * Retry result type
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?;
  attemptCount: number;
  totalDelay: number;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attemptNumber: number;
  totalAttempts: number;
  delayMs: number;
  error?;
  timestamp: number;
}

/**
 * Retry result with attempt tracking
 */
export interface RetryExecutionResult<T> {
  success: boolean;
  data?: T;
  error?;
  attempts: RetryAttempt[];
  totalDurationMs: number;
}

/**
 * Retry statistics
 */
export interface RetryStats {
  attemptCount: number;
  totalDelay: number;
  errors: Array<{
    attempt: number;
    error;
    timestamp: number;
  }>;
  startTime: number;
  endTime?: number;
  success: boolean;
}

/**
 * Retry options for HTTP 429 specifically
 */
export interface Retry429Options {
  /** Max retries AFTER the first attempt (default 3 - total up to 4 fetches) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default 1000) */
  baseDelayMs?: number;
  /** Upper bound for backoff + jitter delay (default 30000) */
  maxDelayMs?: number;
}

/**
 * Circuit breaker state
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening */
  failureThreshold: number;
  /** Successes needed to close from half-open */
  successThreshold: number;
  /** Time to wait before moving to half-open (ms) */
  timeout: number;
  /** Time window for tracking failures (ms) */
  monitoringPeriod: number;
}

// ============================================================================
// Default Configurations
// ============================================================================

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 8000,
  backoffMultiplier: 2,
  jitter: true,
  timeout: 30000,
  shouldRetry: isRetryableError,
  onRetry: (_error, _attempt: number, _delay: number) => { /* noop */ },
  enableLogging: __DEV__,
};

/** Default retry strategy configuration */
export const DEFAULT_RETRY_STRATEGY_CONFIG: RetryStrategyConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  jitterMs: 500,
};

/** Aggressive retry config for critical operations */
export const AGGRESSIVE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelay: 500,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  timeout: 60000,
};

/** Conservative retry config for rate-limited operations */
export const CONSERVATIVE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelay: 2000,
  maxDelay: 5000,
  backoffMultiplier: 2.5,
  jitter: false,
  timeout: 30000,
};

/** Fast retry config for quick operations */
export const FAST_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelay: 300,
  maxDelay: 1000,
  backoffMultiplier: 2,
  jitter: true,
  timeout: 10000,
};

/** No retry config (for testing or specific cases) */
export const NO_RETRY_CONFIG: RetryConfig = {
  maxRetries: 0,
  initialDelay: 0,
  maxDelay: 0,
  backoffMultiplier: 1,
  jitter: false,
  timeout: 30000,
};

/** Default circuit breaker configuration */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitoringPeriod: 120000,
};

// ============================================================================
// Constants
// ============================================================================

/** 429 retry constants from retryPolicy */
export const RETRY_429_DEFAULT_MAX_RETRIES = 3;
export const RETRY_429_DEFAULT_BASE_DELAY_MS = 1000;
export const RETRY_429_DEFAULT_MAX_DELAY_MS = 30000;

// ============================================================================
// Crypto-Based Jitter (arch-fitness compliant)
// ============================================================================

/**
 * Generate crypto-backed jitter in ms, up to `cap` (default 250ms).
 * Uses crypto.getRandomValues for arch-fitness compliance (no Math.random).
 * Falls back to 0 jitter if crypto.getRandomValues is unavailable.
 */
function cryptoJitterMs(cap: number = 250): number {
  try {
    const g = (globalThis as unknown as { crypto?: Crypto }).crypto;
    if (g && typeof g.getRandomValues === 'function') {
      const buf = new Uint32Array(1);
      g.getRandomValues(buf);
      const first = buf[0] ?? 0;
      return (first / 0xffffffff) * cap;
    }
  } catch {
    // crypto unavailable - fall through to deterministic zero jitter
  }
  return 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const {
    initialDelay = 1000,
    maxDelay = 8000,
    backoffMultiplier = 2,
    jitter = true,
  } = config;

  // Calculate exponential delay
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, maxDelay);

  // Add jitter
  if (jitter) {
    const jitterAmount = delay * 0.25;
    delay = delay - jitterAmount + Math.random() * (jitterAmount * 2);
  }

  return Math.round(delay);
}

/**
 * Get exponential delay
 */
export function getExponentialDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  factor: number = 2
): number {
  return Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
}

/**
 * Get delay with jitter
 */
export function getDelayWithJitter(delay: number, jitterFactor: number = 0.5): number {
  return delay * (1 - jitterFactor + Math.random() * jitterFactor * 2);
}

/**
 * Calculate backoff delay for retryStrategy
 */
export function calculateBackoffDelay(
  attemptNumber: number,
  config: RetryStrategyConfig = DEFAULT_RETRY_STRATEGY_CONFIG
): number {
  const exponentialDelay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = config.jitterMs
    ? Math.random() * config.jitterMs
    : 0;
  return Math.round(cappedDelay + jitter);
}

/**
 * Get delays for all retry attempts
 */
export function getRetryDelays(config: RetryStrategyConfig = DEFAULT_RETRY_STRATEGY_CONFIG): number[] {
  const delays: number[] = [];
  for (let i = 0; i < config.maxAttempts; i++) {
    delays.push(calculateBackoffDelay(i, config));
  }
  return delays;
}

/**
 * Add timeout to a promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Create a fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Compute the delay for a single 429 retry attempt.
 * Honours Retry-After when provided, otherwise applies capped exponential
 * backoff plus crypto jitter.
 */
export function computeRetry429DelayMs(
  attempt: number,
  retryAfterHeader: string | null | undefined,
  opts: Retry429Options = {},
): number {
  const {
    baseDelayMs = RETRY_429_DEFAULT_BASE_DELAY_MS,
    maxDelayMs = RETRY_429_DEFAULT_MAX_DELAY_MS,
  } = opts;
  const retryAfter = parseInt(retryAfterHeader ?? '', 10);
  const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  const base =
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoff;
  return base + cryptoJitterMs(250);
}

/**
 * Format retry stats for logging
 */
export function formatRetryStats(stats: RetryStats): string {
  const duration = stats.endTime
    ? stats.endTime - stats.startTime
    : Date.now() - stats.startTime;

  return [
    `Retry Statistics:`,
    `  Attempts: ${stats.attemptCount}`,
    `  Success: ${stats.success}`,
    `  Total Delay: ${stats.totalDelay}ms`,
    `  Total Duration: ${duration}ms`,
    `  Errors: ${stats.errors.length}`,
  ].join('\n');
}

/**
 * Format retry attempt for display
 */
export function formatRetryAttempt(attempt: RetryAttempt): string {
  return `Attempt ${attempt.attemptNumber + 1}/${attempt.totalAttempts} failed. ` +
    `Retrying in ${(attempt.delayMs / 1000).toFixed(1)}s...`;
}

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Determine if an error should trigger a retry.
 * Checks error message patterns, status codes, and explicit retry flags.
 */
export function isRetryableError(error, attempt: number = 0): boolean {
  // Don't retry if we've exceeded max retries
  if (attempt >= DEFAULT_RETRY_CONFIG.maxRetries) {
    return false;
  }

  // Check if error has explicit retry flag
  if (typeof error?.isRetryable === 'boolean') {
    return error.isRetryable;
  }

  // Network errors - always retry
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('aborted') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('enotfound') ||
    errorCode === 'econnrefused' ||
    errorCode === 'econnreset' ||
    errorCode === 'enotfound' ||
    errorCode === 'econnaborted'
  ) {
    return true;
  }

  // HTTP status codes
  const status = error?.response?.status || error?.status || error?.statusCode;
  if (status) {
    // Retry on server errors (5xx)
    if (status >= 500 && status < 600) {
      return true;
    }

    // Retry on specific client errors
    if (
      status === 408 || // Request Timeout
      status === 429 || // Too Many Requests
      status === 502 || // Bad Gateway
      status === 503 || // Service Unavailable
      status === 504    // Gateway Timeout
    ) {
      return true;
    }

    // Don't retry on other 4xx errors
    if (status >= 400 && status < 500) {
      return false;
    }
  }

  return false;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('connection')
  );
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('aborted') ||
    error?.code === 'ECONNABORTED'
  );
}

/**
 * Check if error is a rate limit error (429)
 */
export function isRateLimitError(error): boolean {
  const status = error?.response?.status || error?.status;
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    status === 429 ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')
  );
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error): boolean {
  const status = error?.response?.status || error?.status;
  return status >= 500 && status < 600;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error): boolean {
  const status = error?.response?.status || error?.status;
  return status >= 400 && status < 500;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error): boolean {
  const status = error?.response?.status;
  return status === 401 || status === 403;
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Retry a function with exponential backoff (retryLogic style)
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry,
    jitter = true,
  } = options;

  let lastError;
  let attemptCount = 0;
  let totalDelay = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attemptCount++;

    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      if (attempt >= maxRetries) {
        throw error;
      }

      let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);

      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      totalDelay += delay;

      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry a function with linear backoff
 */
export async function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'backoffFactor'> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true,
    onRetry,
    jitter = true,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt) || attempt >= maxRetries) {
        throw error;
      }

      let delay = Math.min(baseDelay * (attempt + 1), maxDelay);

      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry a function with constant delay
 */
export async function retryWithConstantDelay<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'backoffFactor' | 'maxDelay'> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt) || attempt >= maxRetries) {
        throw error;
      }

      if (onRetry) {
        onRetry(error, attempt + 1, baseDelay);
      }

      await sleep(baseDelay);
    }
  }

  throw lastError;
}

/**
 * Retry a function with exponential backoff (requestRetry style)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const {
    maxRetries,
    shouldRetry,
    onRetry,
    enableLogging,
  } = mergedConfig;

  const stats: RetryStats = {
    attemptCount: 0,
    totalDelay: 0,
    errors: [],
    startTime: Date.now(),
    success: false,
  };

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    stats.attemptCount++;

    try {
      const result = await fn();
      stats.success = true;
      stats.endTime = Date.now();
      return result;
    } catch (error) {
      lastError = error;

      stats.errors.push({
        attempt,
        error,
        timestamp: Date.now(),
      });

      const canRetry = shouldRetry(error, attempt);
      const isLastAttempt = attempt >= maxRetries;

      if (!canRetry || isLastAttempt) {
        stats.endTime = Date.now();
        throw error;
      }

      const delay = calculateDelay(attempt, mergedConfig);
      stats.totalDelay += delay;

      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      await sleep(delay);
    }
  }

  stats.endTime = Date.now();
  throw lastError;
}

/**
 * Retry an API call and return ApiResponse format
 */
export async function retryApiCall<T>(
  fn: () => Promise<{ success: boolean; data?: T; error?: string; message?: string }>,
  config: RetryConfig = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    return await retryWithBackoff(fn, {
      ...config,
      shouldRetry: (error, attempt) => {
        if (error?.success === false) {
          const status = error?.response?.status || error?.status;
          if (status) {
            return isRetryableError({ status }, attempt);
          }
        }
        return config.shouldRetry
          ? config.shouldRetry(error, attempt)
          : isRetryableError(error, attempt);
      },
    });
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Request failed after retries',
      message: error?.message || 'Request failed after retries',
    };
  }
}

/**
 * Execute a function with retry and attempt tracking (retryStrategy style)
 */
export async function retryWithAttemptTracking<T>(
  fn: () => Promise<T>,
  config: RetryStrategyConfig = DEFAULT_RETRY_STRATEGY_CONFIG,
  onRetry?: (attempt: RetryAttempt) => void
): Promise<RetryExecutionResult<T>> {
  const startTime = Date.now();
  const attempts: RetryAttempt[] = [];
  let lastError;

  for (let i = 0; i < config.maxAttempts; i++) {
    const attemptStartTime = Date.now();

    try {
      const result = await fn();

      const attempt: RetryAttempt = {
        attemptNumber: i,
        totalAttempts: i + 1,
        delayMs: 0,
        timestamp: attemptStartTime,
      };
      attempts.push(attempt);

      return {
        success: true,
        data: result,
        attempts,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;

      const delayMs = calculateBackoffDelay(i, config);
      const attempt: RetryAttempt = {
        attemptNumber: i,
        totalAttempts: config.maxAttempts,
        delayMs,
        error,
        timestamp: attemptStartTime,
      };
      attempts.push(attempt);

      const isLastAttempt = i === config.maxAttempts - 1;
      const canRetry = shouldRetryDefault(error);

      if (!canRetry || isLastAttempt) {
        return {
          success: false,
          error: lastError,
          attempts,
          totalDurationMs: Date.now() - startTime,
        };
      }

      if (onRetry) {
        onRetry(attempt);
      }

      await sleep(delayMs);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Default should retry function for retryStrategy
 */
function shouldRetryDefault(error): boolean {
  if (error && typeof error === 'object') {
    if (error.isRetryable !== undefined) {
      return error.isRetryable;
    }

    if (error.message) {
      const message = error.message.toLowerCase();
      if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('econnreset') ||
        message.includes('enotfound')
      ) {
        return true;
      }
    }

    if (error.statusCode || error.status) {
      const status = error.statusCode || error.status;
      return (
        status === 408 ||
        status === 429 ||
        status === 502 ||
        status === 503 ||
        status === 504
      );
    }
  }

  return false;
}

/**
 * Invoke fn and transparently retry on HTTP 429 responses.
 * Honours Retry-After header when present.
 */
export async function retry429(
  fn: (attempt: number) => Promise<Response>,
  opts: Retry429Options = {},
): Promise<Response> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = opts;
  let response: Response = await fn(0);
  let attempt = 0;
  while (response.status === 429 && attempt < maxRetries) {
    const retryAfterHeader = response.headers.get('retry-after') ?? '';
    const retryAfter = parseInt(retryAfterHeader, 10);
    const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    const delay =
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoff;
    const jitter = cryptoJitterMs(250);
    await new Promise<void>((resolve) => setTimeout(resolve, delay + jitter));
    attempt += 1;
    response = await fn(attempt);
  }
  return response;
}

// ============================================================================
// Retry Wrapper
// ============================================================================

/**
 * Create a retry wrapper for unknown async function (retryLogic style)
 */
export function createRetryWrapper<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: unknown[]) => {
    return retryWithExponentialBackoff(() => fn(...args), options);
  }) as T;
}

/**
 * Create a retry wrapper for unknown async function (requestRetry style)
 */
export function createRequestRetryWrapper<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: RetryConfig = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return retryWithBackoff(() => fn(...args), config);
  };
}

// ============================================================================
// Circuit Breaker
// ============================================================================

/**
 * Circuit Breaker Implementation
 *
 * Prevents cascading failures by stopping requests to a failing service.
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failing, reject requests immediately
 * - HALF_OPEN: Testing if service recovered
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private recentFailures: number[] = [];

  constructor(
    private config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG,
    private name: string = 'default'
  ) {}

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttemptTime) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
    return this.state;
  }

  /**
   * Check if request should be allowed
   */
  canExecute(): boolean {
    const state = this.getState();
    return state !== CircuitState.OPEN;
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    this.failureCount = 0;
    this.recentFailures = [];

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * Record a failed execution
   */
  recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.recentFailures.push(now);

    this.recentFailures = this.recentFailures.filter(
      (time) => now - time < this.config.monitoringPeriod
    );

    this.failureCount = this.recentFailures.length;

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = now + this.config.timeout;
      this.successCount = 0;
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = now + this.config.timeout;
    }
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(
        `Circuit breaker '${this.name}' is OPEN. Service is temporarily unavailable.`
      );
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    this.recentFailures = [];
  }

  /**
   * Get circuit breaker stats
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      recentFailures: this.recentFailures.length,
    };
  }
}

/**
 * Global circuit breaker instance for bill uploads
 */
export const billUploadCircuitBreaker = new CircuitBreaker(
  {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    monitoringPeriod: 60000,
  },
  'billUpload'
);

/**
 * Combine retry logic with circuit breaker
 */
export async function executeWithRetryAndCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker = billUploadCircuitBreaker,
  retryConfig: RetryStrategyConfig = DEFAULT_RETRY_STRATEGY_CONFIG
): Promise<T> {
  if (!circuitBreaker.canExecute()) {
    const stats = circuitBreaker.getStats();
    throw new Error(
      `Service temporarily unavailable. Circuit breaker is ${stats.state}. ` +
      `Next attempt allowed at ${new Date(stats.nextAttemptTime).toLocaleTimeString()}`
    );
  }

  const result = await retryWithAttemptTracking(
    () => circuitBreaker.execute(fn),
    retryConfig
  );

  if (!result.success) {
    throw result.error;
  }

  return result.data as T;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Core retry functions
  retryWithExponentialBackoff,
  retryWithLinearBackoff,
  retryWithConstantDelay,
  retryWithBackoff,
  retryApiCall,
  retryWithAttemptTracking,
  retry429,

  // Helper functions
  sleep,
  calculateDelay,
  getExponentialDelay,
  getDelayWithJitter,
  calculateBackoffDelay,
  getRetryDelays,
  withTimeout,
  fetchWithTimeout,
  computeRetry429DelayMs,

  // Error classification
  isRetryableError,
  isNetworkError,
  isTimeoutError,
  isRateLimitError,
  isServerError,
  isClientError,
  isAuthError,

  // Wrapper functions
  createRetryWrapper,
  createRequestRetryWrapper,

  // Circuit breaker
  CircuitBreaker,
  billUploadCircuitBreaker,
  executeWithRetryAndCircuitBreaker,

  // Formatting
  formatRetryStats,
  formatRetryAttempt,

  // Configs
  DEFAULT_RETRY_CONFIG,
  DEFAULT_RETRY_STRATEGY_CONFIG,
  AGGRESSIVE_RETRY_CONFIG,
  CONSERVATIVE_RETRY_CONFIG,
  FAST_RETRY_CONFIG,
  NO_RETRY_CONFIG,
  DEFAULT_CIRCUIT_CONFIG,
};
