import { Request, Response, NextFunction } from 'express';
import { logger } from 'utils/logger.js';

// Extend Express Request to include service auth info
export interface ServiceAuthRequest extends Request {
  serviceId?: string;
  serviceName?: string;
  internalToken?: string;
}

// Middleware to verify internal service authentication
export const internalServiceAuth = (
  req: ServiceAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceId = req.headers['x-service-id'] as string;
  const serviceName = req.headers['x-service-name'] as string;

  // In production, validate against a service registry or auth service
  // For now, we'll check if the token exists and matches expected format
  if (!internalToken) {
    logger.warn('Missing internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing internal service token'
    });
    return;
  }

  // Validate token format (simple check for demo)
  // In production, use proper JWT or token validation
  if (internalToken.length < 32) {
    logger.warn('Invalid internal service token format', {
      path: req.path,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid token format'
    });
    return;
  }

  // Attach service info to request
  req.serviceId = serviceId || 'unknown';
  req.serviceName = serviceName || 'unknown-service';
  req.internalToken = internalToken;

  logger.debug('Internal service authenticated', {
    serviceId: req.serviceId,
    serviceName: req.serviceName,
    path: req.path
  });

  next();
};

// Middleware for optional auth (doesn't fail if no token)
export const optionalServiceAuth = (
  req: ServiceAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (internalToken && internalToken.length >= 32) {
    req.serviceId = req.headers['x-service-id'] as string || 'unknown';
    req.serviceName = req.headers['x-service-name'] as string || 'unknown-service';
    req.internalToken = internalToken;
  }

  next();
};

// Rate limiting middleware placeholder
export const rateLimiter = (
  maxRequests: number = 1000,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // In production, implement with Redis
    // For now, allow all requests
    next();
  };
};

// Request validation middleware
export const validateRequest = (schema: unknown) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // In production, use Zod or Joi for validation
    // For now, allow all requests
    next();
  };
};

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
};

// Request logging middleware
export const requestLogger = (
  req: ServiceAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      serviceId: req.serviceId
    });
  });

  next();
};

// CORS middleware
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Internal-Token, X-Service-Id, X-Service-Name');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};