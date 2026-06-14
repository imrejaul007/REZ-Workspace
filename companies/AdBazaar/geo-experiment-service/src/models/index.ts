import mongoose, { Schema, Document } from 'mongoose';
import { ExperimentStatus, MarketType } from '../types';

// ==================== GEO EXPERIMENT MODEL ====================
export interface IGeoExperiment extends Document {
  name: string;
  description?: string;
  status: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  confidenceLevel: number;
  minMarketDurationDays: number;
  minControlSizePercent: number;
  campaignId?: string;
  targeting?: {
    locations?: string[];
    dmaCodes?: string[];
    demographics?: {
      ageRanges?: string[];
      genders?: string[];
      incomeBrackets?: string[];
    };
  };
  metrics: string[];
  hypothesis?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const GeoExperimentSchema = new Schema<IGeoExperiment>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: Object.values(ExperimentStatus),
      default: ExperimentStatus.DRAFT,
      index: true
    },
    startDate: {
      type: Date,
      index: true
    },
    endDate: {
      type: Date,
      index: true
    },
    confidenceLevel: {
      type: Number,
      min: 0.8,
      max: 0.99,
      default: 0.95
    },
    minMarketDurationDays: {
      type: Number,
      min: 1,
      max: 90,
      default: 7
    },
    minControlSizePercent: {
      type: Number,
      min: 1,
      max: 50,
      default: 5
    },
    campaignId: {
      type: String,
      index: true
    },
    targeting: {
      locations: [String],
      dmaCodes: [String],
      demographics: {
        ageRanges: [String],
        genders: [String],
        incomeBrackets: [String]
      }
    },
    metrics: {
      type: [String],
      enum: ['impressions', 'reach', 'visits', 'conversions', 'revenue', 'ctr', 'vtr'],
      default: ['impressions', 'conversions']
    },
    hypothesis: {
      type: String,
      maxlength: 2000
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    collection: 'geo_experiments'
  }
);

// Indexes
GeoExperimentSchema.index({ status: 1, startDate: -1 });
GeoExperimentSchema.index({ campaignId: 1, status: 1 });
GeoExperimentSchema.index({ createdAt: -1 });

// ==================== MARKET MODEL ====================
export interface IMarket extends Document {
  experimentId: mongoose.Types.ObjectId;
  name: string;
  type: MarketType;
  dmaCode?: string;
  city?: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  population?: number;
  expectedReach?: number;
  status: 'active' | 'paused' | 'completed';
  metrics: {
    impressions: number;
    reach: number;
    conversions: number;
    revenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MarketSchema = new Schema<IMarket>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'GeoExperiment',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    type: {
      type: String,
      enum: Object.values(MarketType),
      required: true,
      index: true
    },
    dmaCode: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'US'
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    radius: Number,
    population: Number,
    expectedReach: Number,
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active'
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    collection: 'markets'
  }
);

// Indexes
MarketSchema.index({ experimentId: 1, type: 1 });
MarketSchema.index({ dmaCode: 1 });
MarketSchema.index({ city: 1, state: 1 });

// ==================== TREATMENT MARKET MODEL ====================
export interface ITreatmentMarket extends Document {
  experimentId: mongoose.Types.ObjectId;
  marketId: mongoose.Types.ObjectId;
  spend: number;
  impressions?: number;
  reach?: number;
  frequency?: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentMarketSchema = new Schema<ITreatmentMarket>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'GeoExperiment',
      required: true,
      index: true
    },
    marketId: {
      type: Schema.Types.ObjectId,
      ref: 'Market',
      required: true,
      index: true
    },
    spend: {
      type: Number,
      required: true,
      min: 0
    },
    impressions: Number,
    reach: Number,
    frequency: Number,
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'treatment_markets'
  }
);

// Indexes
TreatmentMarketSchema.index({ experimentId: 1, marketId: 1 }, { unique: true });
TreatmentMarketSchema.index({ startDate: -1, endDate: 1 });

// ==================== CONTROL MARKET MODEL ====================
export interface IControlMarket extends Document {
  experimentId: mongoose.Types.ObjectId;
  marketId: mongoose.Types.ObjectId;
  baseline: {
    impressions: number;
    reach: number;
    conversions: number;
    revenue: number;
  };
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ControlMarketSchema = new Schema<IControlMarket>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'GeoExperiment',
      required: true,
      index: true
    },
    marketId: {
      type: Schema.Types.ObjectId,
      ref: 'Market',
      required: true,
      index: true
    },
    baseline: {
      impressions: { type: Number, required: true, min: 0 },
      reach: { type: Number, required: true, min: 0 },
      conversions: { type: Number, required: true, min: 0 },
      revenue: { type: Number, required: true, min: 0 }
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'control_markets'
  }
);

// Indexes
ControlMarketSchema.index({ experimentId: 1, marketId: 1 }, { unique: true });

// ==================== GEO RESULT MODEL ====================
export interface IGeoResult extends Document {
  experimentId: mongoose.Types.ObjectId;
  marketId: mongoose.Types.ObjectId;
  lift: number;
  confidence: number;
  pValue: number;
  isSignificant: boolean;
  sampleSize: number;
  treatmentMetrics: {
    impressions: number;
    reach: number;
    conversions: number;
    revenue: number;
    ctr?: number;
    vtr?: number;
  };
  controlMetrics?: {
    impressions: number;
    reach: number;
    conversions: number;
    revenue: number;
  };
  calculatedAt: Date;
}

const GeoResultSchema = new Schema<IGeoResult>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'GeoExperiment',
      required: true,
      index: true
    },
    marketId: {
      type: Schema.Types.ObjectId,
      ref: 'Market',
      required: true,
      index: true
    },
    lift: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    pValue: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    isSignificant: {
      type: Boolean,
      required: true
    },
    sampleSize: {
      type: Number,
      required: true,
      min: 0
    },
    treatmentMetrics: {
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ctr: Number,
      vtr: Number
    },
    controlMetrics: {
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'geo_results'
  }
);

// Indexes
GeoResultSchema.index({ experimentId: 1, marketId: 1 }, { unique: true });
GeoResultSchema.index({ experimentId: 1, isSignificant: 1 });
GeoResultSchema.index({ calculatedAt: -1 });

// Export models
export const GeoExperiment = mongoose.model<IGeoExperiment>('GeoExperiment', GeoExperimentSchema);
export const Market = mongoose.model<IMarket>('Market', MarketSchema);
export const TreatmentMarket = mongoose.model<ITreatmentMarket>('TreatmentMarket', TreatmentMarketSchema);
export const ControlMarket = mongoose.model<IControlMarket>('ControlMarket', ControlMarketSchema);
export const GeoResult = mongoose.model<IGeoResult>('GeoResult', GeoResultSchema);