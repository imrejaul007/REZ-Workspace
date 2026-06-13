/**
 * Logger Utility
 *
 * Structured logging for the Rider Twin service
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  [key: string]: any;
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

  constructor(service: string) {
    this.service = service;
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, meta?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...meta,
    };
  }

  private output(entry: LogEntry): void {
    const output = JSON.stringify(entry);

    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, meta));
    }
  }

  error(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      this.output(this.formatEntry('error', message, meta));
    }
  }
}

export function createLogger(service: string): Logger {
  return new Logger(service);
}

export { Logger };
