import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  serviceToken?: string;
  isInternalCall?: boolean;
}

export function internalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    logger.warn('INTERNAL_SERVICE_TOKEN not configured');
    next();
    return;
  }

  if (token === expectedToken) {
    req.isInternalCall = true;
    req.serviceToken = token;
    next();
    return;
  }

  // Allow requests without token for health checks and basic operations
  const publicPaths = ['/health', '/api/health'];
  if (publicPaths.includes(req.path)) {
    next();
    return;
  }

  logger.warn('Unauthorized access attempt', {
    path: req.path,
    ip: req.ip
  });

  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing internal service token'
    }
  });
}

export function loggingMiddleware(
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
      duration: `${duration}ms`
    });
  });

  next();
}

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}
