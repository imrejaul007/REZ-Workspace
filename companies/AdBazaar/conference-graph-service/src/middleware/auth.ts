import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';

export interface AuthenticatedRequest extends Request {
  serviceId?: string;
  isInternalService?: boolean;
}

// Internal service authentication middleware
export const internalServiceAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const serviceToken = req.headers['x-service-token'] as string;
  const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token-dev';

  // Allow requests with valid service token
  if (serviceToken === internalServiceToken) {
    req.isInternalService = true;
    req.serviceId = req.headers['x-service-id'] as string || 'unknown';
    next();
    return;
  }

  // Allow requests with Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === internalServiceToken || token.startsWith('sk-')) {
      req.isInternalService = true;
      req.serviceId = req.headers['x-service-id'] as string || 'external';
      next();
      return;
    }
  }

  // In development, allow requests without auth
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_AUTH === 'true') {
    req.isInternalService = true;
    req.serviceId = 'dev-local';
    next();
    return;
  }

  logger.warn('Unauthorized access attempt', {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Valid service authentication required'
  });
};

// Optional auth - doesn't block if no auth, but sets flags if present
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const serviceToken = req.headers['x-service-token'] as string;
  const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token-dev';

  if (serviceToken === internalServiceToken || (authHeader && authHeader.startsWith('Bearer '))) {
    req.isInternalService = true;
    req.serviceId = req.headers['x-service-id'] as string || 'unknown';
  }

  next();
};

// Rate limiting helper for internal services
export const serviceRateLimit = (maxRequests: number = 1000, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const serviceId = req.serviceId || req.ip || 'unknown';
    const now = Date.now();

    let serviceData = requests.get(serviceId);

    if (!serviceData || now > serviceData.resetTime) {
      serviceData = { count: 0, resetTime: now + windowMs };
      requests.set(serviceId, serviceData);
    }

    serviceData.count++;

    if (serviceData.count > maxRequests) {
      logger.warn('Rate limit exceeded', { serviceId, count: serviceData.count });
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil((serviceData.resetTime - now) / 1000)
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - serviceData.count).toString());
    res.setHeader('X-RateLimit-Reset', serviceData.resetTime.toString());

    next();
  };
};

export default {
  internalServiceAuth,
  optionalAuth,
  serviceRateLimit
};