/**
 * Authentication Middleware
 * Validates internal service tokens and user JWTs
 */

import { Request, Response, NextFunction } from 'express';

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

/**
 * Require internal service authentication
 * Used for service-to-service communication
 */
export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Missing internal authentication token',
    });
    return;
  }

  if (INTERNAL_TOKEN && token !== INTERNAL_TOKEN) {
    res.status(403).json({
      success: false,
      error: 'Invalid internal authentication token',
    });
    return;
  }

  next();
}

/**
 * Require user authentication (JWT)
 * Used for user-facing endpoints
 */
export function requireUserAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header',
    });
    return;
  }

  const token = authHeader.substring(7);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Missing authentication token',
    });
    return;
  }

  // TODO: Validate JWT token here
  // For now, we extract user info from headers set by API gateway
  const userId = req.headers['x-user-id'] as string;
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!userId || !tenantId) {
    res.status(401).json({
      success: false,
      error: 'Invalid token or missing user context',
    });
    return;
  }

  next();
}

/**
 * Optional authentication - doesn't fail if no token present
 * Used for endpoints that work differently for authenticated vs anonymous users
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without user context
    next();
    return;
  }

  // If auth is provided, validate it
  requireUserAuth(req, res, next);
}
