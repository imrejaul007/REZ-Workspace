import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../utils/logger.js';

const ApiKeySchema = z.object({
  'x-api-key': z.string().min(1),
  'x-user-id': z.string().optional(),
  'x-organization-id': z.string().optional()
});

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId?: string;
    apiKey: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'Missing API key',
        message: 'x-api-key header is required'
      });
      return;
    }

    const validated = ApiKeySchema.safeParse({
      'x-api-key': apiKey,
      'x-user-id': userId,
      'x-organization-id': organizationId
    });

    if (!validated.success) {
      res.status(401).json({
        success: false,
        error: 'Invalid authentication headers',
        message: 'Missing or invalid required headers'
      });
      return;
    }

    req.user = {
      id: userId || 'anonymous',
      organizationId,
      apiKey
    };

    logger.debug(`Authenticated request from user: ${req.user.id}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal authentication error'
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  const userId = req.headers['x-user-id'] as string;
  const organizationId = req.headers['x-organization-id'] as string;

  if (apiKey) {
    req.user = {
      id: userId || 'anonymous',
      organizationId,
      apiKey
    };
  }

  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRole = req.headers['x-user-role'] as string;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`
      });
      return;
    }

    next();
  };
};

export default authMiddleware;