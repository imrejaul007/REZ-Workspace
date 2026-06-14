import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesLiftMetric extends Document {
  date: Date;
  campaignId: string;
  campaignName: string;
  retailerId: string;
  retailerName: string;
  category: string;
  baseline: number;
  actual: number;
  lift: number;
  liftPercentage: number;
  confidence: number;
  sampleSize: number;
  controlGroup: number;
  treatmentGroup: number;
  pValue: number;
  statisticalSignificance: boolean;
  channels: string[];
  regions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SalesLiftMetricSchema = new Schema<ISalesLiftMetric>(
  {
    date: { type: Date, required: true, index: true },
    campaignId: { type: String, required: true, index: true },
    campaignName: { type: String, required: true },
    retailerId: { type: String, required: true, index: true },
    retailerName: { type: String, required: true },
    category: { type: String, required: true },
    baseline: { type: Number, required: true },
    actual: { type: Number, required: true },
    lift: { type: Number, required: true },
    liftPercentage: { type: Number, required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    sampleSize: { type: Number, required: true },
    controlGroup: { type: Number, required: true },
    treatmentGroup: { type: Number, required: true },
    pValue: { type: Number, required: true },
    statisticalSignificance: { type: Boolean, required: true },
    channels: [{ type: String }],
    regions: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

SalesLiftMetricSchema.index({ date: -1, campaignId: 1 });
SalesLiftMetricSchema.index({ retailerId: 1, date: -1 });
SalesLiftMetricSchema.index({ category: 1, date: -1 });

export const SalesLiftMetric = mongoose.model<ISalesLiftMetric>(
  'SalesLiftMetric',
  SalesLiftMetricSchema
);