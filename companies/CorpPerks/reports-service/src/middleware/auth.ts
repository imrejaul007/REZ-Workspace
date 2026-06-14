import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  userId: string;
  email?: string;
  role: string;
  tenantId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  tenantId?: string;
}

// Simple auth middleware for internal service communication
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  // For internal service calls, use X-Internal-Token
  const internalToken = req.headers['x-internal-token'] as string;
  const authToken = req.headers.authorization?.replace('Bearer ', '');

  if (internalToken) {
    // Internal service call
    req.tenantId = req.headers['x-tenant-id'] as string || 'default';
    req.user = {
      userId: req.headers['x-user-id'] as string || 'system',
      role: 'admin',
      tenantId: req.tenantId,
    };
    next();
    return;
  }

  if (authToken) {
    // In production, verify JWT here
    // For now, decode basic token format: base64(userId:role:tenantId)
    try {
      const decoded = Buffer.from(authToken, 'base64').toString();
      const [userId, role, tenantId] = decoded.split(':');
      req.user = { userId, role: role || 'user', tenantId };
      req.tenantId = tenantId || 'default';
      next();
      return;
    } catch {
      // Invalid token format, continue without auth
    }
  }

  // Fallback: use query params or headers for testing
  req.tenantId = (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string) || 'default';
  req.user = {
    userId: (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'anonymous',
    role: 'user',
    tenantId: req.tenantId,
  };
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    next();
  };
};
