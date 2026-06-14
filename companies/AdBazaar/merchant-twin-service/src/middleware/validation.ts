/**
 * Validation Middleware using Zod
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import logger from '../utils/logger';

// Validation schemas
export const createMerchantTwinSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  business: z.object({
    name: z.string().min(1, 'Business name is required'),
    category: z.string().min(1, 'Category is required'),
    subcategory: z.string().min(1, 'Subcategory is required'),
    location: z.object({
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      country: z.string().min(1, 'Country is required'),
    }),
    size: z.enum(['small', 'medium', 'large']),
    rating: z.number().min(0).max(5).optional().default(0),
    yearsActive: z.number().min(0).optional().default(0),
  }),
  customerProfile: z.object({
    demographics: z.object({
      ageDistribution: z.array(z.object({
        range: z.string(),
        percentage: z.number().min(0).max(100),
      })).optional(),
      genderDistribution: z.record(z.string(), z.number()).optional(),
      incomeLevel: z.enum(['low', 'medium', 'high']).optional(),
    }).optional(),
    behavioral: z.object({
      avgVisitFrequency: z.number().optional(),
      avgOrderValue: z.number().optional(),
      peakHours: z.array(z.string()).optional(),
      popularDays: z.array(z.string()).optional(),
      repeatCustomerRate: z.number().min(0).max(1).optional(),
    }).optional(),
    size: z.number().optional(),
  }).optional(),
  advertising: z.object({
    adSpendHistory: z.array(z.object({
      month: z.string(),
      amount: z.number().min(0),
    })).optional(),
    preferredChannels: z.array(z.string()).optional(),
    targetAudience: z.array(z.string()).optional(),
    competitorOverlap: z.number().min(0).max(100).optional(),
    adEffectiveness: z.number().min(0).max(100).optional(),
  }).optional(),
  growth: z.object({
    monthlyGrowth: z.number().optional(),
    seasonalPatterns: z.array(z.string()).optional(),
    expansionPotential: z.number().min(0).max(100).optional(),
    investmentReadiness: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

export const updateMerchantTwinSchema = z.object({
  business: z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    subcategory: z.string().min(1).optional(),
    location: z.object({
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
    }).partial().optional(),
    size: z.enum(['small', 'medium', 'large']).optional(),
    rating: z.number().min(0).max(5).optional(),
    yearsActive: z.number().min(0).optional(),
  }).optional(),
  customerProfile: z.object({
    demographics: z.object({
      ageDistribution: z.array(z.object({
        range: z.string(),
        percentage: z.number().min(0).max(100),
      })).optional(),
      genderDistribution: z.record(z.string(), z.number()).optional(),
      incomeLevel: z.enum(['low', 'medium', 'high']).optional(),
    }).optional(),
    behavioral: z.object({
      avgVisitFrequency: z.number().optional(),
      avgOrderValue: z.number().optional(),
      peakHours: z.array(z.string()).optional(),
      popularDays: z.array(z.string()).optional(),
      repeatCustomerRate: z.number().min(0).max(1).optional(),
    }).optional(),
    size: z.number().optional(),
  }).optional(),
  advertising: z.object({
    adSpendHistory: z.array(z.object({
      month: z.string(),
      amount: z.number().min(0),
    })).optional(),
    preferredChannels: z.array(z.string()).optional(),
    targetAudience: z.array(z.string()).optional(),
    competitorOverlap: z.number().min(0).max(100).optional(),
    adEffectiveness: z.number().min(0).max(100).optional(),
  }).optional(),
  growth: z.object({
    monthlyGrowth: z.number().optional(),
    seasonalPatterns: z.array(z.string()).optional(),
    expansionPotential: z.number().min(0).max(100).optional(),
    investmentReadiness: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  city: z.string().optional(),
  investmentReadiness: z.enum(['low', 'medium', 'high']).optional(),
});

export const merchantIdParamSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
});

// Validation middleware factory
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      logger.warn('Validation error', { errors: result.error.issues });
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues.map(issue => ({
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

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      logger.warn('Query validation error', { errors: result.error.issues });
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      logger.warn('Param validation error', { errors: result.error.issues });
      res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    req.params = result.data as typeof req.params;
    next();
  };
}