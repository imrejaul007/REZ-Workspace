import { Request, Response, NextFunction } from 'express';
import { logger } from 'utils/logger.js';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';
const ALLOWED_SERVICE_IDS = (process.env.ALLOWED_SERVICE_IDS || '').split(',').filter(Boolean);

/**
 * Authentication middleware for internal service-to-service communication
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const serviceId = req.headers['x-service-id'] as string;

  // Skip auth for health and metrics endpoints
  if (req.path === '/health' || req.path === '/metrics') {
    next();
    return;
  }

  // Validate internal token
  if (!token || token !== INTERNAL_SERVICE_TOKEN) {
    logger.warn('Unauthorized access attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      serviceId
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing internal service token'
    });
    return;
  }

  // Validate service ID if specified
  if (ALLOWED_SERVICE_IDS.length > 0 && serviceId && !ALLOWED_SERVICE_IDS.includes(serviceId)) {
    logger.warn('Access denied for service', {
      path: req.path,
      serviceId,
      allowedServices: ALLOWED_SERVICE_IDS
    });

    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Service not authorized to access this resource'
    });
    return;
  }

  // Attach service info to request
  (req as any).serviceId = serviceId || 'unknown';

  logger.debug('Service authenticated', {
    serviceId,
    path: req.path
  });

  next();
}

/**
 * Optional auth middleware - continues even if auth fails
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const serviceId = req.headers['x-service-id'] as string;

  if (token && token === INTERNAL_SERVICE_TOKEN) {
    (req as any).authenticated = true;
    (req as any).serviceId = serviceId || 'unknown';
  }

  next();
}

/**
 * Rate limiting middleware for consent operations
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.headers['x-internal-token'] as string || req.ip || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        key,
        count: record.count,
        limit: maxRequests
      });

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit of ${maxRequests} requests per ${windowMs / 1000}s exceeded`,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };
}
