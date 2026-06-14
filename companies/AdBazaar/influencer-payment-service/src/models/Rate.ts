import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const RateSchema = z.object({
  influencerId: z.string(),
  platform: z.string(),
  contentType: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog', 'story_reel']),
  baseRate: z.number(),
  currency: z.string().default('INR'),
  minFollowers: z.number().optional(),
  maxFollowers: z.number().optional(),
  effectiveRate: z.number().optional(),
  negotiatedRate: z.number().optional(),
  volumeDiscount: z.object({
    enabled: z.boolean().default(false),
    tiers: z.array(z.object({
      quantity: z.number(),
      discountPercent: z.number()
    })).optional()
  }).optional(),
  validity: z.object({
    from: z.date(),
    to: z.date().optional()
  }).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  updatedAt: z.date().optional()
});

export type IRate = z.infer<typeof RateSchema>;

const rateSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  platform: { type: String, required: true },
  contentType: {
    type: String,
    enum: ['post', 'story', 'reel', 'video', 'live', 'blog', 'story_reel'],
    required: true
  },
  baseRate: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  minFollowers: { type: Number },
  maxFollowers: { type: Number },
  effectiveRate: { type: Number },
  negotiatedRate: { type: Number },
  volumeDiscount: {
    enabled: { type: Boolean, default: false },
    tiers: [{
      quantity: Number,
      discountPercent: Number
    }]
  },
  validity: {
    from: { type: Date, required: true },
    to: { type: Date }
  },
  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, {
  timestamps: true
});

rateSchema.index({ influencerId: 1, platform: 1, contentType: 1 }, { unique: true });
rateSchema.index({ influencerId: 1, isActive: 1 });

export const Rate = mongoose.model<IRate & Document>('Rate', rateSchema);