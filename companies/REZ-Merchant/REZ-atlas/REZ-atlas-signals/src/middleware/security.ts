// ================================================
// REZ Atlas Signals - Security Middleware
// ================================================

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { Request, Response, NextFunction } from 'express';

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
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
});

const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production') {
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    }
    if (origin.includes('localhost')) return callback(null, true);
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
  credentials: true,
  maxAge: 86400,
});

const rateLimitOptions = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', retryAfter: 60 },
  skip: (req: Request) => req.path === '/health' || req.path === '/health/live',
};

export const rateLimitMiddleware = rateLimit(rateLimitOptions);

export const mongoSanitizeMiddleware = mongoSanitize({
  onSanitize: ({ key }) => console.warn(`Attempted sanitization of key: ${key}`),
});

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
};

export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export const securityLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.warn('Security event:', {
        requestId: (req as any).requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      });
    }
  });
  next();
};

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
