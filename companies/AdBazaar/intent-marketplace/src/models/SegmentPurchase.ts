import mongoose, { Schema, Document } from 'mongoose';
import type { ISegmentPurchase, PurchaseStatus, DeliveryMetrics } from '../types.js';

export interface SegmentPurchaseDocument extends Omit<ISegmentPurchase, 'createdAt' | 'updatedAt'>, Document {}

const deliveryMetricsSchema = new Schema<DeliveryMetrics>(
  {
    impressions: { type: Number, default: 0 },
    uniqueUsersReached: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    attributedRevenue: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
  },
  { _id: false }
);

const segmentPurchaseSchema = new Schema<SegmentPurchaseDocument>(
  {
    purchaseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    segmentId: {
      type: String,
      required: true,
      index: true,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      index: true,
    },
    userCount: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'paused'],
      default: 'pending',
      index: true,
    },
    deliveryMetrics: {
      type: deliveryMetricsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: 'segment_purchases',
  }
);

// Indexes
segmentPurchaseSchema.index({ advertiserId: 1, status: 1 });
segmentPurchaseSchema.index({ segmentId: 1, status: 1 });
segmentPurchaseSchema.index({ campaignId: 1, status: 1 });
segmentPurchaseSchema.index({ startDate: 1, endDate: 1 });

export const SegmentPurchase = mongoose.model<SegmentPurchaseDocument>('SegmentPurchase', segmentPurchaseSchema);
