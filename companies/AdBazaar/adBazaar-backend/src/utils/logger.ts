/**
 * Simple logger utility for AdBazaar Backend
 * Provides structured logging with timestamps and levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private minLevel: LogLevel;

  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levelPriority[level] >= Logger.levelPriority[this.minLevel];
  }

  private formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  private output(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    if (entry.context) {
      logger.info(`${prefix} ${entry.message}`, entry.context);
    } else {
      logger.info(`${prefix} ${entry.message}`);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatLog('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      this.output(this.formatLog('info', message, context));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatLog('warn', message, context));
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      this.output(this.formatLog('error', message, context));
    }
  }

  // Convenience method for HTTP request logging
  httpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.output({
      timestamp: new Date().toISOString(),
      level,
      message: `${method} ${path} ${statusCode} ${durationMs}ms`,
    });
  }
}

// Export singleton instance
const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || ('info' as LogLevel)
);

export default logger;
export { Logger, LogLevel, LogEntry };

/**
 * Create a module-scoped logger with prefix
 */
export function createLogger(module: string) {
  return {
    info: (msg: string, context?: Record<string, unknown>) => {
      logger.info(`[${module}] ${msg}`, context);
    },
    error: (msg: string, err?: unknown) => {
      if (err instanceof Error) {
        logger.error(`[${module}] ${msg}`, { error: err.message, stack: err.stack });
      } else if (err !== undefined) {
        logger.error(`[${module}] ${msg}`, err as Record<string, unknown>);
      } else {
        logger.error(`[${module}] ${msg}`);
      }
    },
    warn: (msg: string, context?: Record<string, unknown>) => {
      logger.warn(`[${module}] ${msg}`, context);
    },
    debug: (msg: string, context?: Record<string, unknown>) => {
      logger.debug(`[${module}] ${msg}`, context);
    },
    http: (data: { method: string; url: string; statusCode: number; durationMs: number; ip?: string; userAgent?: string }) => {
      logger.httpRequest(data.method, data.url, data.statusCode, data.durationMs);
    },
  };
}
