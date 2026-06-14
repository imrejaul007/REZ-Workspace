// ==========================================
// AI Agents Service - Middleware
// ==========================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// ==========================================
// Request ID Middleware
// ==========================================

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// ==========================================
// Request Logger Middleware
// ==========================================

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = (req as any).requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

// ==========================================
// CORS Middleware
// ==========================================

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:19006',
    'exp://localhost:19000',
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-User-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

// ==========================================
// Rate Limiting Middleware
// Simple in-memory rate limiter (use Redis in production)
// ==========================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

export const rateLimitMiddleware = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { ip: key, count: entry.count });
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    entry.count++;
    next();
  };
};

// ==========================================
// Security Headers Middleware
// ==========================================

export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
};

// ==========================================
// Authentication Middleware
// ==========================================

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // In production, verify JWT token
  const internalToken = req.headers['x-internal-token'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (process.env.NODE_ENV === 'production') {
    if (!internalToken || internalToken !== process.env.INTERNAL_SERVICE_TOKEN) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }
  }

  // Set user ID (in production, extract from JWT)
  if (userId) {
    (req as any).userId = userId;
  }

  next();
};

// ==========================================
// Error Handler Middleware
// ==========================================

export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId;

  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId,
  });
};
