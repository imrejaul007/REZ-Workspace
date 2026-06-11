/**
 * FLEETIQ - Zod Validation Middleware
 * Production-ready request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

// ============================================
// VALIDATION FACTORY
// ============================================

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validatedData = schema.parse(dataToValidate);

      // Replace with validated data (ensures type safety)
      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'query') {
        (req as any).validatedQuery = validatedData;
      } else {
        (req as any).validatedParams = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validation failed', { errors, path: req.path, method: req.method });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        });
        return;
      }

      next(error);
    }
  };
};

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

export const schemas = {
  // ObjectId validation
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),

  // Location validation
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional()
  }),

  // Address validation
  address: z.object({
    address: z.string().min(1, 'Address is required'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),

  // Pagination query schema
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional()
  }),

  // ID parameter schema
  idParam: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
  }),

  // ============================================
  // VEHICLE SCHEMAS
  // ============================================

  createVehicle: z.object({
    registrationNumber: z.string()
      .min(2, 'Registration number too short')
      .max(20, 'Registration number too long'),
    type: z.enum(['truck', 'van', 'car', 'bike'], {
      errorMap: () => ({ message: 'Type must be: truck, van, car, or bike' })
    }),
    capacity: z.number().positive('Capacity must be positive'),
    status: z.enum(['available', 'on-trip', 'maintenance', 'idle']).optional(),
    fuelLevel: z.number().min(0).max(100).optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      address: z.string().optional()
    }).optional(),
    driverId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
  }),

  updateVehicleLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional()
  }),

  updateVehicleStatus: z.object({
    status: z.enum(['available', 'on-trip', 'maintenance', 'idle'], {
      errorMap: () => ({ message: 'Invalid status' })
    })
  }),

  // ============================================
  // DRIVER SCHEMAS
  // ============================================

  createDriver: z.object({
    name: z.string().min(2, 'Name too short').max(100, 'Name too long'),
    phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number'),
    licenseNumber: z.string().min(5, 'License number too short').max(30, 'License number too long'),
    status: z.enum(['available', 'on-trip', 'off-duty']).optional()
  }),

  updateDriverRating: z.object({
    rating: z.number().min(0).max(5, 'Rating must be between 0 and 5')
  }),

  // ============================================
  // TRIP SCHEMAS
  // ============================================

  createTrip: z.object({
    vehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID'),
    driverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID'),
    origin: z.object({
      address: z.string().min(1, 'Origin address required'),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    destination: z.object({
      address: z.string().min(1, 'Destination address required'),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    cargoWeight: z.number().positive().optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).optional()
  }),

  updateTripStatus: z.object({
    status: z.enum(['pending', 'in-progress', 'completed', 'cancelled'], {
      errorMap: () => ({ message: 'Invalid trip status' })
    })
  }),

  // ============================================
  // MAINTENANCE SCHEMAS
  // ============================================

  createMaintenance: z.object({
    vehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID'),
    type: z.enum(['scheduled', 'repair', 'emergency'], {
      errorMap: () => ({ message: 'Type must be: scheduled, repair, or emergency' })
    }),
    description: z.string().min(5, 'Description too short').max(500, 'Description too long'),
    cost: z.number().min(0).optional(),
    date: z.string().or(z.date()).optional()
  }),

  // ============================================
  // AI AGENT SCHEMAS
  // ============================================

  dispatchOptimize: z.object({
    origin: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    destination: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    cargoWeight: z.number().positive().optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    preferences: z.object({
      prioritizeSpeed: z.boolean().optional(),
      prioritizeCost: z.boolean().optional(),
      avoidHighways: z.boolean().optional()
    }).optional()
  }),

  routeCalculate: z.object({
    stops: z.array(z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      address: z.string().optional(),
      order: z.number().optional()
    })).min(2, 'At least 2 stops required'),
    optimize: z.boolean().default(true),
    preferences: z.object({
      avoidTolls: z.boolean().optional(),
      avoidHighways: z.boolean().optional(),
      fastestRoute: z.boolean().optional()
    }).optional()
  }),

  fleetAnalyze: z.object({
    metrics: z.array(z.enum(['utilization', 'fuel', 'maintenance', 'performance'])).optional(),
    period: z.enum(['day', 'week', 'month', 'quarter']).default('week')
  }),

  driverCoach: z.object({
    driverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID'),
    situation: z.enum(['route_planning', 'fuel_management', 'break_reminder', 'safety_tip', 'performance_review']),
    context: z.record(z.any()).optional()
  })
};

// ============================================
// ERROR FORMATTER
// ============================================

export const formatZodError = (error: ZodError): string[] => {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
};

export default { validate, schemas, formatZodError };