/**
 * Shared Production Logger for RTNM Companies
 *
 * Features:
 * - Structured JSON logging
 * - PII redaction
 * - Correlation ID tracking
 * - Production-safe (no console.log in prod)
 *
 * Usage:
 *   import { logger } from '../../shared/logger';
 *   logger.info('Message', { key: 'value' });
 *   logger.error('Failed', error);
 */
declare const logger: {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void;
    http(req: {
        method: string;
        url: string;
        status: number;
        duration: number;
    }): void;
};
export { logger };
export default logger;
