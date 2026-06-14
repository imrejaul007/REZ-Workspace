// RisaCare Shared Middleware

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { RisaCareError, formatErrorResponse } from '../errors';
import { logger, generateRequestId } from '../utils';

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
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================
// ERROR HANDLER
// ============================================

export function errorHandler(
  error: Error | RisaCareError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';

  if (error instanceof RisaCareError) {
    logger.error(`RisaCare error: ${error.code}`, error, { requestId });
    res.status(error.statusCode).json(formatErrorResponse(error, requestId));
    return;
  }

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
      requestId: req.headers['x-request-id'],
      userId: req.headers['x-user-id'] || 'anonymous'
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
    timestamp: new Date().toISOString()
  });
}
