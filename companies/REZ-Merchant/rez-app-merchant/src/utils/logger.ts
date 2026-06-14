/**
 * Logger - Centralized logging utility
 *
 * Re-exports from @rez/shared logger with mobile-specific console guard.
 * This file ensures consistent logging across the merchant app.
 */

import { logger as baseLogger, setGlobalContext } from '@rez/shared';

// Set global context for the merchant app
setGlobalContext('merchant-app', process.env.EXPO_PUBLIC_ENV || 'development');

/**
 * Install production console guard to prevent accidental sensitive data logging.
 * Should be called once at app startup in production.
 */
export function installProductionConsoleGuard(): void {
  if (__DEV__) {
    // In development, allow full console access
    return;
  }

  // In production, patch console methods to add filtering
  const originalConsole = {
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // List of sensitive field patterns that should be redacted
  const SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /apiKey/i,
    /api_key/i,
    /auth/i,
    /credential/i,
    /pin/i,
    /otp/i,
    /card/i,
    /cvv/i,
    /account/i,
    /ifsc/i,
    /iban/i,
  ];

  function shouldRedact(key: string): boolean {
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
  }

  function sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (shouldRedact(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // Patch console methods
  console.log = (...args: unknown[]) => {
    const sanitized = args.map(sanitizeObject);
    originalConsole.log(...sanitized);
  };

  console.debug = (...args: unknown[]) => {
    const sanitized = args.map(sanitizeObject);
    originalConsole.debug(...sanitized);
  };

  console.info = (...args: unknown[]) => {
    const sanitized = args.map(sanitizeObject);
    originalConsole.info(...sanitized);
  };

  console.warn = (...args: unknown[]) => {
    const sanitized = args.map(sanitizeObject);
    originalConsole.warn(...sanitized);
  };

  console.error = (...args: unknown[]) => {
    const sanitized = args.map(sanitizeObject);
    originalConsole.error(...sanitized);
  };
}

// Re-export base logger with additional convenience methods
export const logger = {
  ...baseLogger,

  // Additional mobile-specific logging
  network(url: string, method: string, statusCode?: number, durationMs?: number): void {
    baseLogger.info('Network request', {
      event: 'network_request',
      url,
      method,
      statusCode,
      durationMs,
    });
  },

  navigation(screen: string, params?: Record<string, unknown>): void {
    baseLogger.debug('Navigation', {
      event: 'navigation',
      screen,
      params,
    });
  },

  userAction(action: string, metadata?: Record<string, unknown>): void {
    baseLogger.info('User action', {
      event: 'user_action',
      action,
      ...metadata,
    });
  },

  deviceInfo(info: Record<string, unknown>): void {
    baseLogger.debug('Device info', {
      event: 'device_info',
      ...info,
    });
  },
};

export type Logger = typeof logger;
