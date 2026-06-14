/**
 * REZ Atlas v2 - Security Middleware
 * Helmet, CORS, Rate Limiting
 */

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
  credentials: true,
  maxAge: 86400,
});

const rateLimitOptions = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', retryAfter: 60 },
  skip: (req: Request) => req.path === '/health' || req.path === '/health/live' || req.path === '/health/ready',
};

export const rateLimitMiddleware = rateLimit(rateLimitOptions);

export const mongoSanitizeMiddleware = mongoSanitize({
  onSanitize: ({ key }) => {
    console.warn(`Attempted sanitization of key: ${key}`);
  },
});

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
};

export const securityMiddleware = [
  requestIdMiddleware,
  helmetMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  mongoSanitizeMiddleware,
];