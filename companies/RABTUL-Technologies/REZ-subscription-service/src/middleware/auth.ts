import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Authentication middleware for internal service calls
 */
export function authenticateInternal(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-Internal-Token header'
    });
    return;
  }

  // Validate token against configured service tokens
  const serviceTokens = process.env.INTERNAL_SERVICE_TOKENS_JSON
    ? JSON.parse(process.env.INTERNAL_SERVICE_TOKENS_JSON)
    : {};

  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  const isValid =
    token === internalToken ||
    Object.values(serviceTokens).includes(token);

  if (!isValid) {
    logger.warn('Invalid internal token attempt', {
      ip: req.ip,
      path: req.path
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid internal token'
    });
    return;
  }

  next();
}

/**
 * Optional authentication - continues even without token
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;

  if (token) {
    // Set service info on request
    (req as unknown).serviceToken = token;
  }

  next();
}

/**
 * Rate limiting by IP
 */
export function rateLimitByIP(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip;
  const now = Date.now();

  // Simple in-memory rate limiting (use Redis in production)
  const key = `rate:${ip}`;
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

  // In a real implementation, use Redis for distributed rate limiting
  // For now, we'll let express-rate-limit handle this via middleware

  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: err.message
    });
    return;
  }

  if (err.name === 'NotFoundError') {
    res.status(404).json({
      error: 'Not Found',
      message: err.message
    });
    return;
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  });
}

/**
 * Validate request body against Zod schema
 */
export function validateBody<T>(
  schema: {
    parse: (data: unknown) => T;
  }
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.errors || error.message
      });
    }
  };
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
