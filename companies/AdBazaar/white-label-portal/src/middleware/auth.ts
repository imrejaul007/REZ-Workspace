import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from 'utils/logger.js';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        agencyId?: string;
        role?: string;
      };
      serviceAuth?: {
        serviceId: string;
        authenticated: boolean;
      };
    }
  }
}

/**
 * Internal service authentication middleware
 * Verifies the X-Internal-Service-Token header for service-to-service communication
 */
export const serviceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceToken = req.headers['x-internal-service-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  // If no token is configured, allow all requests (development mode)
  if (!expectedToken) {
    req.serviceAuth = {
      serviceId: 'unknown',
      authenticated: true,
    };
    next();
    return;
  }

  if (!serviceToken) {
    logger.warn('Missing service token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing service authentication token',
    });
    return;
  }

  if (serviceToken !== expectedToken) {
    logger.warn('Invalid service token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid service authentication token',
    });
    return;
  }

  req.serviceAuth = {
    serviceId: req.headers['x-service-id'] as string || 'unknown',
    authenticated: true,
  };

  next();
};

/**
 * Optional service auth - allows requests without token but validates if present
 */
export const optionalServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceToken = req.headers['x-internal-service-token'] as string;

  if (!serviceToken) {
    req.serviceAuth = {
      serviceId: 'anonymous',
      authenticated: false,
    };
    next();
    return;
  }

  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (serviceToken === expectedToken) {
    req.serviceAuth = {
      serviceId: req.headers['x-service-id'] as string || 'unknown',
      authenticated: true,
    };
  } else {
    req.serviceAuth = {
      serviceId: 'invalid',
      authenticated: false,
    };
  }

  next();
};

/**
 * Agency authentication middleware
 * Verifies the X-Agency-Id header for agency-specific operations
 */
export const agencyAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const agencyId = req.headers['x-agency-id'] as string;

  if (!agencyId) {
    logger.warn('Missing agency ID', {
      path: req.path,
      method: req.method,
    });
    res.status(400).json({
      error: 'Bad Request',
      message: 'Missing X-Agency-Id header',
    });
    return;
  }

  req.user = {
    id: agencyId,
    agencyId,
    role: 'agency',
  };

  next();
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role || '')) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Request validation middleware using Zod
 */
export const validate = <T extends z.ZodSchema>(schema: T, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation failed', {
          path: req.path,
          errors,
        });

        res.status(400).json({
          error: 'Validation Error',
          message: 'Request validation failed',
          errors,
        });
        return;
      }

      // Replace with validated data
      if (source === 'body') {
        req.body = result.data;
      } else if (source === 'query') {
        req.query = result.data;
      } else {
        req.params = result.data;
      }

      next();
    } catch (error) {
      logger.error('Validation error', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation processing failed',
      });
    }
  };
};

// Common validation schemas
export const schemas = {
  // Portal schemas
  createPortal: z.object({
    agencyId: z.string().min(1),
    name: z.string().min(1).max(100),
    slug: z.string().min(4).max(32).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
    domain: z.string().optional(),
    settings: z.object({
      allowCustomDomain: z.boolean().optional(),
      allowSubdomains: z.boolean().optional(),
      maxClients: z.number().positive().optional(),
      maxCampaigns: z.number().positive().optional(),
      features: z.object({
        analytics: z.boolean().optional(),
        reporting: z.boolean().optional(),
        whiteLabelReports: z.boolean().optional(),
        customBranding: z.boolean().optional(),
        apiAccess: z.boolean().optional(),
      }).optional(),
      limits: z.object({
        impressions: z.number().nonnegative().optional(),
        clicks: z.number().nonnegative().optional(),
        campaigns: z.number().nonnegative().optional(),
      }).optional(),
    }).optional(),
  }),

  updatePortal: z.object({
    name: z.string().min(1).max(100).optional(),
    domain: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
    settings: z.object({
      allowCustomDomain: z.boolean().optional(),
      allowSubdomains: z.boolean().optional(),
      maxClients: z.number().positive().optional(),
      maxCampaigns: z.number().positive().optional(),
      features: z.object({
        analytics: z.boolean().optional(),
        reporting: z.boolean().optional(),
        whiteLabelReports: z.boolean().optional(),
        customBranding: z.boolean().optional(),
        apiAccess: z.boolean().optional(),
      }).optional(),
      limits: z.object({
        impressions: z.number().nonnegative().optional(),
        clicks: z.number().nonnegative().optional(),
        campaigns: z.number().nonnegative().optional(),
      }).optional(),
    }).optional(),
  }),

  // Branding schemas
  createBranding: z.object({
    logo: z.object({
      url: z.string().url(),
      alt: z.string().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
    }),
    favicon: z.object({
      url: z.string().url(),
      type: z.string().optional(),
    }),
    colors: z.object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      success: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      error: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }).optional(),
    fonts: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      code: z.string().optional(),
    }).optional(),
    customCSS: z.string().optional(),
    emailTemplate: z.object({
      headerLogo: z.string().url().optional(),
      footerText: z.string().optional(),
      socialLinks: z.object({
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        facebook: z.string().url().optional(),
      }).optional(),
    }).optional(),
  }),

  // Domain schemas
  createDomain: z.object({
    domain: z.string().min(1),
    subdomain: z.string().optional(),
    method: z.enum(['CNAME', 'TXT', 'A']).optional(),
  }),

  // Analytics schemas
  analyticsQuery: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    clientId: z.string().optional(),
    campaignId: z.string().optional(),
    granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
    days: z.coerce.number().min(1).max(365).optional(),
  }),

  // Report schemas
  createReport: z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['performance', 'client', 'campaign', 'financial', 'custom']),
    metrics: z.array(z.string()),
    dimensions: z.array(z.string()),
    filters: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      clientIds: z.array(z.string()).optional(),
      campaignIds: z.array(z.string()).optional(),
      countries: z.array(z.string()).optional(),
      devices: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional(),
    }).optional(),
    schedule: z.object({
      enabled: z.boolean(),
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      recipients: z.array(z.string().email()),
    }).optional(),
    format: z.enum(['json', 'csv', 'pdf', 'excel']),
  }),
};

export { serviceAuth, agencyAuth, validate };