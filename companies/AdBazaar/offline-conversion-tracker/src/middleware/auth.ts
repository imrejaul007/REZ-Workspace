import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';

export interface ServiceAuthConfig {
  allowedServices: string[];
  internalToken: string;
}

const config: ServiceAuthConfig = {
  allowedServices: [
    'adbazaar-backend',
    'adbazaar-api-gateway',
    'adbazaar-analytics',
    'hojai-intelligence',
    'rez-intent-graph',
    'rez-notification-service'
  ],
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'adbazaar-internal-token-2024'
};

/**
 * Internal service authentication middleware
 */
export const serviceAuth = (req: Request, res: Response, next: NextFunction): void => {
  const serviceToken = req.headers['x-service-token'] as string;
  const internalToken = req.headers['x-internal-token'] as string;

  // Check for internal token
  if (internalToken && internalToken === config.internalToken) {
    (req as any).serviceAuth = {
      type: 'internal',
      service: 'internal'
    };
    next();
    return;
  }

  // Check for service token
  if (serviceToken) {
    // In production, validate the token against a service registry
    const isValidService = config.allowedServices.some(service => {
      const expectedToken = generateServiceToken(service);
      return serviceToken === expectedToken;
    });

    if (isValidService) {
      const service = config.allowedServices.find(s => serviceToken === generateServiceToken(s));
      (req as any).serviceAuth = {
        type: 'service',
        service
      };
      next();
      return;
    }
  }

  logger.warn('Unauthorized service access attempt', {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Invalid or missing service authentication'
  });
};

/**
 * Optional service auth - allows unauthenticated requests but logs them
 */
export const optionalServiceAuth = (req: Request, res: Response, next: NextFunction): void => {
  const serviceToken = req.headers['x-service-token'] as string;
  const internalToken = req.headers['x-internal-token'] as string;

  if (internalToken === config.internalToken || serviceToken) {
    serviceAuth(req, res, next);
  } else {
    (req as any).serviceAuth = null;
    next();
  }
};

/**
 * API key authentication for external clients
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API key required'
    });
    return;
  }

  // In production, validate against stored API keys
  const isValid = validateApiKey(apiKey);

  if (!isValid) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
    return;
  }

  (req as any).apiKeyAuth = true;
  next();
};

/**
 * Rate limiting middleware for internal services
 */
export const rateLimit = (maxRequests: number = 1000, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();

    let requestData = requests.get(identifier);

    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + windowMs
      };
      requests.set(identifier, requestData);
    }

    requestData.count++;

    if (requestData.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        count: requestData.count
      });

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - requestData.count).toString());
    res.setHeader('X-RateLimit-Reset', requestData.resetTime.toString());

    next();
  };
};

/**
 * Generate service token
 */
function generateServiceToken(service: string): string {
  // In production, use proper JWT or signed tokens
  const secret = process.env.SERVICE_TOKEN_SECRET || 'adbazaar-service-secret';
  return Buffer.from(`${service}:${secret}`).toString('base64');
}

/**
 * Validate API key
 */
function validateApiKey(apiKey: string): boolean {
  // In production, validate against database or cache
  const validKeys = (process.env.VALID_API_KEYS || '').split(',');
  return validKeys.includes(apiKey);
}

/**
 * CORS middleware for cross-origin requests
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',');

  const origin = req.headers.origin;

  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Service-Token, X-Internal-Token, X-API-Key');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
};

export default {
  serviceAuth,
  optionalServiceAuth,
  apiKeyAuth,
  rateLimit,
  corsMiddleware,
  requestLogger
};