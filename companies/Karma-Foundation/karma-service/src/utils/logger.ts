/**
 * Logger Utility for Karma Foundation
 * Simple logger with timestamp and level support
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  meta?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private service: string;
  private minLevel: LogLevel;

  constructor(service: string = 'karma-service', minLevel: LogLevel = 'info') {
    this.service = service;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      meta,
    };
    return JSON.stringify(entry);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatEntry('debug', message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(this.formatEntry('info', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatEntry('warn', message, meta));
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(this.formatEntry('error', message, meta));
    }
  }

  child(additionalContext: Record<string, unknown>): Logger {
    const child = new Logger(this.service, this.minLevel);
    return child;
  }
}

export const logger = new Logger('karma-service');

export function createServiceLogger(service: string): Logger {
  return new Logger(service);
}

export default logger;
