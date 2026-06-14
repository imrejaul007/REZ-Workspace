import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiResponse } from '../types';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  serviceId?: string;
  isInternal?: boolean;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  const internalToken = req.headers['x-internal-token'];
  if (internalToken && internalToken === config.internalServiceToken) {
    req.isInternal = true;
    next();
    return;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; serviceId?: string };
    req.userId = decoded.userId;
    req.serviceId = decoded.serviceId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
};

export const internalOnlyMiddleware = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'];

  if (!internalToken || internalToken !== config.internalServiceToken) {
    res.status(403).json({
      success: false,
      error: 'Internal service access only',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  req.isInternal = true;
  next();
};
