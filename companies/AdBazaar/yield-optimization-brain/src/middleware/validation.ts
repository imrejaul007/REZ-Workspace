import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import logger from '../config/logger.js';

/**
 * Validation schemas for yield optimization requests
 */

// Yield Decision Schema
export const yieldDecisionSchema = z.object({
  inventorySlot: z.object({
    id: z.string().min(1),
    type: z.enum(['banner', 'video', 'native', 'interstitial']),
    format: z.enum(['display', 'video', 'audio']),
    size: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    context: z.string(),
    placement: z.string().optional(),
    floorPrice: z.number().positive().optional(),
    minBid: z.number().positive().optional(),
  }),
  userContext: z.object({
    segments: z.array(z.string()).default([]),
    intentScore: z.number().min(0).max(1),
    userId: z.string().optional(),
    deviceType: z.enum(['mobile', 'desktop', 'tablet']).optional(),
    location: z.string().optional(),
    timeOfDay: z.number().min(0).max(23).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
  }),
  eligibleAds: z.array(
    z.object({
      ad: z.object({
        id: z.string().min(1),
        advertiserId: z.string().min(1),
        advertiserName: z.string(),
        campaignId: z.string(),
        type: z.enum(['image', 'video', 'text', 'html']),
        format: z.string(),
        bid: z.number().positive(),
        ctr: z.number().min(0).max(1),
        conversionRate: z.number().min(0).max(1),
        cpa: z.number().positive(),
        frequency: z.number().min(0),
        lastSeen: z.date().optional(),
        qualityScore: z.number().min(0).max(100).optional(),
        category: z.array(z.string()).optional(),
      }),
      eligibility: z.object({
        matched: z.boolean(),
        reason: z.string().optional(),
      }),
    })
  ),
  optimizationGoal: z.enum(['revenue', 'conversions', 'ltv']).optional(),
  constraints: z
    .object({
      minCTR: z.number().min(0).max(1).optional(),
      maxFrequency: z.number().positive().optional(),
      maxAdsPerUser: z.number().positive().optional(),
      brandSafetyThreshold: z.number().min(0).max(1).optional(),
      pacingLimits: z
        .array(
          z.object({
            advertiserId: z.string(),
            maxSpendPerHour: z.number().positive(),
            dailyBudget: z.number().positive(),
          })
        )
        .optional(),
    })
    .optional(),
});

// Floor Price Request Schema
export const floorPriceRequestSchema = z.object({
  inventoryId: z.string().min(1),
  context: z
    .object({
      segments: z.array(z.string()).optional(),
      intentScore: z.number().min(0).max(1).optional(),
      timeOfDay: z.number().min(0).max(23).optional(),
      dayOfWeek: z.number().min(0).max(6).optional(),
    })
    .optional(),
  eligibleBidderCount: z.number().positive().optional(),
});

// Bid Landscape Request Schema
export const bidLandscapeRequestSchema = z.object({
  inventoryType: z.string().optional(),
  context: z.string().optional(),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional(),
});

// Revenue Attribution Request Schema
export const revenueAttributionRequestSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
  groupBy: z.enum(['ad', 'advertiser', 'placement', 'format', 'segment']).optional(),
  filters: z
    .object({
      advertiserId: z.string().optional(),
      placementId: z.string().optional(),
      format: z.string().optional(),
    })
    .optional(),
});

// Yield Prediction Request Schema
export const yieldPredictionRequestSchema = z.object({
  horizon: z.enum(['1h', '6h', '24h', '7d']),
  inventoryType: z.string().optional(),
  context: z.string().optional(),
});

// A/B Test Request Schema
export const abTestRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  strategies: z.array(z.string()).min(2),
  trafficAllocation: z.array(z.number().min(0).max(100)),
  duration: z.number().positive(), // days
  successMetrics: z.array(z.string()).optional(),
});

// Yield Strategy Schema
export const yieldStrategySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['floor_price', 'bid_allocation', 'audience_targeting', 'format_optimization']),
  config: z.record(z.unknown()).optional(),
  weights: z
    .object({
      revenue: z.number().min(0).max(1).optional(),
      conversions: z.number().min(0).max(1).optional(),
      ltv: z.number().min(0).max(1).optional(),
      ctr: z.number().min(0).max(1).optional(),
      brandSafety: z.number().min(0).max(1).optional(),
    })
    .optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});

/**
 * Validation middleware factory
 */
export function validate<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const result = schema.parse(data);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));

        logger.warn('Validation error', {
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
}

/**
 * Request ID middleware
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

/**
 * Request timing middleware
 */
export function requestTiming(req: Request, res: Response, next: NextFunction): void {
  req.startTime = Date.now();
  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error('Unhandled error', {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}