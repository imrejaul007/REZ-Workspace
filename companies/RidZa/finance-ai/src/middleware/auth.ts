import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/index.js';
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
        message: 'Authorization header required'
      }));
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');

    try {
      const response = await axios.post(
        `${config.services.auth}/api/auth/verify`,
        { token },
        { headers: { 'X-Internal-Token': config.internalToken } }
      );

      req.user = response.data;
      next();
    } catch {
      res.status(401).json(createResponse(false, undefined, {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }));
    }
  } catch (error) {
    next(error);
  }
}
