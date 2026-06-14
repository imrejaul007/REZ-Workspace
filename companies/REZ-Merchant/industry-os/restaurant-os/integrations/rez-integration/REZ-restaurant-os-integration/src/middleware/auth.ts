import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

export interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  merchantId?: string;
  restaurantId?: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

async function verifyTokenWithRABTUL(token: string): Promise<JWTPayload | null> {
  try {
    const response = await axios.post(
      `${SERVICE_URLS.AUTH_SERVICE}/api/auth/verify`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
        },
        timeout: 5000,
      }
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

  res.status(401).json({ success: false, error: 'Invalid token' });
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
    const userRole = authReq.user.role || 'user';
    if (!roles.includes(userRole) && userRole !== 'admin') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
