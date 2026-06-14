import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { httpRequestsTotal, httpRequestDuration } from '../utils/metrics';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

    logger.info('Request completed', {
      method: req.method,
      path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
};