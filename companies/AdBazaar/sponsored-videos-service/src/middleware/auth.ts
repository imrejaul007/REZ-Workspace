import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  serviceAuth?: {
    serviceId: string;
    serviceName: string;
    authenticated: boolean;
  };
}

/**
 * Internal service authentication middleware
 */
export function internalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers['x-internal-token'] as string;
  const serviceId = req.headers['x-service-id'] as string;

  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      ip: req.ip,
    });
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Internal service token is required',
      },
    });
  }

  if (token !== config.auth.internalToken) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      ip: req.ip,
      serviceId,
    });
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid internal service token',
      },
    });
  }

  // Set service auth info
  req.serviceAuth = {
    serviceId: serviceId || 'unknown',
    serviceName: 'sponsored-videos-service',
    authenticated: true,
  };

  next();
}

/**
 * Optional internal auth - doesn't fail if no token
 */
export function optionalInternalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers['x-internal-token'] as string;
  const serviceId = req.headers['x-service-id'] as string;

  if (token && token === config.auth.internalToken) {
    req.serviceAuth = {
      serviceId: serviceId || 'unknown',
      serviceName: 'sponsored-videos-service',
      authenticated: true,
    };
  }

  next();
}

/**
 * Request ID middleware
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Error handler middleware
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || 'unknown';

  logger.error('Request error', {
    requestId,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

/**
 * Rate limiting info middleware
 */
export function rateLimitInfo(req: Request, res: Response, next: NextFunction) {
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', '1000');
  res.setHeader('X-RateLimit-Remaining', '999');
  res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);
  next();
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export default {
  internalAuth,
  optionalInternalAuth,
  requestId,
  errorHandler,
  notFoundHandler,
  rateLimitInfo,
};