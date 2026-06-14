import mongoose, { Document, Schema } from 'mongoose';

export interface IExperiment extends Document {
  experimentId: string;
  name: string;
  description?: string;
  type: 'ab' | 'multivariate' | 'feature_flag' | 'canary' | 'champion_challenger';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  owner: string;
  team?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  trafficPercentage: number;
  targeting?: {
    userIds?: string[];
    segments?: string[];
    countries?: string[];
    platforms?: string[];
    userTypes?: string[];
  };
  variants: Array<{
    variantId: string;
    name: string;
    weight: number;
    description?: string;
  }>;
  metrics: Array<{
    metricId: string;
    name: string;
    type: 'conversion' | 'revenue' | 'engagement' | 'retention' | 'custom';
    unit: string;
    higherIsBetter: boolean;
  }>;
  guardrails?: Array<{
    metricId: string;
    name: string;
    minValue: number;
    maxValue: number;
  }>;
  hypothesis?: string;
  createdAt: Date;
  updatedAt: Date;
}

const variantConfigSchema = new Schema({
  variantId: { type: String, required: true },
  name: { type: String, required: true },
  weight: { type: Number, required: true, min: 0, max: 100 },
  description: { type: String }
}, { _id: false });

const metricConfigSchema = new Schema({
  metricId: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['conversion', 'revenue', 'engagement', 'retention', 'custom'],
    required: true
  },
  unit: { type: String, required: true },
  higherIsBetter: { type: Boolean, default: true }
}, { _id: false });

const guardrailConfigSchema = new Schema({
  metricId: { type: String, required: true },
  name: { type: String, required: true },
  minValue: { type: Number, required: true },
  maxValue: { type: Number, required: true }
}, { _id: false });

const experimentSchema = new Schema<IExperiment>({
  experimentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['ab', 'multivariate', 'feature_flag', 'canary', 'champion_challenger'],
    default: 'ab'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  owner: { type: String, required: true },
  team: { type: String },
  tags: [String],
  startDate: { type: Date },
  endDate: { type: Date },
  trafficPercentage: { type: Number, default: 100, min: 0, max: 100 },
  targeting: {
    userIds: [String],
    segments: [String],
    countries: [String],
    platforms: [String],
    userTypes: [String]
  },
  variants: [variantConfigSchema],
  metrics: [metricConfigSchema],
  guardrails: [guardrailConfigSchema],
  hypothesis: { type: String }
}, { timestamps: true });

experimentSchema.index({ experimentId: 1 });
experimentSchema.index({ status: 1 });
experimentSchema.index({ owner: 1 });
experimentSchema.index({ tags: 1 });

export const Experiment = mongoose.model<IExperiment>('Experiment', experimentSchema);