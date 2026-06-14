import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const MatchSchema = z.object({
  influencerId: { type: String, required: true },
  campaignId: z.string().optional(),
  brandId: z.string().optional(),
  matchScore: z.number().min(0).max(100),
  matchFactors: z.object({
    nicheAlignment: z.number().optional(),
    audienceAlignment: z.number().optional(),
    engagementAlignment: z.number().optional(),
    priceAlignment: z.number().optional(),
    locationAlignment: z.number().optional(),
    brandAlignment: z.number().optional()
  }),
  reasons: z.array(z.string()),
  recommendations: z.array(z.string()).optional(),
  status: z.enum(['pending', 'contacted', 'negotiating', 'accepted', 'rejected']).default('pending'),
  notes: z.string().optional(),
  expiresAt: z.date().optional()
});

export type IMatch = z.infer<typeof MatchSchema>;

const matchSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, index: true },
  brandId: { type: Schema.Types.ObjectId, index: true },
  matchScore: { type: Number, required: true, min: 0, max: 100 },
  matchFactors: {
    nicheAlignment: Number,
    audienceAlignment: Number,
    engagementAlignment: Number,
    priceAlignment: Number,
    locationAlignment: Number,
    brandAlignment: Number
  },
  reasons: [{ type: String }],
  recommendations: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'contacted', 'negotiating', 'accepted', 'rejected'],
    default: 'pending'
  },
  notes: { type: String },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

matchSchema.index({ influencerId: 1, campaignId: 1 }, { unique: true });
matchSchema.index({ brandId: 1, matchScore: -1 });
matchSchema.index({ status: 1, matchScore: -1 });

export const Match = mongoose.model<IMatch & Document>('Match', matchSchema);
