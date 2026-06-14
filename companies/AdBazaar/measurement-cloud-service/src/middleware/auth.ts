import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Internal service authentication middleware
export const internalServiceAuth = (allowedServices?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const internalToken = req.headers['x-internal-token'] as string;
    const serviceName = req.headers['x-service-name'] as string;

    // Check for internal service token
    if (internalToken) {
      const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

      if (!expectedToken) {
        logger.warn('Internal service token not configured');
        return res.status(500).json({
          error: 'Internal service authentication not configured'
        });
      }

      if (internalToken !== expectedToken) {
        logger.warn('Invalid internal service token', {
          serviceName,
          ip: req.ip
        });
        return res.status(401).json({
          error: 'Invalid internal service token'
        });
      }

      // Check if service is allowed
      if (allowedServices && serviceName && !allowedServices.includes(serviceName)) {
        logger.warn('Service not in allowed list', {
          serviceName,
          allowedServices
        });
        return res.status(403).json({
          error: 'Service not authorized'
        });
      }

      // Attach service info to request
      (req as any).serviceAuth = {
        authenticated: true,
        serviceName: serviceName || 'unknown'
      };

      return next();
    }

    // Fall back to API key authentication for external access
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
      const expectedApiKey = process.env.MEASUREMENT_API_KEY;

      if (!expectedApiKey) {
        logger.warn('API key not configured');
        return res.status(500).json({
          error: 'API authentication not configured'
        });
      }

      if (apiKey !== expectedApiKey) {
        logger.warn('Invalid API key', {
          ip: req.ip
        });
        return res.status(401).json({
          error: 'Invalid API key'
        });
      }

      (req as any).apiAuth = {
        authenticated: true,
        type: 'api_key'
      };

      return next();
    }

    // No authentication provided
    logger.warn('Authentication required', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    return res.status(401).json({
      error: 'Authentication required',
      message: 'Provide X-Internal-Token header for internal services or X-API-Key for external access'
    });
  };
};

// Optional auth middleware - doesn't fail if no auth provided
export const optionalAuth = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const internalToken = req.headers['x-internal-token'] as string;
    const apiKey = req.headers['x-api-key'] as string;
    const serviceName = req.headers['x-service-name'] as string;

    if (internalToken) {
      const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;
      if (expectedToken && internalToken === expectedToken) {
        (req as any).serviceAuth = {
          authenticated: true,
          serviceName: serviceName || 'unknown'
        };
      }
    }

    if (apiKey) {
      const expectedApiKey = process.env.MEASUREMENT_API_KEY;
      if (expectedApiKey && apiKey === expectedApiKey) {
        (req as any).apiAuth = {
          authenticated: true,
          type: 'api_key'
        };
      }
    }

    next();
  };
};

// Rate limiting for internal services
export const serviceRateLimit = (maxRequests: number = 1000, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.headers['x-service-name'] as string) || req.ip || 'unknown';
    const now = Date.now();

    let record = requests.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      requests.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        serviceName: key,
        count: record.count,
        limit: maxRequests
      });

      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const serviceName = (req as any).serviceAuth?.serviceName || 'external';

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      serviceName,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  });

  next();
};

export default {
  internalServiceAuth,
  optionalAuth,
  serviceRateLimit,
  requestLogger
};