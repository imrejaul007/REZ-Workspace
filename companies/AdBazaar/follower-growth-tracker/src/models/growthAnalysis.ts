import mongoose, { Schema, Document } from 'mongoose';

export interface IGrowthAnalysis {
  accountId: string;
  period: 'day' | 'week' | 'month' | 'year';
  startFollowers: number;
  endFollowers: number;
  netGrowth: number;
  growthRate: number;
  engagementCorrelation: number;
  predictions: {
    nextWeek: number;
    nextMonth: number;
  };
  insights: string[];
}

export interface IGrowthAnalysisDoc extends IGrowthAnalysis, Document {}

const GrowthAnalysisSchema = new Schema<IGrowthAnalysisDoc>(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['day', 'week', 'month', 'year'],
      required: true,
    },
    startFollowers: {
      type: Number,
      required: true,
    },
    endFollowers: {
      type: Number,
      required: true,
    },
    netGrowth: {
      type: Number,
      required: true,
    },
    growthRate: {
      type: Number,
      required: true,
    },
    engagementCorrelation: {
      type: Number,
      default: 0,
    },
    predictions: {
      nextWeek: { type: Number, default: 0 },
      nextMonth: { type: Number, default: 0 },
    },
    insights: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
GrowthAnalysisSchema.index({ accountId: 1, period: 1, createdAt: -1 });

export const GrowthAnalysis = mongoose.model<IGrowthAnalysisDoc>(
  'GrowthAnalysis',
  GrowthAnalysisSchema
);
