import mongoose, { Schema, Document } from 'mongoose';
import { IntentSignal, EventType, SignalCategory } from '../types';

export interface IntentSignalDocument extends Omit<IntentSignal, 'timestamp'>, Document {
  timestamp: Date;
  enrichmentData?: {
    userProfile?: Record<string, unknown>;
    relatedSignals?: string[];
    intentClusters?: string[];
    predictedNextActions?: string[];
  };
  signalHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventTypeEnum: EventType[] = ['search', 'view', 'wishlist', 'cart_add', 'checkout_start', 'fulfilled'];
const categoryEnum: SignalCategory[] = ['DINING', 'TRAVEL', 'RETAIL', 'HEALTHCARE', 'GENERAL'];

const IntentSignalSchema = new Schema<IntentSignalDocument>(
  {
    signalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    sourceService: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: eventTypeEnum,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: categoryEnum,
      required: true,
      index: true,
    },
    intentKey: {
      type: String,
      required: true,
      index: true,
    },
    intentQuery: {
      type: String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    enriched: {
      type: Boolean,
      default: false,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    enrichmentData: {
      userProfile: { type: Schema.Types.Mixed },
      relatedSignals: [{ type: String }],
      intentClusters: [{ type: String }],
      predictedNextActions: [{ type: String }],
    },
    signalHash: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'intent_signals',
  }
);

// Compound indexes for common queries
IntentSignalSchema.index({ userId: 1, timestamp: -1 });
IntentSignalSchema.index({ source: 1, eventType: 1, timestamp: -1 });
IntentSignalSchema.index({ category: 1, intentKey: 1 });
IntentSignalSchema.index({ signalHash: 1, timestamp: 1 });

// TTL index to auto-delete old signals (optional, 90 days)
IntentSignalSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const IntentSignalModel = mongoose.model<IntentSignalDocument>(
  'IntentSignal',
  IntentSignalSchema
);

// Aggregation helpers
export async function getSignalStats() {
  const stats = await IntentSignalModel.aggregate([
    {
      $facet: {
        totalCount: [{ $count: 'count' }],
        bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
        byEventType: [{ $group: { _id: '$eventType', count: { $sum: 1 } } }],
        avgConfidence: [{ $group: { _id: null, avg: { $avg: '$confidence' } } }],
        enrichedCount: [{ $match: { enriched: true } }, { $count: 'count' }],
      },
    },
  ]);

  const result = stats[0];

  return {
    totalSignals: result.totalCount[0]?.count || 0,
    signalsBySource: Object.fromEntries(
      result.bySource.map((s: { _id: string; count: number }) => [s._id, s.count])
    ),
    signalsByCategory: Object.fromEntries(
      result.byCategory.map((s: { _id: string; count: number }) => [s._id, s.count])
    ),
    signalsByEventType: Object.fromEntries(
      result.byEventType.map((s: { _id: string; count: number }) => [s._id, s.count])
    ),
    averageConfidence: result.avgConfidence[0]?.avg || 0,
    enrichedSignals: result.enrichedCount[0]?.count || 0,
    lastUpdated: new Date(),
  };
}

export async function getUserSignals(
  userId: string,
  limit = 100,
  offset = 0
): Promise<IntentSignalDocument[]> {
  return IntentSignalModel.find({ userId })
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
}

export async function findDuplicateByHash(
  signalHash: string,
  windowStart: Date
): Promise<IntentSignalDocument | null> {
  return IntentSignalModel.findOne({
    signalHash,
    timestamp: { $gte: windowStart },
  }).exec();
}

export async function findRecentSignals(
  userId: string,
  limit = 10
): Promise<IntentSignalDocument[]> {
  return IntentSignalModel.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
}