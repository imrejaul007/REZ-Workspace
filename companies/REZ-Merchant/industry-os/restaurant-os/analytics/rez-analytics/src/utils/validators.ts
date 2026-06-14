import { z } from 'zod';

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

export const RestaurantIdSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
});

export const ReportQuerySchema = z.object({
  ...DateRangeSchema.shape,
  ...PaginationSchema.shape,
  ...RestaurantIdSchema.shape,
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
});

export const DashboardQuerySchema = z.object({
  ...RestaurantIdSchema.shape,
  date: z.string().optional(),
  period: z.enum(['today', 'week', 'month', 'year']).optional().default('week'),
});

export type DateRange = z.infer<typeof DateRangeSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ReportQuery = z.infer<typeof ReportQuerySchema>;
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
