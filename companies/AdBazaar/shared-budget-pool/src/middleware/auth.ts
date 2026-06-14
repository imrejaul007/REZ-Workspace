import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  organizationId?: string;
  serviceId?: string;
  isInternal?: boolean;
}

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'adbazaar-internal-token';

export const internalServiceAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;
  const serviceId = req.headers['x-service-id'] as string;

  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(401).json({
      success: false,
      error: 'Missing internal service token',
      code: 'MISSING_TOKEN',
    });
    return;
  }

  if (token !== INTERNAL_SERVICE_TOKEN) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(403).json({
      success: false,
      error: 'Invalid internal service token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  req.isInternal = true;
  req.serviceId = serviceId || 'unknown';

  logger.debug('Internal service authenticated', {
    serviceId: req.serviceId,
    path: req.path,
  });

  next();
};

export const optionalInternalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === INTERNAL_SERVICE_TOKEN) {
    req.isInternal = true;
    req.serviceId = req.headers['x-service-id'] as string || 'unknown';
  }

  next();
};

export const requestLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      serviceId: req.serviceId,
      ip: req.ip,
    });
  });

  next();
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  const statusCode = (err as any).statusCode || 500;
  const code = (err as any).code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    code,
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
};

export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('application/json')) {
      res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json',
        code: 'UNSUPPORTED_MEDIA_TYPE',
      });
      return;
    }
  }

  next();
};

export const rateLimitHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.set({
    'X-RateLimit-Limit': '1000',
    'X-RateLimit-Remaining': '999',
    'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + 60,
  });

  next();
};