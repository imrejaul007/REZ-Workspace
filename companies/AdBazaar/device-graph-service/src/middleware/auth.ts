import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Express Request type
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
export const internalServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  // Get allowed tokens from environment
  const allowedTokens = process.env.INTERNAL_SERVICE_TOKENS?.split(',') || [];
  const adminToken = process.env.INTERNAL_ADMIN_TOKEN;

  // Check if token is valid
  if (internalToken) {
    if (allowedTokens.includes(internalToken) || internalToken === adminToken) {
      // Extract service info from token or use default
      req.serviceAuth = {
        serviceId: req.headers['x-service-id'] as string || 'unknown',
        serviceName: req.headers['x-service-name'] as string || 'unknown',
        permissions: (req.headers['x-service-permissions'] as string)?.split(',') || ['read'],
      };

      logger.debug(`Internal service auth: ${req.serviceAuth.serviceName}`);
      next();
      return;
    }
  }

  // Check for API key authentication
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (apiKey && validApiKeys.includes(apiKey)) {
    req.serviceAuth = {
      serviceId: 'api-client',
      serviceName: 'api-client',
      permissions: ['read', 'write'],
    };
    next();
    return;
  }

  // If in development mode, allow unauthenticated access
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    req.serviceAuth = {
      serviceId: 'dev-local',
      serviceName: 'development',
      permissions: ['read', 'write', 'admin'],
    };
    next();
    return;
  }

  logger.warn(`Unauthorized access attempt from ${req.ip}`);
  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Invalid or missing authentication token',
  });
};

/**
 * API key authentication middleware
 */
export const apiKeyAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (apiKey && (validApiKeys.includes(apiKey) || apiKey === adminApiKey)) {
    next();
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Invalid API key',
  });
};

/**
 * Permission check middleware factory
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.serviceAuth) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const hasPermission = permissions.some(p =>
      req.serviceAuth!.permissions.includes(p)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Required permissions: ${permissions.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.serviceAuth?.permissions.includes('admin')) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required',
    });
    return;
  }
  next();
};

/**
 * Rate limiting middleware (simple implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > maxRequests) {
      logger.warn(`Rate limit exceeded for ${key}`);
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
      return;
    }

    next();
  };
};

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};
