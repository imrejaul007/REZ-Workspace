import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISegment extends Document {
  name: string;
  description?: string;
  criteria: {
    filters: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
      value: unknown;
    }>;
    logic: 'and' | 'or';
  };
  estimatedSize: number;
  ownerId: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    name: { type: String, required: true },
    description: String,
    criteria: {
      filters: [{
        field: { type: String, required: true },
        operator: { type: String, enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains'], required: true },
        value: { type: Schema.Types.Mixed, required: true },
      }],
      logic: { type: String, enum: ['and', 'or'], default: 'and' },
    },
    estimatedSize: { type: Number, default: 0 },
    ownerId: { type: String, required: true, index: true },
    tags: [String],
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

SegmentSchema.index({ ownerId: 1 });

export const Segment = mongoose.model<ISegment>('Segment', SegmentSchema);