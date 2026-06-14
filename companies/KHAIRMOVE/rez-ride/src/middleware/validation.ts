import { z } from 'zod';

/**
 * Validation Schemas
 */

// Auth
export const requestOTPSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  type: z.enum(['login', 'register']).optional().default('login'),
});

export const verifyOTPSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(4, 'OTP must be 4 digits'),
});

// Ride
export const createRideSchema = z.object({
  pickup: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1),
  }),
  drop: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1),
  }),
  vehicleType: z.enum(['auto', 'cab', 'suv', 'bike']),
  paymentMethod: z.enum(['wallet', 'upi', 'cash', 'card']).optional().default('wallet'),
});

export const cancelRideSchema = z.object({
  reason: z.string().min(1).optional(),
});

// Driver
export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Fare
export const fareEstimateSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropLat: z.number().min(-90).max(90),
  dropLng: z.number().min(-180).max(180),
  vehicleType: z.enum(['auto', 'cab', 'suv', 'bike']).optional().default('auto'),
});

// Ticket
export const createTicketSchema = z.object({
  type: z.enum(['complaint', 'refund', 'feedback', 'lost_found', 'safety', 'billing']),
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  rideId: z.string().optional(),
});

// Feedback
export const feedbackSchema = z.object({
  rideId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// Corporate
export const corporateBookingSchema = z.object({
  pickup: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }),
  drop: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }),
  vehicleType: z.enum(['auto', 'cab', 'suv']),
  employeeId: z.string(),
  companyId: z.string(),
});

// Voucher
export const applyVoucherSchema = z.object({
  code: z.string().min(4).max(20),
  rideId: z.string().optional(),
});

// Helper function for validation
export const validate = (schema: z.ZodSchema) => {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return { valid: true, data: result.data };
  };
};
