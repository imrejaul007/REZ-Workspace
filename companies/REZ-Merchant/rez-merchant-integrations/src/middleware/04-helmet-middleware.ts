/**
 * REZ Security Middleware - Helmet/Security Headers
 * Copy to: src/middleware/security.ts
 *
 * Usage in index.ts:
 *   import { securityHeaders } from './middleware/security';
 *   app.use(securityHeaders());
 */

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return helmet({
    // Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Clickjacking protection
    frameguard: {
      action: 'deny',
    },
    // XSS protection
    xssFilter: true,
    // MIME sniffing protection
    noSniff: true,
    // Referrer policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  });
}

/**
 * Request ID middleware for tracing
 * FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'] as string;
  // Use crypto for secure random ID generation
  let requestId: string;
  if (existingId) {
    requestId = existingId;
  } else {
    try {
      const { randomUUID } = require('crypto');
      requestId = `req-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 9)}`;
    } catch {
      // Fallback for environments without crypto (should not happen in Node.js)
      requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  res.setHeader('X-Request-Id', requestId);
  (req as unknown).requestId = requestId;

  next();
}
