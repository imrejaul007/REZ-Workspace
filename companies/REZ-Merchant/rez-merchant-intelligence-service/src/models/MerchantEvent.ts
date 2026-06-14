import mongoose, { Document, Schema } from 'mongoose';
import { EventCategory } from '../types';

export interface MerchantEventDocument extends Document {
  merchantId: string;
  eventType: EventCategory;
  eventData: Record<string, unknown>;
  metadata: {
    source: string;
    correlationId?: string;
    userId?: string;
    sessionId?: string;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantEventSchema = new Schema<MerchantEventDocument>(
  {
    merchantId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ['order', 'inventory', 'customer', 'feedback', 'payment', 'marketing', 'operational', 'system'],
      required: true,
      index: true,
    },
    eventData: { type: Schema.Types.Mixed, required: true },
    metadata: {
      source: { type: String, required: true },
      correlationId: { type: String },
      userId: { type: String },
      sessionId: { type: String },
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: 'merchant_events',
  }
);

// Indexes for efficient querying
MerchantEventSchema.index({ merchantId: 1, eventType: 1 });
MerchantEventSchema.index({ merchantId: 1, timestamp: -1 });
MerchantEventSchema.index({ 'metadata.correlationId': 1 });

// TTL index to auto-delete events after 90 days
MerchantEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export const MerchantEventModel = mongoose.model<MerchantEventDocument>('MerchantEvent', MerchantEventSchema);

export default MerchantEventModel;
