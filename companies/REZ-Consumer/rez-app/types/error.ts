/**
 * Error Types for REZ App
 * Centralized error type definitions for consistent error handling
 */

/**
 * Log levels for error severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  PAYMENT = 'payment',
  CART = 'cart',
  API = 'api',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * Base error interface with common properties
 */
export interface AppError {
  message: string;
  code?: string;
  category: ErrorCategory;
  originalError?: Error;
  stack?: string;
  timestamp: number;
  userId?: string;
  context?: Record<string, unknown>;
}

/**
 * Network error (API calls, connectivity issues)
 */
export interface NetworkError extends AppError {
  category: ErrorCategory.NETWORK;
  url?: string;
  method?: string;
  statusCode?: number;
  isOffline?: boolean;
}

/**
 * Authentication/Authorization error
 */
export interface AuthError extends AppError {
  category: ErrorCategory.AUTH;
  authType?: 'jwt' | 'otp' | 'biometric' | 'session';
  expiredToken?: boolean;
}

/**
 * Validation error (user input, form validation)
 */
export interface ValidationError extends AppError {
  category: ErrorCategory.VALIDATION;
  field?: string;
  validationType?: 'required' | 'format' | 'range' | 'custom';
}

/**
 * Payment error (transactions, wallet, refunds)
 */
export interface PaymentError extends AppError {
  category: ErrorCategory.PAYMENT;
  paymentMethod?: string;
  transactionId?: string;
  amount?: number;
}

/**
 * Cart error (add to cart, checkout, inventory)
 */
export interface CartError extends AppError {
  category: ErrorCategory.CART;
  cartId?: string;
  productId?: string;
  inventoryIssue?: boolean;
}

/**
 * API error (server-side errors, malformed responses)
 */
export interface ApiError extends AppError {
  category: ErrorCategory.API;
  endpoint?: string;
  statusCode?: number;
  responseData?: unknown;
}

/**
 * Storage error (local storage, AsyncStorage)
 */
export interface StorageError extends AppError {
  category: ErrorCategory.STORAGE;
  storageType?: 'async' | 'secure' | 'memory';
  key?: string;
}

/**
 * Error log entry for persistence
 */
export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  category: ErrorCategory;
  userId?: string;
  deviceInfo: DeviceInfo;
  stack?: string;
  context?: Record<string, unknown>;
  actionPath?: string;
  handled: boolean;
}

/**
 * Device information for error context
 */
export interface DeviceInfo {
  platform: string;
  osVersion?: string;
  appVersion?: string;
  deviceId?: string;
  isEmulator?: boolean;
  memoryUsage?: number;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  timestamp: number;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  enableSentry: boolean;
  enableConsole: boolean;
  enableRemoteLogging: boolean;
  maxRetries?: number;
  retryDelay?: number;
  ignoredErrors?: RegExp[];
}

/**
 * Create a standardized error object
 */
export function createError(
  message: string,
  category: ErrorCategory,
  options?: Partial<AppError>
): AppError {
  return {
    message,
    category,
    timestamp: Date.now(),
    ...options,
  };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    (error as AppError).category === ErrorCategory.NETWORK
  );
}

/**
 * Check if error is an auth error
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    (error as AppError).category === ErrorCategory.AUTH
  );
}

/**
 * Check if error is a payment error
 */
export function isPaymentError(error: unknown): error is PaymentError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    (error as AppError).category === ErrorCategory.PAYMENT
  );
}

/**
 * Get error severity level based on category
 */
export function getErrorSeverity(category: ErrorCategory): LogLevel {
  switch (category) {
    case ErrorCategory.PAYMENT:
    case ErrorCategory.AUTH:
      return LogLevel.CRITICAL;
    case ErrorCategory.NETWORK:
    case ErrorCategory.API:
      return LogLevel.ERROR;
    case ErrorCategory.VALIDATION:
    case ErrorCategory.CART:
      return LogLevel.WARN;
    default:
      return LogLevel.ERROR;
  }
}
