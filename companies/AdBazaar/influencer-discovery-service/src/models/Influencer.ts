import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod validation schemas
export const AudienceDemographicsSchema = z.object({
  ageRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  gender: z.enum(['male', 'female', 'other', 'all']).optional(),
  locations: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  incomeLevel: z.enum(['low', 'middle', 'high', 'all']).optional()
});

export const PlatformStatsSchema = z.object({
  platform: z.string(),
  handle: z.string(),
  followers: z.number(),
  following: z.number().optional(),
  posts: z.number().optional(),
  engagementRate: z.number().optional(),
  avgLikes: z.number().optional(),
  avgComments: z.number().optional(),
  avgShares: z.number().optional(),
  verified: z.boolean().optional()
});

export const InfluencerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  niche: z.array(z.string()),
  platforms: z.array(PlatformStatsSchema),
  audience: z.object({
    demographics: AudienceDemographicsSchema.optional(),
    size: z.number(),
    growthRate: z.number().optional(),
    avgViews: z.number().optional(),
    avgEngagement: z.number().optional()
  }),
  categories: z.array(z.string()).optional(),
  location: z.string().optional(),
  language: z.array(z.string()).optional(),
  collaborationHistory: z.array(z.object({
    brand: z.string(),
    campaign: z.string(),
    date: z.date(),
    performance: z.number().optional()
  })).optional(),
  rates: z.object({
    story: z.number().optional(),
    post: z.number().optional(),
    video: z.number().optional(),
    reel: z.number().optional(),
    live: z.number().optional()
  }).optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('pending'),
  score: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type IInfluencer = z.infer<typeof InfluencerSchema>;
export type IAudienceDemographics = z.infer<typeof AudienceDemographicsSchema>;
export type IPlatformStats = z.infer<typeof PlatformStatsSchema>;

// MongoDB schema
const influencerSchema = new Schema({
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  bio: { type: String },
  niche: [{ type: String, index: true }],
  platforms: [{
    platform: { type: String, required: true },
    handle: { type: String, required: true },
    followers: { type: Number, default: 0 },
    following: { type: Number },
    posts: { type: Number },
    engagementRate: { type: Number },
    avgLikes: { type: Number },
    avgComments: { type: Number },
    avgShares: { type: Number },
    verified: { type: Boolean, default: false }
  }],
  audience: {
    demographics: {
      ageRange: { min: Number, max: Number },
      gender: String,
      locations: [String],
      interests: [String],
      incomeLevel: String
    },
    size: { type: Number, required: true },
    growthRate: { type: Number },
    avgViews: { type: Number },
    avgEngagement: { type: Number }
  },
  categories: [{ type: String }],
  location: { type: String, index: true },
  language: [{ type: String }],
  collaborationHistory: [{
    brand: String,
    campaign: String,
    date: Date,
    performance: Number
  }],
  rates: {
    story: Number,
    post: Number,
    video: Number,
    reel: Number,
    live: Number
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  score: { type: Number, min: 0, max: 100 },
  tags: [{ type: String }],
  notes: { type: String }
}, {
  timestamps: true
});

// Text index for search
influencerSchema.index({
  name: 'text',
  bio: 'text',
  niche: 'text',
  tags: 'text'
});

// Compound indexes
influencerSchema.index({ 'platforms.platform': 1, 'platforms.followers': -1 });
influencerSchema.index({ niche: 1, score: -1 });
influencerSchema.index({ verificationStatus: 1, score: -1 });

export const Influencer = mongoose.model<IInfluencer& Document>('Influencer', influencerSchema);
