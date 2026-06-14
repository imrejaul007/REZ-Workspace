/**
 * ReZ Segments - Segment Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISegment extends Document {
  shop: string;
  tenantId: string;
  brandId: string;
  name: string;
  description: string;
  type: 'dynamic' | 'static';
  rules: SegmentRule[];
  customerCount: number;
  lastCalculated?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'between' | 'days_ago_gt' | 'days_ago_lt';
  value: any;
  conjunction?: 'and' | 'or';
}

const SegmentRuleSchema = new Schema({
  field: { type: String, required: true },
  operator: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  conjunction: { type: String, enum: ['and', 'or'], default: 'and' },
}, { _id: false });

const SegmentSchema = new Schema({
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['dynamic', 'static'], default: 'dynamic' },
  rules: [SegmentRuleSchema],
  customerCount: { type: Number, default: 0 },
  lastCalculated: Date,
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'segments',
});

SegmentSchema.index({ shop: 1, active: 1 });
SegmentSchema.index({ tenantId: 1, brandId: 1 });

export const Segment = mongoose.model<ISegment>('Segment', SegmentSchema);
