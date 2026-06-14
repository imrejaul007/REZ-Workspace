import mongoose, { Schema, Document } from 'mongoose';

export interface AdEventDocument extends Document {
  eventId: string;
  campaignId: string;
  creativeId: string;
  placementId: string;
  eventType: 'impression' | 'view' | 'click' | 'skip' | 'complete' | 'firstQuartile' | 'midpoint' | 'thirdQuartile' | 'error';
  deviceId?: string;
  deviceType: string;
  timestamp: Date;
  metadata?: {
    videoPosition?: number;
    skipOffset?: number;
    podPosition?: number;
    geo?: string;
    appId?: string;
    ip?: string;
    userAgent?: string;
 };
}

const AdEventSchema = new Schema<AdEventDocument>({
  eventId: { type: String, required: true, unique: true, index: true },
  campaignId: { type: String, required: true, index: true },
  creativeId: { type: String, required: true, index: true },
  placementId: { type: String, required: true, index: true },
  eventType: {
    type: String,
    enum: ['impression', 'view', 'click', 'skip', 'complete', 'firstQuartile', 'midpoint', 'thirdQuartile', 'error'],
    required: true,
    index: true
  },
  deviceId: { type: String, index: true },
  deviceType: { type: String, required: true },
  timestamp: { type: Date, required: true, index: true },
  metadata: {
    videoPosition: Number,
    skipOffset: Number,
    podPosition: Number,
    geo: String,
    appId: String,
    ip: String,
    userAgent: String,
  },
}, {
  timestamps: true,
  collection: 'ad_events',
});

// TTL index - events expire after 90 days
AdEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound indexes for analytics queries
AdEventSchema.index({ campaignId: 1, eventType: 1, timestamp: -1 });
AdEventSchema.index({ creativeId: 1, eventType: 1, timestamp: -1 });
AdEventSchema.index({ deviceId: 1, timestamp: -1 });

export const AdEventModel = mongoose.model<AdEventDocument>('AdEvent', AdEventSchema);
