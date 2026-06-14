import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const DeliverableSchema = z.object({
  campaignId: z.string(),
  influencerId: z.string(),
  type: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
  platform: z.string(),
  description: z.string().optional(),
  content: z.string().optional(),
  contentUrl: z.string().url().optional(),
  scheduledDate: z.date().optional(),
  submittedDate: z.date().optional(),
  approvedDate: z.date().optional(),
  publishedDate: z.date().optional(),
  status: z.enum(['pending', 'in_progress', 'submitted', 'revision_requested', 'approved', 'rejected', 'published']).default('pending'),
  revisionNotes: z.array(z.object({
    note: z.string(),
    requestedAt: z.date(),
    requestedBy: z.string()
  })).optional(),
  performance: z.object({
    views: z.number().optional(),
    likes: z.number().optional(),
    comments: z.number().optional(),
    shares: z.number().optional(),
    saves: z.number().optional(),
    clicks: z.number().optional(),
    reach: z.number().optional()
  }).optional(),
  payment: z.object({
    amount: z.number(),
    status: z.enum(['pending', 'approved', 'paid']).default('pending'),
    paidAt: z.date().optional()
  }).optional()
});

export type IDeliverable = z.infer<typeof DeliverableSchema>;

const deliverableSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  type: {
    type: String,
    enum: ['post', 'story', 'reel', 'video', 'live', 'blog'],
    required: true
  },
  platform: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  contentUrl: { type: String },
  scheduledDate: { type: Date },
  submittedDate: { type: Date },
  approvedDate: { type: Date },
  publishedDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'revision_requested', 'approved', 'rejected', 'published'],
    default: 'pending',
    index: true
  },
  revisionNotes: [{
    note: String,
    requestedAt: { type: Date, default: Date.now },
    requestedBy: String
  }],
  performance: {
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    saves: Number,
    clicks: Number,
    reach: Number
  },
  payment: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid'],
      default: 'pending'
    },
    paidAt: Date
  }
}, {
  timestamps: true
});

deliverableSchema.index({ campaignId: 1, status: 1 });
deliverableSchema.index({ influencerId: 1, status: 1 });
deliverableSchema.index({ scheduledDate: 1 });

export const Deliverable = mongoose.model<IDeliverable & Document>('Deliverable', deliverableSchema);