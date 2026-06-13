/**
 * AI Concierge Agent - Request Logger Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const { method, path, requestId } = req;

  // Log request
  logger.info('Incoming request', {
    requestId,
    method,
    path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]('Request completed', {
      requestId,
      method,
      path,
      statusCode,
      durationMs: duration,
    });
  });

  next();
};
