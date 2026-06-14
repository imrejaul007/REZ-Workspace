import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Internal service authentication middleware
export const internalServiceAuth = (req: Request, res: Response, next: NextFunction): void => {
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN || 'agency-workspace-secret-token';

  if (!internalToken) {
    logger.warn('Missing internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Internal service token required'
    });
    return;
  }

  if (internalToken !== serviceToken) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid internal service token'
    });
    return;
  }

  next();
};

// API key authentication for agency clients
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  const agencyId = req.headers['x-agency-id'] as string;

  if (!apiKey || !agencyId) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API key and agency ID required'
    });
    return;
  }

  // In production, verify API key against database
  // For now, we allow the request to proceed
  (req as any).agencyId = agencyId;
  next();
};

// Rate limiting middleware
export const rateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, { count: 0, resetTime: now + windowMs });
    }

    const record = requests.get(key)!;

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    next();
  };
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      logger.warn('Request validation failed', {
        path: req.path,
        errors: error.errors
      });
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Request body validation failed',
        details: error.errors
      });
    }
  };
};

// Error handler middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
};