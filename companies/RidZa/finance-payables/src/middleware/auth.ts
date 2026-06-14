/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthenticatedUser } from '../types';
import { verifyToken } from '../integrations/rabtulClient';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      isInternalService?: boolean;
    }
  }
}

/**
 * Extract token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') return null;

  return parts[1];
}

/**
 * Check if request is from internal service
 */
function isInternalRequest(req: Request): boolean {
  const internalToken = req.headers['x-internal-token'];
  return internalToken === config.internalServiceToken;
}

/**
 * Main authentication middleware
 * Validates JWT and attaches user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check for internal service call
    if (isInternalRequest(req)) {
      req.isInternalService = true;
      // For internal calls, use tenant from header or default
      req.user = {
        userId: 'internal-service',
        tenantId: req.headers['x-tenant-id'] as string || 'default',
        roles: ['service'],
      };
      return next();
    }

    // Extract and verify JWT
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided',
      });
      return;
    }

    try {
      // Verify token locally first (faster)
      const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;

      // Optionally verify with auth service for fresh data
      if (config.nodeEnv === 'production') {
        try {
          const verified = await verifyToken(token);
          req.user = {
            userId: verified.userId || decoded.userId,
            tenantId: verified.tenantId || decoded.tenantId,
            roles: verified.roles || decoded.roles,
          };
        } catch {
          // Use locally verified token if service unavailable
          req.user = decoded;
        }
      } else {
        req.user = decoded;
      }

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Please login again',
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Token verification failed',
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error',
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole && !req.user.roles.includes('admin')) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Tenant isolation middleware
 * Ensures users can only access their own tenant's data
 */
export function tenantIsolation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.isInternalService) {
    return next();
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // For internal service calls, we allow cross-tenant access
  // For user requests, enforce tenant isolation
  const requestedTenant = req.params['tenantId'] || req.body['tenantId'];

  if (requestedTenant && requestedTenant !== req.user.tenantId) {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Cannot access other tenant data',
    });
    return;
  }

  next();
}
