/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Missing internal authentication token'
    });
    return;
  }

  if (INTERNAL_TOKEN && token !== INTERNAL_TOKEN) {
    res.status(403).json({
      success: false,
      error: 'Invalid internal authentication token'
    });
    return;
  }

  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // Allow unauthenticated access to health endpoints
  if (req.path.startsWith('/health')) {
    next();
    return;
  }
  next();
}
