import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config/index.js';
import { AuthenticatedRequest, UserRole } from '../types/index.js';

/**
 * Internal service authentication middleware
 * Validates the X-Internal-Token header for service-to-service communication
 */
export const internalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: 'Internal token required',
    });
    return;
  }

  // Timing-safe comparison
  const expectedToken = config.internalServiceToken;
  const tokenBuffer = Buffer.from(internalToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    res.status(401).json({
      success: false,
      error: 'Invalid internal token',
    });
    return;
  }

  // Set tenant ID from header if provided
  const tenantId = req.headers['x-tenant-id'] as string;
  if (tenantId) {
    req.tenantId = tenantId;
  }

  next();
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Tenant isolation middleware
 * Ensures requests are scoped to a specific tenant
 */
export const requireTenant = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check if tenant ID is set from user token or header
  if (!req.tenantId) {
    res.status(400).json({
      success: false,
      error: 'Tenant ID is required',
    });
    return;
  }

  next();
};
