/*** Production Logger for RisnaEstate Frontend ***/

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL = (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as LogLevel;

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
}

const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) console.debug(`[DEBUG] ${message}`, ...args);
  },
  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) console.info(`[INFO] ${message}`, ...args);
  },
  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) console.warn(`[WARN] ${message}`, ...args);
  },
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (shouldLog('error')) console.error(`[ERROR] ${message}`, error, ...args);
  },
};

export { logger };
export default logger;
