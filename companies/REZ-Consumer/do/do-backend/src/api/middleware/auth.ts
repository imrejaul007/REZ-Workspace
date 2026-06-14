import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../utils/config.js';
import { AuthenticationError } from './errorHandler.js';

export interface AuthUser {
  id: string;
  phone: string;
  name?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Simple in-memory store for demo (use Redis/DB in production)
const tokenStore = new Map<string, AuthUser>();

export const generateToken = (user: AuthUser): string => {
  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
  tokenStore.set(token, user);
  return token;
};

export const verifyToken = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string; phone: string };
    return tokenStore.get(token) || { id: decoded.userId, phone: decoded.phone };
  } catch {
    return null;
  }
};

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user) {
      throw new AuthenticationError('Invalid or expired token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Authentication failed'));
    }
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
};
