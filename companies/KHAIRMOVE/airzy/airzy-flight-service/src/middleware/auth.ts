import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UnauthorizedError } from '../utils/errors';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        tenantId?: string;
        roles?: string[];
      };
    }
  }
}

// JWT Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow unauthenticated access for public endpoints (search, airports, airlines)
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        sub: string;
        tenantId?: string;
        roles?: string[];
      };

      req.user = {
        sub: decoded.sub,
        tenantId: decoded.tenantId,
        roles: decoded.roles
      };
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Authentication failed');
    }
  } catch (error) {
    next(error);
  }
};

// Strict authentication - requires valid token
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      sub: string;
      tenantId?: string;
      roles?: string[];
    };

    req.user = {
      sub: decoded.sub,
      tenantId: decoded.tenantId,
      roles: decoded.roles
    };
    next();
  } catch (jwtError) {
    if (jwtError instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token has expired'));
    }
    if (jwtError instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid token'));
    }
    next(new UnauthorizedError('Authentication failed'));
  }
};

// Role-based authorization
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

export default { authenticate, requireAuth, requireRole };
