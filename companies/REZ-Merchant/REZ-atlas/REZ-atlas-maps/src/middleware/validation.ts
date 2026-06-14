/**
 * Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Bounds validation schema
const boundsSchema = z.object({
  north: z.coerce.number().min(-90).max(90),
  south: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
  west: z.coerce.number().min(-180).max(180),
}).refine((data) => data.north > data.south, {
  message: 'North must be greater than south',
}).refine((data) => data.east > data.west, {
  message: 'East must be greater than west',
});

// Heat query validation
export const heatQuerySchema = z.object({
  bounds: z.string().optional(),
  north: z.coerce.number().min(-90).max(90).optional(),
  south: z.coerce.number().min(-90).max(90).optional(),
  east: z.coerce.number().min(-180).max(180).optional(),
  west: z.coerce.number().min(-180).max(180).optional(),
  category: z.string().optional(),
  metric: z.enum(['density', 'revenue', 'growth', 'competition']).optional(),
  gridSize: z.coerce.number().min(1).max(100).optional(),
});

// Cluster query validation
export const clusterQuerySchema = z.object({
  bounds: z.string().optional(),
  north: z.coerce.number().min(-90).max(90).optional(),
  south: z.coerce.number().min(-90).max(90).optional(),
  east: z.coerce.number().min(-180).max(180).optional(),
  west: z.coerce.number().min(-180).max(180).optional(),
  zoom: z.coerce.number().min(1).max(20).optional(),
  category: z.string().optional(),
  minCount: z.coerce.number().min(1).optional(),
});

// Territory params validation
export const territoryParamsSchema = z.object({
  territoryId: z.string().min(1),
});

// Middleware factory
export const validateHeatQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query = heatQuerySchema.parse(req.query) as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    } else {
      next(error);
    }
  }
};

export const validateClusterQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query = clusterQuerySchema.parse(req.query) as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    } else {
      next(error);
    }
  }
};

export const validateTerritoryParams = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.params = territoryParamsSchema.parse(req.params) as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    } else {
      next(error);
    }
  }
};