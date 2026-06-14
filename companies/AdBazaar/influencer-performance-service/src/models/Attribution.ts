import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const AttributionEventSchema = z.object({
  type: z.enum(['view', 'click', 'add_to_cart', 'checkout', 'purchase', 'signup', 'download', 'form_submit']),
  timestamp: z.date(),
  source: z.string(),
  campaignId: z.string().optional(),
  influencerId: z.string(),
  deliverableId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const AttributionSchema = z.object({
  influencerId: z.string(),
  campaignId: z.string().optional(),
  deliverableId: z.string().optional(),
  model: z.enum(['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'data_driven']).default('last_touch'),
  touchpoints: z.array(z.object({
    touchpointId: z.string(),
    channel: z.string(),
    influencerId: z.string(),
    campaignId: z.string().optional(),
    timestamp: z.date(),
    weight: z.number().optional()
  })),
  conversions: z.object({
    total: z.number(),
    attributed: z.number(),
    direct: z.number(),
    assisted: z.number()
  }),
  revenue: z.object({
    total: z.number(),
    attributed: z.number(),
    direct: z.number(),
    assisted: z.number()
  }),
  attributionWindow: z.object({
    lookbackDays: z.number().default(30),
    viewWindowDays: z.number().default(1),
    clickWindowDays: z.number().default(7)
  }),
  calculatedAt: z.date()
});

export type IAttribution = z.infer<typeof AttributionSchema>;
export type IAttributionEvent = z.infer<typeof AttributionEventSchema>;

const attributionSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, index: true },
  deliverableId: { type: Schema.Types.ObjectId, index: true },
  model: {
    type: String,
    enum: ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'data_driven'],
    default: 'last_touch'
  },
  touchpoints: [{
    touchpointId: String,
    channel: String,
    influencerId: Schema.Types.ObjectId,
    campaignId: Schema.Types.ObjectId,
    timestamp: Date,
    weight: Number
  }],
  conversions: {
    total: { type: Number, default: 0 },
    attributed: { type: Number, default: 0 },
    direct: { type: Number, default: 0 },
    assisted: { type: Number, default: 0 }
  },
  revenue: {
    total: { type: Number, default: 0 },
    attributed: { type: Number, default: 0 },
    direct: { type: Number, default: 0 },
    assisted: { type: Number, default: 0 }
  },
  attributionWindow: {
    lookbackDays: { type: Number, default: 30 },
    viewWindowDays: { type: Number, default: 1 },
    clickWindowDays: { type: Number, default: 7 }
  },
  calculatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

attributionSchema.index({ influencerId: 1, campaignId: 1 });
attributionSchema.index({ calculatedAt: -1 });

export const Attribution = mongoose.model<IAttribution & Document>('Attribution', attributionSchema);