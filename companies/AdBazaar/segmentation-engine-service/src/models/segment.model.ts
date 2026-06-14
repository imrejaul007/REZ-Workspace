import mongoose, { Document, Schema } from 'mongoose';

export interface ISegment extends Document {
  segmentId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  type: 'dynamic' | 'static' | 'hybrid';
  criteria: Array<{
    criteriaId: string;
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between' | 'exists' | 'not_exists' | 'starts_with' | 'ends_with';
    value: unknown;
  }>;
  criteriaLogic: 'and' | 'or';
  memberCount: number;
  estimatedReach?: number;
  refreshInterval?: number; // minutes
  lastRefreshed?: Date;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const criteriaSchema = new Schema({
  criteriaId: { type: String, required: true },
  field: { type: String, required: true },
  operator: {
    type: String,
    enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'between', 'exists', 'not_exists', 'starts_with', 'ends_with'],
    required: true
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const segmentSchema = new Schema<ISegment>({
  segmentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  type: {
    type: String,
    enum: ['dynamic', 'static', 'hybrid'],
    default: 'dynamic'
  },
  criteria: [criteriaSchema],
  criteriaLogic: {
    type: String,
    enum: ['and', 'or'],
    default: 'and'
  },
  memberCount: { type: Number, default: 0 },
  estimatedReach: { type: Number },
  refreshInterval: { type: Number }, // minutes
  lastRefreshed: { type: Date },
  tags: [String],
  createdBy: { type: String, required: true }
}, { timestamps: true });

segmentSchema.index({ segmentId: 1 });
segmentSchema.index({ status: 1 });
segmentSchema.index({ name: 'text' });
segmentSchema.index({ tags: 1 });
segmentSchema.index({ createdBy: 1 });

export const Segment = mongoose.model<ISegment>('Segment', segmentSchema);