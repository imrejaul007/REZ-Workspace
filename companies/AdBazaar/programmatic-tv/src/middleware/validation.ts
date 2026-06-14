import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { CTVBidRequest, DealType, DealStatus } from '../types/index.js';

// ============================================================================
// Zod Schemas for Request Validation
// ============================================================================

// OpenRTB Bid Request Schema
export const CTVBidRequestSchema: ZodSchema<CTVBidRequest> = z.object({
  id: z.string().min(1),
  at: z.number().int().min(1).max(3),
  tmax: z.number().int().positive().optional(),
  imp: z.array(z.object({
    id: z.string().min(1),
    bidfloor: z.number().nonnegative().optional(),
    bidfloorcur: z.string().length(3).optional(),
    video: z.object({
      mimes: z.array(z.string()),
      minduration: z.number().int().nonnegative(),
      maxduration: z.number().int().positive(),
      linearity: z.number().int().min(1).max(2),
      skip: z.number().int().min(0).max(1).optional(),
      skipmin: z.number().int().nonnegative().optional(),
      skipafter: z.number().int().nonnegative().optional(),
      w: z.number().int().positive().optional(),
      h: z.number().int().positive().optional(),
      ctv: z.object({
        deviceCategory: z.enum(['smarttv', 'settop', 'gaming', 'streaming']),
        appBundle: z.string(),
        isLivingRoom: z.boolean(),
      }).optional(),
    }).optional(),
    pmp: z.object({
      private_auction: z.number().int().min(0).max(1),
      deals: z.array(z.object({
        id: z.string(),
        bidfloor: z.number().nonnegative(),
        bidfloorcur: z.string().length(3).optional(),
        at: z.number().int().min(1).max(3).optional(),
      })).optional(),
    }).optional(),
  })).min(1),
  device: z.object({
    devicetype: z.number().int().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    os: z.string().optional(),
    osv: z.string().optional(),
    connectiontype: z.number().int().optional(),
    geo: z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
    }).optional(),
  }).optional(),
  app: z.object({
    id: z.string(),
    name: z.string().optional(),
    bundle: z.string().optional(),
  }).optional(),
  site: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).optional(),
  user: z.object({
    id: z.string(),
    yob: z.number().int().positive().optional(),
    gender: z.string().optional(),
  }).optional(),
  test: z.number().int().min(0).max(1).optional(),
  cur: z.array(z.string().length(3)).optional(),
  regs: z.object({
    coppa: z.number().int().min(0).max(1).optional(),
  }).optional(),
}).refine(
  (data) => data.app || data.site,
  { message: 'Either app or site must be provided' }
);

// Batch Bid Request Schema
export const BatchBidRequestSchema = z.object({
  requestId: z.string().min(1),
  requests: z.array(CTVBidRequestSchema).min(1).max(100),
  options: z.object({
    parallel: z.boolean().optional(),
    timeout: z.number().int().positive().optional(),
  }).optional(),
});

// Private Deal Schema
export const CreateDealSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  advertiserId: z.string().min(1),
  advertiserName: z.string().optional(),
  publisherId: z.string().min(1),
  publisherName: z.string().optional(),
  type: z.nativeEnum(DealType),
  floorPrice: z.number().positive(),
  priceCurrency: z.string().length(3).default('USD'),
  targeting: z.object({
    geo: z.array(z.string()).optional(),
    deviceTypes: z.array(z.enum(['smarttv', 'settop', 'gaming', 'streaming'])).optional(),
    contentCategories: z.array(z.string()).optional(),
    deviceMakes: z.array(z.string()).optional(),
    deviceModels: z.array(z.string()).optional(),
    operatingSystems: z.array(z.string()).optional(),
    userAgeGroups: z.array(z.number()).optional(),
    userGenders: z.array(z.string()).optional(),
    dayParts: z.array(z.object({
      daysOfWeek: z.array(z.number().int().min(0).max(6)),
      startHour: z.number().int().min(0).max(23),
      endHour: z.number().int().min(0).max(23),
      timezone: z.string().optional(),
    })).optional(),
    inventorySources: z.array(z.string()).optional(),
  }).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  status: z.nativeEnum(DealStatus).optional(),
  priority: z.number().int().min(0).optional(),
  impressionsLimit: z.number().int().positive().optional(),
  budgetLimit: z.number().positive().optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  { message: 'endDate must be after startDate', path: ['endDate'] }
);

export const UpdateDealSchema = CreateDealSchema.partial();

// Bidder Seat Schema
export const CreateSeatSchema = z.object({
  name: z.string().min(1).max(255),
  advertiserId: z.string().min(1),
  organizationName: z.string().optional(),
  contactEmail: z.string().email(),
  status: z.enum(['active', 'suspended', 'inactive']).optional(),
  allowedFormats: z.array(z.string()).optional(),
  allowedCategories: z.array(z.string()).optional(),
  bidLimits: z.object({
    dailyBudget: z.number().positive().optional(),
    monthlyBudget: z.number().positive().optional(),
    perBidMax: z.number().positive().optional(),
    dailyImpressions: z.number().int().positive().optional(),
  }).optional(),
  sspConnections: z.array(z.string()).optional(),
});

export const UpdateSeatSchema = CreateSeatSchema.partial();

// Floor Price Rule Schema
export const CreateFloorRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  priority: z.number().int().min(0).default(0),
  conditions: z.object({
    geo: z.array(z.string()).optional(),
    deviceTypes: z.array(z.enum(['smarttv', 'settop', 'gaming', 'streaming'])).optional(),
    contentCategories: z.array(z.string()).optional(),
    appBundles: z.array(z.string()).optional(),
    formats: z.array(z.string()).optional(),
    connectionTypes: z.array(z.number()).optional(),
    timeOfDay: z.object({
      startHour: z.number().int().min(0).max(23),
      endHour: z.number().int().min(0).max(23),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    }).optional(),
    dealTypes: z.array(z.nativeEnum(DealType)).optional(),
  }),
  floorPrice: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  status: z.enum(['active', 'paused', 'deleted']).optional(),
});

export const UpdateFloorRuleSchema = CreateFloorRuleSchema.partial();

// Pagination Schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Validation Middleware Factory
// ============================================================================

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body validation failed',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter validation failed',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const params = schema.parse(req.params);
      req.params = params as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URL parameter validation failed',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================================================
// Pre-built Validation Middlewares
// ============================================================================

export const validateBidRequest = validateBody(CTVBidRequestSchema);
export const validateBatchBidRequest = validateBody(BatchBidRequestSchema);
export const validateCreateDeal = validateBody(CreateDealSchema);
export const validateUpdateDeal = validateBody(UpdateDealSchema);
export const validateCreateSeat = validateBody(CreateSeatSchema);
export const validateUpdateSeat = validateBody(UpdateSeatSchema);
export const validateCreateFloorRule = validateBody(CreateFloorRuleSchema);
export const validateUpdateFloorRule = validateBody(UpdateFloorRuleSchema);
export const validatePagination = validateQuery(PaginationSchema);