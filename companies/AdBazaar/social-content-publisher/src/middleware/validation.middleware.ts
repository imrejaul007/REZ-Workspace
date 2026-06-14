import { z } from 'zod';

export const platformTypes = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'] as const;

export const mediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video', 'gif']),
  alt: z.string().optional(),
});

export const contentSchema = z.object({
  text: z.string().min(1).max(5000),
  media: z.array(mediaSchema).max(10).optional().default([]),
});

export const platformConfigSchema = z.object({
  platform: z.enum(platformTypes),
  accountId: z.string().min(1),
  adaptedContent: z.string().optional(),
  enabled: z.boolean().optional().default(true),
});

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: contentSchema,
  platforms: z.array(platformConfigSchema).min(1),
  scheduledTime: z.string().datetime().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: contentSchema.optional(),
  platforms: z.array(platformConfigSchema).optional(),
  scheduledTime: z.string().datetime().optional().nullable(),
});

export const schedulePostSchema = z.object({
  scheduledTime: z.string().datetime(),
});

export const submitReviewSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const approvePostSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const rejectPostSchema = z.object({
  notes: z.string().min(1).max(500),
});

export const connectPlatformSchema = z.object({
  platform: z.enum(platformTypes),
  accountId: z.string().min(1),
  accountName: z.string().min(1),
  accountHandle: z.string().optional(),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  permissions: z.array(z.string()).optional().default([]),
});

export const reorderQueueSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['draft', 'scheduled', 'publishing', 'published', 'failed']).optional(),
  workflowStatus: z.enum(['pending', 'review', 'approved', 'rejected']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'scheduledTime', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type SchedulePostInput = z.infer<typeof schedulePostSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ApprovePostInput = z.infer<typeof approvePostSchema>;
export type RejectPostInput = z.infer<typeof rejectPostSchema>;
export type ConnectPlatformInput = z.infer<typeof connectPlatformSchema>;
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;