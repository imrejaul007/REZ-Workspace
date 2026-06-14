import mongoose, { Document, Schema } from 'mongoose';

export interface IMetric extends Document {
  metricId: string;
  experimentId: string;
  variantId: string;
  metricName: string;
  value: number;
  sampleSize: number;
  timestamp: Date;
  dimensions?: Record<string, string>;
  createdAt: Date;
}

const metricSchema = new Schema<IMetric>({
  metricId: { type: String, required: true, unique: true },
  experimentId: { type: String, required: true },
  variantId: { type: String, required: true },
  metricName: { type: String, required: true },
  value: { type: Number, required: true },
  sampleSize: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  dimensions: { type: Map, of: String }
}, { timestamps: true });

metricSchema.index({ metricId: 1 });
metricSchema.index({ experimentId: 1 });
metricSchema.index({ variantId: 1 });
metricSchema.index({ experimentId: 1, variantId: 1 });
metricSchema.index({ timestamp: -1 });

export const Metric = mongoose.model<IMetric>('Metric', metricSchema);