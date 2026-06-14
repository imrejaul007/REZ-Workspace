/**
 * Makcorps Validators
 * Zod schemas for request validation
 */

import { z } from 'zod';

export const searchSchema = z.object({
  city: z.string().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.string().transform(Number).optional(),
  minRating: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
});

export const createBookingSchema = z.object({
  propertyId: z.string(),
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
  guestDetails: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
  })),
  specialRequests: z.string().optional(),
  corporateCode: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export const pricingSchema = z.object({
  propertyId: z.string(),
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  corporateCode: z.string().optional(),
});

export const getBookingsSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});

export type SearchInput = z.infer<typeof searchSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type PricingInput = z.infer<typeof pricingSchema>;
export type GetBookingsInput = z.infer<typeof getBookingsSchema>;
