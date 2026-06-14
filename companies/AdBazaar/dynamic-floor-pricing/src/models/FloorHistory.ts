import mongoose, { Schema, Document } from 'mongoose';

export interface IFloorHistory extends Document {
  floorId: string;
  inventoryId: string;
  previousPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercent: number;
  timestamp: Date;
  reason: string;
  reasonCode: string;
  triggeredBy: 'manual' | 'automatic' | 'ai_optimization' | 'market_adjustment' | 'competitor_adjustment';
  factors: {
    impressions?: number;
    revenue?: number;
    ecpm?: number;
    competitorPrice?: number;
    marketRate?: number;
    demandScore?: number;
  };
  metadata: {
    optimizationId?: string;
    algorithm?: string;
    confidence?: number;
    notes?: string;
  };
  createdAt: Date;
}

const FloorHistorySchema = new Schema<IFloorHistory>(
  {
    floorId: {
      type: String,
      required: true,
      index: true
    },
    inventoryId: {
      type: String,
      required: true,
      index: true
    },
    previousPrice: {
      type: Number,
      required: true
    },
    newPrice: {
      type: Number,
      required: true
    },
    priceChange: {
      type: Number,
      required: true
    },
    priceChangePercent: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    reason: {
      type: String,
      required: true
    },
    reasonCode: {
      type: String,
      required: true,
      index: true
    },
    triggeredBy: {
      type: String,
      enum: ['manual', 'automatic', 'ai_optimization', 'market_adjustment', 'competitor_adjustment'],
      required: true,
      index: true
    },
    factors: {
      impressions: Number,
      revenue: Number,
      ecpm: Number,
      competitorPrice: Number,
      marketRate: Number,
      demandScore: Number
    },
    metadata: {
      optimizationId: String,
      algorithm: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      notes: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'floor_history'
  }
);

// Compound indexes for efficient queries
FloorHistorySchema.index({ floorId: 1, timestamp: -1 });
FloorHistorySchema.index({ inventoryId: 1, timestamp: -1 });
FloorHistorySchema.index({ reasonCode: 1, timestamp: -1 });
FloorHistorySchema.index({ triggeredBy: 1, timestamp: -1 });

// TTL index for automatic cleanup (90 days)
FloorHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const FloorHistory = mongoose.model<IFloorHistory>('FloorHistory', FloorHistorySchema);