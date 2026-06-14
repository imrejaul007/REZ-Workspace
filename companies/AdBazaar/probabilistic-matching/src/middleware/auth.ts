import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Internal service authentication middleware
export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Skip auth in development mode
  if (process.env.NODE_ENV === 'development' && !internalToken) {
    next();
    return;
  }

  if (!authHeader) {
    logger.warn('Missing authorization header', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  if (internalToken && token !== internalToken) {
    logger.warn('Invalid internal token', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  next();
}

// Optional auth - doesn't fail if no token
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    req.headers['x-internal-token'] = token;
  }

  next();
}

// Request validation middleware
export function validateRequest(schema: {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic validation - schemas can be added with zod
    if (schema.body && Object.keys(schema.body as object).length > 0) {
      if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({ error: 'Request body is required' });
        return;
      }
    }

    if (schema.params && Object.keys(schema.params as object).length > 0) {
      if (!req.params || Object.keys(req.params).length === 0) {
        res.status(400).json({ error: 'Request params are required' });
        return;
      }
    }

    next();
  };
}

// Rate limiting info middleware
export function rateLimitInfo(req: Request, res: Response, next: NextFunction): void {
  const clientId = req.headers['x-client-id'] as string || req.ip;
  const now = Date.now();

  // Store rate limit info in request
  req.headers['x-rate-limit-timestamp'] = now.toString();
  req.headers['x-client-id'] = clientId;

  next();
}

// CORS options for internal services
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-Id', 'X-Client-Id']
};
