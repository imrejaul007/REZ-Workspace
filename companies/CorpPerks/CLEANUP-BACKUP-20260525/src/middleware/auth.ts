import { Request, Response, NextFunction } from 'express';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  userId?: string;
}

export type AuthenticatedRequest = AuthRequest;

/**
 * Verify token via RABTUL Auth Service
 */
async function verifyToken(token: string): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || ''
      },
      body: JSON.stringify({ token })
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch {
    return null;
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdminAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
};

export const requireInternalToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!token || token !== expectedToken) {
    res.status(403).json({ error: 'Internal access denied' });
    return;
  }

  next();
};
