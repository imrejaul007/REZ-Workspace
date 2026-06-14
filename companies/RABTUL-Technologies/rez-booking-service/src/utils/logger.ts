/**
 * Production-grade structured logging for REZ platform
 * Supports: JSON logs, tracing, PII masking, multiple transports
 */

import { AsyncLocalStorage } from 'async_hooks';

// Trace context for distributed tracing
interface TraceContext {
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  service?: string;
}

const traceStorage = new AsyncLocalStorage<TraceContext>();

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Log entry structure
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// PII fields to mask
const PII_FIELDS = [
  'password', 'token', 'secret', 'apiKey', 'api_key', 'accessToken', 'access_token',
  'refreshToken', 'refresh_token', 'bearer', 'authorization',
  'email', 'phone', 'mobile', 'creditCard', 'credit_card', 'cardNumber', 'card_number',
  'cvv', 'ssn', 'aadhaar', 'pan', 'upi', 'vpa',
  'address', 'street', 'city', 'pincode', 'zipcode', 'zip',
  'firstName', 'first_name', 'lastName', 'last_name', 'name',
];

// Mask PII in objects
function maskPII(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => maskPII(item, depth + 1));
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();

    if (PII_FIELDS.some(f => lowerKey.includes(f.toLowerCase()))) {
      if (typeof value === 'string') {
        masked[key] = value.length > 4
          ? `${value.substring(0, 4)}${'*'.repeat(Math.min(value.length - 4, 12))}`
          : '****';
      } else {
        masked[key] = '***MASKED***';
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskPII(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

// Parse log level from string
function parseLogLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'debug': return LogLevel.DEBUG;
    case 'info': return LogLevel.INFO;
    case 'warn': return LogLevel.WARN;
    case 'error': return LogLevel.ERROR;
    case 'fatal': return LogLevel.FATAL;
    default: return LogLevel.INFO;
  }
}

// Service logger factory
export interface LoggerConfig {
  service: string;
  level?: string;
  json?: boolean;
  redact?: boolean;
}

export function createServiceLogger(config: LoggerConfig) {
  const minLevel = parseLogLevel(config.level || process.env.LOG_LEVEL || 'info');
  const useJson = config.json ?? process.env.NODE_ENV === 'production';
  const redact = config.redact ?? true;

  function formatLog(level: LogLevel, levelName: string, message: string, meta?: Record<string, unknown>): LogEntry {
    const ctx = traceStorage.getStore();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      service: config.service,
      traceId: ctx?.traceId,
      spanId: ctx?.spanId,
      userId: ctx?.userId,
      requestId: ctx?.requestId,
    };

    if (meta) {
      entry.metadata = redact ? maskPII(meta) as Record<string, unknown> : meta;
    }

    return entry;
  }

  function output(entry: LogEntry): void {
    if (useJson) {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
        `[${entry.service}]`,
        entry.requestId ? `[${entry.requestId}]` : '',
        entry.message,
        entry.metadata ? JSON.stringify(entry.metadata) : '',
      ].filter(Boolean);
      process.stdout.write(parts.join(' ') + '\n');
    }
  }

  function log(level: LogLevel, levelName: string, message: string, meta?: Record<string, unknown>): void {
    if (level < minLevel) return;
    const entry = formatLog(level, levelName, message, meta);
    output(entry);
  }

  return {
    debug: (message: string, meta?: Record<string, unknown>) => log(LogLevel.DEBUG, 'debug', message, meta),
    info: (message: string, meta?: Record<string, unknown>) => log(LogLevel.INFO, 'info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log(LogLevel.WARN, 'warn', message, meta),
    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      const errObj = error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : typeof error === 'object' ? error : undefined;
      const entry = formatLog(LogLevel.ERROR, 'error', message, { ...meta, error: errObj });
      output(entry);
    },
    fatal: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      const errObj = error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : typeof error === 'object' ? error : undefined;
      const entry = formatLog(LogLevel.FATAL, 'fatal', message, { ...meta, error: errObj });
      output(entry);
    },

    // Child logger with additional context
    child: (additionalContext: Record<string, unknown>) => {
      return {
        debug: (message: string, meta?: Record<string, unknown>) =>
          log(LogLevel.DEBUG, 'debug', message, { ...additionalContext, ...meta }),
        info: (message: string, meta?: Record<string, unknown>) =>
          log(LogLevel.INFO, 'info', message, { ...additionalContext, ...meta }),
        warn: (message: string, meta?: Record<string, unknown>) =>
          log(LogLevel.WARN, 'warn', message, { ...additionalContext, ...meta }),
        error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
          const errObj = error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : typeof error === 'object' ? error : undefined;
          const entry = formatLog(LogLevel.ERROR, 'error', message, { ...additionalContext, ...meta, error: errObj });
          output(entry);
        },
      };
    },

    // Run with trace context
    withTrace: (ctx: TraceContext, fn: () => void) => {
      traceStorage.run(ctx, fn);
    },
  };
}

// Default logger instance
export const logger = createServiceLogger({
  service: process.env.SERVICE_NAME || 'unknown-service',
  level: process.env.LOG_LEVEL || 'info',
});

// Performance measurement utility
export function startTimer(): () => number {
  const start = process.hrtime.bigint();
  return () => Number(process.hrtime.bigint() - start) / 1_000_000; // ms
}

// Structured request logging
export function logRequest(req: {
  method: string;
  path: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  headers?: Record<string, string>;
}, res: {
  statusCode: number;
}, durationMs: number): void {
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.requestId,
    userId: req.userId,
    ip: req.ip,
    statusCode: res.statusCode,
    duration: `${durationMs}ms`,
    userAgent: req.headers?.['user-agent'],
  });
}
