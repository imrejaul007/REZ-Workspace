/**
 * Bid Recommendation Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import { BidRecommendation } from '../types';

export interface IBidRecommendationDocument extends Document {
  recommendationId: string;
  optimizationId: string;
  campaignId: string;
  placementId: string;
  recommendedBid: number;
  maxBid: number;
  expectedCPC: number;
  expectedCTR: number;
  expectedConversions: number;
  confidence: number;
  reasoning: string;
  status: 'pending' | 'applied' | 'rejected' | 'expired';
  appliedAt?: Date;
  appliedBy?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BidRecommendationSchema = new Schema<IBidRecommendationDocument>(
  {
    recommendationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    optimizationId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    placementId: {
      type: String,
      required: true,
      index: true,
    },
    recommendedBid: {
      type: Number,
      required: true,
    },
    maxBid: {
      type: Number,
      required: true,
    },
    expectedCPC: {
      type: Number,
      required: true,
    },
    expectedCTR: {
      type: Number,
      required: true,
    },
    expectedConversions: {
      type: Number,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    reasoning: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'applied', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    appliedAt: {
      type: Date,
    },
    appliedBy: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
BidRecommendationSchema.index({ campaignId: 1, status: 1 });
BidRecommendationSchema.index({ optimizationId: 1, status: 1 });
BidRecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL for expired recommendations (24 hours)
BidRecommendationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 }
);

export const BidRecommendationModel = mongoose.model<IBidRecommendationDocument>(
  'BidRecommendation',
  BidRecommendationSchema
);

export default BidRecommendationModel;