type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private formatEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data !== undefined && { data }),
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry = this.formatEntry(level, message, data);
    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        logger.error(output);
        break;
      case 'warn':
        logger.warn(output);
        break;
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(output);
        }
        break;
      default:
        logger.info(output);
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
