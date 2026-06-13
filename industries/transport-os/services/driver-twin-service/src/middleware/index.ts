export * from './auth.js';
export * from './validation.js';
export * from './rate-limit.js';
export * from './error.middleware.js';

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/index.js';

// ============================================================================
// REQUEST LOGGING
// ============================================================================

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
