import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  analyticsId: string;
  cartId: string;
  userId: string;
  metrics: {
    abandonmentScore?: number;
    recoveryLikelihood?: number;
    predictedValue?: number;
    timeToAbandon?: number; // minutes
    cartValue?: number;
    itemCount?: number;
  };
  segmentation?: {
    segmentId?: string;
    segmentName?: string;
    customerTier?: 'new' | 'returning' | 'vip';
  };
  engagement?: {
    emailOpens?: number;
    emailClicks?: number;
    pushOpens?: number;
    websiteVisits?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>({
  analyticsId: { type: String, required: true, unique: true },
  cartId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  metrics: {
    abandonmentScore: Number,
    recoveryLikelihood: Number,
    predictedValue: Number,
    timeToAbandon: Number,
    cartValue: Number,
    itemCount: Number
  },
  segmentation: {
    segmentId: String,
    segmentName: String,
    customerTier: { type: String, enum: ['new', 'returning', 'vip'] }
  },
  engagement: {
    emailOpens: { type: Number, default: 0 },
    emailClicks: { type: Number, default: 0 },
    pushOpens: { type: Number, default: 0 },
    websiteVisits: { type: Number, default: 0 }
  }
}, { timestamps: true });

analyticsSchema.index({ analyticsId: 1 });
analyticsSchema.index({ cartId: 1 });
analyticsSchema.index({ 'metrics.abandonmentScore': -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);