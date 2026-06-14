import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const InfluencerSchema = z.object({
  campaignId: z.string(),
  influencerId: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  platform: z.string(),
  handle: z.string(),
  followers: z.number(),
  status: z.enum(['invited', 'negotiating', 'confirmed', 'working', 'submitted', 'approved', 'rejected', 'completed']).default('invited'),
  agreedRate: z.number().optional(),
  deliverables: z.array(z.object({
    type: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
    content: z.string().optional(),
    link: z.string().optional(),
    scheduledDate: z.date().optional(),
    submittedDate: z.date().optional(),
    approvedDate: z.date().optional(),
    status: z.enum(['pending', 'submitted', 'revision_requested', 'approved', 'rejected']).default('pending')
  })).optional(),
  contractId: z.string().optional(),
  notes: z.string().optional(),
  invitedAt: z.date().optional(),
  confirmedAt: z.date().optional()
});

export type IInfluencer = z.infer<typeof InfluencerSchema>;

const influencerSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  influencerId: { type: Schema.Types.ObjectId, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  platform: { type: String, required: true },
  handle: { type: String, required: true },
  followers: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['invited', 'negotiating', 'confirmed', 'working', 'submitted', 'approved', 'rejected', 'completed'],
    default: 'invited',
    index: true
  },
  agreedRate: { type: Number },
  deliverables: [{
    type: {
      type: String,
      enum: ['post', 'story', 'reel', 'video', 'live', 'blog']
    },
    content: String,
    link: String,
    scheduledDate: Date,
    submittedDate: Date,
    approvedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'submitted', 'revision_requested', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  contractId: { type: Schema.Types.ObjectId, index: true },
  notes: { type: String },
  invitedAt: { type: Date },
  confirmedAt: { type: Date }
}, {
  timestamps: true
});

influencerSchema.index({ campaignId: 1, status: 1 });
influencerSchema.index({ influencerId: 1, status: 1 });

export const CampaignInfluencer = mongoose.model<IInfluencer & Document>('CampaignInfluencer', influencerSchema);