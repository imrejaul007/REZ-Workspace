import { z } from 'zod';

export const RevenueTypeSchema = z.enum(['impression', 'click', 'booking', 'commission']);
export const PeriodTypeSchema = z.enum(['daily', 'weekly', 'monthly']);
export const CurrencyTypeSchema = z.enum(['INR']);

export const CreateRevenueSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  type: RevenueTypeSchema,
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: CurrencyTypeSchema.default('INR'),
  screenId: z.string().optional(),
  advertiserId: z.string().optional(),
  campaignId: z.string().optional(),
  bookingId: z.string().optional(),
  period: PeriodTypeSchema,
  periodDate: z.string().datetime().or(z.date()).transform(val => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const UpdateRevenueSchema = z.object({
  type: RevenueTypeSchema.optional(),
  amount: z.number().min(0).optional(),
  currency: CurrencyTypeSchema.optional(),
  screenId: z.string().optional().nullable(),
  advertiserId: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  bookingId: z.string().optional().nullable(),
  period: PeriodTypeSchema.optional(),
  periodDate: z.string().datetime().or(z.date()).optional().transform(val => {
    if (!val) return undefined;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  metadata: z.record(z.unknown()).optional(),
});

export const QueryRevenueSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: RevenueTypeSchema.optional(),
  period: PeriodTypeSchema.optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

export const StatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

export type CreateRevenueInput = z.infer<typeof CreateRevenueSchema>;
export type UpdateRevenueInput = z.infer<typeof UpdateRevenueSchema>;
export type QueryRevenueInput = z.infer<typeof QueryRevenueSchema>;
export type StatsQueryInput = z.infer<typeof StatsQuerySchema>;
