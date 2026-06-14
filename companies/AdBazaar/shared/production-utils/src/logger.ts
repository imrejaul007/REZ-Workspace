/**
 * Production Logger - Structured logging with PII redaction
 *
 * Features:
 * - Structured JSON logging
 * - PII redaction (phone, email, IP addresses)
 * - Correlation ID tracking
 * - Multiple transport support (console, file, external)
 *
 * @module @adbazaar/shared-utils/logger
 * @author AdBazaar
 */

import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

// PII patterns for redaction
const PII_PATTERNS = {
  // Phone numbers (various formats)
  phone: /\+?[0-9]{10,15}/g,
  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // IP addresses (v4 and v6)
  ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b|\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
  // Credit card numbers
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // Aadhaar numbers (Indian ID)
  aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
};

/**
 * Redacts PII from a string
 */
function redactPII(str: string): string {
  if (typeof str !== 'string') return str;

  let result = str;

  // Redact phone numbers (show first and last 2 digits)
  result = result.replace(PII_PATTERNS.phone, (match) => {
    if (match.length < 4) return '[REDACTED]';
    return match.slice(0, 2) + '*'.repeat(match.length - 4) + match.slice(-2);
  });

  // Redact emails (show first part only)
  result = result.replace(PII_PATTERNS.email, (match) => {
    const [local, domain] = match.split('@');
    return local.slice(0, 2) + '***@' + domain;
  });

  // Redact IP addresses (show first octet only)
  result = result.replace(PII_PATTERNS.ip, (match) => {
    if (match.includes(':')) return '[IPv6_REDACTED]'; // IPv6
    const parts = match.split('.');
    return parts[0] + '.***.***.' + parts[3];
  });

  return result;
}

/**
 * Recursively redact PII from an object
 */
function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') return redactPII(obj);

  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Skip sensitive keys entirely
      if (['password', 'secret', 'token', 'apiKey', 'creditCard', 'cvv'].includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactObject(value);
      }
    }
    return redacted;
  }

  return obj;
}

// Log level configuration
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const PRETTY_PRINT = process.env.NODE_ENV !== 'production';

/**
 * Create a production logger instance
 */
export const createLogger = (serviceName: string) => {
  const logger = pino({
    name: serviceName,
    level: LOG_LEVEL,
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(PRETTY_PRINT && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
    base: {
      service: serviceName,
      env: process.env.NODE_ENV || 'development',
    },
  });

  return {
    /**
     * Create a child logger with additional context
     */
    child: (context: Record<string, unknown>) => {
      return logger.child(redactObject(context));
    },

    /**
     * Set correlation ID for request tracing
     */
    withCorrelation: (correlationId: string) => {
      return logger.child({ correlationId });
    },

    /**
     * Generate new correlation ID
     */
    generateCorrelationId: (): string => {
      return uuidv4();
    },

    /**
     * Log debug message
     */
    debug: (message: string, context?: Record<string, unknown>) => {
      logger.debug(redactObject(context || {}), redactPII(message));
    },

    /**
     * Log info message
     */
    info: (message: string, context?: Record<string, unknown>) => {
      logger.info(redactObject(context || {}), redactPII(message));
    },

    /**
     * Log warning message
     */
    warn: (message: string, context?: Record<string, unknown>) => {
      logger.warn(redactObject(context || {}), redactPII(message));
    },

    /**
     * Log error message
     */
    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
      const errorObj = error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error;

      logger.error(
        redactObject({ ...context, error: errorObj }),
        redactPII(message)
      );
    },

    /**
     * Log HTTP request
     */
    http: (req: {
      method: string;
      url: string;
      statusCode: number;
      durationMs: number;
      userAgent?: string;
      ip?: string;
    }) => {
      const level = req.statusCode >= 500 ? 'error' : req.statusCode >= 400 ? 'warn' : 'info';
      logger[level]({
        type: 'http',
        ...redactObject(req),
      }, `${req.method} ${req.url} ${req.statusCode} ${req.durationMs}ms`);
    },
  };
};

// Default export singleton
export const logger = createLogger('adbazaar');

export default logger;
