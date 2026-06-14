import mongoose, { Schema, Document } from 'mongoose';
import { InsightType, InsightPayload, InsightMetadata } from '../types';

// Mongoose Document interface
export interface IWellnessInsight extends Document {
  insightId: string;
  merchantId: string;
  type: InsightType;
  confidence: number;
  payload: InsightPayload;
  metadata: InsightMetadata;
  expiresAt: Date;
  createdAt: Date;
}

const WellnessInsightSchema = new Schema<IWellnessInsight>(
  {
    insightId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['treatment', 'upsell', 'retention', 'pricing'],
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    payload: {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      data: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
      recommendations: [String],
      metrics: [
        {
          name: String,
          value: Number,
          previousValue: Number,
          change: Number,
          unit: String,
        },
      ],
    },
    metadata: {
      category: {
        type: String,
        required: true,
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
      tags: {
        type: [String],
        default: [],
        index: true,
      },
      source: {
        type: String,
        default: 'spa_mind_ai',
      },
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'wellness_insights',
  }
);

// Compound indexes for efficient queries
WellnessInsightSchema.index({ merchantId: 1, type: 1, createdAt: -1 });
WellnessInsightSchema.index({ merchantId: 1, 'metadata.priority': 1 });
WellnessInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-expiration

// Virtual for checking if insight is expired
WellnessInsightSchema.virtual('isExpired').get(function () {
  return this.expiresAt && this.expiresAt.getTime() < Date.now();
});

// Virtual for age in hours
WellnessInsightSchema.virtual('ageInHours').get(function () {
  return (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
});

// Static method to find active insights for merchant
WellnessInsightSchema.statics.findActiveInsights = function (
  merchantId: string,
  type?: InsightType
): Promise<IWellnessInsight[]> {
  const query: Record<string, unknown> = {
    merchantId,
    expiresAt: { $gt: new Date() },
  };
  if (type) {
    query.type = type;
  }
  return this.find(query).sort({ 'metadata.priority': -1, confidence: -1 });
};

// Static method to get insights by priority
WellnessInsightSchema.statics.findByPriority = function (
  merchantId: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): Promise<IWellnessInsight[]> {
  return this.find({
    merchantId,
    'metadata.priority': priority,
    expiresAt: { $gt: new Date() },
  }).sort({ confidence: -1, createdAt: -1 });
};

// Static method to get top insights for dashboard
WellnessInsightSchema.statics.getTopInsights = function (
  merchantId: string,
  limit: number = 10
): Promise<IWellnessInsight[]> {
  return this.find({
    merchantId,
    expiresAt: { $gt: new Date() },
  })
    .sort({ 'metadata.priority': -1, confidence: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get insights by tag
WellnessInsightSchema.statics.findByTag = function (
  merchantId: string,
  tag: string
): Promise<IWellnessInsight[]> {
  return this.find({
    merchantId,
    'metadata.tags': tag,
    expiresAt: { $gt: new Date() },
  }).sort({ confidence: -1 });
};

// Static method to clean up expired insights
WellnessInsightSchema.statics.cleanExpired = async function (): Promise<number> {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount || 0;
};

// Instance method to extend expiration
WellnessInsightSchema.methods.extendExpiration = function (
  hours: number
): Promise<IWellnessInsight> {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.save();
};

// Export the model
export const WellnessInsight = mongoose.model<IWellnessInsight>(
  'WellnessInsight',
  WellnessInsightSchema
);