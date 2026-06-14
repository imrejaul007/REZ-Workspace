import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// Internal service authentication
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'adbazaar-identity-internal-token';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const apiKey = req.headers['x-api-key'] as string;

  // Allow requests with valid internal token
  if (token && token === INTERNAL_SERVICE_TOKEN) {
    logger.debug('Request authenticated via internal token', {
      path: req.path,
      ip: req.ip
    });
    next();
    return;
  }

  // Allow requests with valid API key
  if (apiKey && isValidApiKey(apiKey)) {
    logger.debug('Request authenticated via API key', {
      path: req.path,
      ip: req.ip
    });
    next();
    return;
  }

  // For health check and metrics, allow unauthenticated access
  if (req.path === '/health' || req.path === '/metrics') {
    next();
    return;
  }

  logger.warn('Authentication failed', {
    path: req.path,
    ip: req.ip,
    hasToken: !!token,
    hasApiKey: !!apiKey
  });

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid or missing authentication credentials'
  });
}

function isValidApiKey(apiKey: string): boolean {
  // In production, validate against a database of valid API keys
  // For now, accept any non-empty key that starts with 'adb_'
  return apiKey.startsWith('adb_') && apiKey.length >= 20;
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // Always allow the request but log if not authenticated
  if (!req.headers['x-internal-token'] && !req.headers['x-api-key']) {
    logger.debug('Request without authentication (optional auth)', {
      path: req.path,
      ip: req.ip
    });
  }
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.headers['x-user-role'] as string;

    if (userRole !== role) {
      logger.warn('Role check failed', {
        path: req.path,
        userRole,
        requiredRole: role
      });

      res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${role}`
      });
      return;
    }

    next();
  };
}

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = requests.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requests.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: key,
        count: record.count,
        limit: maxRequests
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }

    next();
  };
}

// Cleanup old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requests.entries()) {
    if (now > record.resetTime) {
      requests.delete(key);
    }
  }
}, 60000); // Every minute