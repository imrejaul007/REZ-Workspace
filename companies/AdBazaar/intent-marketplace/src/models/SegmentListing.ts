import mongoose, { Schema, Document } from 'mongoose';
import type { ISegmentListing, SegmentStatus, SegmentType, PricingModel } from '../types.js';

export interface SegmentListingDocument extends Omit<ISegmentListing, 'createdAt' | 'updatedAt'>, Document {}

const segmentListingSchema = new Schema<SegmentListingDocument>(
  {
    segmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    segmentType: {
      type: String,
      enum: ['active_buyers', 'dormant_interest', 'researchers', 'near_purchase'],
      required: true,
      index: true,
    },
    userCount: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    pricingModel: {
      type: String,
      enum: ['cpm', 'cpc', 'cpd', 'rtb'],
      required: true,
    },
    qualityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    avgConversionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    attributes: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'archived'],
      default: 'active',
      index: true,
    },
    imageUrl: {
      type: String,
    },
    demographics: {
      ageRanges: { type: [String], default: [] },
      locations: { type: [String], default: [] },
      interests: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    collection: 'segment_listings',
  }
);

// Indexes for common queries
segmentListingSchema.index({ segmentType: 1, status: 1 });
segmentListingSchema.index({ category: 1, status: 1 });
segmentListingSchema.index({ price: 1, qualityScore: 1 });
segmentListingSchema.index({ name: 'text', description: 'text' });

export const SegmentListing = mongoose.model<SegmentListingDocument>('SegmentListing', segmentListingSchema);
