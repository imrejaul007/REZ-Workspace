// @ts-nocheck
/**
 * RETRY UTILITY WITH BACKOFF
 * Based on REZ-retry-service (RABTUL)
 *
 * Features:
 * - Exponential backoff
 * - Jitter for load distribution
 * - Circuit breaker support
 * - Retry budget tracking
 * - Configurable retry conditions
 */

import { logger } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface RetryConfig {
  maxAttempts?: number;      // Maximum retry attempts (default: 3)
  baseDelay?: number;       // Base delay in ms (default: 1000)
  maxDelay?: number;        // Maximum delay in ms (default: 30000)
  factor?: number;          // Exponential factor (default: 2)
  jitter?: boolean;          // Add randomness (default: true)
  jitterFactor?: number;     // Jitter as percentage of delay (default: 0.25)
  retryCondition?: (error: unknown) => boolean;  // Custom retry condition
  onRetry?: (attempt: number, error: unknown, delay: number) => void;  // Callback on retry
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;     // Failures before opening (default: 5)
  successThreshold?: number;      // Successes before closing (default: 3)
  timeout?: number;              // Time in ms to try again (default: 60000)
}

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalTime: number;
}

// ============================================================================
// RETRY UTILITY
// ============================================================================

/**
 * Calculate delay with exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  factor: number,
  jitter: boolean,
  jitterFactor: number
): number {
  // Calculate exponential delay
  let delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);

  // Add jitter to prevent thundering herd
  if (jitter) {
    const jitterRange = delay * jitterFactor;
    const jitterOffset = (Math.random() * 2 - 1) * jitterRange;
    delay = Math.max(0, delay + jitterOffset);
  }

  return Math.round(delay);
}

/**
 * Default retry condition - retry on network errors and 5xx/429 status codes
 */
export function defaultRetryCondition(error: unknown): boolean {
  // Network errors (fetch throws on network failure)
  if (error instanceof TypeError) {
    return error.message.includes('Network') ||
           error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('abort');
  }

  // HTTP errors
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode: number }).statusCode;
    // Retry on server errors and rate limiting
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }

  // Check if it's an AbortError (timeout)
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    jitter = true,
    jitterFactor = 0.25,
    retryCondition = defaultRetryCondition,
    onRetry,
  } = config;

  let lastError: unknown;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = attempt < maxAttempts && retryCondition(error);

      if (shouldRetry) {
        const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay, factor, jitter, jitterFactor);

        // Call retry callback
        onRetry?.(attempt, error, delay);

        // Log retry attempt
        logger.debug(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms:`, error);

        await sleep(delay);
      } else {
        // No more retries
        break;
      }
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = 0;

  constructor(private config: CircuitBreakerConfig = {}) {
    const { failureThreshold = 5, successThreshold = 3, timeout = 60000 } = config;
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeout = timeout;
  }

  getState(): CircuitState {
    // Check if circuit should transition from open to half-open
    if (this.state === 'open' && Date.now() >= this.nextAttempt) {
      this.state = 'half_open';
      this.successCount = 0;
    }
    return this.state;
  }

  async execute<T>(
    fn: () => Promise<T>,
    retryConfig?: RetryConfig
  ): Promise<RetryResult<T>> {
    if (this.getState() === 'open') {
      return {
        success: false,
        error: new Error('Circuit breaker is open'),
        attempts: 0,
        totalTime: 0,
      };
    }

    const result = await retry(fn, {
      ...retryConfig,
      onRetry: (attempt, error, delay) => {
        this.recordFailure();
        retryConfig?.onRetry?.(attempt, error, delay);
      },
    });

    if (result.success) {
      this.recordSuccess();
    }

    return result;
  }

  private recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.timeout;
      logger.warn('[CircuitBreaker] Circuit opened');
    }
  }

  private recordSuccess(): void {
    this.successCount++;
    if (this.successCount >= this.successThreshold && this.state === 'half_open') {
      this.state = 'closed';
      this.failureCount = 0;
      this.successCount = 0;
      logger.info('[CircuitBreaker] Circuit closed');
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = 0;
  }
}

// ============================================================================
// PRE-BUILT RETRY CONFIGS
// ============================================================================

export const RETRY_CONFIGS = {
  // Fast retries for non-critical operations
  fast: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    factor: 2,
    jitter: true,
    jitterFactor: 0.2,
  } as RetryConfig,

  // Standard retries
  standard: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    jitter: true,
    jitterFactor: 0.25,
  } as RetryConfig,

  // Slow retries for critical operations
  slow: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    factor: 2,
    jitter: true,
    jitterFactor: 0.3,
  } as RetryConfig,

  // Retry for network errors only
  networkOnly: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    factor: 2,
    retryCondition: (error: unknown) => {
      if (error instanceof TypeError) {
        return error.message.includes('Network') ||
               error.message.includes('timeout');
      }
      return false;
    },
  } as RetryConfig,

  // No retries
  none: {
    maxAttempts: 1,
  } as RetryConfig,
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Retry a fetch request
 */
export async function retryFetch<T>(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<RetryResult<T>> {
  return retry(async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as { statusCode: number }).statusCode = response.status;
      throw error;
    }
    return response.json() as Promise<T>;
  }, retryConfig);
}

/**
 * Retry a promise-returning function with standard config
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  preset: keyof typeof RETRY_CONFIGS = 'standard'
): Promise<RetryResult<T>> {
  return retry(fn, RETRY_CONFIGS[preset]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  retry,
  retryFetch,
  retryAsync,
  CircuitBreaker,
  calculateBackoffDelay,
  defaultRetryCondition,
  RETRY_CONFIGS,
};
