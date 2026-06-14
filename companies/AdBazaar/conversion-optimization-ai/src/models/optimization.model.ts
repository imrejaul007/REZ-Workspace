/**
 * Campaign Optimization Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import {
  OptimizationGoals,
  CurrentPerformance,
  BidAdjustment,
  AudienceChange,
  BudgetReallocation,
  Recommendation,
} from '../types';

export interface IOptimizationDocument extends Document {
  optimizationId: string;
  campaignId: string;
  advertiserId: string;
  status: 'active' | 'paused' | 'completed';
  goals: OptimizationGoals;
  currentPerformance: CurrentPerformance;
  aiActions: {
    bidAdjustments: BidAdjustment[];
    audienceChanges: AudienceChange[];
    budgetReallocation: BudgetReallocation[];
  };
  recommendations: Recommendation[];
  startedAt: Date;
  updatedAt: Date;
  lastOptimizedAt?: Date;
  nextOptimizationAt?: Date;
}

const BidAdjustmentSchema = new Schema<BidAdjustment>(
  {
    time: { type: Date, required: true },
    change: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const AudienceChangeSchema = new Schema<AudienceChange>(
  {
    time: { type: Date, required: true },
    change: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const BudgetReallocationSchema = new Schema<BudgetReallocation>(
  {
    time: { type: Date, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const RecommendationSchema = new Schema<Recommendation>(
  {
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    action: { type: String, required: true },
    expectedImpact: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const OptimizationSchema = new Schema<IOptimizationDocument>(
  {
    optimizationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
      index: true,
    },
    goals: {
      targetCPA: { type: Number },
      targetROAS: { type: Number },
      targetConversions: { type: Number },
    },
    currentPerformance: {
      cpa: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    aiActions: {
      bidAdjustments: [BidAdjustmentSchema],
      audienceChanges: [AudienceChangeSchema],
      budgetReallocation: [BudgetReallocationSchema],
    },
    recommendations: [RecommendationSchema],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastOptimizedAt: {
      type: Date,
    },
    nextOptimizationAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'startedAt', updatedAt: 'updatedAt' },
  }
);

// Compound indexes for common queries
OptimizationSchema.index({ campaignId: 1, status: 1 });
OptimizationSchema.index({ advertiserId: 1, status: 1 });
OptimizationSchema.index({ 'recommendations.priority': 1 });

// TTL index for completed optimizations (expire after 90 days)
OptimizationSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export const Optimization = mongoose.model<IOptimizationDocument>(
  'Optimization',
  OptimizationSchema
);