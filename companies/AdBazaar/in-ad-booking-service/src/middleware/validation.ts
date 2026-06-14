/**
 * Validation middleware using Zod
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { BookingType } from '../types';

// Create booking schema
export const createBookingSchema = z.object({
  adId: z.string().min(1, 'Ad ID is required'),
  advertiserId: z.string().min(1, 'Advertiser ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  businessId: z.string().min(1, 'Business ID is required'),
  type: z.enum(['restaurant', 'healthcare', 'salon', 'service', 'appointment'] as const),
  details: z.object({
    date: z.string().datetime().optional(),
    time: z.string().optional(),
    guests: z.number().int().min(1).max(100).optional(),
    service: z.string().optional(),
    notes: z.string().max(500).optional(),
  }),
  paymentRequired: z.boolean().optional().default(false),
  paymentAmount: z.number().min(0).optional(),
});

// Get booking schema
export const getBookingSchema = z.object({
  id: z.string().min(1),
});

// Cancel booking schema
export const cancelBookingSchema = z.object({
  id: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// Confirm booking schema
export const confirmBookingSchema = z.object({
  id: z.string().min(1),
});

// Get user bookings schema
export const getUserBookingsSchema = z.object({
  userId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Get ad bookings schema
export const getAdBookingsSchema = z.object({
  adId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Payment schema
export const paymentSchema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(['wallet', 'card', 'upi', 'netbanking']).optional().default('wallet'),
});

// Validation middleware factory
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
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
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    req.query = result.data as Record<string, string>;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    next();
  };
}