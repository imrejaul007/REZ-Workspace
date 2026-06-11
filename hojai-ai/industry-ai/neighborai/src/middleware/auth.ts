/**
 * NEIGHBORAI - Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'neighborai-dev-secret-2024';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userFlat?: string;
  isInternal?: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  flatNumber?: string;
}

// Generate JWT token
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Compare password
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Main authentication middleware
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'];
    const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN || 'neighborai-internal-token';

    if (internalToken === internalServiceToken) {
      req.isInternal = true;
      return next();
    }

    // Check for Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userFlat = decoded.flatNumber;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded) {
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.userFlat = decoded.flatNumber;
      }
    }
    next();
  } catch {
    next();
  }
};

// Role-based access control
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = requireRole('admin');

// Resident or admin middleware
export const residentOrAdmin = requireRole('resident', 'admin');

export default {
  authMiddleware,
  optionalAuth,
  requireRole,
  adminOnly,
  residentOrAdmin,
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword
};