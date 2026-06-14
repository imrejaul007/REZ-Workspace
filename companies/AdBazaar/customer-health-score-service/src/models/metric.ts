import mongoose, { Schema, Document } from 'mongoose';

export interface IMetric extends Document {
  customerId: string;
  name: string;
  category: 'engagement' | 'usage' | 'payment' | 'support' | 'adoption';
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  unit: string;
  timestamp: Date;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const MetricSchema = new Schema<IMetric>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['engagement', 'usage', 'payment', 'support', 'adoption'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    previousValue: {
      type: Number,
      default: 0,
    },
    change: {
      type: Number,
      default: 0,
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'health_metrics',
  }
);

// Indexes
MetricSchema.index({ customerId: 1, name: 1 });
MetricSchema.index({ customerId: 1, category: 1 });
MetricSchema.index({ customerId: 1, timestamp: -1 });
MetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year TTL

export const MetricModel = mongoose.model<IMetric>('Metric', MetricSchema);
