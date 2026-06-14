import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const BriefSchema = z.object({
  campaignId: z.string(),
  version: z.number().default(1),
  objectives: z.array(z.string()),
  keyMessages: z.array(z.string()),
  targetAudience: z.object({
    ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
    gender: z.enum(['male', 'female', 'other', 'all']).optional(),
    locations: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional()
  }).optional(),
  contentRequirements: z.object({
    formats: z.array(z.enum(['post', 'story', 'reel', 'video', 'live', 'blog'])),
    platforms: z.array(z.string()),
    duration: z.number().optional(),
    tone: z.string().optional(),
    guidelines: z.string().optional(),
    doAndDonts: z.array(z.string()).optional()
  }),
  creativeAssets: z.array(z.object({
    name: z.string(),
    type: z.enum(['image', 'video', 'document', 'link']),
    url: z.string()
  })).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  referencePosts: z.array(z.string()).optional(),
  timeline: z.object({
    briefingDate: z.date().optional(),
    contentDueDate: z.date().optional(),
    reviewPeriod: z.number().optional(),
    publicationDate: z.date().optional()
  }),
  approvalWorkflow: z.object({
    requiresApproval: z.boolean().default(true),
    approvers: z.array(z.string()).optional(),
    autoApproveAfter: z.number().optional()
  }).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type IBrief = z.infer<typeof BriefSchema>;

const briefSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  version: { type: Number, default: 1 },
  objectives: [{ type: String }],
  keyMessages: [{ type: String }],
  targetAudience: {
    ageRange: { min: Number, max: Number },
    gender: String,
    locations: [{ type: String }],
    interests: [{ type: String }]
  },
  contentRequirements: {
    formats: [{ type: String }],
    platforms: [{ type: String }],
    duration: Number,
    tone: String,
    guidelines: String,
    doAndDonts: [{ type: String }]
  },
  creativeAssets: [{
    name: String,
    type: { type: String, enum: ['image', 'video', 'document', 'link'] },
    url: String
  }],
  hashtags: [{ type: String }],
  mentions: [{ type: String }],
  referencePosts: [{ type: String }],
  timeline: {
    briefingDate: Date,
    contentDueDate: Date,
    reviewPeriod: Number,
    publicationDate: Date
  },
  approvalWorkflow: {
    requiresApproval: { type: Boolean, default: true },
    approvers: [{ type: String }],
    autoApproveAfter: Number
  }
}, {
  timestamps: true
});

briefSchema.index({ campaignId: 1, version: -1 });

export const Brief = mongoose.model<IBrief & Document>('Brief', briefSchema);