import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  serviceToken?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (serviceToken && internalToken === serviceToken) {
    req.serviceToken = internalToken;
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      req.userId = payload.userId || payload.sub;
      next();
    } catch {
      logger.warn('Invalid auth token format');
      res.status(401).json({ error: 'Invalid token' });
 }
    return;
  }

  res.status(401).json({ error: 'Unauthorized' });
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      req.userId = payload.userId || payload.sub;
    } catch {
      logger.warn('Invalid optional auth token');
    }
  }
  next();
};
