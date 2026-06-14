/**
 * Zod Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import logger from '../utils/logger';

/**
 * Create validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
}

/**
 * Create validation middleware for path parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid path parameters',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    next();
  };
}

// Common validation schemas
export const schemas = {
  // Banner generation
  generateBanner: z.object({
    description: z.string().min(1, 'Description is required').max(1000),
    dimensions: z.object({
      width: z.number().int().min(100, 'Width must be at least 100px').max(4000),
      height: z.number().int().min(100, 'Height must be at least 100px').max(4000),
    }),
    format: z.enum(['static', 'animated', 'video']).default('static'),
    style: z.enum(['modern', 'classic', 'bold', 'minimal']).optional(),
    colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')).max(10).optional(),
    brandGuidelines: z.object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      font: z.string().min(1),
      logo: z.string().url().optional(),
    }).optional(),
  }),

  // Generate variants
  generateVariants: z.object({
    baseGenerationId: z.string().min(1),
    count: z.number().int().min(1).max(10).default(3),
    variations: z.array(z.object({
      style: z.enum(['modern', 'classic', 'bold', 'minimal']).optional(),
      colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
    })).optional(),
  }),

  // Create template
  createTemplate: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    category: z.string().min(1, 'Category is required').max(100),
    dimensions: z.object({
      width: z.number().int().min(100).max(4000),
      height: z.number().int().min(100).max(4000),
    }),
    layout: z.object({
      elements: z.array(z.object({
        type: z.enum(['text', 'image', 'logo', 'cta']),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
        style: z.record(z.unknown()),
      })),
    }),
    isPublic: z.boolean().default(false),
  }),

  // Regenerate
  regenerate: z.object({
    changes: z.object({
      description: z.string().max(1000).optional(),
      style: z.enum(['modern', 'classic', 'bold', 'minimal']).optional(),
      colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(10).optional(),
      dimensions: z.object({
        width: z.number().int().min(100).max(4000),
        height: z.number().int().min(100).max(4000),
      }).optional(),
    }).optional(),
  }),

  // List templates query
  listTemplatesQuery: z.object({
    category: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  // List generations query
  listGenerationsQuery: z.object({
    status: z.enum(['processing', 'completed', 'failed']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  // Generation ID param
  generationIdParam: z.object({
    id: z.string().min(1),
  }),

  // Template ID param
  templateIdParam: z.object({
    id: z.string().min(1),
  }),
};

export default { validateBody, validateQuery, validateParams, schemas };
