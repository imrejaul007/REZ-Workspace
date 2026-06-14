import mongoose, { Document, Schema } from 'mongoose';

export interface IMatchResult extends Document {
  sourceIds: string[];
  targetId: string;
  method: 'deterministic' | 'probabilistic' | 'merge';
  confidence: number;
  features: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

const MatchResultSchema = new Schema<IMatchResult>(
  {
    sourceIds: {
      type: [String],
      required: true
    },
    targetId: {
      type: String,
      required: true,
      index: true
    },
    method: {
      type: String,
      enum: ['deterministic', 'probabilistic', 'merge'],
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    features: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      expires: 2592000 // 30 days TTL
    }
  },
  {
    timestamps: true
  }
);

// Indexes
MatchResultSchema.index({ method: 1 });
MatchResultSchema.index({ confidence: -1 });
MatchResultSchema.index({ createdAt: -1 });
MatchResultSchema.index({ targetId: 1, method: 1 });
MatchResultSchema.index({ sourceIds: 1 });

export const MatchResult = mongoose.model<IMatchResult>('MatchResult', MatchResultSchema);