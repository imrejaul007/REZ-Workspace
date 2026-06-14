import mongoose, { Document, Schema } from 'mongoose';

// Pipeline stage
export interface IPipelineStage {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  name: string;
  order: number;
  probability: number; // Win probability 0-100
  avgDaysInStage: number;

  // Stage config
  isActive: boolean;
  isWonStage: boolean;
  isLostStage: boolean;

  // Metrics
  dealCount: number;
  totalValue: number;

  // Meta
  createdAt: Date;
  updatedAt: Date;
}

// Pipeline
export interface IPipeline {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  name: string;
  description?: string;

  // Stages
  stages: IPipelineStage[];

  // Settings
  defaultCurrency: string;
  isDefault: boolean;

  // Meta
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Forecast period
export type ForecastPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// Forecast
export interface IForecast {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  pipelineId: mongoose.Types.ObjectId;
  period: ForecastPeriod;

  // Date range
  startDate: Date;
  endDate: Date;

  // Values
  totalPipeline: number;
  weightedPipeline: number;
  closedWon: number;
  closedLost: number;

  // Stage breakdown
  stageBreakdown: {
    stageId: mongoose.Types.ObjectId;
    stageName: string;
    dealCount: number;
    totalValue: number;
    weightedValue: number;
  }[];

  // Confidence
  confidence: number; // 0-100
  confidenceFactors: string[];

  // Comparison
  previousPeriodValue?: number;
  periodOverPeriodChange?: number;

  // Meta
  createdAt: Date;
  calculatedAt: Date;
}

// Deal movement suggestion
export interface ISuggestion {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  type: 'move_stage' | 'add_deal' | 'remove_deal' | 'increase_effort' |
        'accelerate' | 'stall_warning' | 'risk_alert' | 'opportunity';
  priority: 'critical' | 'high' | 'medium' | 'low';

  // Target
  dealId?: string;
  accountId?: string;

  // Suggestion details
  title: string;
  description: string;
  reason: string;

  // Action
  action: string;
  expectedOutcome?: string;

  // Impact
  potentialValue?: number;
  probabilityImpact?: number; // Percentage point change

  // Status
  status: 'pending' | 'accepted' | 'dismissed' | 'completed';
  dismissedAt?: Date;
  acceptedAt?: Date;
  completedAt?: Date;

  // Meta
  createdAt: Date;
  expiresAt?: Date;
}

// Pipeline analytics
export interface IPipelineAnalytics {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  pipelineId: mongoose.Types.ObjectId;

  // Date
  date: Date;

  // Metrics
  totalDeals: number;
  totalValue: number;
  avgDealSize: number;
  medianDealSize: number;

  // Velocity
  avgDaysToClose: number;
  avgDaysInStage: number;

  // Conversion
  conversionRate: number; // Won / (Won + Lost)
  stageConversionRates: {
    stageId: mongoose.Types.ObjectId;
    stageName: string;
    enterCount: number;
    exitCount: number;
    conversionRate: number;
  }[];

  // Velocity metrics
  velocityByStage: {
    stageId: mongoose.Types.ObjectId;
    stageName: string;
    avgDays: number;
  }[];

  // Win/loss
  dealsWon: number;
  dealsLost: number;
  valueWon: number;
  valueLost: number;

  // Created at
  createdAt: Date;
}

// Mongoose Models
const PipelineStageSchema = new Schema<IPipelineStage>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
    probability: { type: Number, default: 0 },
    avgDaysInStage: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isWonStage: { type: Boolean, default: false },
    isLostStage: { type: Boolean, default: false },
    dealCount: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 }
  },
  { timestamps: true }
);

PipelineStageSchema.index({ tenantId: 1, order: 1 });

const PipelineSchema = new Schema<IPipeline>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    stages: [PipelineStageSchema],
    defaultCurrency: { type: String, default: 'USD' },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

PipelineSchema.index({ tenantId: 1, isDefault: 1 });

const ForecastSchema = new Schema<IForecast>(
  {
    tenantId: { type: String, required: true, index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline', required: true },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      required: true
    },
    startDate: Date,
    endDate: Date,
    totalPipeline: Number,
    weightedPipeline: Number,
    closedWon: Number,
    closedLost: Number,
    stageBreakdown: [
      {
        stageId: Schema.Types.ObjectId,
        stageName: String,
        dealCount: Number,
        totalValue: Number,
        weightedValue: Number
      }
    ],
    confidence: Number,
    confidenceFactors: [String],
    previousPeriodValue: Number,
    periodOverPeriodChange: Number,
    calculatedAt: Date
  },
  { timestamps: true }
);

ForecastSchema.index({ tenantId: 1, pipelineId: 1, period: 1, startDate: -1 });

const SuggestionSchema = new Schema<ISuggestion>(
  {
    tenantId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['move_stage', 'add_deal', 'remove_deal', 'increase_effort',
             'accelerate', 'stall_warning', 'risk_alert', 'opportunity'],
      required: true
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium'
    },
    dealId: String,
    accountId: String,
    title: { type: String, required: true },
    description: String,
    reason: String,
    action: { type: String, required: true },
    expectedOutcome: String,
    potentialValue: Number,
    probabilityImpact: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'dismissed', 'completed'],
      default: 'pending'
    },
    dismissedAt: Date,
    acceptedAt: Date,
    completedAt: Date,
    expiresAt: Date
  },
  { timestamps: true }
);

SuggestionSchema.index({ tenantId: 1, status: 1 });
SuggestionSchema.index({ tenantId: 1, priority: 1, createdAt: -1 });
SuggestionSchema.index({ tenantId: 1, dealId: 1 });

const PipelineAnalyticsSchema = new Schema<IPipelineAnalytics>(
  {
    tenantId: { type: String, required: true, index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline', required: true },
    date: Date,
    totalDeals: Number,
    totalValue: Number,
    avgDealSize: Number,
    medianDealSize: Number,
    avgDaysToClose: Number,
    avgDaysInStage: Number,
    conversionRate: Number,
    stageConversionRates: [
      {
        stageId: Schema.Types.ObjectId,
        stageName: String,
        enterCount: Number,
        exitCount: Number,
        conversionRate: Number
      }
    ],
    velocityByStage: [
      {
        stageId: Schema.Types.ObjectId,
        stageName: String,
        avgDays: Number
      }
    ],
    dealsWon: Number,
    dealsLost: Number,
    valueWon: Number,
    valueLost: Number
  },
  { timestamps: true }
);

PipelineAnalyticsSchema.index({ tenantId: 1, pipelineId: 1, date: -1 });

// Export models
export const Pipeline = mongoose.model<IPipeline>('Pipeline', PipelineSchema);
export const Forecast = mongoose.model<IForecast>('Forecast', ForecastSchema);
export const Suggestion = mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
export const PipelineAnalytics = mongoose.model<IPipelineAnalytics>('PipelineAnalytics', PipelineAnalyticsSchema);
