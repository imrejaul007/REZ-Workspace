import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const ROISchema = z.object({
  influencerId: z.string(),
  campaignId: z.string().optional(),
  investment: z.object({
    total: z.number(),
    fee: z.number().optional(),
    productCost: z.number().optional(),
    otherCosts: z.number().optional(),
    currency: z.string().default('INR')
  }),
  returns: z.object({
    revenue: z.number().optional(),
    conversions: z.number().optional(),
    leads: z.number().optional(),
    impressions: z.number().optional(),
    engagement: z.number().optional(),
    brandAwareness: z.number().optional()
  }),
  calculatedROI: z.number(),
  roiPercentage: z.number(),
  costPerEngagement: z.number().optional(),
  costPerClick: z.number().optional(),
  costPerConversion: z.number().optional(),
  costPerThousand: z.number().optional(),
  ltvMultiplier: z.number().optional(),
  calculatedAt: z.date(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'campaign', 'lifetime']).default('campaign')
});

export type IROI = z.infer<typeof ROISchema>;

const roiSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, index: true },
  investment: {
    total: { type: Number, required: true },
    fee: Number,
    productCost: Number,
    otherCosts: Number,
    currency: { type: String, default: 'INR' }
  },
  returns: {
    revenue: Number,
    conversions: Number,
    leads: Number,
    impressions: Number,
    engagement: Number,
    brandAwareness: Number
  },
  calculatedROI: { type: Number, required: true },
  roiPercentage: { type: Number, required: true },
  costPerEngagement: Number,
  costPerClick: Number,
  costPerConversion: Number,
  costPerThousand: Number,
  ltvMultiplier: Number,
  calculatedAt: { type: Date, default: Date.now },
  period: {
    type: String,
    enum: ['day', 'week', 'month', 'quarter', 'campaign', 'lifetime'],
    default: 'campaign'
  }
}, {
  timestamps: true
});

roiSchema.index({ influencerId: 1, calculatedAt: -1 });
roiSchema.index({ campaignId: 1, calculatedAt: -1 });

export const ROI = mongoose.model<IROI & Document>('ROI', roiSchema);