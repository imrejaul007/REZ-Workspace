import config from '../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = (config.log.level as LogLevel) || 'info';
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
    };

    if (level === 'error') {
      logger.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
      logger.warn(JSON.stringify(logEntry));
    } else {
      logger.info(JSON.stringify(logEntry));
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  child(meta: Record<string, unknown>): Logger {
    const childLogger = new ChildLogger(this, meta);
    return childLogger;
  }
}

class ChildLogger extends Logger {
  private parent: Logger;
  private meta: Record<string, unknown>;

  constructor(parent: Logger, meta: Record<string, unknown>) {
    super();
    this.parent = parent;
    this.meta = meta;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    this.parent.log(level, message, { ...this.meta, ...meta });
  }
}

export const logger = new Logger();
export default logger;