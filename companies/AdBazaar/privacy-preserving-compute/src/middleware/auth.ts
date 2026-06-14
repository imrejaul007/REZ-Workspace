import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger, securityLogger } from '../utils/logger.js';

/**
 * Internal service authentication middleware
 * Validates the X-Internal-Token header for inter-service communication
 */
export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const internalToken = config.security.internalToken;

  // Skip auth in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Check if token is provided
  if (!token) {
    securityLogger.warn('Missing internal token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing internal service token',
    });
    return;
  }

  // Validate token
  if (token !== internalToken) {
    securityLogger.warn('Invalid internal token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid internal service token',
    });
    return;
  }

  next();
}

/**
 * Optional internal auth - continues even if no token provided
 */
export function optionalInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const internalToken = config.security.internalToken;

  if (token && token === internalToken) {
    (req as Request & { internalService: boolean }).internalService = true;
  }

  next();
}

/**
 * API key validation middleware
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  // Skip auth in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // If no API key is configured, skip validation
  if (!validApiKey) {
    return next();
  }

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing API key',
    });
    return;
  }

  if (apiKey !== validApiKey) {
    securityLogger.warn('Invalid API key', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
    return;
  }

  next();
}

/**
 * Rate limiting middleware for internal services
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000): (
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitMap.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      securityLogger.warn('Rate limit exceeded', {
        ip: key,
        count: record.count,
        limit: maxRequests,
      });

      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

export default internalAuth;