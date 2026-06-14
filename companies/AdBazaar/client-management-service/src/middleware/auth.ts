import { Request, Response, NextFunction } from 'express';
import { logger, errorTotal } from '../utils';
import { z } from 'zod';

// Extend Express Request to include user/service info
declare global {
  namespace Express {
    interface Request {
      serviceId?: string;
      agencyId?: string;
      userId?: string;
      userRole?: string;
    }
  }
}

// Internal service authentication middleware
export const internalServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const internalToken = req.headers['x-internal-service-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

  // Skip auth in development if no token is required
  if (process.env.NODE_ENV === 'development' && !internalToken) {
    req.serviceId = 'dev-service';
    req.agencyId = 'dev-agency';
    return next();
  }

  if (internalToken !== expectedToken) {
    errorTotal.inc({ type: 'auth', operation: 'unauthorized' });
    logger.warn('Unauthorized access attempt', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing internal service token',
      },
    });
  }

  // Extract service info from token (in production, this would be decoded from JWT)
  req.serviceId = req.headers['x-service-id'] as string || 'unknown';
  req.agencyId = req.headers['x-agency-id'] as string || 'default';

  next();
};

// Agency-level authorization
export const agencyAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const agencyId = req.headers['x-agency-id'] as string;

  if (!agencyId) {
    errorTotal.inc({ type: 'auth', operation: 'missing_agency' });
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_AGENCY',
        message: 'Agency ID is required',
      },
    });
  }

  req.agencyId = agencyId;
  next();
};

// Rate limiting middleware (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (
  windowMs: number = 60000,
  maxRequests: number = 100
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowData = rateLimitStore.get(key);

    if (!windowData || now > windowData.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (windowData.count >= maxRequests) {
      errorTotal.inc({ type: 'rate_limit', operation: 'exceeded' });
      logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((windowData.resetTime - now) / 1000),
        },
      });
    }

    windowData.count++;
    next();
  };
};

// Request validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorTotal.inc({ type: 'validation', operation: 'schema' });
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  errorTotal.inc({ type: 'server', operation: 'error' });

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An internal error occurred'
        : err.message,
    },
  });
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      agencyId: req.agencyId,
    });
  });

  next();
};

// Validation schemas for common operations
export const validationSchemas = {
  createClient: z.object({
    name: z.string().min(1).max(200),
    industry: z.string().min(1).max(100),
    status: z.enum(['active', 'inactive', 'prospect', 'churned']).optional(),
    budget: z.object({
      monthly: z.number().min(0).optional(),
      quarterly: z.number().min(0).optional(),
      yearly: z.number().min(0).optional(),
      currency: z.string().optional(),
    }).optional(),
    metadata: z.object({
      website: z.string().url().optional(),
      address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
      }).optional(),
      social: z.object({
        linkedin: z.string().optional(),
        twitter: z.string().optional(),
        facebook: z.string().optional(),
      }).optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
  }),

  createContact: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.string().min(1),
    department: z.string().optional(),
    isPrimary: z.boolean().optional(),
    metadata: z.object({
      birthday: z.string().datetime().optional(),
      linkedin: z.string().url().optional(),
      timezone: z.string().optional(),
    }).optional(),
  }),

  createNote: z.object({
    content: z.string().min(1),
    type: z.enum(['general', 'meeting', 'strategy', 'issue', 'update']).optional(),
    isPinned: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional(),
  }),

  linkCampaign: z.object({
    campaignId: z.string().min(1),
    name: z.string().min(1),
    budget: z.number().min(0).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  }),

  updateClient: z.object({
    name: z.string().min(1).max(200).optional(),
    industry: z.string().min(1).max(100).optional(),
    status: z.enum(['active', 'inactive', 'prospect', 'churned']).optional(),
    budget: z.object({
      monthly: z.number().min(0).optional(),
      quarterly: z.number().min(0).optional(),
      yearly: z.number().min(0).optional(),
      currency: z.string().optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
  }),
};

export default {
  internalServiceAuth,
  agencyAuth,
  rateLimit,
  validateRequest,
  errorHandler,
  requestLogger,
  validationSchemas,
};