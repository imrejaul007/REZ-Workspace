/**
 * Logger utility for REZ Workflow Builder
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private serviceName: string;
  private minLevel: LogLevel;

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(serviceName: string = 'workflow-builder') {
    this.serviceName = serviceName;
    const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
    this.minLevel = envLevel && envLevel in this.levels ? envLevel : 'info';
  }

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message: `[${this.serviceName}] ${message}`,
      ...(data !== undefined && { data }),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private output(entry: LogEntry): void {
    const { timestamp, level, message, data } = entry;
    const prefix = `${timestamp} ${level.toUpperCase().padEnd(5)}`;

    if (level === 'error') {
      console.error(prefix, message, data !== undefined ? data : '');
    } else if (level === 'warn') {
      console.warn(prefix, message, data !== undefined ? data : '');
    } else {
      console.log(prefix, message, data !== undefined ? data : '');
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      this.output(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      this.output(this.formatMessage('error', message, data));
    }
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export const logger = new Logger('workflow-builder');
