import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import logger from '../config/logger.js';

/**
 * Zod validation schemas for API requests
 */

// Merchant ID parameter schema
export const merchantIdParamSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required').max(50),
});

// Query schemas
export const insightsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
});

export const revenueQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
});

export const productsQuerySchema = z.object({
  sortBy: z.enum(['revenue', 'units', 'margin', 'growth']).optional().default('revenue'),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const recommendationsQuerySchema = z.object({
  category: z.enum(['all', 'revenue', 'marketing', 'inventory', 'pricing', 'customer']).optional().default('all'),
  priority: z.enum(['all', 'critical', 'high', 'medium', 'low']).optional().default('all'),
});

export const competitorsQuerySchema = z.object({
  radius: z.coerce.number().min(1).max(50).optional().default(5),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

// Body schemas for POST requests
export const createMerchantSchema = z.object({
  merchantId: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  location: z.object({
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    pincode: z.string().min(1).max(20),
  }),
});

export const createRevenueRecordSchema = z.object({
  merchantId: z.string().min(1),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  revenue: z.number().min(0),
  orders: z.number().min(0).int(),
  averageOrderValue: z.number().min(0),
  costs: z.object({
    cogs: z.number().min(0).optional(),
    marketing: z.number().min(0).optional(),
    operations: z.number().min(0).optional(),
    other: z.number().min(0).optional(),
  }).optional(),
});

export const createProductPerformanceSchema = z.object({
  merchantId: z.string().min(1),
  productId: z.string().min(1),
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  revenue: z.number().min(0),
  unitsSold: z.number().min(0).int(),
  margin: z.number().min(0).max(100),
  returnRate: z.number().min(0).max(100).optional().default(0),
  trend: z.enum(['rising', 'falling', 'stable']).optional().default('stable'),
});

export const createCustomerSchema = z.object({
  merchantId: z.string().min(1),
  customerId: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstPurchase: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  lastPurchase: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  totalOrders: z.number().min(0).int().optional().default(1),
  totalSpent: z.number().min(0).optional().default(0),
  averageOrderValue: z.number().min(0).optional().default(0),
  rfmScores: z.object({
    recency: z.number().min(0).max(5).optional().default(0),
    frequency: z.number().min(0).max(5).optional().default(0),
    monetary: z.number().min(0).max(5).optional().default(0),
  }).optional(),
  segment: z.string().optional().default('new'),
  churnRisk: z.enum(['high', 'medium', 'low']).optional().default('low'),
});

export const createCompetitorSchema = z.object({
  competitorId: z.string().min(1),
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  pricePosition: z.enum(['premium', 'mid', 'budget']).optional().default('mid'),
  estimatedRevenue: z.number().min(0).optional().default(0),
  rating: z.number().min(0).max(5).optional().default(0),
  reviewCount: z.number().min(0).int().optional().default(0),
  strengths: z.array(z.string()).optional().default([]),
  weaknesses: z.array(z.string()).optional().default([]),
});

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

        logger.warn('Validation failed', {
          path: req.path,
          errors,
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors,
          },
        });
        return;
      }

      next(error);
    }
  };
};

/**
 * Validate merchant ID from params
 */
export const validateMerchantId = validate(merchantIdParamSchema, 'params');

/**
 * Validate insights query
 */
export const validateInsightsQuery = validate(insightsQuerySchema, 'query');

/**
 * Validate revenue query
 */
export const validateRevenueQuery = validate(revenueQuerySchema, 'query');

/**
 * Validate products query
 */
export const validateProductsQuery = validate(productsQuerySchema, 'query');

/**
 * Validate recommendations query
 */
export const validateRecommendationsQuery = validate(recommendationsQuerySchema, 'query');

/**
 * Validate competitors query
 */
export const validateCompetitorsQuery = validate(competitorsQuerySchema, 'query');

/**
 * Validate create merchant body
 */
export const validateCreateMerchant = validate(createMerchantSchema, 'body');

/**
 * Validate create revenue record body
 */
export const validateCreateRevenueRecord = validate(createRevenueRecordSchema, 'body');

/**
 * Validate create product performance body
 */
export const validateCreateProductPerformance = validate(createProductPerformanceSchema, 'body');

/**
 * Validate create customer body
 */
export const validateCreateCustomer = validate(createCustomerSchema, 'body');

/**
 * Validate create competitor body
 */
export const validateCreateCompetitor = validate(createCompetitorSchema, 'body');
