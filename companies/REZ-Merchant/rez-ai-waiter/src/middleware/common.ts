import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../config/logger';

// Correlation ID middleware
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string ||
                        req.headers['x-request-id'] as string ||
                        generateCorrelationId();
  res.setHeader('X-Correlation-ID', correlationId);
  req.headers['x-correlation-id'] = correlationId;
  next();
};

function generateCorrelationId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      correlationId: req.headers['x-correlation-id'],
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Error handler middleware
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.nodeEnv === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

// Auth middleware (simplified for demo)
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token && req.path.startsWith('/api/')) {
    // For demo purposes, allow unauthenticated access
    // In production, implement proper JWT verification
    (req as any).userId = 'demo-user';
    return next();
  }

  if (token) {
    // Simplified token verification - in production use proper JWT
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString());
      (req as any).userId = payload.userId || payload.sub;
    } catch {
      (req as any).userId = 'demo-user';
    }
  }

  next();
};
