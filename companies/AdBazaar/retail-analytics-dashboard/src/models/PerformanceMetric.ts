import mongoose, { Schema, Document } from 'mongoose';

export interface IMetricDimension {
  name: string;
  value: string;
}

export interface IPerformanceMetric extends Document {
  date: Date;
  metricType: 'impression' | 'conversion' | 'engagement' | 'roi' | 'reach';
  retailerId: string;
  retailerName: string;
  campaignId?: string;
  metrics: {
    value: number;
    previousValue?: number;
    change?: number;
    changePercentage?: number;
  };
  dimensions: IMetricDimension[];
  source: 'dooh' | 'digital' | 'physical' | 'mixed';
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  updatedAt: Date;
}

const MetricDimensionSchema = new Schema<IMetricDimension>({
  name: { type: String, required: true },
  value: { type: String, required: true },
});

const PerformanceMetricSchema = new Schema<IPerformanceMetric>(
  {
    date: { type: Date, required: true, index: true },
    metricType: {
      type: String,
      enum: ['impression', 'conversion', 'engagement', 'roi', 'reach'],
      required: true,
      index: true,
    },
    retailerId: { type: String, required: true, index: true },
    retailerName: { type: String, required: true },
    campaignId: { type: String, index: true },
    metrics: {
      value: { type: Number, required: true },
      previousValue: { type: Number },
      change: { type: Number },
      changePercentage: { type: Number },
    },
    dimensions: [MetricDimensionSchema],
    source: {
      type: String,
      enum: ['dooh', 'digital', 'physical', 'mixed'],
      required: true,
    },
    granularity: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PerformanceMetricSchema.index({ date: -1, metricType: 1 });
PerformanceMetricSchema.index({ retailerId: 1, date: -1 });
PerformanceMetricSchema.index({ campaignId: 1, date: -1 });

export const PerformanceMetric = mongoose.model<IPerformanceMetric>(
  'PerformanceMetric',
  PerformanceMetricSchema
);