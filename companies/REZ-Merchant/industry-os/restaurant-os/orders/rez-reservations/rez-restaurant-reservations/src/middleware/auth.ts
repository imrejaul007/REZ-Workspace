import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION && !JWT_SECRET) {
  logger.error('[FATAL] JWT_SECRET is required in production');
  process.exit(1);
}

export interface JWTPayload {
  sub: string;
  email?: string;
  role?: 'admin' | 'manager' | 'employee' | 'customer';
  merchantId?: string;
  restaurantId?: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

async function verifyTokenWithRABTUL(token: string): Promise<JWTPayload | null> {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify`,
      { token },
      { headers: { 'Content-Type': 'application/json', 'X-Internal-Token': INTERNAL_SERVICE_TOKEN }, timeout: 5000 }
    );
    if (response.data.success && response.data.user) {
      return response.data.user as JWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (req.path === '/health') { next(); return; }
  if (!token) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

  const raborUser = await verifyTokenWithRABTUL(token);
  if (raborUser) { (req as AuthRequest).user = raborUser; next(); return; }

  if (JWT_SECRET) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) { res.status(401).json({ success: false, error: 'Invalid token' }); return; }
      (req as AuthRequest).user = decoded as JWTPayload;
      next();
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
    const userRole = authReq.user.role || 'customer';
    if (!roles.includes(userRole) && userRole !== 'admin') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
