/**
 * Logger Configuration
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogContext { [key: string]: unknown; }

class Logger {
  private isDevelopment: boolean;
  constructor() { this.isDevelopment = process.env.NODE_ENV !== 'production'; }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void { console.log(this.formatMessage('info', message, context)); }
  warn(message: string, context?: LogContext): void { console.warn(this.formatMessage('warn', message, context)); }
  error(message: string, context?: LogContext): void { console.error(this.formatMessage('error', message, context)); }
  debug(message: string, context?: LogContext): void { if (this.isDevelopment) console.log(this.formatMessage('debug', message, context)); }
}

export const logger = new Logger();
export default logger;
