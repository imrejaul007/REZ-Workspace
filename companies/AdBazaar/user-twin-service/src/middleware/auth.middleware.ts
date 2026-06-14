import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JwtPayload } from '../types';

/**
 * JWT Authentication middleware
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
        statusCode: 401,
        timestamp: new Date(),
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
        statusCode: 401,
        timestamp: new Date(),
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    (req as Request& { user: JwtPayload }).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
        statusCode: 401,
        timestamp: new Date(),
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        statusCode: 401,
        timestamp: new Date(),
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (req as Request & { user: JwtPayload }).user = decoded;
    next();
  } catch {
    // Invalid token, but continue without user
    next();
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request& { user: JwtPayload }).user;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        statusCode: 401,
        timestamp: new Date(),
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        statusCode: 403,
        timestamp: new Date(),
      });
      return;
    }

    next();
  };
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};