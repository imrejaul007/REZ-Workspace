import mongoose, { Document, Schema } from 'mongoose';
import {
  ExperimentType,
  ExperimentStatus,
  Targeting,
  Metrics,
  Recommendation
} from '../types';

export interface IExperimentDocument extends Document {
  name: string;
  description: string;
  type: ExperimentType;
  status: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  targeting: Targeting;
  budget: number;
  spent: number;
  metrics: Metrics;
  testGroups: mongoose.Types.ObjectId[];
  results: mongoose.Types.ObjectId[];
  liftAnalyses: mongoose.Types.ObjectId[];
  recommendations: Recommendation[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
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

const TargetingSchema = new Schema({
  demographics: {
    ageRanges: [String],
    genders: [String],
    locations: [String],
    incomeBrackets: [String]
  },
  behavior: {
    interests: [String],
    purchaseFrequency: String,
    brandAffinity: [String]
  },
  geo: {
    countries: [String],
    regions: [String],
    cities: [String],
    postalCodes: [String]
  },
  device: {
    types: [String],
    os: [String]
  }
}, { _id: false });

const RecommendationSchema = new Schema({
  type: {
    type: String,
    enum: ['scaling', 'budget_reallocation', 'creative', 'targeting', 'timing'],
    required: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  expectedImpact: { type: Number, required: true },
  confidence: { type: Number, required: true },
  actionItems: [String]
}, { _id: false });

const ExperimentSchema = new Schema<IExperimentDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    type: {
      type: String,
      enum: Object.values(ExperimentType),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ExperimentStatus),
      default: ExperimentStatus.DRAFT
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    targeting: {
      type: TargetingSchema,
      default: () => ({})
    },
    budget: {
      type: Number,
      required: true,
      min: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    metrics: {
      type: MetricsSchema,
      default: () => ({})
    },
    testGroups: [{
      type: Schema.Types.ObjectId,
      ref: 'TestGroup'
    }],
    results: [{
      type: Schema.Types.ObjectId,
      ref: 'Result'
    }],
    liftAnalyses: [{
      type: Schema.Types.ObjectId,
      ref: 'LiftAnalysis'
    }],
    recommendations: {
      type: [RecommendationSchema],
      default: []
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'experiments'
  }
);

// Indexes
ExperimentSchema.index({ status: 1 });
ExperimentSchema.index({ type: 1 });
ExperimentSchema.index({ createdAt: -1 });
ExperimentSchema.index({ 'targeting.geo.countries': 1 });
ExperimentSchema.index({ 'targeting.geo.regions': 1 });
ExperimentSchema.index({ name: 'text', description: 'text' });

// Virtual for duration
ExperimentSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for spend percentage
ExperimentSchema.virtual('spendPercentage').get(function() {
  if (this.budget > 0) {
    return (this.spent / this.budget) * 100;
  }
  return 0;
});

// Methods
ExperimentSchema.methods.calculateMetrics = function() {
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

export const Experiment = mongoose.model<IExperimentDocument>('Experiment', ExperimentSchema);