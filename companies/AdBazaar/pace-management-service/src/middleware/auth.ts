import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Extend Express Request to include service auth
declare global {
  namespace Express {
    interface Request {
      serviceAuth?: {
        serviceId: string;
        serviceName: string;
        permissions: string[];
      };
    }
  }
}

/**
 * Internal service authentication middleware
 * Validates the X-Internal-Token header for inter-service communication
 */
export function internalServiceAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Skip auth in development if no token is configured
  if (!expectedToken && process.env.NODE_ENV !== 'production') {
    logger.debug('Skipping auth in development mode');
    next();
    return;
  }

  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing internal service token'
    });
    return;
  }

  if (token !== expectedToken) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      ip: req.ip
    });
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid internal service token'
    });
    return;
  }

  // Add service auth info to request
  req.serviceAuth = {
    serviceId: 'internal-service',
    serviceName: 'Internal Service',
    permissions: ['read', 'write', 'admin']
  };

  next();
}

/**
 * Optional internal service auth - sets service info if valid token provided
 */
export function optionalInternalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (token && token === expectedToken) {
    req.serviceAuth = {
      serviceId: 'internal-service',
      serviceName: 'Internal Service',
      permissions: ['read', 'write', 'admin']
    };
  }

  next();
}

/**
 * API Key authentication for external clients
 */
export function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('Missing API key', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing API key'
    });
    return;
  }

  // In production, validate against API key database
  // For now, we'll use a simple check
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key', {
      path: req.path,
      ip: req.ip
    });
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid API key'
    });
    return;
  }

  next();
}

/**
 * Rate limiting middleware for internal services
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function internalRateLimit(
  limit: number = 1000,
  windowMs: number = 60000
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.serviceAuth?.serviceId || req.ip || 'unknown';
    const now = Date.now();

    const record = rateLimitMap.get(key);

    if (record && record.resetTime > now) {
      record.count++;

      if (record.count > limit) {
        logger.warn('Rate limit exceeded', { serviceId: key, count: record.count });
        res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded for internal service',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
        return;
      }
    } else {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
    }

    next();
  };
}

/**
 * Permission check middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.serviceAuth) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Service authentication required'
      });
      return;
    }

    if (!req.serviceAuth.permissions.includes(permission)) {
      logger.warn('Permission denied', {
        serviceId: req.serviceAuth.serviceId,
        requiredPermission: permission
      });
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Permission '${permission}' required`
      });
      return;
    }

    next();
  };
}

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  });
}

export default {
  internalServiceAuth,
  optionalInternalAuth,
  apiKeyAuth,
  internalRateLimit,
  requirePermission,
  requestLogger,
  errorHandler
};