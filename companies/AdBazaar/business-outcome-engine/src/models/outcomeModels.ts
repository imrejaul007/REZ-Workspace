import mongoose, { Schema, Document } from 'mongoose';

// ============ Campaign Objective Types ============

export enum CampaignObjective {
  REVENUE = 'revenue',
  CONVERSIONS = 'conversions',
  LEADS = 'leads',
  TRAFFIC = 'traffic',
  ENGAGEMENT = 'engagement',
  AWARENESS = 'awareness',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AttributionModel {
  FIRST_TOUCH = 'first_touch',
  LAST_TOUCH = 'last_touch',
  LINEAR = 'linear',
  TIME_DECAY = 'time_decay',
  POSITION_BASED = 'position_based',
  DATA_DRIVEN = 'data_driven',
}

// ============ OutcomeCampaign Model ============

export interface IOutcomeCampaign extends Document {
  campaignId: string;
  advertiserId: string;
  name: string;
  description?: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  startDate: Date;
  endDate?: Date;

  // Budget & KPIs
  budget: {
    total: number;
    spent: number;
    currency: string;
    dailyLimit?: number;
  };

  kpis: {
    target: number;
    current: number;
    metric: string;
    unit: 'currency' | 'count' | 'percentage';
  };

  // Attribution settings
  attribution: {
    model: AttributionModel;
    lookbackWindow: number; // days
    touchpointWeight?: Record<string, number>;
  };

  // Targeting
  targeting?: {
    channels?: string[];
    audiences?: string[];
    geographies?: string[];
    demographics?: Record<string, any>;
  };

  // Metadata
  metadata?: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const OutcomeCampaignSchema = new Schema<IOutcomeCampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    advertiserId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    objective: {
      type: String,
      enum: Object.values(CampaignObjective),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      default: CampaignStatus.DRAFT
    },
    startDate: { type: Date, required: true },
    endDate: Date,

    budget: {
      total: { type: Number, required: true },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      dailyLimit: Number,
    },

    kpis: {
      target: { type: Number, required: true },
      current: { type: Number, default: 0 },
      metric: { type: String, required: true },
      unit: {
        type: String,
        enum: ['currency', 'count', 'percentage'],
        default: 'count'
      },
    },

    attribution: {
      model: {
        type: String,
        enum: Object.values(AttributionModel),
        default: AttributionModel.LINEAR
      },
      lookbackWindow: { type: Number, default: 30 },
      touchpointWeight: { type: Schema.Types.Mixed },
    },

    targeting: {
      channels: [String],
      audiences: [String],
      geographies: [String],
      demographics: { type: Schema.Types.Mixed },
    },

    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
OutcomeCampaignSchema.index({ advertiserId: 1, status: 1 });
OutcomeCampaignSchema.index({ advertiserId: 1, objective: 1 });
OutcomeCampaignSchema.index({ startDate: 1, endDate: 1 });

// ============ BusinessOutcome Model ============

export interface IBusinessOutcome extends Document {
  outcomeId: string;
  campaignId: string;
  advertiserId: string;

  // Outcome details
  type: 'conversion' | 'purchase' | 'signup' | 'lead' | 'engagement' | 'impression' | 'click';
  value: number;
  currency: string;

  // Customer info
  customerId?: string;
  sessionId?: string;
  device?: string;
  location?: string;

  // Conversion details
  conversionData: {
    channel: string;
    source?: string;
    medium?: string;
    campaign?: string;
    keyword?: string;
    adId?: string;
    creativeId?: string;
  };

  // Attribution
  attributedRevenue?: number;
  attributionConfidence?: number;

  // Timestamps
  timestamp: Date;
  createdAt: Date;
}

const BusinessOutcomeSchema = new Schema<IBusinessOutcome>(
  {
    outcomeId: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    advertiserId: { type: String, required: true, index: true },

    type: {
      type: String,
      enum: ['conversion', 'purchase', 'signup', 'lead', 'engagement', 'impression', 'click'],
      required: true
    },
    value: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },

    customerId: String,
    sessionId: String,
    device: String,
    location: String,

    conversionData: {
      channel: { type: String, required: true },
      source: String,
      medium: String,
      campaign: String,
      keyword: String,
      adId: String,
      creativeId: String,
    },

    attributedRevenue: Number,
    attributionConfidence: Number,

    timestamp: { type: Date, required: true },
  },
  { timestamps: true }
);

// Indexes
BusinessOutcomeSchema.index({ campaignId: 1, timestamp: -1 });
BusinessOutcomeSchema.index({ advertiserId: 1, timestamp: -1 });
BusinessOutcomeSchema.index({ type: 1, timestamp: -1 });
BusinessOutcomeSchema.index({ 'conversionData.channel': 1 });

// ============ Attribution Model ============

export interface IAttribution extends Document {
  attributionId: string;
  outcomeId: string;
  campaignId: string;

  // Touchpoints in the conversion path
  touchpoints: Array<{
    touchpointId: string;
    channel: string;
    source: string;
    timestamp: Date;
    interactionType: 'impression' | 'click' | 'engagement';

    // Attribution data
    credit: number;
    weight: number;
    position: number;

    // Additional context
    campaign?: string;
    adGroup?: string;
    keyword?: string;
    creative?: string;
    placement?: string;
  }>;

  // Attribution result
  attributionModel: AttributionModel;
  totalCredit: number;

  // Revenue attribution
  attributedRevenue: number;
  attributedConversions: number;

  // Metadata
  metadata?: Record<string, any>;

  createdAt: Date;
}

const AttributionSchema = new Schema<IAttribution>(
  {
    attributionId: { type: String, required: true, unique: true, index: true },
    outcomeId: { type: String, required: true, index: true },
    campaignId: { type: String, required: true, index: true },

    touchpoints: [{
      touchpointId: { type: String, required: true },
      channel: { type: String, required: true },
      source: { type: String, required: true },
      timestamp: { type: Date, required: true },
      interactionType: {
        type: String,
        enum: ['impression', 'click', 'engagement'],
        required: true
      },
      credit: { type: Number, required: true },
      weight: { type: Number, required: true },
      position: { type: Number, required: true },
      campaign: String,
      adGroup: String,
      keyword: String,
      creative: String,
      placement: String,
    }],

    attributionModel: {
      type: String,
      enum: Object.values(AttributionModel),
      required: true
    },
    totalCredit: { type: Number, required: true },

    attributedRevenue: { type: Number, default: 0 },
    attributedConversions: { type: Number, default: 1 },

    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
AttributionSchema.index({ campaignId: 1, createdAt: -1 });
AttributionSchema.index({ outcomeId: 1 });

// ============ Touchpoint Event Model (for tracking user journey) ============

export interface ITouchpointEvent extends Document {
  touchpointId: string;
  customerId?: string;
  sessionId: string;

  // Event details
  channel: string;
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;

  // Interaction
  interactionType: 'impression' | 'click' | 'engagement' | 'conversion';

  // Context
  device?: string;
  location?: string;
  referrer?: string;
  landingPage?: string;

  // Campaign association
  campaignId?: string;
  adId?: string;

  // Revenue/value if conversion
  value?: number;

  timestamp: Date;
  createdAt: Date;
}

const TouchpointEventSchema = new Schema<ITouchpointEvent>(
  {
    touchpointId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true },
    sessionId: { type: String, required: true, index: true },

    channel: { type: String, required: true },
    source: { type: String, required: true },
    medium: String,
    campaign: String,
    content: String,
    term: String,

    interactionType: {
      type: String,
      enum: ['impression', 'click', 'engagement', 'conversion'],
      required: true
    },

    device: String,
    location: String,
    referrer: String,
    landingPage: String,

    campaignId: String,
    adId: String,

    value: Number,

    timestamp: { type: Date, required: true },
  },
  { timestamps: true }
);

// Indexes
TouchpointEventSchema.index({ sessionId: 1, timestamp: 1 });
TouchpointEventSchema.index({ customerId: 1, timestamp: -1 });
TouchpointEventSchema.index({ campaignId: 1, timestamp: -1 });
TouchpointEventSchema.index({ channel: 1, timestamp: -1 });

// ============ ROAS Record Model ============

export interface IROASRecord extends Document {
  recordId: string;
  campaignId: string;
  advertiserId: string;

  // Time period
  periodStart: Date;
  periodEnd: Date;
  periodType: 'daily' | 'weekly' | 'monthly';

  // Revenue metrics
  revenue: {
    total: number;
    attributed: number;
    direct: number;
    organic: number;
  };

  // Cost metrics
  costs: {
    total: number;
    media: number;
    creative: number;
    platform: number;
  };

  // ROAS calculation
  roas: number;
  cpa: number;
  cpm: number;

  // Conversions
  conversions: {
    total: number;
    attributed: number;
  };

  // Performance metrics
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversionRate: number;
  };

  createdAt: Date;
}

const ROASRecordSchema = new Schema<IROASRecord>(
  {
    recordId: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    advertiserId: { type: String, required: true, index: true },

    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    periodType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },

    revenue: {
      total: { type: Number, default: 0 },
      attributed: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      organic: { type: Number, default: 0 },
    },

    costs: {
      total: { type: Number, default: 0 },
      media: { type: Number, default: 0 },
      creative: { type: Number, default: 0 },
      platform: { type: Number, default: 0 },
    },

    roas: { type: Number, required: true },
    cpa: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },

    conversions: {
      total: { type: Number, default: 0 },
      attributed: { type: Number, default: 0 },
    },

    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes
ROASRecordSchema.index({ campaignId: 1, periodStart: -1 });
ROASRecordSchema.index({ advertiserId: 1, periodStart: -1 });

// ============ Forecast Record Model ============

export interface IForecastRecord extends Document {
  forecastId: string;
  campaignId: string;
  advertiserId: string;

  // Forecast details
  forecastType: 'revenue' | 'conversions' | 'roi';
  horizonDays: number;

  // Predictions
  predictions: {
    optimistic: number;
    base: number;
    pessimistic: number;
    confidence: number;
  };

  // Assumptions
  assumptions: {
    budget: number;
    growthRate?: number;
    seasonality?: Record<string, number>;
    historicalTrend?: number;
  };

  // Actual vs predicted (for learning)
  actual?: {
    revenue: number;
    conversions: number;
    roas: number;
  };

  // Model info
  model: string;
  factors: Array<{
    name: string;
    impact: number;
    direction: 'positive' | 'negative' | 'neutral';
  }>;

  forecastDate: Date;
  horizonDate: Date;

  createdAt: Date;
}

const ForecastRecordSchema = new Schema<IForecastRecord>(
  {
    forecastId: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    advertiserId: { type: String, required: true, index: true },

    forecastType: {
      type: String,
      enum: ['revenue', 'conversions', 'roi'],
      required: true
    },
    horizonDays: { type: Number, required: true },

    predictions: {
      optimistic: { type: Number, required: true },
      base: { type: Number, required: true },
      pessimistic: { type: Number, required: true },
      confidence: { type: Number, required: true },
    },

    assumptions: {
      budget: { type: Number, required: true },
      growthRate: Number,
      seasonality: { type: Schema.Types.Mixed },
      historicalTrend: Number,
    },

    actual: {
      revenue: Number,
      conversions: Number,
      roas: Number,
    },

    model: { type: String, required: true },
    factors: [{
      name: { type: String, required: true },
      impact: { type: Number, required: true },
      direction: { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
    }],

    forecastDate: { type: Date, required: true },
    horizonDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Indexes
ForecastRecordSchema.index({ campaignId: 1, forecastDate: -1 });
ForecastRecordSchema.index({ advertiserId: 1, forecastDate: -1 });

// ============ Model Exports ============

export const OutcomeCampaign = mongoose.model<IOutcomeCampaign>('OutcomeCampaign', OutcomeCampaignSchema);
export const BusinessOutcome = mongoose.model<IBusinessOutcome>('BusinessOutcome', BusinessOutcomeSchema);
export const Attribution = mongoose.model<IAttribution>('Attribution', AttributionSchema);
export const TouchpointEvent = mongoose.model<ITouchpointEvent>('TouchpointEvent', TouchpointEventSchema);
export const ROASRecord = mongoose.model<IROASRecord>('ROASRecord', ROASRecordSchema);
export const ForecastRecord = mongoose.model<IForecastRecord>('ForecastRecord', ForecastRecordSchema);