import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const PerformanceMetricsSchema = z.object({
  reach: z.number().optional(),
  impressions: z.number().optional(),
  views: z.number().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  saves: z.number().optional(),
  clicks: z.number().optional(),
  ctr: z.number().optional(),
  engagementRate: z.number().optional(),
  avgWatchTime: z.number().optional(),
  completionRate: z.number().optional(),
  followersGained: z.number().optional()
});

export const PerformanceSchema = z.object({
  influencerId: z.string(),
  campaignId: z.string().optional(),
  deliverableId: z.string().optional(),
  platform: z.string(),
  contentType: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
  contentUrl: z.string().optional(),
  publishedAt: z.date().optional(),
  metrics: PerformanceMetricsSchema,
  tracking: z.object({
    promoCode: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    pixelFired: z.boolean().optional()
  }).optional(),
  attribution: z.object({
    source: z.enum(['promo_code', 'utm', 'pixel', 'direct', 'organic']).optional(),
    conversions: z.number().optional(),
    revenue: z.number().optional(),
    conversionValue: z.number().optional()
  }).optional(),
  period: z.enum(['day', 'week', 'month', 'campaign']).default('campaign'),
  recordedAt: z.date().default(new Date())
});

export type IPerformance = z.infer<typeof PerformanceSchema>;
export type IPerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

const performanceSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, index: true },
  deliverableId: { type: Schema.Types.ObjectId, index: true },
  platform: { type: String, required: true },
  contentType: {
    type: String,
    enum: ['post', 'story', 'reel', 'video', 'live', 'blog'],
    required: true
  },
  contentUrl: { type: String },
  publishedAt: { type: Date },
  metrics: {
    reach: Number,
    impressions: Number,
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    saves: Number,
    clicks: Number,
    ctr: Number,
    engagementRate: Number,
    avgWatchTime: Number,
    completionRate: Number,
    followersGained: Number
  },
  tracking: {
    promoCode: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    pixelFired: { type: Boolean, default: false }
  },
  attribution: {
    source: {
      type: String,
      enum: ['promo_code', 'utm', 'pixel', 'direct', 'organic']
    },
    conversions: Number,
    revenue: Number,
    conversionValue: Number
  },
  period: {
    type: String,
    enum: ['day', 'week', 'month', 'campaign'],
    default: 'campaign'
  },
  recordedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

performanceSchema.index({ influencerId: 1, recordedAt: -1 });
performanceSchema.index({ campaignId: 1, recordedAt: -1 });
performanceSchema.index({ deliverableId: 1 });
performanceSchema.index({ platform: 1, contentType: 1 });

export const Performance = mongoose.model<IPerformance & Document>('Performance', performanceSchema);