import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      staffId?: string;
      staffName?: string;
      isInternal?: boolean;
    }
  }
}

/**
 * JWT Authentication middleware
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        staffId?: string;
        staffName?: string;
      };

      req.userId = decoded.userId;
      req.staffId = decoded.staffId;
      req.staffName = decoded.staffName;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Internal service authentication middleware
 * Used for service-to-service communication
 */
export const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const internalToken = req.headers['x-internal-token'] as string;

    if (!internalToken) {
      res.status(401).json({
        success: false,
        error: 'No internal token provided',
      });
      return;
    }

    // Check if token matches any registered service token
    const isValid = Object.values(config.internalTokens).includes(internalToken);

    if (!isValid) {
      res.status(403).json({
        success: false,
        error: 'Invalid internal token',
      });
      return;
    }

    req.isInternal = true;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal authentication error',
    });
  }
};

/**
 * Combined auth middleware - accepts either JWT or internal token
 */
export const combinedAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (internalToken) {
    // Use internal auth
    internalAuthMiddleware(req, res, next);
  } else {
    // Use JWT auth
    authMiddleware(req, res, next);
  }
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis-based rate limiting
 */
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
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    record.count++;
    next();
  };
};

/**
 * Validation error formatter
 */
export const formatValidationErrors = (errors: unknown[]): string => {
  return errors
    .map((e) => `${e.path.join('.')}: ${e.msg}`)
    .join(', ');
};
