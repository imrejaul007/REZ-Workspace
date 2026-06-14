/**
 * Logger Utility
 * Production-safe logging with different levels
 * Console.log disabled in production by default
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  level?: LogLevel;
  disableProduction?: boolean;
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const DISABLE_PRODUCTION_LOGS = process.env.DISABLE_PRODUCTION_LOGS !== 'false';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  if (LEVELS[level] >= LEVELS[LOG_LEVEL as LogLevel] || LEVELS[level] >= LEVELS['info']) {
    return true;
  }
  return false;
}

export function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): void {
  if (DISABLE_PRODUCTION_LOGS && process.env.NODE_ENV === 'production') {
    // Only log errors in production by default
    if (level === 'error' || level === 'warn') {
      console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    }
    return;
  }

  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case 'error':
      console.error(`${prefix} ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`, data || '');
      break;
    default:
      console.log(`${prefix} ${message}`, data || '');
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
};
