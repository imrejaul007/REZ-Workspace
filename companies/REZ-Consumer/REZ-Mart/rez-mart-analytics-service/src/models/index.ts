import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAnalyticsEvent, EventType } from '../types/index.js';

export interface AnalyticsEventDocument extends Omit<IAnalyticsEvent, 'eventId'>, Document {
  eventId: string;
}

const analyticsEventSchema = new Schema<AnalyticsEventDocument>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['order', 'view', 'search', 'add_to_cart', 'checkout', 'signup'] as EventType[],
      index: true,
    },
    userId: {
      type: String,
      required: false,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    storeId: {
      type: String,
      required: false,
      index: true,
    },
    productId: {
      type: String,
      required: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
      default: {},
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'analytics_events',
  }
);

// Compound indexes for common queries
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ storeId: 1, timestamp: -1 });
analyticsEventSchema.index({ productId: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });

// TTL index for automatic cleanup (optional, based on retention policy)
analyticsEventSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, name: 'event_ttl_index' }
);

// Static methods
analyticsEventSchema.statics.findByFilters = function (
  filters: Record<string, any>
) {
  const query: Record<string, any> = {};

  if (filters.eventType) query.eventType = filters.eventType;
  if (filters.userId) query.userId = filters.userId;
  if (filters.sessionId) query.sessionId = filters.sessionId;
  if (filters.storeId) query.storeId = filters.storeId;
  if (filters.productId) query.productId = filters.productId;

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(filters.offset || 0)
    .limit(filters.limit || 100);
};

// Instance method for converting to plain object
analyticsEventSchema.methods.toAnalyticsEvent = function (): IAnalyticsEvent {
  return {
    eventId: this.eventId,
    eventType: this.eventType,
    userId: this.userId,
    sessionId: this.sessionId,
    storeId: this.storeId,
    productId: this.productId,
    metadata: this.metadata,
    timestamp: this.timestamp,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const AnalyticsEvent: Model<AnalyticsEventDocument> = mongoose.model<AnalyticsEventDocument>(
  'AnalyticsEvent',
  analyticsEventSchema
);

export default AnalyticsEvent;
