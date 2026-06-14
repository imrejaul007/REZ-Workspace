import { z } from 'zod';

// Date range validation schema
export const DateRangeValidationSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  days: z.coerce.number().min(1).max(90).optional(),
}).refine((data) => {
  // If dates are provided, start must be before end
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
});

// Content query validation schema
export const ContentQueryValidationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS', 'STORY', 'IGTV']).optional(),
  sortBy: z.enum(['date', 'engagementRate', 'reach', 'likes']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Hashtag validation schema
export const HashtagValidationSchema = z.object({
  hashtag: z.string()
    .min(1)
    .regex(/^[a-zA-Z0-9_]+$/, 'Hashtag must contain only alphanumeric characters and underscores')
    .max(100),
});

// Export request validation schema
export const ExportRequestValidationSchema = z.object({
  type: z.enum(['account', 'content', 'audience', 'stories', 'reels', 'hashtags']),
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  days: z.coerce.number().min(1).max(90).optional(),
  contentIds: z.array(z.string()).max(100).optional(),
  hashtags: z.array(z.string()).max(50).optional(),
});

// Dashboard query validation schema
export const DashboardQueryValidationSchema = z.object({
  days: z.coerce.number().min(1).max(90).default(7),
  includeContent: z.boolean().default(true),
  includeAudience: z.boolean().default(true),
});

// Story query validation schema
export const StoryQueryValidationSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(25),
  includeStickers: z.boolean().default(true),
});

// Reels query validation schema
export const ReelsQueryValidationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.enum(['plays', 'engagementRate', 'reach', 'likes']).default('plays'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Refresh period validation
export const RefreshPeriodValidationSchema = z.object({
  period: z.enum(['day', 'week', 'days_28']).default('days_28'),
});

// Active times query schema
export const ActiveTimesQueryValidationSchema = z.object({
  timezone: z.string().optional(),
  limit: z.coerce.number().min(1).max(24).default(10),
});

// Best times query schema
export const BestTimesQueryValidationSchema = z.object({
  days: z.coerce.number().min(7).max(90).default(30),
  limit: z.coerce.number().min(1).max(20).default(10),
});

// Content sync request schema
export const ContentSyncRequestValidationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  mediaTypes: z.array(z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS'])).optional(),
});

// API key validation
export const ApiKeyValidationSchema = z.object({
  apiKey: z.string().min(32, 'API key must be at least 32 characters'),
});

// Pagination schema
export const PaginationValidationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type DateRangeInput = z.infer<typeof DateRangeValidationSchema>;
export type ContentQueryInput = z.infer<typeof ContentQueryValidationSchema>;
export type HashtagInput = z.infer<typeof HashtagValidationSchema>;
export type ExportRequestInput = z.infer<typeof ExportRequestValidationSchema>;
export type DashboardQueryInput = z.infer<typeof DashboardQueryValidationSchema>;
export type StoryQueryInput = z.infer<typeof StoryQueryValidationSchema>;
export type ReelsQueryInput = z.infer<typeof ReelsQueryValidationSchema>;
export type RefreshPeriodInput = z.infer<typeof RefreshPeriodValidationSchema>;
export type ActiveTimesInput = z.infer<typeof ActiveTimesQueryValidationSchema>;
export type BestTimesInput = z.infer<typeof BestTimesQueryValidationSchema>;
export type ContentSyncInput = z.infer<typeof ContentSyncRequestValidationSchema>;
export type ApiKeyInput = z.infer<typeof ApiKeyValidationSchema>;
export type PaginationInput = z.infer<typeof PaginationValidationSchema>;