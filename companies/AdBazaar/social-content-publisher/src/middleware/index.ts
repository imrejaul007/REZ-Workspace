export * from './auth.middleware';
export * from './error.middleware';
export * from './validation.middleware';

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { httpRequestsTotal, httpRequestDuration } from '../config/metrics';

export const requestMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status: res.statusCode.toString(),
      },
      duration
    );

    logger.debug('Request completed', {
      method: req.method,
      path,
      status: res.statusCode,
      duration,
    });
  });

  next();
};

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
  next();
};

export const rateLimitHandler = (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  });
};