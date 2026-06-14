export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private service: string;
  private minLevel: LogLevel;

  constructor(service: string, minLevel: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      context,
      error,
    };
  }

  private output(entry: LogEntry): void {
    const output = JSON.stringify(entry);
    switch (entry.level) {
      case LogLevel.ERROR:
        logger.error(output);
        break;
      case LogLevel.WARN:
        logger.warn(output);
        break;
      default:
        logger.info(output);
    }
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatEntry(LogLevel.ERROR, message, context, error));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatEntry(LogLevel.WARN, message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatEntry(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatEntry(LogLevel.DEBUG, message, context));
    }
  }
}

export const createLogger = (service: string): Logger => new Logger(service);

export default Logger;
