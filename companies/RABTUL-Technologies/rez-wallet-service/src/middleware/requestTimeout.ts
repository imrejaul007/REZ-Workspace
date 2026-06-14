import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Request timeout middleware - aborts requests that take too long.
 * @param timeoutMs - Timeout in milliseconds (default: 30 seconds)
 */
export function requestTimeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Set response timeout header
    res.setHeader('X-Response-Time-Limit', `${timeoutMs}ms`);

    const timeoutId = setTimeout(() => {
      logger.warn('Request timeout', {
        method: req.method,
        path: req.path,
        timeout: timeoutMs,
        ip: req.ip,
      });

      // Only respond if headers haven't been sent
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          message: `Request took longer than ${timeoutMs / 1000} seconds`,
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    // Also clear on close (client disconnected)
    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}
