/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'salon-booking-secret';

export interface JWTPayload {
  sub: string;
  email?: string;
  phone?: string;
  role?: string;
  salonId?: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Verify JWT token
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (req.path === '/health' || req.path.startsWith('/api/availability/slots')) {
    next();
    return;
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }
    (req as AuthRequest).user = decoded as JWTPayload;
    next();
  });
}
