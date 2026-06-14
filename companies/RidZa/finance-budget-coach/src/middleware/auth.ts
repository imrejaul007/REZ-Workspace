/**
 * Authentication Middleware
 * JWT token verification and tenant validation
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthUser {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  tenantId?: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: string;
    }
  }
}

/**
 * Verify JWT token
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'No authorization header provided' });
    return;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Invalid authorization header format. Use: Bearer <token>' });
    return;
  }
  
  const token = parts[1];
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser & { exp?: number };
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    next();
    return;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }
  
  const token = parts[1];
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };
  } catch {
    // Ignore invalid tokens for optional auth
  }
  
  next();
}

/**
 * Validate tenant access - ensures user can only access their tenant's data
 */
export function validateTenantAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  const urlTenantId = req.params.tenantId;
  
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  // Admin can access any tenant
  if (req.user.roles.includes('admin')) {
    next();
    return;
  }
  
  // Check tenant match
  if (urlTenantId && urlTenantId !== req.user.tenantId) {
    res.status(403).json({ error: 'Access denied to this tenant' });
    return;
  }
  
  // Set tenantId for downstream use
  req.tenantId = urlTenantId || req.user.tenantId;
  next();
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const hasRole = roles.some(role => req.user?.roles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

/**
 * Require specific permission
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const hasPermission = permissions.some(perm => req.user?.permissions.includes(perm));
    
    if (!hasPermission) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

export default {
  authenticate,
  optionalAuth,
  validateTenantAccess,
  requireRole,
  requirePermission,
};
