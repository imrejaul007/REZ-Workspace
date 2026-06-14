/**
 * DSP Portal Logger
 * Structured logging with request context
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
    const logLine = entry.context
      ? `${prefix} ${entry.message} ${JSON.stringify(entry.context)}`
      : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'error':
        console.error(logLine);
        break;
      case 'warn':
        console.warn(logLine);
        break;
      default:
        console.log(logLine);
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
}

const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || ('info' as LogLevel)
);

export default logger;
export { Logger, LogLevel, LogEntry };
