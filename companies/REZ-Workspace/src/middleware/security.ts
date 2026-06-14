/**
 * REZ Workspace - Production Security Middleware
 *
 * Features:
 * - Helmet for secure HTTP headers
 * - Rate limiting
 * - CORS configuration
 * - Request size limits
 * - Security audit logging
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ============================================
// HELMET CONFIGURATION
// ============================================

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || 'http://localhost:3000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// ============================================
// RATE LIMITING
// ============================================

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction, options) => {
    res.status(429).json(options.message);
  },
});

// Stricter rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for login specifically
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 login attempts per hour
  message: {
    success: false,
    error: 'Too many login attempts, please try again after an hour',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter for WebSocket connections
export const wsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 connections per minute
  message: {
    success: false,
    error: 'Too many connection attempts',
  },
});

// Rate limiter for search endpoints
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    error: 'Too many search requests, please slow down',
  },
});

// ============================================
// CORS CONFIGURATION
// ============================================

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim());

    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-User-ID',
    'X-Workspace-ID',
    'X-Request-ID',
    'X-Correlation-ID',
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

// ============================================
// REQUEST VALIDATION & SANITIZATION
// ============================================

export const requestSizeLimit = '10mb'; // For document uploads

// Validate content type
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json',
      });
    }
  }
  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add custom security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Request-ID': generateRequestId(),
  });
  next();
};

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================
// AUDIT LOGGING
// ============================================

interface AuditEvent {
  timestamp: string;
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  userId?: string;
  action: string;
  statusCode: number;
  duration: number;
}

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Attach request ID to request object
  (req as any).requestId = requestId;

  // Log request start
  const auditEvent: AuditEvent = {
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    userId: (req.headers['x-user-id'] as string) || undefined,
    action: `${req.method} ${req.path}`,
    statusCode: 0,
    duration: 0,
  };

  // Log response when finished
  res.on('finish', () => {
    auditEvent.statusCode = res.statusCode;
    auditEvent.duration = Date.now() - startTime;

    // Log security-sensitive actions
    const sensitivePaths = ['/api/auth', '/api/users', '/api/admin'];
    const isSensitive = sensitivePaths.some(p => req.path.startsWith(p));

    if (isSensitive || auditEvent.statusCode >= 400) {
      console.log(JSON.stringify({
        type: 'audit',
        ...auditEvent,
        level: auditEvent.statusCode >= 500 ? 'error' : auditEvent.statusCode >= 400 ? 'warn' : 'info',
      }));
    }
  });

  next();
};

export default {
  helmetConfig,
  apiRateLimiter,
  authRateLimiter,
  loginRateLimiter,
  wsRateLimiter,
  searchRateLimiter,
  corsOptions,
  requestSizeLimit,
  validateContentType,
  securityHeaders,
  auditLogger,
};