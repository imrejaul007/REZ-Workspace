/**
 * Simple Logger for safe-qr-service
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const levels: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function log(level: string, msg: string, ...args: unknown[]): void {
  const configured = levels[LOG_LEVEL] ?? 1;
  if ((levels[level] ?? 0) < configured) return;
  const ts = new Date().toISOString();
  const extra = args.length > 0 ? ' ' + args.map(a => String(a)).join(' ') : '';
  console.log(`[${ts}] [${level.toUpperCase()}] ${msg}${extra}`);
}

export const logger = {
  debug: (msg: string, ...args: unknown[]) => log('debug', msg, ...args),
  info: (msg: string, ...args: unknown[]) => log('info', msg, ...args),
  warn: (msg: string, ...args: unknown[]) => log('warn', msg, ...args),
  error: (msg: string, ...args: unknown[]) => log('error', msg, ...args),
};

export default logger;
