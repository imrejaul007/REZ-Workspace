import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errorHandler';
import { logger } from '../utils/logger';

// Generic validation middleware factory
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(data);

      // Replace with validated data (applies defaults, transforms)
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated;
      } else {
        req.params = validated;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));

        logger.warn('Request validation failed', {
          source,
          path: req.path,
          errors: details,
        });

        next(new ValidationError('Request validation failed', error));
      } else {
        next(error);
      }
    }
  };
};

// Validation middleware for body only
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

// Validation middleware for query only
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

// Validation middleware for params only
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

// Combined validation for multiple sources
export const validateAll = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Request validation failed', error));
      } else {
        next(error);
      }
    }
  };
};

// Custom validator for merchant ID format
export const isValidMerchantId = (merchantId: string): boolean => {
  // Alphanumeric with optional dashes/underscores
  const pattern = /^[a-zA-Z0-9_-]+$/;
  return pattern.test(merchantId) && merchantId.length >= 3 && merchantId.length <= 100;
};

// Custom validator for session ID format (UUID)
export const isValidSessionId = (sessionId: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(sessionId);
};

// Sanitize string input (basic XSS prevention)
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Request ID middleware
export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string;
  if (!requestId) {
    // Generate a simple request ID (in production, use uuid)
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    req.headers['x-request-id'] = `${timestamp}-${random}`;
  }
  next();
};

// Request timestamp middleware
export const timestampMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  (req as any).requestTimestamp = Date.now();
  next();
};

// Response time middleware
export const responseTimeMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  next();
};
