import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from 'utils/logger.js';

/**
 * Validation middleware factory
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(data);

      // Replace with validated data
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
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
        return;
      }

      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation error',
        },
      });
    }
  };
};

/**
 * Pagination validation middleware
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (page < 1) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Page must be greater than 0',
      },
    });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Limit must be between 1 and 100',
      },
    });
    return;
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};

/**
 * Date range validation middleware
 */
export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;

  if (startDate) {
    const start = new Date(startDate as string);
    if (isNaN(start.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid start date format',
        },
      });
      return;
    }
  }

  if (endDate) {
    const end = new Date(endDate as string);
    if (isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid end date format',
        },
      });
      return;
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (start > end) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before end date',
        },
      });
      return;
    }
  }

  next();
};

/**
 * UUID validation middleware
 */
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    if (!value) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `${paramName} is required`,
        },
      });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value) && !value.startsWith('AIMM-') && !value.startsWith('CAMP-')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid ${paramName} format`,
        },
      });
      return;
    }

    next();
  };
};