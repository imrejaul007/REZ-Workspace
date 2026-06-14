/**
 * Logger utility
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: unknown;
}

class Logger {
  private service: string;

  constructor(service: string = 'conversion-optimization-ai') {
    this.service = service;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      data,
    };

    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.service}] ${message}`;

    switch (level) {
      case 'error':
        logger.error(logMessage, data ? JSON.stringify(data, null, 2) : '');
        break;
      case 'warn':
        logger.warn(logMessage, data ? JSON.stringify(data, null, 2) : '');
        break;
      case 'debug':
        if (process.env.DEBUG === 'true') {
          logger.debug(logMessage, data ? JSON.stringify(data, null, 2) : '');
        }
        break;
      default:
        logger.info(logMessage, data ? JSON.stringify(data, null, 2) : '');
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

export default new Logger('conversion-optimization-ai');