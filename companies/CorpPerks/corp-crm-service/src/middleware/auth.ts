import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export interface TenantRequest extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

// Extract tenant from header or subdomain
export const tenantMiddleware = (req: TenantRequest, res: Response, next: NextFunction): void => {
  // Get tenant from header (set by API gateway)
  const tenantId = req.headers['x-tenant-id'] as string;

  // Get user info from header (set by auth service)
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;

  if (tenantId) {
    req.tenantId = tenantId;
  }

  if (userId) {
    req.userId = userId;
  }

  if (userRole) {
    req.userRole = userRole;
  }

  next();
};

// Internal service authentication
export const internalAuth = (req: TenantRequest, res: Response, next: NextFunction): void => {
  const token = req.headers['x-internal-token'] as string;

  if (!token || token !== config.services.internalToken) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid internal token',
    });
    return;
  }

  next();
};

// Optional auth - doesn't block if no auth
export const optionalAuth = (req: TenantRequest, res: Response, next: NextFunction): void => {
  // Just pass through, actual auth is handled elsewhere
  next();
};

// Require tenant context
export const requireTenant = (req: TenantRequest, res: Response, next: NextFunction): void => {
  if (!req.tenantId) {
    res.status(400).json({
      success: false,
      error: 'Tenant ID is required. Provide x-tenant-id header.',
    });
    return;
  }
  next();
};

// Role-based access control
export const requireRole = (...roles: string[]) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};
