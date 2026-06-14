import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

// Extend Express Request to include auth info
declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
      userId?: string;
      authScope?: string[];
    }
  }
}

/**
 * Internal API authentication middleware
 * Validates internal service tokens for inter-service communication
 */
export const internalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  // In production, validate against actual internal token
  // For now, allow requests with the header present
  if (!internalToken && process.env.NODE_ENV === 'production') {
    logger.warn('Unauthorized internal API access attempt', {
      ip: req.ip,
      path: req.path,
    });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing internal token',
      },
    });
    return;
  }

  // Set default merchant context for internal calls
  if (req.headers['x-merchant-id']) {
    req.merchantId = req.headers['x-merchant-id'] as string;
  }

  next();
};

/**
 * Merchant authentication middleware
 * Validates merchant JWT tokens
 */
export const merchantAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn('Missing authorization header', {
      ip: req.ip,
      path: req.path,
    });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing authorization header',
      },
    });
    return;
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  try {
    // In production, validate JWT and extract merchant info
    // For now, we assume token contains merchantId
    // const decoded = verifyToken(token);
    // req.merchantId = decoded.merchantId;

    // Placeholder - in real implementation, validate JWT
    req.merchantId = token;

    logger.debug('Merchant authenticated', {
      merchantId: req.merchantId,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error('Token validation failed', { error });
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
};

/**
 * Optional auth middleware - sets merchant context if available
 */
export const optionalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    try {
      // Validate token if present
      req.merchantId = token;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  // Also check for internal headers
  if (req.headers['x-merchant-id']) {
    req.merchantId = req.headers['x-merchant-id'] as string;
  }

  next();
};

/**
 * Rate limiting middleware for public endpoints
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        count: record.count,
      });

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    next();
  };
};

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime + 60000) {
      requestCounts.delete(key);
    }
  }
}, 60000);