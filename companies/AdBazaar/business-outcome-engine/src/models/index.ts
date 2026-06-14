import mongoose, { Schema, Document, Model } from 'mongoose';
import { OutcomeType, OutcomeStatus, InterventionType, PredictionModel } from '../types/index.js';

// ============ Business Goal Model ============

export interface IBusinessGoal extends Document {
  goalId: string;
  businessId: string;
  type: OutcomeType;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  targetDate: Date;
  status: OutcomeStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessGoalSchema = new Schema<IBusinessGoal>(
  {
    goalId: { type: String, required: true, unique: true, index: true },
    businessId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(OutcomeType), required: true },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    targetDate: { type: Date, required: true },
    status: { type: String, enum: Object.values(OutcomeStatus), default: OutcomeStatus.ACTIVE },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
BusinessGoalSchema.index({ businessId: 1, status: 1 });
BusinessGoalSchema.index({ businessId: 1, type: 1 });

// ============ Prediction Model ============

export interface IPrediction extends Document {
  predictionId: string;
  businessId: string;
  outcomeType: OutcomeType;
  predictedValue: number;
  confidence: number;
  predictionDate: Date;
  horizonDate: Date;
  model: PredictionModel;
  factors: Array<{
    name: string;
    impact: number;
    direction: 'positive' | 'negative' | 'neutral';
  }>;
  scenario?: {
    optimistic: number;
    base: number;
    pessimistic: number;
  };
  createdAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    predictionId: { type: String, required: true, unique: true, index: true },
    businessId: { type: String, required: true, index: true },
    outcomeType: { type: String, enum: Object.values(OutcomeType), required: true },
    predictedValue: { type: Number, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    predictionDate: { type: Date, required: true },
    horizonDate: { type: Date, required: true },
    model: { type: String, enum: Object.values(PredictionModel), required: true },
    factors: [
      new Schema(
        {
          name: { type: String, required: true },
          impact: { type: Number, required: true },
          direction: { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
        },
        { _id: false }
      ),
    ],
    scenario: {
      optimistic: Number,
      base: Number,
      pessimistic: Number,
    },
  },
  { timestamps: true }
);

// Indexes
PredictionSchema.index({ businessId: 1, outcomeType: 1, predictionDate: -1 });
PredictionSchema.index({ businessId: 1, horizonDate: 1 });

// ============ Intervention Model ============

export interface IIntervention extends Document {
  interventionId: string;
  goalId: string;
  businessId: string;
  type: InterventionType;
  description: string;
  expectedImpact: number;
  confidence: number;
  priority: number;
  cost?: number;
  estimatedROI?: number;
  status: 'pending' | 'applied' | 'completed' | 'cancelled';
  appliedAt?: Date;
  result?: {
    actualImpact?: number;
    achieved?: boolean;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const InterventionSchema = new Schema<IIntervention>(
  {
    interventionId: { type: String, required: true, unique: true, index: true },
    goalId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(InterventionType), required: true },
    description: { type: String, required: true },
    expectedImpact: { type: Number, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    priority: { type: Number, required: true, min: 1, max: 10 },
    cost: Number,
    estimatedROI: Number,
    status: { type: String, enum: ['pending', 'applied', 'completed', 'cancelled'], default: 'pending' },
    appliedAt: Date,
    result: {
      actualImpact: Number,
      achieved: Boolean,
      notes: String,
    },
  },
  { timestamps: true }
);

// Indexes
InterventionSchema.index({ businessId: 1, status: 1 });
InterventionSchema.index({ goalId: 1, priority: 1 });

// ============ Outcome Tracking Event Model ============

export interface IOutcomeTrackingEvent extends Document {
  eventId: string;
  businessId: string;
  goalId?: string;
  outcomeType: OutcomeType;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const OutcomeTrackingEventSchema = new Schema<IOutcomeTrackingEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    businessId: { type: String, required: true, index: true },
    goalId: { type: String, index: true },
    outcomeType: { type: String, enum: Object.values(OutcomeType), required: true },
    value: { type: Number, required: true },
    previousValue: Number,
    change: Number,
    changePercent: Number,
    timestamp: { type: Date, required: true },
    source: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
OutcomeTrackingEventSchema.index({ businessId: 1, outcomeType: 1, timestamp: -1 });
OutcomeTrackingEventSchema.index({ timestamp: -1 });

// ============ Learning Outcome Model ============

export interface ILearningOutcome extends Document {
  outcomeId: string;
  businessId: string;
  predictionId: string;
  interventionId?: string;
  predictedValue: number;
  actualValue: number;
  error: number;
  errorPercent: number;
  factors: Array<{
    name: string;
    predicted: number;
    actual: number;
    contribution: number;
  }>;
  timestamp: Date;
  modelUsed: PredictionModel;
  feedbackQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  createdAt: Date;
}

const LearningOutcomeSchema = new Schema<ILearningOutcome>(
  {
    outcomeId: { type: String, required: true, unique: true, index: true },
    businessId: { type: String, required: true, index: true },
    predictionId: { type: String, required: true, index: true },
    interventionId: String,
    predictedValue: { type: Number, required: true },
    actualValue: { type: Number, required: true },
    error: { type: Number, required: true },
    errorPercent: { type: Number, required: true },
    factors: [
      new Schema(
        {
          name: { type: String, required: true },
          predicted: { type: Number, required: true },
          actual: { type: Number, required: true },
          contribution: { type: Number, required: true },
        },
        { _id: false }
      ),
    ],
    timestamp: { type: Date, required: true },
    modelUsed: { type: String, enum: Object.values(PredictionModel), required: true },
    feedbackQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
  },
  { timestamps: true }
);

// Indexes
LearningOutcomeSchema.index({ businessId: 1, timestamp: -1 });
LearningOutcomeSchema.index({ modelUsed: 1, timestamp: -1 });
LearningOutcomeSchema.index({ errorPercent: 1 });

// ============ Model Exports ============

export const BusinessGoal = mongoose.model<IBusinessGoal>('BusinessGoal', BusinessGoalSchema);
export const Prediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);
export const Intervention = mongoose.model<IIntervention>('Intervention', InterventionSchema);
export const OutcomeTrackingEvent = mongoose.model<IOutcomeTrackingEvent>('OutcomeTrackingEvent', OutcomeTrackingEventSchema);
export const LearningOutcome = mongoose.model<ILearningOutcome>('LearningOutcome', LearningOutcomeSchema);

// Model map for dynamic access
export const models = {
  BusinessGoal,
  Prediction,
  Intervention,
  OutcomeTrackingEvent,
  LearningOutcome,
};

export type ModelMap = typeof models;