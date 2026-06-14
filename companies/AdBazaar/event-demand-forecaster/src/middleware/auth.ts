import { Request, Response, NextFunction } from 'express';
import { logger } from 'utils/logger.js';

// Extend Express Request to include service info
declare global {
  namespace Express {
    interface Request {
      serviceId?: string;
      serviceToken?: string;
    }
  }
}

/**
 * Internal service authentication middleware
 * Validates the X-Internal-Token header for inter-service communication
 */
export function internalServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Skip auth in development if no token is set
  if (!internalToken) {
    logger.debug('Internal auth skipped - no token configured');
    next();
    return;
  }

  // Check token
  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({
      success: false,
      error: 'Unauthorized - Missing internal service token',
      code: 'MISSING_TOKEN'
    });
    return;
  }

  if (token !== internalToken) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid internal service token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  // Token is valid - extract service ID if provided
  const serviceId = req.headers['x-service-id'] as string;
  if (serviceId) {
    req.serviceId = serviceId;
  }

  next();
}

/**
 * Optional internal service auth - doesn't block if no token
 */
export function optionalInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Skip if no auth required
  if (!internalToken || !token) {
    next();
    return;
  }

  // Validate token
  if (token === internalToken) {
    const serviceId = req.headers['x-service-id'] as string;
    if (serviceId) {
      req.serviceId = serviceId;
    }
  }

  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      serviceId: req.serviceId
    });
  });

  next();
}

/**
 * CORS headers middleware
 */
export function corsHeaders(req: Request, res: Response, next: NextFunction): void {
  // Allow from any origin in development
  const origin = process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')
    : '*';

  if (origin === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && req.headers.origin && origin.includes(req.headers.origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Token, X-Service-Id');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

export default {
  internalServiceAuth,
  optionalInternalAuth,
  requestLogger,
  corsHeaders
};