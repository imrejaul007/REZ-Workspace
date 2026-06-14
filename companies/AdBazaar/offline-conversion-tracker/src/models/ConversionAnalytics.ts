import mongoose, { Document, Schema } from 'mongoose';

export interface IConversionAnalytics extends Document {
  campaignId: string;
  date: Date;
  conversions: {
    total: number;
    purchase: number;
    visit: number;
    call: number;
    form: number;
    install: number;
    other: number;
  };
  value: {
    total: number;
    average: number;
    currency: string;
  };
  matchRate: {
    matched: number;
    unmatched: number;
    rate: number;
  };
  attribution: {
    direct: number;
    assisted: number;
    crossDevice: number;
  };
  demographics?: {
    ageGroups?: Record<string, number>;
    gender?: Record<string, number>;
    locations?: Record<string, number>;
  };
  performance?: {
    cpa: number;
    roas: number;
    conversionRate: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionAnalyticsSchema = new Schema<IConversionAnalytics>(
  {
    campaignId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    conversions: {
      total: { type: Number, default: 0 },
      purchase: { type: Number, default: 0 },
      visit: { type: Number, default: 0 },
      call: { type: Number, default: 0 },
      form: { type: Number, default: 0 },
      install: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    value: {
      total: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    },
    matchRate: {
      matched: { type: Number, default: 0 },
      unmatched: { type: Number, default: 0 },
      rate: { type: Number, default: 0 }
    },
    attribution: {
      direct: { type: Number, default: 0 },
      assisted: { type: Number, default: 0 },
      crossDevice: { type: Number, default: 0 }
    },
    demographics: {
      ageGroups: { type: Map, of: Number },
      gender: { type: Map, of: Number },
      locations: { type: Map, of: Number }
    },
    performance: {
      cpa: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 }
    },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

ConversionAnalyticsSchema.index({ campaignId: 1, date: -1 });
ConversionAnalyticsSchema.index({ date: -1 });

export const ConversionAnalytics = mongoose.model<IConversionAnalytics>(
  'ConversionAnalytics',
  ConversionAnalyticsSchema
);