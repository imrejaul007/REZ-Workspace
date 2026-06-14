import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; name: string; email: string; companyId: string; role: string; avatar?: string };
  internalService?: { name: string };
}

export async function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authorization header missing' });
      return;
    }

    const token = authHeader.substring(7);
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, { token }, { timeout: 5000 });

    if (!response.data?.userId) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    req.user = {
      userId: response.data.userId,
      name: response.data.name,
      email: response.data.email,
      companyId: response.data.companyId,
      role: response.data.role,
      avatar: response.data.avatar,
    };
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
}

export function verifyInternalToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'];
  if (!internalToken || internalToken !== INTERNAL_SERVICE_TOKEN) {
    res.status(403).json({ success: false, error: 'Invalid internal token' });
    return;
  }
  req.internalService = { name: (req.headers['x-service-name'] as string) || 'unknown' };
  next();
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.headers['x-internal-token']) {
    return verifyInternalToken(req, res, next);
  }
  return verifyToken(req, res, next);
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
