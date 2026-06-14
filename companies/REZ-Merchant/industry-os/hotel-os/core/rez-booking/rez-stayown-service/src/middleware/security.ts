import { logger } from '../../shared/logger';
/**
 * SECURITY MIDDLEWARE FOR HOTEL ECOSYSTEM
 * Rate limiting, Helmet headers, CORS, etc.
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================================
// HELMET SECURITY HEADERS
// ============================================

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://api.rez.com", "https://api.stayown.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// ============================================
// CORS CONFIGURATION
// ============================================

export const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
});

// ============================================
// RATE LIMITING
// ============================================

// General API rate limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

// Strict rate limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment rate limit (stricter)
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment attempts per minute
  message: {
    success: false,
    error: {
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many payment attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Booking rate limit
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 booking attempts per minute
  message: {
    success: false,
    error: {
      code: 'BOOKING_RATE_LIMIT_EXCEEDED',
      message: 'Too many booking attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limit (more lenient)
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  message: {
    success: false,
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Message rate limit
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    error: {
      code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
      message: 'Too many messages, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// WEBHOOK VERIFICATION
// ============================================

export function verifyRazorpayWebhook(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_SIGNATURE',
        message: 'Webhook signature is required',
      },
    });
    return;
  }

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature',
        },
      });
      return;
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SIGNATURE_VERIFICATION_FAILED',
        message: 'Webhook signature verification failed',
      },
    });
    return;
  }

  next();
}

// ============================================
// INTERNAL SERVICE AUTH
// ============================================

export function verifyInternalToken(req: Request, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    // If no internal token configured, allow all (for development)
    logger.warn('INTERNAL_SERVICE_TOKEN not configured - allowing all requests');
    next();
    return;
  }

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Internal service token is required',
      },
    });
    return;
  }

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(internalToken),
      Buffer.from(expectedToken)
    );

    if (!isValid) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid internal service token',
        },
      });
      return;
    }
  } catch (error) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TOKEN_VERIFICATION_FAILED',
        message: 'Internal token verification failed',
      },
    });
    return;
  }

  next();
}

// ============================================
// INPUT SANITIZATION
// ============================================

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potential XSS patterns
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// ============================================
// REQUEST ID
// ============================================

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers['x-request-id'] as string || crypto.randomUUID();
  (req as any).requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

// ============================================
// ERROR HANDLER
// ============================================

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req as any).requestId || 'unknown';

  logger.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      requestId,
    },
  });
}
