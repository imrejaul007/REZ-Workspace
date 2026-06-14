import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import logger from 'utils/logger.js';
import { recordHttpRequest, startTimer } from '../utils/metrics.js';

// ============ Error Handler ============

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  logger.error('Request error', {
    error: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
};

// ============ Not Found Handler ============

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', { path: req.path, method: req.method });

  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

// ============ Request Logger ============

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const endTimer = startTimer();
  const originalSend = res.send;

  res.send = function (body): Response {
    const duration = endTimer();
    const route = req.route?.path || req.path;

    // Record metrics
    recordHttpRequest(req.method, route, res.statusCode, duration);

    // Log request
    logger.http('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${(duration * 1000).toFixed(2)}ms`,
    });

    return originalSend.call(this, body);
  };

  next();
};

// ============ Auth Middleware ============

export const serviceAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required' },
    });
    return;
  }

  if (token !== config.internalServiceToken) {
    logger.warn('Invalid service token attempt', { ip: req.ip, path: req.path });
    res.status(403).json({
      success: false,
      error: { message: 'Invalid service token' },
    });
    return;
  }

  next();
};

// ============ Rate Limiter (Simple) ============

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests',
          retryAfter,
        },
      });
      return;
    }

    record.count++;
    next();
  };
};

// ============ Validation Middleware ============

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors,
        },
      });
      return;
    }

    next();
  };
};

// ============ CORS Middleware ============

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Internal-Token');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};