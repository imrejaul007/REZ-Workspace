import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const CampaignBriefSchema = z.object({
  objectives: z.array(z.string()),
  keyMessages: z.array(z.string()),
  contentGuidelines: z.string().optional(),
  doAndDonts: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  referenceContent: z.string().optional(),
  brandVoice: z.string().optional(),
  targetKPIs: z.object({
    reach: z.number().optional(),
    engagement: z.number().optional(),
    clicks: z.number().optional(),
    conversions: z.number().optional()
  }).optional()
});

export const CampaignSchema = z.object({
  name: z.string().min(1),
  brandId: z.string(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.object({
    total: z.number(),
    spent: z.number().optional(),
    currency: z.string().default('INR')
  }),
  brief: CampaignBriefSchema.optional(),
  targetInfluencers: z.object({
    count: z.number().optional(),
    niche: z.array(z.string()).optional(),
    minFollowers: z.number().optional(),
    platforms: z.array(z.string()).optional()
  }).optional(),
  platforms: z.array(z.string()),
  deliverables: z.array(z.object({
    type: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
    quantity: z.number(),
    platform: z.string().optional(),
    dueDate: z.date().optional()
  })).optional(),
  tracking: z.object({
    promoCode: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    landingPage: z.string().optional()
  }).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type ICampaign = z.infer<typeof CampaignSchema>;
export type ICampaignBrief = z.infer<typeof CampaignBriefSchema>;

const campaignSchema = new Schema({
  name: { type: String, required: true, index: true },
  brandId: { type: Schema.Types.ObjectId, required: true, index: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  startDate: { type: Date },
  endDate: { type: Date },
  budget: {
    total: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  brief: {
    objectives: [{ type: String }],
    keyMessages: [{ type: String }],
    contentGuidelines: String,
    doAndDonts: [{ type: String }],
    hashtags: [{ type: String }],
    mentions: [{ type: String }],
    referenceContent: String,
    brandVoice: String,
    targetKPIs: {
      reach: Number,
      engagement: Number,
      clicks: Number,
      conversions: Number
    }
  },
  targetInfluencers: {
    count: Number,
    niche: [{ type: String }],
    minFollowers: Number,
    platforms: [{ type: String }]
  },
  platforms: [{ type: String }],
  deliverables: [{
    type: {
      type: String,
      enum: ['post', 'story', 'reel', 'video', 'live', 'blog']
    },
    quantity: Number,
    platform: String,
    dueDate: Date
  }],
  tracking: {
    promoCode: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    landingPage: String
  }
}, {
  timestamps: true
});

campaignSchema.index({ brandId: 1, status: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });

export const Campaign = mongoose.model<ICampaign & Document>('Campaign', campaignSchema);