import { Request, Response, NextFunction } from 'express';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'ad-bazaar-internal-token';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4961'];

export interface AuthenticatedRequest extends Request {
  serviceAuth?: {
    isInternal: boolean;
    serviceId?: string;
  };
}

/**
 * Internal service authentication middleware
 * Validates internal service tokens for inter-service communication
 */
export const internalServiceAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;
  const serviceId = req.headers['x-service-id'] as string;

  if (token && token === INTERNAL_SERVICE_TOKEN) {
    req.serviceAuth = { isInternal: true, serviceId };
    return next();
  }

  // For development, allow requests without auth
  if (process.env.NODE_ENV !== 'production') {
    req.serviceAuth = { isInternal: false };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing internal service token',
    },
  });
};

/**
 * Rate limiting middleware for auction endpoints
 * Uses in-memory store (use Redis in production)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX = 100; // requests per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      },
    });
  }

  record.count++;
  next();
};

/**
 * CORS middleware for AdBazaar services
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Token, X-Service-Id, X-Request-Id');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    if (logLevel === 'warn') {
      logger.warn(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms - ${requestId}`);
    } else {
      logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms - ${requestId}`);
    }
  });

  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
};
