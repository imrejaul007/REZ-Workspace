// KHAIRMOVE Zod Schemas
// Input validation for all KHAIRMOVE services

import { z } from 'zod';

// ============================================
// CORE SCHEMAS
// ============================================

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
});

export const fareEstimateSchema = z.object({
  vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']),
  pickup: locationSchema,
  drop: locationSchema,
  couponCode: z.string().optional(),
});

export const rideRequestSchema = z.object({
  pickup: locationSchema,
  drop: locationSchema,
  vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']),
  scheduledTime: z.string().datetime().optional(),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const cancelRideSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().max(1000).optional(),
});

export const rateRideSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().max(1000).optional(),
  tip: z.number().min(0).optional(),
});

// ============================================
// DRIVER SCHEMAS
// ============================================

export const driverRegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional(),
  vehicle: z.object({
    type: z.enum(['bike', 'auto', 'cab', 'suv']),
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z.number().min(2000).max(new Date().getFullYear() + 1),
    color: z.string().min(1).max(30),
    registrationNumber: z.string().regex(/^[A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{1,2}\s?[0-9]{4}$/i),
  }),
  documents: z.object({
    license: z.object({
      number: z.string().min(5).max(20),
      imageUrl: z.string().url(),
      expiryDate: z.string().datetime().optional(),
    }),
    rcBook: z.object({
      number: z.string().min(5).max(20),
      imageUrl: z.string().url(),
    }),
    aadhar: z.object({
      number: z.string().regex(/^\d{12}$/),
      imageUrl: z.string().url(),
    }),
  }),
  bankDetails: z.object({
    accountHolder: z.string().min(1).max(100),
    accountNumber: z.string().regex(/^\d{9,18}$/),
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i),
    bankName: z.string().min(1).max(100),
  }).optional(),
});

export const driverLocationUpdateSchema = z.object({
  location: locationSchema,
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
});

export const driverStatusUpdateSchema = z.object({
  status: z.enum(['offline', 'online', 'busy', 'in_ride']),
});

// ============================================
// DELIVERY SCHEMAS
// ============================================

export const deliveryItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1),
  weight: z.number().min(0).max(100).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
});

export const deliveryRequestSchema = z.object({
  pickup: locationSchema,
  drop: locationSchema,
  items: z.array(deliveryItemSchema).min(1).max(50),
  priority: z.enum(['standard', 'express', 'instant']).default('standard'),
  receiverName: z.string().min(1).max(100).optional(),
  receiverPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  instructions: z.string().max(500).optional(),
  estimatedWeight: z.number().min(0).max(100).optional(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned']),
  otpVerified: z.boolean().optional(),
  notes: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
});

// ============================================
// FLEET SCHEMAS
// ============================================

export const fleetCreationSchema = z.object({
  name: z.string().min(2).max(100),
  ownerId: z.string().uuid(),
  vehicleIds: z.array(z.string().uuid()).optional(),
  driverIds: z.array(z.string().uuid()).optional(),
});

export const dispatchRequestSchema = z.object({
  pickup: locationSchema,
  drop: locationSchema,
  vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']),
  scheduledTime: z.string().datetime().optional(),
  priority: z.enum(['standard', 'express', 'instant']).optional(),
});

export const vehicleSchema = z.object({
  type: z.enum(['bike', 'auto', 'cab', 'suv']),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().min(2000).max(new Date().getFullYear() + 1),
  color: z.string().min(1).max(30),
  registrationNumber: z.string().regex(/^[A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{1,2}\s?[0-9]{4}$/i),
});

// ============================================
// RENTAL SCHEMAS
// ============================================

export const rentalBookingSchema = z.object({
  packageId: z.string().uuid(),
  vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']),
  pickup: locationSchema,
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
});

export const rentalOtpVerifySchema = z.object({
  bookingId: z.string().uuid(),
  otp: z.string().length(4).regex(/^\d{4}$/),
});

export const completeRentalSchema = z.object({
  bookingId: z.string().uuid(),
  endOdometer: z.number().min(0).optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

// ============================================
// SUBSCRIPTION SCHEMAS
// ============================================

export const subscribeSchema = z.object({
  planId: z.string().uuid(),
  paymentMethod: z.enum(['wallet', 'razorpay', 'upi']).default('razorpay'),
  autoRenew: z.boolean().default(true),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
  feedback: z.string().max(1000).optional(),
});

// ============================================
// SAFETY SCHEMAS
// ============================================

export const sosAlertSchema = z.object({
  rideId: z.string().uuid(),
  type: z.enum(['emergency', 'accident', 'harassment']),
  location: locationSchema.optional(),
});

export const shareLocationSchema = z.object({
  rideId: z.string().uuid(),
  contacts: z.array(z.string().uuid()).min(1),
  duration: z.number().min(5).max(60).default(30),
});

export const reportRideSchema = z.object({
  rideId: z.string().uuid(),
  type: z.enum(['driver_behavior', 'vehicle_condition', 'safety', 'other']),
  description: z.string().min(10).max(1000),
  evidenceUrls: z.array(z.string().url()).max(5).optional(),
});

// ============================================
// CORPORATE SCHEMAS
// ============================================

export const corporateAccountSchema = z.object({
  companyName: z.string().min(2).max(200),
  contactPerson: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  address: locationSchema,
  creditLimit: z.number().min(0).default(0),
  policies: z.object({
    maxPerRide: z.number().min(0),
    allowedVehicleTypes: z.array(z.enum(['bike', 'auto', 'cab', 'suv'])),
    allowedDays: z.array(z.number().min(0).max(6)),
    blackoutDates: z.array(z.string().datetime()).optional(),
    requiresApproval: z.boolean().default(false),
  }),
});

export const addCorporateEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  department: z.string().max(100).optional(),
});

// ============================================
// VOUCHER SCHEMAS
// ============================================

export const voucherCreationSchema = z.object({
  code: z.string().min(4).max(20).regex(/^[A-Z0-9]+$/),
  type: z.enum(['discount', 'cashback', 'free_ride']),
  value: z.number().min(1),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  usageLimit: z.number().int().min(1).optional(),
  userLimit: z.number().int().min(1).default(1),
  applicableVehicles: z.array(z.enum(['bike', 'auto', 'cab', 'suv'])).optional(),
});

export const applyVoucherSchema = z.object({
  code: z.string().min(4).max(20),
  rideEstimate: fareEstimateSchema.optional(),
});

// ============================================
// ANALYTICS SCHEMAS
// ============================================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  filters: z.object({
    vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']).optional(),
    city: z.string().optional(),
    driverId: z.string().uuid().optional(),
  }).optional(),
});

// ============================================
// SEARCH & NEARBY SCHEMAS
// ============================================

export const nearbyDriversQuerySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(1).max(50).default(5), // km
  vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const geocodeSchema = z.object({
  address: z.string().min(5).max(500),
  city: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
});

export const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ============================================
// WEBHOOK SCHEMAS
// ============================================

export const paymentWebhookSchema = z.object({
  event: z.enum(['payment.success', 'payment.failed', 'refund.processed']),
  paymentId: z.string(),
  orderId: z.string(),
  amount: z.number(),
  status: z.enum(['success', 'failed', 'pending']),
  timestamp: z.string().datetime(),
});

export const razorpayWebhookSchema = paymentWebhookSchema.extend({
  razorpaySignature: z.string(),
});
