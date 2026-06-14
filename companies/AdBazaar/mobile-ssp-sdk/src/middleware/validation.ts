import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ZodError } from 'zod';

/**
 * Zod validation middleware factory
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Zod validation middleware for query params
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Query validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Zod validation middleware for params
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Params validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Validation Schemas

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const AddAppSchema = z.object({
  name: z.string().min(2, 'App name must be at least 2 characters'),
  platform: z.enum(['ios', 'android', 'react-native', 'flutter']),
  bundleId: z.string().min(3, 'Bundle ID must be at least 3 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
});

export const UpdateAppStatusSchema = z.object({
  status: z.enum(['active', 'pending', 'suspended']),
});

export const UpdateSettingsSchema = z.object({
  adFormats: z.array(z.enum(['banner', 'interstitial', 'native', 'rewarded', 'app-open'])).optional(),
  minCPM: z.number().min(0).max(100).optional(),
  autoRefresh: z.boolean().optional(),
  testMode: z.boolean().optional(),
});

export const CreatePlacementSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  name: z.string().min(2, 'Placement name must be at least 2 characters'),
  adFormat: z.enum(['banner', 'interstitial', 'native', 'rewarded', 'app-open']),
  width: z.number().optional(),
  height: z.number().optional(),
  position: z.enum(['top', 'bottom', 'center', 'interstitial']).optional(),
  refreshInterval: z.number().min(10).max(300).optional(),
  ecpm: z.number().min(0.01).max(100).optional(),
  targeting: z.object({
    countries: z.array(z.string()).optional(),
    excludedCountries: z.array(z.string()).optional(),
    devices: z.array(z.string()).optional(),
    osVersions: z.array(z.string()).optional(),
    demographics: z.object({
      ageMin: z.number().optional(),
      ageMax: z.number().optional(),
      gender: z.enum(['male', 'female', 'other']).optional(),
    }).optional(),
  }).optional(),
});

export const AdRequestSchema = z.object({
  placementId: z.string().min(1, 'Placement ID is required'),
  appId: z.string().min(1, 'App ID is required'),
  publisherId: z.string().min(1, 'Publisher ID is required'),
  platform: z.enum(['ios', 'android', 'react-native', 'flutter']),
  adFormat: z.enum(['banner', 'interstitial', 'native', 'rewarded', 'app-open']),
  deviceId: z.string().min(1, 'Device ID is required'),
  ipAddress: z.string().ip('Invalid IP address'),
  userAgent: z.string().min(1, 'User agent is required'),
  language: z.string().default('en'),
  country: z.string().default('US'),
  keywords: z.array(z.string()).optional(),
  demographics: z.object({
    age: z.number().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
  }).optional(),
});

export const ImpressionSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  adId: z.string().min(1, 'Ad ID is required'),
  placementId: z.string().min(1, 'Placement ID is required'),
  appId: z.string().min(1, 'App ID is required'),
  publisherId: z.string().min(1, 'Publisher ID is required'),
  viewable: z.boolean().optional(),
  viewableTime: z.number().optional(),
});

export const ClickSchema = z.object({
  impressionId: z.string().min(1, 'Impression ID is required'),
  requestId: z.string().min(1, 'Request ID is required'),
  adId: z.string().min(1, 'Ad ID is required'),
  placementId: z.string().min(1, 'Placement ID is required'),
  appId: z.string().min(1, 'App ID is required'),
  publisherId: z.string().min(1, 'Publisher ID is required'),
  deviceType: z.string().optional(),
});

export const EarningsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
});

export const PlacementIdSchema = z.object({
  placementId: z.string().min(1, 'Placement ID is required'),
});

export const AppIdSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
});

export const PublisherIdSchema = z.object({
  id: z.string().min(1, 'Publisher ID is required'),
});