/**
 * LEDGERAI - Security Middleware
 * Helmet, CORS, and security headers
 */

import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

// ============================================
// HELMET CONFIGURATION
// ============================================

export const helmetMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  // XSS Protection
  xssFilter: true,
  // Hide X-Powered-By
  hidePoweredBy: true,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Strict Transport Security (for HTTPS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // No sniffing MIME type
  noSniff: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// ============================================
// CORS CONFIGURATION
// ============================================

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Configure allowed origins here
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4815',
      // Add your production domains here
    ];

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from unauthorized origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Number',
    'X-Page-Size',
    'X-Total-Pages'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

export const corsMiddleware = cors(corsOptions);

// ============================================
// ADDITIONAL SECURITY MIDDLEWARE
// ============================================

// Prevent MIME type sniffing
export const noSniffMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

// Cache control for sensitive endpoints
export const cacheControlMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Don't cache sensitive data
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
};

// Remove X-Powered-By header (handled by helmet but as fallback)
export const removePoweredByMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Powered-By');
  next();
};

// Request size limit
export const requestSizeLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    res.status(413).json({
      success: false,
      error: 'Request entity too large',
      code: 'PAYLOAD_TOO_LARGE',
      maxSize: `${maxSize / (1024 * 1024)}MB`
    });
    return;
  }

  next();
};

// Disable iframe embedding (clickjacking protection backup)
export const frameguardMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

// XSS Protection header
export const xssProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

export default {
  helmetMiddleware,
  corsMiddleware,
  noSniffMiddleware,
  cacheControlMiddleware,
  removePoweredByMiddleware,
  requestSizeLimitMiddleware,
  frameguardMiddleware,
  xssProtectionMiddleware
};