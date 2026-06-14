import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

// Internal service token authentication
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const internalToken = config.auth.internalToken;

  // Skip auth for health and metrics endpoints
  if (req.path === '/health' || req.path === '/metrics') {
    next();
    return;
  }

  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Validate internal service token
    if (internalToken && token === internalToken) {
      req.userId = 'internal-service';
      req.userRole = 'service';
      next();
      return;
    }

    // Here you could add JWT validation if needed
    // For now, we'll use internal token only
    logger.warn('Invalid token provided', {
      path: req.path,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
    return;
  }

  // If no auth header provided but internal token is not required (development mode)
  if (!internalToken && config.server.env === 'development') {
    req.userId = 'dev-user';
    req.userRole = 'developer';
    next();
    return;
  }

  logger.warn('Missing authorization header', {
    path: req.path,
    ip: req.ip,
  });

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Authorization header required',
  });
}

// Optional auth - doesn't fail if no token provided
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const internalToken = config.auth.internalToken;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    if (internalToken && token === internalToken) {
      req.userId = 'internal-service';
      req.userRole = 'service';
    }
  }

  next();
}
