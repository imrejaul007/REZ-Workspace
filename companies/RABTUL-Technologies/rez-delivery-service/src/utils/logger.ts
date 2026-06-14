/**
 * Production-grade structured logging for rez-delivery-service
 */

import { AsyncLocalStorage } from 'async_hooks';

interface TraceContext {
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
}

const traceStorage = new AsyncLocalStorage<TraceContext>();

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getMinLevel(): LogLevel {
  switch (LOG_LEVEL) {
    case 'debug': return LogLevel.DEBUG;
    case 'info': return LogLevel.INFO;
    case 'warn': return LogLevel.WARN;
    case 'error': return LogLevel.ERROR;
    default: return LogLevel.INFO;
  }
}

function formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
  const ctx = traceStorage.getStore();
  const timestamp = new Date().toISOString();
  const parts = [timestamp, level.toUpperCase(), message];

  if (ctx?.requestId) parts.push(`[${ctx.requestId}]`);
  if (ctx?.userId) parts.push(`user:${ctx.userId}`);

  if (meta && Object.keys(meta).length > 0) {
    parts.push(JSON.stringify(meta));
  }

  return parts.join(' ');
}

function log(level: LogLevel, levelName: string, message: string, meta?: Record<string, unknown>): void {
  if (level < getMinLevel()) return;

  if (IS_PRODUCTION) {
    process.stdout.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: levelName,
      service: 'rez-delivery-service',
      message,
      ...traceStorage.getStore(),
      ...meta,
    }) + '\n');
  } else {
    process.stdout.write(formatMessage(levelName, message, meta) + '\n');
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    log(LogLevel.DEBUG, 'debug', message, meta),

  info: (message: string, meta?: Record<string, unknown>) =>
    log(LogLevel.INFO, 'info', message, meta),

  warn: (message: string, meta?: Record<string, unknown>) =>
    log(LogLevel.WARN, 'warn', message, meta),

  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    const errObj = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    log(LogLevel.ERROR, 'error', message, { ...meta, error: errObj });
  },
};
