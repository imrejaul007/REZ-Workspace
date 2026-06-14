import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validate request body against a Zod schema
 */
export const validateBody = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error:', error.errors);
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Validate request params
 */
export const validateParams = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Param validation error:', error.errors);
        res.status(400).json({
          success: false,
          error: 'Invalid parameter',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Validate request query
 */
export const validateQuery = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Query validation error:', error.errors);
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  // Account schemas
  createAccount: z.object({
    userId: z.string().min(1, 'User ID is required'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    email: z.string().email('Invalid email').optional()
  }),

  // Transaction schemas
  earnPoints: z.object({
    accountId: z.string().min(1, 'Account ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    vertical: z.string().min(1, 'Vertical is required'),
    points: z.number().positive('Points must be positive'),
    source: z.string().min(1, 'Source is required'),
    sourceId: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    expiresInDays: z.number().positive().optional()
  }),

  redeemPoints: z.object({
    accountId: z.string().min(1, 'Account ID is required'),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    vertical: z.string().min(1, 'Vertical is required'),
    points: z.number().positive('Points must be positive'),
    sourceId: z.string().optional(),
    description: z.string().min(1, 'Description is required')
  }),

  transferPoints: z.object({
    accountId: z.string().min(1, 'Account ID is required'),
    fromVertical: z.string().min(1, 'From vertical is required'),
    toVertical: z.string().min(1, 'To vertical is required'),
    points: z.number().positive('Points must be positive')
  }),

  // Cross-industry redemption
  crossIndustryRedemption: z.object({
    accountId: z.string().min(1, 'Account ID is required'),
    fromVertical: z.string().min(1, 'From vertical is required'),
    toVertical: z.string().min(1, 'To vertical is required'),
    points: z.number().positive('Points must be positive'),
    targetMerchantId: z.string().min(1, 'Target merchant ID is required')
  }),

  // Campaign schemas
  createCampaign: z.object({
    name: z.string().min(1, 'Campaign name is required'),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    vertical: z.string().min(1, 'Vertical is required'),
    type: z.enum(['points_boost', 'bonus', 'double']),
    multiplier: z.number().min(1, 'Multiplier must be at least 1'),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    maxParticipants: z.number().positive().optional()
  }),

  // Tier calculation
  calculateTier: z.object({
    totalPoints: z.number().min(0, 'Total points cannot be negative')
  }),

  // Common params
  accountId: z.object({
    accountId: z.string().min(1, 'Account ID is required')
  }),

  merchantId: z.object({
    merchantId: z.string().min(1, 'Merchant ID is required')
  }),

  tierName: z.object({
    tierName: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
  }),

  // Pagination
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().positive().max(100)).optional()
  })
};

export default {
  validateBody,
  validateParams,
  validateQuery,
  schemas
};