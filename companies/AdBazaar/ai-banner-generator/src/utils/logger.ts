/**
 * Logger utility for AI Banner Generator Service
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const levels = { debug: 0, info: 1, warn: 2, error: 3 };

function log(
  level: 'debug' | 'info' | 'warn' | 'error',
  msg: string,
  meta?: Record<string, unknown>
): void {
  const configured = levels[LOG_LEVEL as keyof typeof levels] ?? 1;
  if (levels[level] < configured) return;
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  logger.info(`[${ts}] [${level.toUpperCase()}] ${msg}${metaStr}`);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};

export default logger;
