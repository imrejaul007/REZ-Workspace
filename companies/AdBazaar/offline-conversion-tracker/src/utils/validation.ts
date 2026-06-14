import { z } from 'zod';

export const CreateConversionSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  userId: z.string().optional(),
  type: z.enum(['purchase', 'visit', 'call', 'form', 'install', 'other']),
  value: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  date: z.string().datetime().or(z.date()).transform(val => new Date(val)),
  source: z.string().optional(),
  medium: z.string().optional(),
  device: z.string().optional(),
  location: z.object({
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

export const BatchConversionSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  conversions: z.array(CreateConversionSchema).min(1).max(1000)
});

export const MatchConversionSchema = z.object({
  offlineId: z.string().min(1, 'Offline conversion ID is required'),
  matchType: z.enum(['email', 'phone', 'device_id', 'fingerprint', 'probability']),
  matchData: z.record(z.any()).optional(),
  attributionWindow: z.number().min(1).max(90).default(30)
});

export const ImportConversionSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(['csv', 'xlsx', 'json']),
  fileSize: z.number().min(1),
  campaignId: z.string().optional(),
  importType: z.enum(['manual', 'api', 'automated']).default('manual'),
  source: z.string().optional()
});

export const AnalyticsQuerySchema = z.object({
  campaignId: z.string().optional(),
  startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  groupBy: z.enum(['day', 'week', 'month', 'campaign', 'type']).default('day'),
  type: z.enum(['purchase', 'visit', 'call', 'form', 'install', 'other']).optional(),
  includeDemographics: z.boolean().default(false)
});

export const AttributionQuerySchema = z.object({
  campaignId: z.string().optional(),
  startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  attributionModel: z.enum(['first_click', 'last_click', 'linear', 'time_decay', 'position_based']).default('last_click'),
  attributionWindow: z.number().min(1).max(90).default(30)
});

export const ConversionIdSchema = z.object({
  id: z.string().min(1, 'Conversion ID is required')
});

export const CampaignIdSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required')
});

export type CreateConversionInput = z.infer<typeof CreateConversionSchema>;
export type BatchConversionInput = z.infer<typeof BatchConversionSchema>;
export type MatchConversionInput = z.infer<typeof MatchConversionSchema>;
export type ImportConversionInput = z.infer<typeof ImportConversionSchema>;
export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>;
export type AttributionQueryInput = z.infer<typeof AttributionQuerySchema>;
