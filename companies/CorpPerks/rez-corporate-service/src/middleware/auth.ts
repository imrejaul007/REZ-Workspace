import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';

/**
 * Verify token via RABTUL Auth Service
 */
async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
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

// User authentication middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Admin authentication middleware
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Internal service authentication
export function requireInternal(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-internal-token'] as string;
  const expected = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expected) {
    return res.status(500).json({ success: false, message: 'Internal auth not configured' });
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing internal token' });
  }

  // Timing-safe comparison
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
    return res.status(403).json({ success: false, message: 'Invalid internal token' });
  }

  next();
}
