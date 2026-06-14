/**
 * Security middleware for AI Front Desk Service
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

// Set security headers using helmet
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
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
});

// Sanitize request body to prevent injection
export function sanitizeBody(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    // Remove any properties starting with $ (MongoDB operators)
    const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!key.startsWith('$')) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitize(value as Record<string, unknown>);
          } else {
            sanitized[key] = value;
          }
        }
      }
      return sanitized;
    };

    req.body = sanitize(req.body);
  }
  next();
}

// Trust proxy for correct IP detection behind load balancers
export function trustProxy(req: Request, res: Response, next: NextFunction): void {
  // Store client IP in a custom property since req.ip is read-only in Express 4.x
  const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  (req as Request & { clientIp: string }).clientIp = clientIp;
  next();
}

export default {
  helmetMiddleware,
  sanitizeBody,
  trustProxy,
};