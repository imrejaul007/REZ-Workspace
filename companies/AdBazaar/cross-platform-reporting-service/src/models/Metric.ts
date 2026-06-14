import mongoose, { Document, Schema } from 'mongoose';

export interface IMetric extends Document {
  name: string;
  key: string;
  description?: string;
  category: 'performance' | 'financial' | 'engagement' | 'conversion';
  calculation: {
    type: 'sum' | 'avg' | 'count' | 'percentage' | 'custom';
    formula?: string;
    sources: string[];
  };
  unit?: string;
  format?: string;
  aggregation: 'daily' | 'weekly' | 'monthly' | 'yearly';
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MetricSchema = new Schema<IMetric>(
  {
    name: { type: String, required: true, index: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['performance', 'financial', 'engagement', 'conversion'],
      required: true
    },
    calculation: {
      type: {
        type: String,
        enum: ['sum', 'avg', 'count', 'percentage', 'custom'],
        required: true
      },
      formula: { type: String },
      sources: [{ type: String }]
    },
    unit: { type: String },
    format: { type: String },
    aggregation: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'daily'
    },
    organizationId: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

MetricSchema.index({ organizationId: 1, category: 1 });

export const Metric = mongoose.model<IMetric>('Metric', MetricSchema);