type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class Logger {
  private formatMessage(log: LogMessage): string {
    const contextStr = log.context ? ` ${JSON.stringify(log.context)}` : '';
    return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const log: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    const formatted = this.formatMessage(log);

    switch (level) {
      case 'error':
        logger.error(formatted);
        break;
      case 'warn':
        logger.warn(formatted);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          logger.debug(formatted);
        }
        break;
      default:
        logger.info(formatted);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }
}

const logger = new Logger();
export default logger;
