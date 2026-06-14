/**
 * Authentication middleware for AI Front Desk Service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    hotelId?: string;
  };
}

// Simple API key authentication for internal services
export function apiKeyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const internalToken = req.headers['x-internal-token'] as string;

  // Allow if API key is provided
  if (apiKey && apiKey === process.env.API_KEY) {
    req.user = { id: 'api-key-user', role: 'api' };
    return next();
  }

  // Allow if internal token is provided
  if (internalToken && internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
    req.user = { id: 'internal-service', role: 'service' };
    return next();
  }

  // Allow public endpoints
  const publicEndpoints = ['/health', '/api/concierge/query', '/api/concierge/welcome'];
  if (publicEndpoints.includes(req.path)) {
    return next();
  }

  logger.warn('Unauthorized access attempt', { path: req.path, ip: req.ip });
  res.status(401).json({ success: false, error: 'Unauthorized' });
}

// Role-based access control
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role', { path: req.path, userRole: req.user.role, requiredRoles: roles });
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}

// CORS middleware with configuration
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Internal-Token');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}

export default {
  apiKeyAuth,
  requireRole,
  requestLogger,
  corsMiddleware,
};