/**
 * Validation Middleware using Zod
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import logger from 'utils/logger.js';

/**
 * Validation middleware factory
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      logger.warn('Validation failed', {
        path: req.path,
        errors: result.error.issues,
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
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
 * Query validation middleware
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      logger.warn('Query validation failed', {
        path: req.path,
        errors: result.error.issues,
      });

      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    req.query = result.data as unknown as typeof req.query;
    next();
  };
}

/**
 * Params validation middleware
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      logger.warn('Params validation failed', {
        path: req.path,
        errors: result.error.issues,
      });

      res.status(400).json({
        success: false,
        error: 'Invalid path parameters',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    req.params = result.data as unknown as typeof req.params;
    next();
  };
}

// Validation schemas
export const schemas = {
  // Create optimization
  createOptimization: z.object({
    campaignId: z.string().min(1, 'Campaign ID is required'),
    goals: z.object({
      targetCPA: z.number().positive().optional(),
      targetROAS: z.number().positive().optional(),
      targetConversions: z.number().int().positive().optional(),
    }).refine(
      (goals) => goals.targetCPA || goals.targetROAS || goals.targetConversions,
      { message: 'At least one optimization goal is required' }
    ),
    maxBid: z.number().positive().optional(),
    budget: z.number().positive().optional(),
  }),

  // Bid optimization request
  bidOptimization: z.object({
    campaignId: z.string().min(1, 'Campaign ID is required'),
    placementId: z.string().min(1, 'Placement ID is required'),
    currentBid: z.number().positive('Current bid must be positive'),
    targetCPA: z.number().positive().optional(),
  }),

  // List optimizations
  listOptimizations: z.object({
    status: z.enum(['active', 'paused', 'completed']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  // Optimization ID param
  optimizationId: z.object({
    id: z.string().min(1, 'Optimization ID is required'),
  }),

  // Campaign ID param
  campaignId: z.object({
    id: z.string().min(1, 'Campaign ID is required'),
  }),

  // Update performance
  updatePerformance: z.object({
    cpa: z.number().min(0).optional(),
    roas: z.number().min(0).optional(),
    conversions: z.number().min(0).optional(),
    spend: z.number().min(0).optional(),
    revenue: z.number().min(0).optional(),
  }),
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  schemas,
};