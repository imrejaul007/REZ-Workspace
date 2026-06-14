import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from 'utils/logger.js';

const authLogger = logger.child({ component: 'auth' });

// Validation schemas
export const InternalTokenSchema = z.object({
  'x-internal-token': z.string().min(1)
});

export interface AuthenticatedRequest extends Request {
  internalServiceToken?: string;
  serviceName?: string;
}

// Middleware to validate internal service token
export const internalServiceAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!token) {
    authLogger.warn('Missing internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(401).json({
      success: false,
      error: 'Missing internal service token',
      code: 'AUTH_MISSING_TOKEN'
    });
    return;
  }

  if (token !== expectedToken) {
    authLogger.warn('Invalid internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(403).json({
      success: false,
      error: 'Invalid internal service token',
      code: 'AUTH_INVALID_TOKEN'
    });
    return;
  }

  req.internalServiceToken = token;
  req.serviceName = req.headers['x-service-name'] as string || 'unknown';

  authLogger.debug('Internal service authenticated', {
    serviceName: req.serviceName,
    path: req.path
  });

  next();
};

// Optional auth - sets user info if token present but doesn't require it
export const optionalInternalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (token && token === expectedToken) {
    req.internalServiceToken = token;
    req.serviceName = req.headers['x-service-name'] as string || 'unknown';
  }

  next();
};

// Validate request body against Zod schema
export const validateBody = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
          code: 'VALIDATION_ERROR'
        });
        return;
      }
      next(error);
    }
  };
};

// Validate query parameters against Zod schema
export const validateQuery = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
          code: 'VALIDATION_ERROR'
        });
        return;
      }
      next(error);
    }
  };
};

export default {
  internalServiceAuth,
  optionalInternalAuth,
  validateBody,
  validateQuery
};