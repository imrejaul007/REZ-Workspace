import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../integrations/rabtulClient.js';
import { createResponse } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    roles: string[];
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json(createResponse(false, undefined, {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is required'
      }));
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      res.status(401).json(createResponse(false, undefined, {
        code: 'UNAUTHORIZED',
        message: 'Token is required'
      }));
      return;
    }

    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json(createResponse(false, undefined, {
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    }));
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  authMiddleware(req, res, next);
}
