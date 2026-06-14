import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface JWTPayload {
  sub: string;
  role?: string;
  merchantId?: string;
  restaurantId?: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.path === '/health') { next(); return; }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Simple token validation (extend with RABTUL auth)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString());
    (req as AuthRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const userRole = authReq.user.role || 'employee';
    if (!roles.includes(userRole) && userRole !== 'admin') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
