import mongoose, { Document, Schema } from 'mongoose';

export interface ISegment extends Document {
  name: string;
  description?: string;
  criteria: {
    rules: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'not_contains' | 'between' | 'exists';
      value: any;
      logicalOperator?: 'and' | 'or';
    }>;
    logic: 'all' | 'any';
  };
  size?: number;
  estimatedSize?: number;
  color?: string;
  tags: string[];
  organizationId: string;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    criteria: {
      rules: [
        {
          field: { type: String, required: true },
          operator: {
            type: String,
            enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'contains', 'not_contains', 'between', 'exists'],
            required: true
          },
          value: { type: Schema.Types.Mixed, required: true },
          logicalOperator: {
            type: String,
            enum: ['and', 'or'],
            default: 'and'
          }
        }
      ],
      logic: {
        type: String,
        enum: ['all', 'any'],
        default: 'all'
      }
    },
    size: { type: Number },
    estimatedSize: { type: Number },
    color: { type: String },
    tags: [{ type: String }],
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

SegmentSchema.index({ organizationId: 1, isActive: 1 });

export const Segment = mongoose.model<ISegment>('Segment', SegmentSchema);