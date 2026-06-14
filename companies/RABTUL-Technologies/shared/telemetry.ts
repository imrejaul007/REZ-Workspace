/**
 * Centralized Telemetry/Logging Service
 *
 * Provides structured logging with PII redaction for all RABTUL services.
 * Replaces console.log statements with a centralized, production-ready logger.
 *
 * USAGE:
 * ```typescript
 * import { createServiceLogger, maskPII } from './telemetry';
 *
 * const logger = createServiceLogger('auth-service');
 *
 * // Basic logging
 * logger.info('User logged in', { userId: maskPII(userId) });
 * logger.warn('Rate limit exceeded', { phone: maskPII(phone) });
 * logger.error('Auth failed', { error: err.message });
 *
 * // With custom redaction patterns
 * const customLogger = createServiceLogger('payment-service', {
 *   additionalPatterns: [/transaction_id/i]
 * });
 * ```
 */

import crypto from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

export interface TelemetryConfig {
  serviceName: string;
  environment?: string;
  logLevel?: LogLevel;
  additionalPatterns?: RegExp[];
  enableRemoteLogging?: boolean;
  remoteEndpoint?: string;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Default PII redaction patterns
const DEFAULT_REDACTION_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /token(?!s)/i,
  /authorization/i,
  /bearer\s+[\w.-]+/gi,
  /\d{10,}/g, // Phone numbers (10+ digits)
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Emails
  /mongodb:\/\/[^@]+@/gi, // MongoDB connection strings
  /redis:\/\/[^@]+@/gi, // Redis connection strings
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI keys
  /rzp_[a-zA-Z0-9]{10,}/g, // Razorpay keys
];

// ============================================
// PII MASKING
// ============================================

/**
 * Mask PII for safe logging
 */
export function maskPII(value: string): string {
  if (!value) return '';

  let masked = value;

  // Email: john@example.com → jo***@example.com
  if (masked.includes('@')) {
    const [local, domain] = masked.split('@');
    if (local.length > 2) {
      masked = `${local.substring(0, 2)}***@${domain}`;
    } else {
      masked = `***@${domain}`;
    }
    return masked;
  }

  // Phone: 9876543210 → 98****3210
  if (/^\d{10,}$/.test(masked)) {
    return masked.substring(0, 2) + '*'.repeat(masked.length - 4) + masked.slice(-2);
  }

  // Default: first 2 + last 2 chars
  if (masked.length > 4) {
    return masked.substring(0, 2) + '*'.repeat(Math.min(masked.length - 4, 6)) + masked.slice(-2);
  }

  return '***';
}

/**
 * Mask object properties that might contain PII
 */
export function maskObject<T extends Record<string, unknown>>(obj: T): T {
  const PII_KEYS = [
    'password', 'secret', 'token', 'apiKey', 'api_key',
    'email', 'phone', 'mobile', 'address', 'name',
    'creditCard', 'cardNumber', 'cvv', 'ssn',
  ];

  const result = { ...obj };

  for (const key of Object.keys(result)) {
    const lowerKey = key.toLowerCase();
    if (PII_KEYS.some(pii => lowerKey.includes(pii))) {
      const value = result[key];
      if (typeof value === 'string') {
        (result as Record<string, unknown>)[key] = maskPII(value);
      } else if (typeof value === 'number') {
        (result as Record<string, unknown>)[key] = '***';
      }
    }
  }

  return result;
}

// ============================================
// LOG ENTRY
// ============================================

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ============================================
// TELEMETRY SERVICE
// ============================================

export class TelemetryService {
  private serviceName: string;
  private environment: string;
  private logLevel: LogLevel;
  private redactionPatterns: RegExp[];
  private correlationId?: string;

  private static instance: TelemetryService | null = null;

  constructor(config: TelemetryConfig) {
    this.serviceName = config.serviceName;
    this.environment = config.environment || process.env.NODE_ENV || 'development';
    this.logLevel = config.logLevel || this.parseLogLevel(process.env.LOG_LEVEL);
    this.redactionPatterns = [
      ...DEFAULT_REDACTION_PATTERNS,
      ...(config.additionalPatterns || []),
    ];
  }

  private parseLogLevel(level?: string): LogLevel {
    switch (level?.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private redact(input: unknown): unknown {
    if (typeof input === 'string') {
      let result = input;
      for (const pattern of this.redactionPatterns) {
        result = result.replace(pattern, '[REDACTED]');
      }
      return result;
    }
    if (typeof input === 'object' && input !== null) {
      return this.redactObject(input as Record<string, unknown>);
    }
    return input;
  }

  private redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      let shouldRedact = false;

      for (const pattern of this.redactionPatterns) {
        if (pattern.test(key)) {
          shouldRedact = true;
          break;
        }
      }

      if (shouldRedact) {
        result[key] = typeof value === 'string' ? '[REDACTED]' : '[REDACTED_VALUE]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.redactObject(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        result[key] = value.map(item =>
          typeof item === 'object' ? this.redactObject(item as Record<string, unknown>) : item
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message: this.redact(message) as string,
      correlationId: this.correlationId,
      metadata: context ? this.redact(context) as Record<string, unknown> : undefined,
    };

    return entry;
  }

  private output(entry: LogEntry): void {
    const prefix = `[${entry.service}]`;
    const levelStr = entry.level.toUpperCase().padEnd(5);

    // Console output with structure
    const output = {
      ...entry,
      formatted: `${entry.timestamp} ${levelStr} ${prefix} ${entry.message}`,
    };

    // Use appropriate console method
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(output));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(output));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(output));
        break;
      case LogLevel.ERROR:
        console.error(JSON.stringify(output));
        break;
    }
  }

  // Public logging methods
  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    this.output(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.output(this.createLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.output(this.createLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, context);

    // Add error stack if context contains an error
    if (context?.error instanceof Error) {
      entry.error = {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack,
      };
    }

    this.output(entry);
  }

  // Correlation ID management
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  withCorrelationId(id: string): TelemetryService {
    const child = new TelemetryService({
      serviceName: this.serviceName,
      logLevel: this.logLevel,
    });
    child.correlationId = id;
    return child;
  }

  // Child logger with additional context
  child(additionalContext: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, additionalContext);
  }

  // Generate unique request ID
  static generateRequestId(): string {
    return `req_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
  }
}

// ============================================
// CHILD LOGGER
// ============================================

class ChildLogger {
  constructor(
    private parent: TelemetryService,
    private additionalContext: Record<string, unknown>
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.parent.debug(message, { ...this.additionalContext, ...context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.parent.info(message, { ...this.additionalContext, ...context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.parent.warn(message, { ...this.additionalContext, ...context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.parent.error(message, { ...this.additionalContext, ...context });
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createServiceLogger(
  serviceName: string,
  config?: Partial<TelemetryConfig>
): TelemetryService {
  return new TelemetryService({
    serviceName,
    ...config,
  });
}

// ============================================
// DEFAULT EXPORTS
// ============================================

export const telemetry = createServiceLogger('app');

// Convenience exports
export const { info, warn, error, debug } = telemetry;
export { maskPII, maskObject };
export type { TelemetryConfig, LogEntry };

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express middleware to add correlation ID and telemetry to requests
 */
export function telemetryMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const correlationId = req.headers['x-correlation-id'] as string ||
                         req.headers['x-request-id'] as string ||
                         TelemetryService.generateRequestId();

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);

    // Set on request for downstream use
    (req as Request & { correlationId: string }).correlationId = correlationId;

    next();
  };
}

// ============================================
// KOAFOA MIDDLEWARE
// ============================================

/**
 * Fastify plugin for telemetry
 */
export function fastifyTelemetryPlugin(fastify, options: TelemetryConfig, done: () => void) {
  const logger = createServiceLogger(options.serviceName || 'fastify-service');

  fastify.addHook('onRequest', async (request) => {
    request.correlationId = request.headers['x-correlation-id'] ||
                          TelemetryService.generateRequestId();
    request.telemetry = logger.withCorrelationId(request.correlationId);
  });

  fastify.addHook('onResponse', async (request, reply) => {
    request.telemetry?.info('Request completed', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime(),
    });
  });

  done();
}

export default TelemetryService;
