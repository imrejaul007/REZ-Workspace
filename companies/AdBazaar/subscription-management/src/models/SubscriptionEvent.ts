import mongoose, { Schema, Document } from 'mongoose';
import { SubscriptionEventType, ISubscriptionEvent } from '../types/index.js';

export interface ISubscriptionEventDocument
  extends Omit<ISubscriptionEvent, '_id'>,
    Document {}

const subscriptionEventSchema = new Schema<ISubscriptionEventDocument>(
  {
    subscriptionId: {
      type: String,
      required: true,
      index: true
    },
    publisherId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(SubscriptionEventType),
      required: true,
      index: true
    },
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false,
    collection: 'subscription_events'
  }
);

// Compound indexes for common queries
subscriptionEventSchema.index({ subscriptionId: 1, timestamp: -1 });
subscriptionEventSchema.index({ publisherId: 1, type: 1, timestamp: -1 });
subscriptionEventSchema.index({ type: 1, timestamp: -1 });

// TTL index - auto-delete events older than 1 year
subscriptionEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const SubscriptionEvent = mongoose.model<ISubscriptionEventDocument>(
  'SubscriptionEvent',
  subscriptionEventSchema
);