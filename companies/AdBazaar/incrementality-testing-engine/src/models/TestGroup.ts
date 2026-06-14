import mongoose, { Document, Schema } from 'mongoose';
import { TestGroupType, Metrics } from '../types';

export interface ITestGroupDocument extends Document {
  experimentId: mongoose.Types.ObjectId;
  name: string;
  type: TestGroupType;
  size: number;
  metrics: Metrics;
  allocation: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MetricsSchema = new Schema({
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  cvr: { type: Number, default: 0 },
  roas: { type: Number, default: 0 },
  cpa: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  brandAwareness: { type: Number, default: 0 },
  consideration: { type: Number, default: 0 },
  intent: { type: Number, default: 0 }
}, { _id: false });

const TestGroupSchema = new Schema<ITestGroupDocument>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'Experiment',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      enum: Object.values(TestGroupType),
      required: true
    },
    size: {
      type: Number,
      default: 0,
      min: 0
    },
    metrics: {
      type: MetricsSchema,
      default: () => ({
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        cost: 0,
        ctr: 0,
        cvr: 0,
        roas: 0,
        cpa: 0,
        engagement: 0,
        brandAwareness: 0,
        consideration: 0,
        intent: 0
      })
    },
    allocation: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'test_groups'
  }
);

// Indexes
TestGroupSchema.index({ experimentId: 1, type: 1 });
TestGroupSchema.index({ isActive: 1 });

// Methods
TestGroupSchema.methods.calculateMetrics = function() {
  const metrics = this.metrics;

  if (metrics.impressions > 0) {
    metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
  }

  if (metrics.clicks > 0) {
    metrics.cvr = (metrics.conversions / metrics.clicks) * 100;
    metrics.cpa = metrics.cost / metrics.conversions;
  }

  if (metrics.cost > 0) {
    metrics.roas = metrics.revenue / metrics.cost;
  }

  return metrics;
};

TestGroupSchema.methods.getConversionRate = function(): number {
  if (this.metrics.clicks > 0) {
    return (this.metrics.conversions / this.metrics.clicks) * 100;
  }
  return 0;
};

TestGroupSchema.methods.getClickThroughRate = function(): number {
  if (this.metrics.impressions > 0) {
    return (this.metrics.clicks / this.metrics.impressions) * 100;
  }
  return 0;
};

export const TestGroup = mongoose.model<ITestGroupDocument>('TestGroup', TestGroupSchema);