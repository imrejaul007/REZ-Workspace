import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

interface JWTPayload {
  userId: string;
  phone?: string;
  role?: string;
  companyId?: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      userPhone?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for internal token first
  const internalToken = req.headers['x-internal-token'];
  if (internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
    // Internal service call - allow with minimal user context
    next();
    return;
  }

  // Check for Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token required' } });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userPhone = decoded.phone;
    next();
  } catch {
    // Try RABTUL Auth for external tokens
    try {
      const response = await axios.post(
        (process.env.REZ_AUTH_URL || 'http://localhost:4002') + '/api/auth/verify',
        { token },
        { headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN } }
      );
      if (response.data.success) {
        req.userId = response.data.data.userId;
        req.userRole = response.data.data.role;
        next();
        return;
      }
    } catch {}

    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}
