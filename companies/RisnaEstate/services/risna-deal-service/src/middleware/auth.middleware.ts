import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Skip auth for health checks and certain routes
const PUBLIC_PATHS = [
  '/health',
  '/healthz',
  '/ready',
  '/metrics',
  '/api/v1/health',
];

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip auth for public paths
  if (PUBLIC_PATHS.some(path => req.path.startsWith(path))) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header missing',
      code: 'AUTH_MISSING',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>',
      code: 'AUTH_INVALID_FORMAT',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('JWT verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    });

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'AUTH_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'AUTH_INVALID',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
}

// Optional auth - sets user if token exists, but doesn't require it
export function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
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
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
  } catch {
    // Ignore errors for optional auth
  }

  next();
}

// Internal service authentication
export function internalServiceAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const serviceToken = req.headers['x-service-token'] as string;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken) {
    logger.warn('INTERNAL_SERVICE_TOKEN not configured');
    res.status(503).json({
      success: false,
      error: 'Service not properly configured',
      code: 'CONFIG_ERROR',
    });
    return;
  }

  if (!serviceToken) {
    res.status(401).json({
      success: false,
      error: 'Service token missing',
      code: 'SERVICE_TOKEN_MISSING',
    });
    return;
  }

  if (serviceToken !== internalToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid service token',
      code: 'SERVICE_TOKEN_INVALID',
    });
    return;
  }

  next();
}

// Role-based access control
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requiredRoles: roles,
      });
      return;
    }

    next();
  };
}

// Company-scoped access
export function requireCompanyAccess(companyIdParam: string = 'companyId') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const requestedCompanyId = req.params[companyIdParam] || req.body?.companyId;

    // Admins can access any company
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      next();
      return;
    }

    // Users can only access their own company
    if (requestedCompanyId && req.user.companyId && requestedCompanyId !== req.user.companyId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this company',
        code: 'COMPANY_ACCESS_DENIED',
      });
      return;
    }

    next();
  };
}