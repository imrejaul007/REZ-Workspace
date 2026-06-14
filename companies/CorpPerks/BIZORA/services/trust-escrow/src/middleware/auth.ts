import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Extended Request type with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role?: string;
    [key: string]: unknown;
  };
}

/**
 * Simple auth middleware
 * In production, this would validate JWT tokens or session cookies
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authorization header required'
      });
      return;
    }

    // Extract token
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Token required'
      });
      return;
    }

    // In production, validate JWT token here
    // For now, we'll decode a simple base64 user ID
    // Format: base64(userId:role) or just use the token as userId
    let userId: string;
    let role: string | undefined;

    try {
      // Try to decode as base64 JSON
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (decoded.includes(':')) {
        [userId, role] = decoded.split(':');
      } else {
        userId = decoded;
      }
    } catch {
      // If decode fails, use token as userId directly (for testing)
      userId = token;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid authorization token'
      });
      return;
    }

    // Attach user to request
    req.user = {
      userId,
      role: role || 'user'
    };

    logger.debug('User authenticated', { userId, role });

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Authentication error'
    });
  }
};

/**
 * Optional auth middleware - doesn't require auth but extracts if present
 */
export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  // Delegate to main auth middleware
  authMiddleware(req, res, next);
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Role '${userRole}' is not authorized for this action`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to verify user is part of an escrow
 */
export const escrowPartyMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // This middleware is applied after route params are parsed
  // The actual verification happens in the route handler
  // This just ensures user is authenticated
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
    return;
  }

  next();
};

/**
 * Service-to-service auth middleware
 * Uses internal service tokens for microservice communication
 */
export const serviceAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const serviceToken = req.headers['x-service-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    // If no internal token configured, allow all (dev mode)
    next();
    return;
  }

  if (!serviceToken || serviceToken !== expectedToken) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Invalid service token'
    });
    return;
  }

  // Extract service name from header
  const serviceName = req.headers['x-service-name'] as string;
  if (serviceName) {
    req.user = {
      userId: `service:${serviceName}`,
      role: 'service'
    };
  }

  next();
};
