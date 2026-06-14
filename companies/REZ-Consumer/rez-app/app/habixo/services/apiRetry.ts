// Habixo API Retry Logic
// Exponential backoff retry logic for failed API calls
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from '@/utils/logger';

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: [
    'ECONNABORTED',
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
  ],
};

// Calculate delay with exponential backoff and jitter
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  // Add jitter (0-25% of delay) to prevent thundering herd
  const jitter = Math.random() * cappedDelay * 0.25;
  return cappedDelay + jitter;
}

// Check if error should be retried
function shouldRetry(
  error: AxiosError,
  config: RetryConfig,
  attempt: number
): boolean {
  // Don't retry if we've exceeded max attempts
  if (attempt >= config.maxRetries) {
    return false;
  }

  // Don't retry if request was cancelled
  if (axios.isCancel(error)) {
    return false;
  }

  // Check if we have a response
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    return config.retryableStatuses.includes(status);
  }

  // Network error
  if (error.code) {
    return config.retryableErrors.includes(error.code);
  }

  // No response and no error code - likely a timeout or connection issue
  return true;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry wrapper for any async function
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!shouldRetry(error as AxiosError, finalConfig, attempt)) {
        throw error;
      }

      if (attempt < finalConfig.maxRetries) {
        const delay = calculateDelay(attempt, finalConfig);
        if (__DEV__) logger.debug(`Retrying request in ${Math.round(delay)}ms (attempt ${attempt + 1}/${finalConfig.maxRetries})`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// Create axios instance with retry interceptor
export function createRetryClient(config?: Partial<RetryConfig>): AxiosInstance {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const client = axios.create();

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retryCount?: number;
      };

      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Track retry count
      originalRequest._retryCount = originalRequest._retryCount || 0;

      if (!shouldRetry(error, retryConfig, originalRequest._retryCount)) {
        return Promise.reject(error);
      }

      originalRequest._retryCount++;

      const delay = calculateDelay(
        originalRequest._retryCount - 1,
        retryConfig
      );

      if (__DEV__) logger.debug(
        `Retrying ${originalRequest.url} in ${Math.round(delay)}ms (attempt ${originalRequest._retryCount}/${retryConfig.maxRetries})`
      );

      await sleep(delay);

      return client(originalRequest);
    }
  );

  return client;
}

// Specific API functions with retry built-in
export async function fetchWithRetry<T>(
  url: string,
  options?: AxiosRequestConfig,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return withRetry(
    async () => {
      const response = await axios.get<T>(url, options);
      return response.data;
    },
    retryConfig
  );
}

export async function postWithRetry<T>(
  url: string,
  data?: unknown,
  options?: AxiosRequestConfig,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return withRetry(
    async () => {
      const response = await axios.post<T>(url, data, options);
      return response.data;
    },
    retryConfig
  );
}

// Circuit breaker pattern for critical endpoints
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private resetTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }
}

// Create circuit breakers for different services
export const bookingCircuitBreaker = new CircuitBreaker(3, 60000, 30000);
export const paymentCircuitBreaker = new CircuitBreaker(2, 120000, 60000);
export const searchCircuitBreaker = new CircuitBreaker(5, 30000, 15000);

export default {
  withRetry,
  createRetryClient,
  fetchWithRetry,
  postWithRetry,
  CircuitBreaker,
  bookingCircuitBreaker,
  paymentCircuitBreaker,
  searchCircuitBreaker,
  DEFAULT_RETRY_CONFIG,
};
