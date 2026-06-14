// Simple logger implementation for production readiness
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
  private level: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }
  
  private formatMessage(level: LogLevel, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }
  
  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', ...args));
    }
  }
  
  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', ...args));
    }
  }
  
  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', ...args));
    }
  }
  
  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', ...args));
    }
  }
}

export const logger = new Logger();
