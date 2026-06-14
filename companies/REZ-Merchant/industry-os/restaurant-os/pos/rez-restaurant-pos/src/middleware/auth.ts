import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  serviceId?: string;
  isInternal?: boolean;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ success: false, error: 'Authorization header required' });
    return;
  }

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      req.userId = decoded.userId;
      next();
      return;
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }
  }

  if (authHeader.startsWith('Internal ')) {
    const token = authHeader.substring(9);
    const callingService = req.headers['x-service-name'] as string;

    if (!callingService) {
      res.status(401).json({ success: false, error: 'Service name required for internal calls' });
      return;
    }

    const expectedToken = config.internalServiceTokens[callingService];

    if (!expectedToken || expectedToken !== token) {
      res.status(403).json({ success: false, error: 'Invalid service token' });
      return;
    }

    req.isInternal = true;
    req.serviceId = callingService;
    next();
    return;
  }

  res.status(401).json({ success: false, error: 'Invalid authorization format' });
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  authenticate(req, res, next);
}
