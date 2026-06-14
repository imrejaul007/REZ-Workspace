import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { recordError } from './metrics.middleware';

/**
 * Validation middleware factory
 * Creates a middleware that validates request body against a Zod schema
 */
export const validateBody = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        res.status(400).json({
          error: 'Validation Error',
          message: 'Request body validation failed',
          statusCode: 400,
          details: errors,
          timestamp: new Date(),
        });
        return;
      }
      req.body = result.data;
      next();
    } catch (error) {
      recordError('validation', 'user-twin-service');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation failed',
        statusCode: 500,
        timestamp: new Date(),
      });
    }
  };
};

/**
 * Validation middleware for query parameters
 */
export const validateQuery = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        res.status(400).json({
          error: 'Validation Error',
          message: 'Query parameter validation failed',
          statusCode: 400,
          details: errors,
          timestamp: new Date(),
        });
        return;
      }
      req.query = result.data as Record<string, string>;
      next();
    } catch (error) {
      recordError('validation', 'user-twin-service');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation failed',
        statusCode: 500,
        timestamp: new Date(),
      });
    }
  };
};

/**
 * Validation middleware for route parameters
 */
export const validateParams = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        res.status(400).json({
          error: 'Validation Error',
          message: 'Route parameter validation failed',
          statusCode: 400,
          details: errors,
          timestamp: new Date(),
        });
        return;
      }
      req.params = result.data as Record<string, string>;
      next();
    } catch (error) {
      recordError('validation', 'user-twin-service');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation failed',
        statusCode: 500,
        timestamp: new Date(),
      });
    }
  };
};

/**
 * Format Zod errors into a readable array
 */
const formatZodErrors = (error: ZodError): { path: string; message: string }[] => {
  return error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));
};

// Common validation schemas
export const schemas = {
  // Create twin schema
  createTwin: z.object({
    userId: z.string().min(1, 'User ID is required'),
    profile: z.object({
      demographics: z.object({
        age: z.number().min(13).max(120).optional(),
        gender: z.string().optional(),
        location: z.object({
          city: z.string().min(1, 'City is required'),
          state: z.string().min(1, 'State is required'),
          country: z.string().min(1, 'Country is required'),
        }),
      }),
      preferences: z.object({
        language: z.string().default('en'),
        notifications: z.array(z.string()).default([]),
        priceRange: z.object({
          min: z.number().min(0),
          max: z.number().min(0),
        }),
      }),
    }),
  }),

  // Update twin schema
  updateTwin: z.object({
    profile: z.object({
      demographics: z.object({
        age: z.number().min(13).max(120).optional(),
        gender: z.string().optional(),
        location: z.object({
          city: z.string().min(1),
          state: z.string().min(1),
          country: z.string().min(1),
        }).optional(),
      }).optional(),
      preferences: z.object({
        language: z.string().optional(),
        notifications: z.array(z.string()).optional(),
        priceRange: z.object({
          min: z.number().min(0),
          max: z.number().min(0),
        }).optional(),
      }).optional(),
    }).optional(),
    behavioral: z.object({
      interests: z.array(z.object({
        category: z.string().min(1),
        score: z.number().min(0).max(1),
      })).optional(),
      purchaseHistory: z.array(z.object({
        category: z.string().min(1),
        count: z.number().int().min(0),
        total: z.number().min(0),
      })).optional(),
      browsingPatterns: z.object({
        patterns: z.array(z.string()).optional(),
        frequency: z.number().min(0).max(1).optional(),
      }).optional(),
      engagementScore: z.number().min(0).max(1).optional(),
    }).optional(),
    advertising: z.object({
      adResponsiveness: z.number().min(0).max(1).optional(),
      clickThroughHistory: z.number().min(0).max(1).optional(),
      conversionRate: z.number().min(0).max(1).optional(),
      preferredAdFormats: z.array(z.string()).optional(),
      brandAffinities: z.record(z.string(), z.number().min(0).max(1)).optional(),
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),

  // Predict request schema
  predict: z.object({
    scenario: z.string().optional(),
    context: z.record(z.unknown()).optional(),
  }),

  // User ID param schema
  userIdParam: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),

  // Pagination query schema
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  schemas,
};