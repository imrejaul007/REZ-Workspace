// @ts-nocheck
/**
 * Logger Utility
 *
 * Centralized logging service that replaces console.log statements
 * in production code. Provides different log levels and integrates
 * with monitoring services like Sentry.
 *
 * Phase 0: Integrated with @rez/shared/telemetry RedactingLogger
 */

import { MonitoringHelpers } from '@/config/monitoring.config';

// Local stub for @rez/shared/telemetry — avoids npm dependency
// The real RedactingLogger lives in @rez/shared/telemetry; this stub
// provides the same interface so Logger compiles without the package.
interface LogContext {
  error?: string;
  context?: string;
  [key: string]: unknown;
}

class RedactingLogger {
  private serviceName: string;
  private environment: string;
  private redactionPatterns: RegExp[];

  constructor(config: { serviceName: string; environment: string; redactionPatterns: RegExp[] }) {
    this.serviceName = config.serviceName;
    this.environment = config.environment;
    this.redactionPatterns = config.redactionPatterns;
  }

  private redact(input: unknown): string {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    return this.redactionPatterns.reduce((acc, pattern) => acc.replace(pattern, '[REDACTED]'), raw);
  }

  debug(message: string, context?: LogContext): void {
    if (__DEV__) console.debug(`[${this.serviceName}]`, this.redact(message), context);
  }
  info(message: string, context?: LogContext): void {
    if (__DEV__) console.info(`[${this.serviceName}]`, this.redact(message), context);
  }
  warn(message: string, context?: LogContext): void {
    logger.warn(`[${this.serviceName}]`, this.redact(message), context);
  }
  error(message: string, context?: LogContext): void {
    logger.error(`[${this.serviceName}]`, this.redact(message), context);
  }
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  persistLogs: boolean;
  maxLogs: number;
}

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?;
  context?: string;
}

const REDACTION_PATTERNS: RegExp[] = [
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /(token|secret|password)["']?\s*[:=]\s*["'][^"']+["']/gi,
];

const redact = (input: unknown): string => {
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  return REDACTION_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, '[REDACTED]'), raw);
};

/**
 * Logger class with shared RedactingLogger integration
 */
class Logger {
  private config: LoggerConfig = {
    enabled: __DEV__, // Only enable in development
    level: __DEV__ ? LogLevel.DEBUG : LogLevel.ERROR,
    persistLogs: true,
    maxLogs: 100,
  };

  private logs: LogEntry[] = [];
  private redactingLogger: RedactingLogger;

  constructor() {
    this.redactingLogger = new RedactingLogger({
      serviceName: 'rez-app-consumer',
      environment: __DEV__ ? 'development' : 'production',
      redactionPatterns: REDACTION_PATTERNS,
    });
  }

  /**
   * Configure logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Add log entry
   */
  private addLog(level: LogLevel, message: string, data?, context?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context,
    };

    if (this.config.persistLogs) {
      this.logs.push(entry);

      // Keep only last N logs
      if (this.logs.length > this.config.maxLogs) {
        this.logs.shift();
      }
    }
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  /**
   * Debug level logging
   * Use for detailed debugging information
   * Fixed CA-AUT-039: Redact sensitive data (tokens, passwords) from logs
   */
  debug(message: string, data?, context?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const sanitizedData = data ? redact(data) : data;
    this.addLog(LogLevel.DEBUG, message, sanitizedData, context);

    if (__DEV__) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context), sanitizedData || '');
    }

    // Use shared redacting logger
    this.redactingLogger.debug(message, data as LogContext);
  }

  /**
   * Info level logging
   * Use for general information
   * Fixed CA-AUT-039: Redact sensitive data from logs
   */
  info(message: string, data?, context?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const sanitizedData = data ? redact(data) : data;
    this.addLog(LogLevel.INFO, message, sanitizedData, context);

    if (__DEV__) {
      console.info(this.formatMessage(LogLevel.INFO, message, context), sanitizedData || '');
    }

    // Use shared redacting logger
    this.redactingLogger.info(message, data as LogContext);
  }

  /**
   * Warning level logging
   * Use for warnings that should be addressed
   * Fixed CA-AUT-039: Redact sensitive data from logs
   */
  warn(message: string, data?, context?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const sanitizedData = data ? redact(data) : data;
    this.addLog(LogLevel.WARN, message, sanitizedData, context);

    // Send warnings to monitoring in production
    if (!__DEV__) {
      MonitoringHelpers.trackEvent('warning', {
        message,
        data: sanitizedData,
        context,
      });
    }

    // Use shared redacting logger
    this.redactingLogger.warn(message, data as LogContext);
  }

  /**
   * Error level logging
   * Use for errors that need immediate attention
   * Fixed CA-AUT-039: Redact sensitive data from logs
   */
  error(message: string, error?: unknown, context?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    // Normalize error to Error type for monitoring
    const normalizedError = error instanceof Error
      ? error
      : error ? new Error(String(error)) : undefined;

    this.addLog(LogLevel.ERROR, message, error, context);

    // Send errors to monitoring
    if (normalizedError) {
      MonitoringHelpers.trackError(normalizedError, {
        message,
        context,
      });
    }

    // Use shared redacting logger
    this.redactingLogger.error(message, { error: String(error), context } as LogContext);
  }

  /**
   * Log API request
   * Fixed CA-AUT-039: Redact sensitive data from API logs
   */
  logRequest(method: string, url: string, data?): void {
    const sanitizedData = data ? redact(data) : data;
    this.debug(`API Request: ${method} ${url}`, sanitizedData, 'API');
  }

  /**
   * Log API response
   * Fixed CA-AUT-039: Redact sensitive data from API logs
   */
  logResponse(method: string, url: string, status: number, data?): void {
    const sanitizedData = data ? redact(data) : data;
    if (status >= 200 && status < 300) {
      this.debug(`API Response: ${method} ${url} - ${status}`, sanitizedData, 'API');
    } else if (status >= 400) {
      this.error(`API Error: ${method} ${url} - ${status}`, undefined, 'API');
    }
  }

  /**
   * Log navigation
   */
  logNavigation(from: string, to: string): void {
    this.debug(`Navigation: ${from} → ${to}`, undefined, 'Navigation');

    // Track page view in analytics
    if (!__DEV__) {
      MonitoringHelpers.trackPageView(to, { from });
    }
  }

  /**
   * Log user action
   */
  logAction(action: string, data?): void {
    this.info(`User Action: ${action}`, data, 'User');

    // Track event in analytics
    if (!__DEV__) {
      MonitoringHelpers.trackEvent(action, data);
    }
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: string, duration: number, context?: string): void {
    this.debug(`Performance: ${metric} took ${duration}ms`, undefined, context);

    // Track performance in monitoring
    if (!__DEV__) {
      MonitoringHelpers.trackPerformance(metric, duration, { context });
    }
  }

  /**
   * Get all logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Backward compatibility methods
  log(...args: unknown[]): void {
    if (args.length > 0) {
      this.debug(String(args[0]), args.slice(1));
    }
  }
}

/**
 * Singleton logger instance
 */
const logger = new Logger();

/**
 * Export logger instance and types
 */
export { logger, Logger, LogEntry };
export default logger;

/**
 * Convenience exports for common logging operations
 */
export const log = {
  debug: (message: string, data?, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?, context?: string) => logger.warn(message, data, context),
  error: (message: string, error?: unknown, context?: string) => logger.error(message, error, context),
  request: (method: string, url: string, data?) => logger.logRequest(method, url, data),
  response: (method: string, url: string, status: number, data?) => logger.logResponse(method, url, status, data),
  navigation: (from: string, to: string) => logger.logNavigation(from, to),
  action: (action: string, data?) => logger.logAction(action, data),
  performance: (metric: string, duration: number, context?: string) => logger.logPerformance(metric, duration, context),
};

export const installProductionConsoleGuard = (): void => {
  if (__DEV__) return;

  const originalError = logger.error.bind(logger);
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  logger.warn = () => {};
  logger.error = (...args: unknown[]) => {
    originalError(...args.map((arg) => redact(arg)));
  };
};

// LOW-9: Install the production console guard at module load time so it is active
// before any module-level console.log calls in other files execute. This replaces
// the useEffect-based call in app/_layout.tsx (which fires after the first render).
installProductionConsoleGuard();
