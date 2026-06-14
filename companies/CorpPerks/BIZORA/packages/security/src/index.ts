/**
 * BIZORA Security Middleware
 * Production-ready security features
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// ============================================================================
// Security Headers (Helmet)
// ============================================================================

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ============================================================================
// CORS Configuration
// ============================================================================

export const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
});

// ============================================================================
// Rate Limiting
// ============================================================================

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per minute
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'), // 5 attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many password reset attempts',
    code: 'PASSWORD_RESET_LIMIT_EXCEEDED',
    retryAfter: 3600,
  },
});

// Limiter for OTP
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Too many OTP requests',
    code: 'OTP_LIMIT_EXCEEDED',
    retryAfter: 3600,
  },
});

// ============================================================================
// Request Validation
// ============================================================================

import { z, ZodSchema } from 'zod';
import { ZodError } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// ============================================================================
// Input Sanitization
// ============================================================================

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  // Remove null bytes
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query) as typeof req.query;
  }
  if (req.params) {
    req.params = sanitizeObject(req.params) as typeof req.params;
  }
  next();
}

function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    // Remove null bytes and trim
    return obj.replace(/\0/g, '').trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result;
  }
  return obj;
}

// ============================================================================
// Authentication Middleware
// ============================================================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthUser {
  userId: string;
  email: string;
  type: string;
}

export function authMiddleware(requiredPermissions?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
      }

      const token = authHeader.slice(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & { permissions?: string[] };
        (req as Request & { user?: AuthUser }).user = {
          userId: decoded.userId,
          email: decoded.email,
          type: decoded.type,
        };

        // Check permissions if required
        if (requiredPermissions && decoded.permissions) {
          const hasPermission = requiredPermissions.some(p =>
            decoded.permissions?.includes(p)
          );
          if (!hasPermission) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              code: 'FORBIDDEN',
            });
          }
        }

        next();
      } catch (jwtError) {
        if (jwtError instanceof jwt.TokenExpiredError) {
          return res.status(401).json({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED',
          });
        }
        return res.status(401).json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }
    } catch (error) {
      next(error);
    }
  };
}

// Optional auth - doesn't fail if no token
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        (req as Request & { user?: AuthUser }).user = {
          userId: decoded.userId,
          email: decoded.email,
          type: decoded.type,
        };
      } catch {
        // Ignore invalid tokens for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// Error Handler
// ============================================================================

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('[Error]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: isProduction ? undefined : err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { message: err.message }),
  });
}

// ============================================================================
// Request ID
// ============================================================================

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id'] as string || generateRequestId();
  (req as Request & { requestId?: string }).requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Timeout Handler
// ============================================================================

export function timeoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000');

  // Set timeout
  req.setTimeout(timeout, () => {
    logger.warn(`[Timeout] Request timeout: ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        code: 'REQUEST_TIMEOUT',
      });
    }
  });

  next();
}

// ============================================================================
// IP Allowlist (for admin routes)
// ============================================================================

const ADMIN_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];

export function ipAllowlist(allowedIps: string[] = ADMIN_IPS) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (allowedIps.length === 0) {
      return next();
    }

    const clientIp = req.ip || req.headers['x-forwarded-for']?.toString();

    if (!clientIp || !allowedIps.includes(clientIp)) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}
