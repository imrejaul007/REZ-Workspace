import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { apiLogger as logger } from '../utils/logger';

// Internal service token validation
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Additional allowed tokens from config
const ALLOWED_SERVICE_TOKENS: Record<string, string> = process.env.INTERNAL_SERVICE_TOKENS_JSON
  ? JSON.parse(process.env.INTERNAL_SERVICE_TOKENS_JSON)
  : {};

/**
 * Validate internal service token
 */
export function validateInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string | undefined;

  if (!token) {
    logger.warn('Missing internal token', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing X-Internal-Token header',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check main token
  if (token === INTERNAL_SERVICE_TOKEN) {
    return next();
  }

  // Check service-specific tokens
  const isValidServiceToken = Object.values(ALLOWED_SERVICE_TOKENS).some((t) => t === token);

  if (isValidServiceToken) {
    return next();
  }

  // Timing-safe comparison
  const isMainTokenValid = timingSafeEqual(token, INTERNAL_SERVICE_TOKEN);
  if (isMainTokenValid) {
    return next();
  }

  logger.warn('Invalid internal token', {
    path: req.path,
    ip: req.ip,
  });

  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid X-Internal-Token',
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Optional auth - sets service context if token is present
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string | undefined;

  if (token) {
    // Validate token but don't block if invalid
    if (token === INTERNAL_SERVICE_TOKEN || Object.values(ALLOWED_SERVICE_TOKENS).includes(token)) {
      (req as Request & { serviceContext?: { authenticated: boolean } }).serviceContext = {
        authenticated: true,
      };
    }
  }

  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
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
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * CORS middleware
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Internal-Token');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(
  windowMs: number = 60000,
  maxRequests: number = 100
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(ip);

    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(ip, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', { ip, count: record.count });
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}
