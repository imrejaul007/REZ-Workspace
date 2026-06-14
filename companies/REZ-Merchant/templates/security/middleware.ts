// ================================================
// REZ-Merchant Security Middleware Template
// Standardized security for all services
// ================================================

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { Request, Response, NextFunction } from 'express';

// ================================================
// Helmet Configuration
// ================================================
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
});

// ================================================
// CORS Configuration
// ================================================
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // In production, strict origin check
    if (process.env.NODE_ENV === 'production') {
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }

    // In development, allow localhost
    if (origin.includes('localhost')) {
      return callback(null, true);
    }

    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours
});

// ================================================
// Rate Limiting Configuration
// ================================================
const rateLimitOptions = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60,
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/health/live';
  },
};

export const rateLimitMiddleware = rateLimit(rateLimitOptions);

// Stricter rate limiting for authentication endpoints
export const authRateLimitMiddleware = rateLimit({
  ...rateLimitOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900,
  },
});

// ================================================
// MongoDB Sanitization
// ================================================
export const mongoSanitizeMiddleware = mongoSanitize({
  onSanitize: ({ key }) => {
    console.warn(`Attempted sanitization of key: ${key}`);
  },
});

// ================================================
// Request ID Middleware
// ================================================
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
};

// ================================================
// Security Headers Middleware
// ================================================
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// ================================================
// Utility Functions
// ================================================
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// ================================================
// Security Logger Middleware
// ================================================
export const securityLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const suspicious = checkSuspiciousActivity(req);

    if (suspicious || res.statusCode >= 400) {
      console.warn('Security event:', {
        requestId: (req as any).requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
        duration,
        suspicious,
      });
    }
  });

  next();
};

// ================================================
// Suspicious Activity Detection
// ================================================
function checkSuspiciousActivity(req: Request): boolean {
  const path = req.path.toLowerCase();
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /<script/i,       // XSS
    /union.*select/i, // SQL injection
    /eval/i,          // Code injection
    /exec/i,          // Command injection
  ];

  // Check path
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path)) return true;
  }

  // Check query params
  const queryStr = JSON.stringify(req.query);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(queryStr)) return true;
  }

  // Check body
  const bodyStr = JSON.stringify(req.body);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(bodyStr)) return true;
  }

  return false;
}

// ================================================
// Complete Security Middleware Stack
// ================================================
export const securityMiddleware = [
  requestIdMiddleware,
  helmetMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  mongoSanitizeMiddleware,
  securityHeadersMiddleware,
  securityLoggerMiddleware,
];

export default securityMiddleware;