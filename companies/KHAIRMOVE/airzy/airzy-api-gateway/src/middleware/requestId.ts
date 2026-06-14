import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Request ID middleware - adds unique request ID to each request
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Add request ID to logger context
  logger.addMeta('requestId', requestId);

  next();
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  req.startTime = startTime;

  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.sub
    });
  });

  next();
};

// Content type validation middleware
export const validateContentType = (
  allowedTypes: string[] = ['application/json']
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type']?.split(';')[0];

      if (!contentType || !allowedTypes.includes(contentType)) {
        return res.status(415).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_MEDIA_TYPE',
            message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
          },
          meta: {
            requestId: req.requestId,
            timestamp: Date.now()
          }
        });
      }
    }

    next();
  };
};

// CORS headers middleware
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // CORS headers are handled by the cors package, but we can add custom ones here
  res.setHeader('X-Response-Time', 'milliseconds');

  next();
};

export default {
  requestId,
  requestLogger,
  validateContentType,
  corsMiddleware
};