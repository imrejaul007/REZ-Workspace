import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      businessId?: string;
      user?: {
        userId: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export interface AuthPayload {
  userId: string;
  email?: string;
  role?: string;
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and extracts user information
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header is required'
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token is required'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      req.userId = decoded.userId;
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token has expired'
        });
        return;
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
        return;
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Extracts user info if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      req.userId = decoded.userId;
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } catch {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Business Access Middleware
 * Ensures user has access to the requested business
 */
export const authorizeBusinessAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const businessId = req.params.id || req.params.businessId;

    if (!businessId) {
      res.status(400).json({
        success: false,
        error: 'Business ID is required'
      });
      return;
    }

    // In production, this would check if the user owns or has access to the business
    // For now, we just attach the businessId to the request
    req.businessId = businessId;
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization failed'
    });
  }
};

/**
 * Role-based Access Control Middleware
 * Checks if user has required role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Role not found.'
      });
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Rate Limiting Helper
 * Simple in-memory rate limiter for demonstration
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (
  windowMs: number = config.rateLimit.windowMs,
  maxRequests: number = config.rateLimit.maxRequests
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, record);
      next();
      return;
    }

    record.count++;

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }

    next();
  };
};

/**
 * Error Handler Middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
    return;
  }

  // Duplicate key error
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry'
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message
  });
};

/**
 * Not Found Handler Middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Request Logger Middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
};

export default {
  authenticate,
  optionalAuth,
  authorizeBusinessAccess,
  requireRole,
  rateLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger
};
