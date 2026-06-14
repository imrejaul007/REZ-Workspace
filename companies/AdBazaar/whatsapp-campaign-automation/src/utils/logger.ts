/**
 * Simple logger utility for WhatsApp Campaign Automation Service
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

  httpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.output({
      timestamp: new Date().toISOString(),
      level,
      message: `${method} ${path} ${statusCode} ${durationMs}ms`,
    });
  }
}

const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || ('info' as LogLevel)
);

export default logger;
export { Logger, LogLevel, LogEntry };