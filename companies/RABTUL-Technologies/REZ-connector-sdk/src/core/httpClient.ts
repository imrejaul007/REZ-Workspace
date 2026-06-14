/**
 * Core HTTP Client with retry logic, logging, and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { z, ZodSchema } from 'zod';
import { ApiError, ApiResponse, ConnectorConfig } from '../types';

// ============================================================================
// Logger
// ============================================================================

class Logger {
  private enabled: boolean;

  constructor(enabled = false) {
    this.enabled = enabled;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] [INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, ...args);
  }
}

// ============================================================================
// Retry Configuration
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxRetryDelay: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
  ],
};

// ============================================================================
// HTTP Client Class
// ============================================================================

export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly logger: Logger;
  private readonly retryConfig: RetryConfig;
  private readonly serviceToken: string | undefined;
  private readonly serviceName: string;

  constructor(config: ConnectorConfig, serviceName: string) {
    this.serviceName = serviceName;
    this.logger = new Logger(config.debug ?? false);
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: config.retries ?? DEFAULT_RETRY_CONFIG.maxRetries,
      retryDelay: config.retryDelay ?? DEFAULT_RETRY_CONFIG.retryDelay,
    };
    this.serviceToken = config.internalServiceToken;

    const baseURL = config.baseUrl || this.getDefaultBaseUrl();

    this.client = axios.create({
      baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': serviceName,
        'X-Request-Timeout': String(config.timeout ?? 30000),
      },
    });

    this.setupInterceptors();
  }

  private getDefaultBaseUrl(): string {
    const envVarMap: Record<string, string> = {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
      wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
      payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4003',
      notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
      eventBus: process.env.EVENT_BUS_URL || 'http://localhost:4051',
      intent: process.env.INTENT_SERVICE_URL || 'http://localhost:4018',
    };
    return envVarMap[this.serviceName] || 'http://localhost:4000';
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.serviceToken) {
          config.headers['X-Internal-Token'] = this.serviceToken;
        }
        this.logger.debug(`[${this.serviceName}] Request:`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        this.logger.error(`[${this.serviceName}] Request Error:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`[${this.serviceName}] Response:`, {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        this.logger.error(`[${this.serviceName}] Response Error:`, {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          code: error.code,
        });
        return Promise.reject(error);
      }
    );
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.config) return false;

    // Check status code
    const status = error.response?.status;
    if (status && this.retryConfig.retryableStatusCodes.includes(status)) {
      return true;
    }

    // Check network error codes
    const code = error.code;
    if (code && this.retryConfig.retryableErrors.includes(code)) {
      return true;
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.retryConfig.maxRetryDelay);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: unknown,
    schema?: ZodSchema<T>
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const config: AxiosRequestConfig = {
          method,
          url: `${url}?requestId=${requestId}`,
          headers: {
            'X-Request-ID': requestId,
          },
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          config.data = data;
        }

        const response: AxiosResponse = await this.client.request(config);

        // Handle different response formats
        if (response.data && typeof response.data === 'object' && 'success' in response.data) {
          const apiResponse = response.data as ApiResponse<T>;
          if (apiResponse.success) {
            if (schema) {
              const validated = schema.parse(apiResponse.data);
              return { ...apiResponse, data: validated, timestamp: new Date().toISOString() };
            }
            return { ...apiResponse, timestamp: new Date().toISOString() };
          } else {
            return { ...apiResponse, timestamp: new Date().toISOString() };
          }
        }

        // Standard response without ApiResponse wrapper
        const responseData = response.data as T;
        if (schema) {
          const validated = schema.parse(responseData);
          return {
            success: true,
            data: validated,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          success: true,
          data: responseData,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error as Error;

        if (error instanceof z.ZodError) {
          this.logger.error(`[${this.serviceName}] Validation Error:`, error.errors);
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Response validation failed',
              details: { errors: error.errors },
              retryable: false,
            },
            timestamp: new Date().toISOString(),
          };
        }

        if (error instanceof AxiosError) {
          if (!this.isRetryableError(error) || attempt === this.retryConfig.maxRetries) {
            const apiError = this.normalizeError(error);
            return {
              success: false,
              error: apiError,
              timestamp: new Date().toISOString(),
            };
          }

          const delay = this.calculateDelay(attempt);
          this.logger.warn(`[${this.serviceName}] Retrying request (${attempt}/${this.retryConfig.maxRetries}) after ${delay}ms`);
          await this.sleep(delay);
        } else {
          // Non-Axios error
          return {
            success: false,
            error: {
              code: 'UNKNOWN_ERROR',
              message: lastError?.message || 'An unknown error occurred',
              retryable: false,
            },
            timestamp: new Date().toISOString(),
          };
        }
      }
    }

    // Should not reach here, but just in case
    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: `Max retries (${this.retryConfig.maxRetries}) exceeded`,
        retryable: false,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private normalizeError(error: AxiosError): ApiError {
    const status = error.response?.status;
    const responseData = error.response?.data as Record<string, unknown> | undefined;

    // Server-side errors with structured response
    if (responseData && 'code' in responseData && 'message' in responseData) {
      return {
        code: String(responseData['code']),
        message: String(responseData['message']),
        details: responseData['details'] as Record<string, unknown> | undefined,
        retryable: this.isRetryableError(error),
      };
    }

    // Status-based error messages
    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: responseData?.['message'] as string || 'Invalid request parameters',
          retryable: false,
        };
      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Authentication required or token invalid',
          retryable: false,
        };
      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied',
          retryable: false,
        };
      case 404:
        return {
          code: 'NOT_FOUND',
          message: responseData?.['message'] as string || 'Resource not found',
          retryable: false,
        };
      case 409:
        return {
          code: 'CONFLICT',
          message: responseData?.['message'] as string || 'Resource conflict',
          retryable: false,
        };
      case 422:
        return {
          code: 'VALIDATION_ERROR',
          message: responseData?.['message'] as string || 'Validation failed',
          details: responseData?.['details'] as Record<string, unknown>,
          retryable: false,
        };
      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later',
          retryable: true,
        };
      case 500:
        return {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          retryable: true,
        };
      case 502:
        return {
          code: 'BAD_GATEWAY',
          message: 'Service temporarily unavailable',
          retryable: true,
        };
      case 503:
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service is temporarily unavailable',
          retryable: true,
        };
      case 504:
        return {
          code: 'GATEWAY_TIMEOUT',
          message: 'Gateway timeout',
          retryable: true,
        };
      default:
        return {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unexpected error occurred',
          retryable: this.isRetryableError(error),
        };
    }
  }

  // Convenience methods
  async get<T>(url: string, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, schema);
  }

  async post<T>(url: string, data?: unknown, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, schema);
  }

  async put<T>(url: string, data?: unknown, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, schema);
  }

  async patch<T>(url: string, data?: unknown, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data, schema);
  }

  async delete<T>(url: string, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, schema);
  }
}

// ============================================================================
// Base Connector Class
// ============================================================================

export abstract class BaseConnector<TConfig extends ConnectorConfig = ConnectorConfig> {
  protected readonly http: HttpClient;
  protected readonly logger: Logger;
  protected readonly config: TConfig;

  constructor(config: TConfig, serviceName: string) {
    this.config = config;
    this.http = new HttpClient(config, serviceName);
    this.logger = new Logger(config.debug ?? false);
  }

  protected async safeCall<T>(
    fn: () => Promise<ApiResponse<T>>
  ): Promise<{ success: boolean; data?: T; error?: ApiError }> {
    try {
      const response = await fn();
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.logger.error('Unexpected error:', error);
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          retryable: false,
        },
      };
    }
  }

  getServiceUrl(): string {
    return this.config.baseUrl || this.http['client']['defaults']['baseURL'] as string;
  }
}
