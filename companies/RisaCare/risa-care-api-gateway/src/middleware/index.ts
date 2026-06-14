// RisaCare API Gateway - Middleware

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { verifyUserToken } from '../../../integrations/rabtul';
import { RisaCareError, formatErrorResponse } from '@risa-care/shared/errors';
import { logger, generateRequestId } from '@risa-care/shared/utils';

// ============================================
// REQUEST ID
// ============================================

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// ============================================
// SECURITY HEADERS
// ============================================

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
});

// ============================================
// CORS
// ============================================

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://risa.money',
      'https://app.risa.money'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Profile-Id']
});

// ============================================
// COMPRESSION
// ============================================

export const compressionMiddleware = compression();

// ============================================
// RATE LIMITING
// ============================================

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false
});

export const recordUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many uploads' } }
});

export const aiInterpretationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many AI requests' } }
});

export const symptomQueryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many symptom queries' } }
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many booking requests' } }
});

// ============================================
// AUTHENTICATION
// ============================================

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      profileId?: string;
      requestId?: string;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
          requestId: req.requestId
        }
      });
      return;
    }

    const token = authHeader.substring(7);
    const user = await verifyUserToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          requestId: req.requestId
        }
      });
      return;
    }

    req.userId = user.userId;

    // Support profile switching via header
    const profileIdHeader = req.headers['x-profile-id'] as string;
    if (profileIdHeader) {
      req.profileId = profileIdHeader;
    }

    next();
  } catch (error) {
    logger.error('Authentication failed', error as Error, { requestId: req.requestId });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Authentication failed',
        requestId: req.requestId
      }
    });
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = await verifyUserToken(token);
    if (user) {
      req.userId = user.userId;
    }
  }

  const profileIdHeader = req.headers['x-profile-id'] as string;
  if (profileIdHeader) {
    req.profileId = profileIdHeader;
  }

  next();
}

// ============================================
// VALIDATION
// ============================================

import { z, ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: { errors },
            requestId: req.requestId
          }
        });
        return;
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query validation failed',
            details: { errors },
            requestId: req.requestId
          }
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================
// ERROR HANDLER
// ============================================

export function errorHandler(
  error: Error | RisaCareError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';

  if (error instanceof RisaCareError) {
    logger.error(`RisaCare error: ${error.code}`, error, { requestId });
    res.status(error.statusCode).json(formatErrorResponse(error, requestId));
    return;
  }

  // Unexpected errors
  logger.error('Unexpected error', error, { requestId });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId
    }
  });
}

// ============================================
// LOGGING
// ============================================

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
      userId: req.userId || 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} ${res.statusCode}`, logData);
    } else {
      logger.info(`${req.method} ${req.path} ${res.statusCode}`, logData);
    }
  });

  next();
}

// ============================================
// HEALTH CHECK
// ============================================

export function healthCheck(req: Request, res: Response): void {
  res.json({
    status: 'healthy',
    service: 'risa-care-api-gateway',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0'
  });
}
