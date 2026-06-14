type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    this.level = ['debug', 'info', 'warn', 'error'].includes(envLevel) ? envLevel : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogMessage {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(data !== undefined && { data }),
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, data);

    switch (level) {
      case 'error':
        logger.error(JSON.stringify(logEntry));
        break;
      case 'warn':
        logger.warn(JSON.stringify(logEntry));
        break;
      default:
        logger.info(JSON.stringify(logEntry));
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
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
}

export const logger = new Logger();
