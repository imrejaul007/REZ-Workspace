/**
 * Authentication Middleware
 * JWT-based authentication with service-to-service support
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  isService?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  isService?: boolean;
  iat: number;
  exp: number;
}

/**
 * Verify JWT token and attach user to request
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      });
      return;
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      roles: decoded.roles,
      isService: decoded.isService,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
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

  try {
    authenticate(req, res, next);
  } catch {
    next();
  }
}

/**
 * Verify internal service token for service-to-service calls
 */
export function verifyInternalToken(req: Request, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Internal service token required',
    });
    return;
  }

  if (internalToken !== config.internalServiceToken) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid internal service token',
    });
    return;
  }

  next();
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

/**
 * Tenant isolation middleware - ensures user can only access their tenant's data
 */
export function tenantIsolation(req: AuthRequest, res: Response, next: NextFunction): void {
  const tenantIdParam = req.params.tenantId;

  if (!tenantIdParam) {
    next();
    return;
  }

  // Service accounts can access any tenant
  if (req.user?.isService) {
    next();
    return;
  }

  // Regular users can only access their own tenant
  if (req.user?.tenantId !== tenantIdParam) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied to this tenant',
    });
    return;
  }

  next();
}

/**
 * Generate JWT token (for testing and service account creation)
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '24h',
  });
}

/**
 * Generate service token
 */
export function generateServiceToken(serviceId: string, tenantId: string): string {
  return jwt.sign(
    {
      userId: `service_${serviceId}`,
      tenantId,
      email: `${serviceId}@internal.service`,
      roles: ['service'],
      isService: true,
    },
    config.jwtSecret,
    {
      expiresIn: '365d',
    }
  );
}

export default {
  authenticate,
  optionalAuth,
  verifyInternalToken,
  authorize,
  tenantIsolation,
  generateToken,
  generateServiceToken,
};