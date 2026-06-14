import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Video Schemas
export const createVideoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  duration: z.number().min(0),
  format: z.enum(['mp4', 'webm', 'mov', 'avi', 'mkv']).optional(),
  resolution: z.string().optional(),
  fileSize: z.number().min(0).optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().min(1),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Sponsor Schemas
export const addSponsorSchema = z.object({
  advertiserId: z.string().min(1),
  placement: z.enum(['pre_roll', 'mid_roll', 'post_roll', 'overlay', 'banner']),
  bid: z.object({
    amount: z.number().min(0),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
    type: z.enum(['cpm', 'cpc', 'cpv']),
  }),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
});

// Campaign Schemas
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  advertiserId: z.string().min(1),
  videoId: z.string().min(1),
  targeting: z.object({
    demographics: z.object({
      ageRange: z.object({
        min: z.number().min(13).max(100).optional(),
        max: z.number().min(13).max(100).optional(),
      }).optional(),
      gender: z.array(z.string()).optional(),
      location: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
    }).optional(),
    devices: z.array(z.string()).optional(),
    platforms: z.array(z.string()).optional(),
    timeSlots: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })).optional(),
    customRules: z.record(z.any()).optional(),
  }).optional(),
  budget: z.object({
    total: z.number().min(0),
    daily: z.number().min(0).optional(),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
  }),
  schedule: z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()).optional(),
    frequency: z.number().min(1).optional(),
  }).optional(),
  priority: z.number().min(1).max(10).optional(),
});

export const setTargetingSchema = z.object({
  demographics: z.object({
    ageRange: z.object({
      min: z.number().min(13).max(100).optional(),
      max: z.number().min(13).max(100).optional(),
    }).optional(),
    gender: z.array(z.string()).optional(),
    location: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
  devices: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  timeSlots: z.array(z.object({
    start: z.string(),
    end: z.string(),
  })).optional(),
  customRules: z.record(z.any()).optional(),
});

// Analytics Schemas
export const recordViewSchema = z.object({
  views: z.number().min(1).optional(),
  uniqueViews: z.number().min(1).optional(),
  source: z.string().optional(),
  device: z.string().optional(),
  geo: z.string().optional(),
  watchTime: z.number().min(0).optional(),
  campaignId: z.string().optional(),
});

export const recordEngagementSchema = z.object({
  type: z.enum(['like', 'comment', 'share', 'save']),
});

// Validation middleware factory
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error', {
          path: req.path,
          errors: error.errors,
        });
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Query validation error', {
          path: req.path,
          errors: error.errors,
        });
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Params validation error', {
          path: req.path,
          errors: error.errors,
        });
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid path parameters',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
}

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const listVideosQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  advertiserId: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export default {
  createVideoSchema,
  updateVideoSchema,
  addSponsorSchema,
  createCampaignSchema,
  setTargetingSchema,
  recordViewSchema,
  recordEngagementSchema,
  validateBody,
  validateQuery,
  validateParams,
  paginationSchema,
  listVideosQuerySchema,
  dateRangeSchema,
};