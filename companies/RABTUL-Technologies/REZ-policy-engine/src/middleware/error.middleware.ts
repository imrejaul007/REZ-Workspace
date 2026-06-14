import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ApiResponse } from '../types/policy.types';

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  const response: ApiResponse<null> = {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    timestamp: new Date()
  };

  res.status(500).json(response);
};

/**
 * Not found middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date()
  };

  res.status(404).json(response);
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
};

/**
 * CORS middleware - restricts origins to configured allowed domains
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_CORS_ORIGINS || 'https://reznow.app,https://admin.reznow.app').split(',');

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  next();
};
