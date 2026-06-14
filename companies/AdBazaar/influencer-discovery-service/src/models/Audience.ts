import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const AudienceSchema = z.object({
  influencerId: { type: String, required: true },
  platform: z.string(),
  demographics: z.object({
    ageDistribution: z.array(z.object({
      ageGroup: z.string(),
      percentage: z.number()
    })).optional(),
    genderDistribution: z.object({
      male: z.number().optional(),
      female: z.number().optional(),
      other: z.number().optional()
    }).optional(),
    topCountries: z.array(z.object({
      country: z.string(),
      percentage: z.number()
    })).optional(),
    topCities: z.array(z.object({
      city: z.string(),
      percentage: z.number()
    })).optional(),
    interests: z.array(z.object({
      interest: z.string(),
      score: z.number()
    })).optional(),
    languages: z.array(z.object({
      language: z.string(),
      percentage: z.number()
    })).optional(),
    incomeBrackets: z.array(z.object({
      bracket: z.string(),
      percentage: z.number()
    })).optional()
  }),
  engagementMetrics: z.object({
    avgLikes: z.number().optional(),
    avgComments: z.number().optional(),
    avgShares: z.number().optional(),
    avgSaves: z.number().optional(),
    avgViews: z.number().optional(),
    avgWatchTime: z.number().optional(),
    avgReach: z.number().optional(),
    engagementRate: z.number().optional()
  }),
  behaviorMetrics: z.object({
    avgSessionDuration: z.number().optional(),
    contentFrequency: z.number().optional(),
    responseRate: z.number().optional(),
    authenticityScore: z.number().optional()
  }).optional(),
  audienceGrowth: z.object({
    monthlyGrowth: z.number().optional(),
    growthTrend: z.array(z.object({
      month: z.string(),
      followers: z.number()
    })).optional(),
    churnRate: z.number().optional()
  }).optional(),
  lastUpdated: z.date().optional()
});

export type IAudience = z.infer<typeof AudienceSchema>;

const audienceSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
  platform: { type: String },
  demographics: {
    ageDistribution: [{
      ageGroup: String,
      percentage: Number
    }],
    genderDistribution: {
      male: Number,
      female: Number,
      other: Number
    },
    topCountries: [{
      country: String,
      percentage: Number
    }],
    topCities: [{
      city: String,
      percentage: Number
    }],
    interests: [{
      interest: String,
      score: Number
    }],
    languages: [{
      language: String,
      percentage: Number
    }],
    incomeBrackets: [{
      bracket: String,
      percentage: Number
    }]
  },
  engagementMetrics: {
    avgLikes: Number,
    avgComments: Number,
    avgShares: Number,
    avgSaves: Number,
    avgViews: Number,
    avgWatchTime: Number,
    avgReach: Number,
    engagementRate: Number
  },
  behaviorMetrics: {
    avgSessionDuration: Number,
    contentFrequency: Number,
    responseRate: Number,
    authenticityScore: Number
  },
  audienceGrowth: {
    monthlyGrowth: Number,
    growthTrend: [{
      month: String,
      followers: Number
    }],
    churnRate: Number
  },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

audienceSchema.index({ influencerId: 1, platform: 1 }, { unique: true });

export const Audience = mongoose.model<IAudience & Document>('Audience', audienceSchema);
