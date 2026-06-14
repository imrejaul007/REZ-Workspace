// @ts-nocheck
/**
 * Error Logger Service
 * Centralized error logging for REZ App with Sentry integration
 *
 * Features:
 * - Log levels: debug, info, warn, error, critical
 * - Sentry integration when available
 * - Console fallback for development
 * - Device and user context
 * - Action path tracking
 */

import * as Sentry from '@sentry/react-native';
import {
  LogLevel,
  ErrorCategory,
  ErrorLogEntry,
  DeviceInfo,
  ErrorHandlerConfig,
  AppError,
  createError,
  getErrorSeverity,
} from '../types/error';

// Default configuration
const defaultConfig: ErrorHandlerConfig = {
  enableSentry: true,
  enableConsole: __DEV__,
  enableRemoteLogging: true,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Get device information for error context
 */
function getDeviceInfo(): DeviceInfo {
  try {
    const { Platform, Dimensions } = require('react-native');
    const deviceInfo: DeviceInfo = {
      platform: Platform.OS,
      osVersion: Platform.Version?.toString(),
      isEmulator: !Platform.isPad,
    };

    // Try to get app version from Constants
    try {
      const Constants = require('expo-constants');
      deviceInfo.appVersion = Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version;
    } catch {
      // Constants not available
    }

    return deviceInfo;
  } catch {
    return {
      platform: 'unknown',
    };
  }
}

/**
 * Get current user ID if available
 */
function getCurrentUserId(): string | undefined {
  try {
    // Try to get from secure store or auth context
    // This is a lazy import to avoid circular dependencies
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // AsyncStorage is async, so we use a sync approximation
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Error Logger class for centralized error handling
 */
class ErrorLogger {
  private config: ErrorHandlerConfig;
  private deviceInfo: DeviceInfo;
  private actionStack: string[] = [];
  private logBuffer: ErrorLogEntry[] = [];
  private readonly BUFFER_SIZE = 50;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.deviceInfo = getDeviceInfo();
  }

  /**
   * Update configuration
   */
  configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Push an action to the action stack for context tracking
   */
  pushAction(action: string): void {
    this.actionStack.push(`${action}`);
    // Keep only last 10 actions
    if (this.actionStack.length > 10) {
      this.actionStack.shift();
    }
  }

  /**
   * Pop the last action from the stack
   */
  popAction(): string | undefined {
    return this.actionStack.pop();
  }

  /**
   * Clear the action stack
   */
  clearActions(): void {
    this.actionStack = [];
  }

  /**
   * Get current action path as string
   */
  getActionPath(): string {
    return this.actionStack.join(' -> ');
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(
    action: string,
    error: unknown,
    context?: Record<string, unknown>
  ): void {
    this.logError(action, error, ErrorCategory.UNKNOWN, context);
  }

  /**
   * Log error with category
   */
  logError(
    action: string,
    error: unknown,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context?: Record<string, unknown>
  ): void {
    const errorObj = this.normalizeError(error);
    const logLevel = getErrorSeverity(category);

    // Add action context
    const errorWithContext: Record<string, unknown> = {
      ...context,
      actionPath: this.getActionPath() ? `${this.getActionPath()} -> ${action}` : action,
      actionStack: [...this.actionStack],
      category,
    };

    // Create structured log entry
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level: logLevel,
      message: errorObj.message,
      category,
      userId: getCurrentUserId(),
      deviceInfo: this.deviceInfo,
      stack: errorObj.stack,
      context: errorWithContext,
      actionPath: errorWithContext.actionPath as string,
      handled: true,
    };

    // Buffer for local storage
    this.bufferEntry(entry);

    // Log to appropriate destinations
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableSentry) {
      this.logToSentry(entry, errorObj);
    }

    if (this.config.enableRemoteLogging && !this.config.enableSentry) {
      this.logToRemote(entry);
    }
  }

  /**
   * Log network errors
   */
  logNetworkError(
    action: string,
    error: unknown,
    url?: string,
    method?: string,
    statusCode?: number
  ): void {
    this.logError(
      action,
      error,
      ErrorCategory.NETWORK,
      { url, method, statusCode, isOffline: !navigator?.onLine }
    );
  }

  /**
   * Log auth errors
   */
  logAuthError(
    action: string,
    error: unknown,
    authType?: string
  ): void {
    this.logError(
      action,
      error,
      ErrorCategory.AUTH,
      { authType }
    );
  }

  /**
   * Log payment errors
   */
  logPaymentError(
    action: string,
    error: unknown,
    transactionId?: string,
    amount?: number
  ): void {
    this.logError(
      action,
      error,
      ErrorCategory.PAYMENT,
      { transactionId, amount }
    );
  }

  /**
   * Log validation errors
   */
  logValidationError(
    action: string,
    error: unknown,
    field?: string
  ): void {
    this.logError(
      action,
      error,
      ErrorCategory.VALIDATION,
      { field }
    );
  }

  /**
   * Log cart errors
   */
  logCartError(
    action: string,
    error: unknown,
    cartId?: string,
    productId?: string
  ): void {
    this.logError(
      action,
      error,
      ErrorCategory.CART,
      { cartId, productId }
    );
  }

  /**
   * Log API errors
   */
  logApiError(
    action: string,
    error: unknown,
    endpoint?: string,
    statusCode?: number
  ): void {
    this.logError(
      action,
      error,
      ErrorCategory.API,
      { endpoint, statusCode }
    );
  }

  /**
   * Log storage errors
   */
  logStorageError(
    action: string,
    error: unknown,
    storageType?: string,
    key?: string
  ): void {
    this.logError(
      action,
      error,
      ErrorCategory.STORAGE,
      { storageType, key }
    );
  }

  /**
   * Log critical errors (payment, auth failures)
   */
  critical(
    action: string,
    error: unknown,
    context?: Record<string, unknown>
  ): void {
    const entry = this.createCriticalEntry(action, error, context);
    this.bufferEntry(entry);
    this.logToConsole(entry);
    if (this.config.enableSentry) {
      this.logToSentry(entry, this.normalizeError(error), true);
    }
  }

  /**
   * Get buffered logs
   */
  getBufferedLogs(): ErrorLogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Flush buffered logs to remote
   */
  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.clearBuffer();

    // In production, this would send to a remote endpoint
    if (this.config.enableRemoteLogging) {
      try {
        // Remote log flushing via internal logging endpoint
        await fetch(`${this.config.remoteEndpoint}/api/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.INTERNAL_API_KEY || '' },
          body: JSON.stringify({ logs, source: 'errorLogger', timestamp: Date.now() }),
        });
      } catch {
        // Re-buffer on failure
        this.logBuffer = [...logs, ...this.logBuffer].slice(0, this.BUFFER_SIZE);
      }
    }
  }

  /**
   * Normalize error to standard format
   */
  private normalizeError(error: unknown): { message: string; stack?: string } {
    if (!error) {
      return { message: 'Unknown error' };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }

    // Handle plain objects with message
    if (typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      return {
        message: (errObj.message as string) || String(error),
        stack: (errObj.stack as string) || undefined,
      };
    }

    return { message: String(error) };
  }

  /**
   * Create a critical error entry
   */
  private createCriticalEntry(
    action: string,
    error: unknown,
    context?: Record<string, unknown>
  ): ErrorLogEntry {
    const errorObj = this.normalizeError(error);
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      level: LogLevel.CRITICAL,
      message: errorObj.message,
      category: ErrorCategory.UNKNOWN,
      userId: getCurrentUserId(),
      deviceInfo: this.deviceInfo,
      stack: errorObj.stack,
      context: {
        ...context,
        actionPath: this.getActionPath() ? `${this.getActionPath()} -> ${action}` : action,
      },
      actionPath: this.getActionPath() ? `${this.getActionPath()} -> ${action}` : action,
      handled: true,
    };
  }

  /**
   * Buffer log entry locally
   */
  private bufferEntry(entry: ErrorLogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.BUFFER_SIZE) {
      this.logBuffer.shift();
    }
  }

  /**
   * Log to console
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}]`;
    const timestamp = new Date(entry.timestamp).toISOString();

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, timestamp, entry.message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(prefix, timestamp, entry.message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(prefix, timestamp, entry.message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(
          prefix,
          timestamp,
          entry.message,
          '\nContext:',
          entry.context,
          '\nStack:',
          entry.stack
        );
        break;
    }
  }

  /**
   * Log to Sentry
   */
  private logToSentry(
    entry: ErrorLogEntry,
    errorObj: { message: string; stack?: string },
    isCritical = false
  ): void {
    try {
      // Create error object for Sentry
      const sentryError = new Error(errorObj.message);
      if (errorObj.stack) {
        sentryError.stack = errorObj.stack;
      }

      // Set tags and context
      Sentry.withScope((scope: Sentry.Scope) => {
        scope.setTag('category', entry.category);
        scope.setTag('action_path', entry.actionPath || 'unknown');

        if (entry.userId) {
          scope.setUser({ id: entry.userId });
        }

        scope.setContext('device', this.deviceInfo as Record<string, unknown>);

        if (entry.context) {
          scope.setContext('action', entry.context as Record<string, unknown>);
        }

        if (isCritical || entry.level === LogLevel.CRITICAL) {
          scope.setLevel('fatal');
        } else if (entry.level === LogLevel.ERROR) {
          scope.setLevel('error');
        } else if (entry.level === LogLevel.WARN) {
          scope.setLevel('warning');
        }

        Sentry.captureException(sentryError);
      });
    } catch {
      // Sentry logging failed, fall back to console
      console.warn('Sentry logging failed:', errorObj.message);
    }
  }

  /**
   * Log to remote endpoint (fallback when Sentry is not available)
   */
  private logToRemote(entry: ErrorLogEntry): void {
    // This would be implemented for custom remote logging
    // For now, we rely on Sentry
    void entry; // Acknowledge unused parameter
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export class for testing
export { ErrorLogger };

// Convenience functions for quick logging
export const log = {
  debug: (message: string, context?: Record<string, unknown>) =>
    errorLogger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    errorLogger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    errorLogger.warn(message, context),
  error: (
    action: string,
    error: unknown,
    context?: Record<string, unknown>
  ) => errorLogger.error(action, error, context),
  critical: (
    action: string,
    error: unknown,
    context?: Record<string, unknown>
  ) => errorLogger.critical(action, error, context),
  network: (
    action: string,
    error: unknown,
    url?: string,
    method?: string,
    statusCode?: number
  ) => errorLogger.logNetworkError(action, error, url, method, statusCode),
  auth: (
    action: string,
    error: unknown,
    authType?: string
  ) => errorLogger.logAuthError(action, error, authType),
  payment: (
    action: string,
    error: unknown,
    transactionId?: string,
    amount?: number
  ) => errorLogger.logPaymentError(action, error, transactionId, amount),
  validation: (
    action: string,
    error: unknown,
    field?: string
  ) => errorLogger.logValidationError(action, error, field),
  cart: (
    action: string,
    error: unknown,
    cartId?: string,
    productId?: string
  ) => errorLogger.logCartError(action, error, cartId, productId),
  api: (
    action: string,
    error: unknown,
    endpoint?: string,
    statusCode?: number
  ) => errorLogger.logApiError(action, error, endpoint, statusCode),
  storage: (
    action: string,
    error: unknown,
    storageType?: string,
    key?: string
  ) => errorLogger.logStorageError(action, error, storageType, key),
};

export default errorLogger;
