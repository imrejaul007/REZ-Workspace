/**
 * Shared Logger Utility for rez-shared
 *
 * Provides a configurable logger that defaults to console methods.
 * Consumers should call `setLogger()` to wire in a production logger
 * (e.g., Winston, Pino). Until then, falls back to console.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('Message');
 *   logger.error('Message');
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...meta: unknown[]) => void;
  info: (message: string, ...meta: unknown[]) => void;
  warn: (message: string, ...meta: unknown[]) => void;
  error: (message: string, ...meta: unknown[]) => void;
}

const noop: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

let currentLogger: Logger = {
  debug: (msg, ...meta) => console.debug(`[DEBUG] ${msg}`, ...meta),
  info: (msg, ...meta) => logger.info([INFO] ${msg}`, ...meta),
  warn: (msg, ...meta) => logger.warn(`[WARN] ${msg}`, ...meta),
  error: (msg, ...meta) => logger.error(`[ERROR] ${msg}`, ...meta),
};

/**
 * Override the logger used by all rez-shared modules.
 * Pass `null` or omit to reset to no-op.
 */
export function setLogger(logger: Logger | null): void {
  currentLogger = logger ?? noop;
}

/**
 * Get the current logger instance (for wiring into consumers).
 */
export function getLogger(): Logger {
  return currentLogger;
}

/**
 * Structured logger instance for use throughout rez-shared.
 */
export const logger: Logger = {
  debug: (msg, ...meta) => currentLogger.debug(msg, ...meta),
  info: (msg, ...meta) => currentLogger.info(msg, ...meta),
  warn: (msg, ...meta) => currentLogger.warn(msg, ...meta),
  error: (msg, ...meta) => currentLogger.error(msg, ...meta),
};
