import mongoose, { Schema, Document } from 'mongoose';

export interface IFloorRecommendation extends Document {
  inventoryId: string;
  floorId?: string;
  currentPrice: number;
  suggestedPrice: number;
  confidence: number;
  direction: 'increase' | 'decrease' | 'maintain';
  algorithm: string;
  factors: Array<{
    name: string;
    impact: number;
    weight: number;
    description: string;
  }>;
  projectedImpact: {
    revenueChange: number;
    ecpmChange: number;
    demandImpact: number;
  };
  validUntil: Date;
  metadata: {
    modelVersion: string;
    trainingDataEndDate?: Date;
    features?: Record<string, number>;
  };
  status: 'pending' | 'applied' | 'dismissed' | 'expired';
  appliedAt?: Date;
  dismissedAt?: Date;
  dismissedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FloorRecommendationSchema = new Schema<IFloorRecommendation>(
  {
    inventoryId: {
      type: String,
      required: true,
      index: true
    },
    floorId: String,
    currentPrice: {
      type: Number,
      required: true
    },
    suggestedPrice: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    direction: {
      type: String,
      enum: ['increase', 'decrease', 'maintain'],
      required: true
    },
    algorithm: {
      type: String,
      required: true,
      default: 'rule_based'
    },
    factors: [
      {
        name: { type: String, required: true },
        impact: { type: Number, required: true },
        weight: { type: Number, required: true },
        description: { type: String }
      }
    ],
    projectedImpact: {
      revenueChange: { type: Number, default: 0 },
      ecpmChange: { type: Number, default: 0 },
      demandImpact: { type: Number, default: 0 }
    },
    validUntil: {
      type: Date,
      required: true,
      index: true
    },
    metadata: {
      modelVersion: { type: String, default: '1.0.0' },
      trainingDataEndDate: Date,
      features: Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ['pending', 'applied', 'dismissed', 'expired'],
      default: 'pending',
      index: true
    },
    appliedAt: Date,
    dismissedAt: Date,
    dismissedReason: String
  },
  {
    timestamps: true,
    collection: 'floor_recommendations'
  }
);

// Compound indexes
FloorRecommendationSchema.index({ inventoryId: 1, status: 1 });
FloorRecommendationSchema.index({ inventoryId: 1, validUntil: 1 });
FloorRecommendationSchema.index({ status: 1, createdAt: -1 });

// TTL index for automatic cleanup (30 days after validUntil)
FloorRecommendationSchema.index(
  { validUntil: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

export const FloorRecommendation = mongoose.model<IFloorRecommendation>(
  'FloorRecommendation',
  FloorRecommendationSchema
);