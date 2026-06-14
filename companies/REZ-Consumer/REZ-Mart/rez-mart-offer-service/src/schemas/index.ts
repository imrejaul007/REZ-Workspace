import { z } from 'zod';

// Offer Type Schema
export const OfferTypeSchema = z.enum(['percentage', 'flat', 'free_delivery', 'buy_x_get_y']);

// Offer Status Schema
export const OfferStatusSchema = z.enum(['active', 'inactive', 'expired']);

// Create Offer Schema
export const CreateOfferSchema = z.object({
  code: z
    .string()
    .min(3, 'Offer code must be at least 3 characters')
    .max(50, 'Offer code must not exceed 50 characters')
    .transform((val) => val.toUpperCase().trim()),
  type: OfferTypeSchema,
  value: z.number().min(0, 'Value must be non-negative'),
  minOrderValue: z.number().min(0, 'Minimum order value must be non-negative').default(0),
  maxDiscount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  userId: z.string().optional(),
  storeId: z.string().optional(),
  validFrom: z.string().datetime().or(z.date()).transform((val) => new Date(val)),
  validUntil: z.string().datetime().or(z.date()).transform((val) => new Date(val)),
  status: OfferStatusSchema.default('active'),
  terms: z.string().max(1000).optional(),
});

// Update Offer Schema
export const UpdateOfferSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .transform((val) => val.toUpperCase().trim())
    .optional(),
  type: OfferTypeSchema.optional(),
  value: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  userId: z.string().optional().nullable(),
  storeId: z.string().optional().nullable(),
  validFrom: z.string().datetime().or(z.date()).transform((val) => new Date(val)).optional(),
  validUntil: z.string().datetime().or(z.date()).transform((val) => new Date(val)).optional(),
  status: OfferStatusSchema.optional(),
  terms: z.string().max(1000).optional().nullable(),
});

// Validate Offer Code Schema
export const ValidateOfferSchema = z.object({
  code: z.string().min(1, 'Offer code is required'),
  orderValue: z.number().min(0, 'Order value must be non-negative'),
  userId: z.string().optional(),
  storeId: z.string().optional(),
});

// Update Status Schema
export const UpdateStatusSchema = z.object({
  status: OfferStatusSchema,
});

// Use Offer Schema
export const UseOfferSchema = z.object({
  userId: z.string().optional(),
});

// Query Filters Schema
export const OfferFiltersSchema = z.object({
  status: OfferStatusSchema.optional(),
  type: OfferTypeSchema.optional(),
  storeId: z.string().optional(),
  userId: z.string().optional(),
  valid: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;
export type UpdateOfferInput = z.infer<typeof UpdateOfferSchema>;
export type ValidateOfferInput = z.infer<typeof ValidateOfferSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type UseOfferInput = z.infer<typeof UseOfferSchema>;
export type OfferFilters = z.infer<typeof OfferFiltersSchema>;