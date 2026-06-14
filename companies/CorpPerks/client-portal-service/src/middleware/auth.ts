import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/authService.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
    return;
  }

  req.user = payload;
  next();
}
