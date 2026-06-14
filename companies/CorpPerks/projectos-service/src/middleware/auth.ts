import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth');

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    employeeId: string;
    name: string;
    role: string;
    departmentId: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'] as string;
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (internalToken && expectedToken && internalToken === expectedToken) {
      // Internal service call - bypass auth
      req.user = {
        userId: 'internal-service',
        employeeId: 'internal',
        name: 'Internal Service',
        role: 'system',
        departmentId: 'internal'
      };
      next();
      return;
    }

    // Check for user token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7);

    // In production, verify JWT token here
    // For now, we'll decode a simple base64 token format: base64(employeeId:name:role)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [employeeId, name, role] = decoded.split(':');

      if (!employeeId || !name) {
        throw new Error('Invalid token format');
      }

      req.user = {
        userId: employeeId,
        employeeId,
        name,
        role: role || 'employee',
        departmentId: req.headers['x-department-id'] as string || 'default'
      };

      next();
    } catch {
      logger.warn('Invalid token provided');
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [employeeId, name, role] = decoded.split(':');

      if (employeeId && name) {
        req.user = {
          userId: employeeId,
          employeeId,
          name,
          role: role || 'employee',
          departmentId: req.headers['x-department-id'] as string || 'default'
        };
      }
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
}
