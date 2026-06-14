import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateRequest = (schema: {
  body?;
  query?;
  params?;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];

    if (schema.body) {
      const bodyErrors = validateObject(req.body, schema.body);
      errors.push(...bodyErrors);
    }

    if (schema.query) {
      const queryErrors = validateObject(req.query, schema.query);
      errors.push(...queryErrors);
    }

    if (schema.params) {
      const paramErrors = validateObject(req.params, schema.params);
      errors.push(...paramErrors);
    }

    if (errors.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors
        }
      };
      return res.status(400).json(response);
    }

    next();
  };
};

function validateObject(obj, schema): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!obj || typeof obj !== 'object') {
    return [createError('root', 'Invalid object')];
  }

  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(createError(key, `${key} is required`));
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(createError(key, `${key} must be of type ${rules.type}`));
        }
      }

      if (rules.min !== undefined && value < rules.min) {
        errors.push(createError(key, `${key} must be at least ${rules.min}`));
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push(createError(key, `${key} must be at most ${rules.max}`));
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(createError(key, `${key} must be one of: ${rules.enum.join(', ')}`));
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(createError(key, `${key} has invalid format`));
      }
    }
  }

  return errors;
}

function createError(field: string, message: string): ValidationError {
  return { field, message };
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error:', err);

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred'
    }
  };

  if (err.message.includes('not found') || err.message.includes('NOT_FOUND')) {
    response.error!.code = 'NOT_FOUND';
    res.status(404).json(response);
    return;
  }

  if (err.message.includes('validation') || err.message.includes('VALIDATION')) {
    response.error!.code = 'VALIDATION_ERROR';
    res.status(400).json(response);
    return;
  }

  if (err.message.includes('unauthorized') || err.message.includes('UNAUTHORIZED')) {
    response.error!.code = 'UNAUTHORIZED';
    res.status(401).json(response);
    return;
  }

  if (err.message.includes('forbidden') || err.message.includes('FORBIDDEN')) {
    response.error!.code = 'FORBIDDEN';
    res.status(403).json(response);
    return;
  }

  if (err.message.includes('duplicate') || err.message.includes('DUPLICATE')) {
    response.error!.code = 'DUPLICATE_ENTRY';
    res.status(409).json(response);
    return;
  }

  res.status(500).json(response);
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
};

const ALLOWED_ORIGINS = (process.env.ALLOWED_CORS_ORIGINS || 'https://reznow.app,https://rez.delivery,https://admin.reznow.app').split(',');

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
};
