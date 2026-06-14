/**
 * Shared Validation Schemas using Zod
 *
 * Centralized validation for common objects across services.
 * Usage:
 * ```typescript
 * const { success, data, error } = createOrderSchema.safeParse(req.body);
 * ```
 */

import { z } from 'zod';

/**
 * Phone number validation (India)
 */
const phoneSchema = z
  .string()
  .regex(/^(\+91|91)?[6-9]\d{9}$/, 'Invalid phone number');

/**
 * Pincode validation (India)
 */
const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Pincode must be 6 digits');

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .optional();

/**
 * Address schema
 */
export const addressSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: phoneSchema,
  email: emailSchema,
  addressLine1: z.string().min(1, 'Address line 1 is required').max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(50),
  state: z.string().min(1, 'State is required').max(50),
  pincode: pincodeSchema,
  country: z.string().max(50).default('India'),
  landmark: z.string().max(100).optional(),
  addressType: z.enum(['home', 'work', 'other']).default('home'),
});

export type Address = z.infer<typeof addressSchema>;

/**
 * Order creation schema
 */
export const createOrderSchema = z.object({
  deliveryAddress: addressSchema,
  paymentMethod: z.enum(['cod', 'wallet', 'razorpay', 'upi', 'card', 'netbanking']),
  fulfillmentType: z.enum(['delivery', 'pickup', 'dine_in', 'drive_thru']).default('delivery'),
  specialInstructions: z.string().max(500).optional(),
  couponCode: z.string().max(20).optional(),
  coinsUsed: z.object({
    rezCoins: z.number().nonnegative().optional(),
    promoCoins: z.number().nonnegative().optional(),
    storePromoCoins: z.number().nonnegative().optional(),
  }).refine(data => Object.values(data).some(v => typeof v === 'number' && v > 0), {
    message: 'At least one coin type must have a positive value',
  }).optional(),
  idempotencyKey: z.string().uuid('Invalid idempotency key format'),
  fulfillmentDetails: z.object({
    tableNumber: z.string().optional(),
    storeAddress: z.string().optional(),
    estimatedReadyTime: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
    pickupInstructions: z.string().optional(),
  }).optional(),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

/**
 * Order status update schema
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'placed', 'confirmed', 'preparing', 'ready',
    'dispatched', 'out_for_delivery', 'delivered',
    'cancelled', 'cancelling', 'returned', 'refunded'
  ]),
  note: z.string().max(500).optional(),
});

export type UpdateOrderStatusRequest = z.infer<typeof updateOrderStatusSchema>;

/**
 * Offer creation schema (base)
 */
const createOfferSchemaBase = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  offerType: z.enum(['discount', 'cashback', 'voucher', 'combo', 'special', 'walk_in']),
  startDate: z.date(),
  endDate: z.date(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxRedemptions: z.number().positive().optional(),
  maxRedemptionsPerUser: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  applicableCategories: z.array(z.string().max(24)).optional(),
  applicableProducts: z.array(z.string().max(24)).optional(),
  userSegments: z.array(z.string()).optional(),
});

export const createOfferSchema = createOfferSchemaBase.refine((data) => data.startDate < data.endDate, {
  message: 'startDate must be before endDate',
  path: ['endDate'],
});

export type CreateOfferRequest = z.infer<typeof createOfferSchema>;

/**
 * Discount offer schema (specific)
 */
export const createDiscountOfferSchema = createOfferSchemaBase.extend({
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be positive'),
  maxDiscountAmount: z.number().nonnegative().optional(),
}).refine((data) => data.startDate < data.endDate, {
  message: 'startDate must be before endDate',
  path: ['endDate'],
});

export type CreateDiscountOfferRequest = z.infer<typeof createDiscountOfferSchema>;

/**
 * Cashback offer schema (specific)
 */
export const createCashbackOfferSchema = createOfferSchemaBase.extend({
  cashbackType: z.enum(['coins', 'wallet']),
  cashbackValue: z.number().positive('Cashback value must be positive'),
}).refine((data) => data.startDate < data.endDate, {
  message: 'startDate must be before endDate',
  path: ['endDate'],
});

export type CreateCashbackOfferRequest = z.infer<typeof createCashbackOfferSchema>;

/**
 * Merchant login schema
 */
export const merchantLoginSchema = z.object({
  email: z.string().email('Invalid email').or(phoneSchema),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type MerchantLoginRequest = z.infer<typeof merchantLoginSchema>;

/**
 * Coupon code validation schema
 */
export const couponCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20).toUpperCase(),
  orderAmount: z.number().positive(),
  userId: z.string().optional(),
});

export type CouponCodeRequest = z.infer<typeof couponCodeSchema>;

/**
 * Validation middleware factory
 */
export function validateRequest(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          statusCode: 400,
          details: errors,
        },
      });
    }

    req.validatedBody = result.data;
    next();
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          statusCode: 400,
          details: errors,
        },
      });
    }

    req.validatedQuery = result.data;
    next();
  };
}
