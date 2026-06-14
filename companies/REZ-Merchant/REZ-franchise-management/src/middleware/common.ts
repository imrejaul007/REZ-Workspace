import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) ||
                        `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Correlation-ID', correlationId);
  req.headers['x-correlation-id'] = correlationId;
  next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = { method: req.method, path: req.path, statusCode: res.statusCode, duration: `${duration}ms` };
    if (res.statusCode >= 400) logger.warn('Request completed', logData);
    else logger.info('Request completed', logData);
  });
  next();
};

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: err.message },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
};
