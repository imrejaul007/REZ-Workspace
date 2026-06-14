import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '../config/logger';

const logger = createLogger('auth');

// Fail startup if secrets not configured
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

if (!INTERNAL_SERVICE_TOKEN || !JWT_SECRET) {
  throw new Error('INTERNAL_SERVICE_TOKEN and JWT_SECRET are required');
}

/**
 * JWT payload structure
 */
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  companyId?: string;
}

/**
 * Verify JWT token
 */
function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Require authentication via JWT Bearer token
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.substring(7);

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn('Invalid token attempt', { path: req.path });
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Attach user to request
  (req as any).user = decoded;
  next();
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const user = (req as any).user;

    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/**
 * Require internal service token
 */
export function requireInternal(req: Request, res: Response, next: NextFunction) {
  const internalToken = req.headers['x-internal-token'];

  if (internalToken !== INTERNAL_SERVICE_TOKEN) {
    logger.warn('Invalid internal token', { path: req.path });
    return res.status(403).json({ error: 'Internal access required' });
  }

  next();
}

/**
 * Optional auth - attaches user if token present
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      (req as any).user = decoded;
    }
  }

  next();
}
