import { z } from 'zod';

// Platform enum
export const PlatformSchema = z.enum(['instagram', 'youtube', 'twitter', 'tiktok', 'facebook', 'linkedin']);
export type Platform = z.infer<typeof PlatformSchema>;

// Risk level enum
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

// Check status enum
export const CheckStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed']);
export type CheckStatus = z.infer<typeof CheckStatusSchema>;

// Check profile request
export const CheckProfileRequestSchema = z.object({
  platform: PlatformSchema,
  username: z.string().min(1).max(100),
  followers: z.number().int().min(0).optional(),
  following: z.number().int().min(0).optional(),
  posts: z.number().int().min(0).optional(),
  engagementLikes: z.number().int().min(0).optional(),
  engagementComments: z.number().int().min(0).optional(),
  engagementViews: z.number().int().min(0).optional(),
  followerGrowthRate: z.number().optional(),
  postingFrequency: z.number().optional(),
  lastPostDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CheckProfileRequest = z.infer<typeof CheckProfileRequestSchema>;

// Batch check request
export const BatchCheckRequestSchema = z.object({
  influencers: z.array(CheckProfileRequestSchema).min(1).max(100),
});

export type BatchCheckRequest = z.infer<typeof BatchCheckRequestSchema>;

// Alert acknowledgement
export const AlertAcknowledgeSchema = z.object({
  acknowledgedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type AlertAcknowledge = z.infer<typeof AlertAcknowledgeSchema>;

// Export format
export const ExportFormatSchema = z.enum(['pdf', 'csv']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

// Export request
export const ExportRequestSchema = z.object({
  format: ExportFormatSchema,
});

export type ExportRequest = z.infer<typeof ExportRequestSchema>;

// Validation helper
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};