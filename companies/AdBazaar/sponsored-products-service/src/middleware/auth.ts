import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthenticatedRequest, JWTPayload } from '../types';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization header format. Use: Bearer <token>');
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
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
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
    } catch {
      // Token invalid, but optional auth so continue
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export function authorize(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Merchant authorization middleware
 * Checks if user has access to the specified merchant
 */
export function authorizeMerchant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check if user's merchantId matches the requested merchant
    const requestedMerchantId = req.params.merchantId || req.body.merchantId || req.query.merchantId;

    if (requestedMerchantId && requestedMerchantId !== req.user.merchantId) {
      // Admin can access any merchant
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('Access denied to this merchant');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Generate JWT token (utility function for testing)
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verify JWT token (utility function)
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
}