import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        restaurantId?: string;
        role: string;
      };
      serviceAuth?: {
        service: string;
        isInternal: boolean;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new UnauthorizedError('No authorization header provided'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new UnauthorizedError('Invalid authorization header format'));
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as unknown;

    req.user = {
      userId: decoded.userId || decoded.sub,
      restaurantId: decoded.restaurantId,
      role: decoded.role || 'user',
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token has expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid token'));
    }
    next(error);
  }
}

export function internalServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'];

  if (!internalToken) {
    return next(new UnauthorizedError('No internal token provided'));
  }

  const serviceTokens = config.internalServiceTokens;

  // Find matching service
  for (const [serviceName, token] of Object.entries(serviceTokens)) {
    if (token === internalToken) {
      req.serviceAuth = {
        service: serviceName,
        isInternal: true,
      };
      logger.debug('Internal service authenticated', { service: serviceName });
      return next();
    }
  }

  return next(new ForbiddenError('Invalid internal service token'));
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next();
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as unknown;
    req.user = {
      userId: decoded.userId || decoded.sub,
      restaurantId: decoded.restaurantId,
      role: decoded.role || 'user',
    };
  } catch (error) {
    // Token invalid, but optional auth, so continue
    logger.debug('Optional auth token invalid', { error });
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Required role: ${roles.join(' or ')}`));
    }

    next();
  };
}

export function requireRestaurantAccess(req: Request, res: Response, next: NextFunction): void {
  const requestedRestaurantId = req.query.restaurantId || req.params.restaurantId;

  if (!requestedRestaurantId) {
    return next(new ForbiddenError('Restaurant ID required'));
  }

  // Internal services can access any restaurant
  if (req.serviceAuth?.isInternal) {
    return next();
  }

  // Check if user has access to the requested restaurant
  if (req.user?.restaurantId && req.user.restaurantId !== requestedRestaurantId) {
    if (req.user.role !== 'admin') {
      return next(new ForbiddenError('Access denied to this restaurant'));
    }
  }

  next();
}
