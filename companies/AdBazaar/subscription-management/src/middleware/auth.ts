import { Request, Response, NextFunction } from 'express';
import logger from 'utils/logger.js';

export interface AuthenticatedRequest extends Request {
  internalServiceToken?: string;
  publisherId?: string;
}

/**
 * Internal service authentication middleware
 * Validates the X-Internal-Token header for service-to-service communication
 */
export const internalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (token !== process.env.INTERNAL_SERVICE_TOKEN) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(403).json({
      success: false,
      error: 'Invalid authentication token'
    });
    return;
  }

  // Store token in request for downstream use
  req.internalServiceToken = token;
  next();
};

/**
 * Optional internal auth - doesn't fail if no token present
 */
export const optionalInternalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === process.env.INTERNAL_SERVICE_TOKEN) {
    req.internalServiceToken = token;
  }

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Log on response finish
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
};

/**
 * Rate limiting headers
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

/**
 * CORS middleware for AdBazaar services
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://adbazaar.app',
    'https://adbazaar.com'
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};