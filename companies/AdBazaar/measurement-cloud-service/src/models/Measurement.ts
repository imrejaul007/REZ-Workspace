import mongoose, { Document, Schema } from 'mongoose';

// Measurement types
export enum MeasurementType {
  CAMPAIGN = 'campaign',
  IMPRESSION = 'impression',
  CONVERSION = 'conversion',
  ENGAGEMENT = 'engagement'
}

// Device types
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  CTV = 'ctv',
  OTHER = 'other'
}

// Placement types
export enum PlacementType {
  DISPLAY = 'display',
  VIDEO = 'video',
  NATIVE = 'native',
  SEARCH = 'search',
  SOCIAL = 'social',
  DOOH = 'dooh'
}

// Audience segments
export interface IAudienceSegment {
  segmentId: string;
  name: string;
  size: number;
  percentage: number;
}

// Demographics
export interface IDemographics {
  ageGroups: {
    '18-24': number;
    '25-34': number;
    '35-44': number;
    '45-54': number;
    '55+': number;
  };
  gender: {
    male: number;
    female: number;
    other: number;
  };
  income: {
    low: number;
    medium: number;
    high: number;
  };
}

// Geo distribution
export interface IGeoDistribution {
  country: string;
  state?: string;
  city?: string;
  impressions: number;
  percentage: number;
}

// Performance metrics
export interface IPerformanceMetrics {
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpm: number;
  ctr: number;
  conversionRate: number;
  roas: number;
}

// Measurement document interface
export interface IMeasurement extends Document {
  campaignId: string;
  type: MeasurementType;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  metrics: IPerformanceMetrics;
  demographics?: IDemographics;
  geoDistribution?: IGeoDistribution[];
  audienceSegments?: IAudienceSegment[];
  deviceBreakdown?: {
    desktop: number;
    mobile: number;
    tablet: number;
    ctv: number;
  };
  channelBreakdown?: {
    display: number;
    video: number;
    social: number;
    search: number;
    dooh: number;
  };
  brandLift?: {
    awareness: number;
    consideration: number;
    preference: number;
    purchaseIntent: number;
  };
  incrementality?: {
    testGroup: number;
    controlGroup: number;
    lift: number;
    confidence: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Measurement schema
const measurementSchema = new Schema<IMeasurement>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(MeasurementType),
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      uniqueImpressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      cpm: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      roas: { type: Number, default: 0 }
    },
    demographics: {
      ageGroups: {
        '18-24': { type: Number, default: 0 },
        '25-34': { type: Number, default: 0 },
        '35-44': { type: Number, default: 0 },
        '45-54': { type: Number, default: 0 },
        '55+': { type: Number, default: 0 }
      },
      gender: {
        male: { type: Number, default: 0 },
        female: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      },
      income: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 }
      }
    },
    geoDistribution: [
      {
        country: String,
        state: String,
        city: String,
        impressions: Number,
        percentage: Number
      }
    ],
    audienceSegments: [
      {
        segmentId: String,
        name: String,
        size: Number,
        percentage: Number
      }
    ],
    deviceBreakdown: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      ctv: { type: Number, default: 0 }
    },
    channelBreakdown: {
      display: { type: Number, default: 0 },
      video: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      dooh: { type: Number, default: 0 }
    },
    brandLift: {
      awareness: { type: Number, default: 0 },
      consideration: { type: Number, default: 0 },
      preference: { type: Number, default: 0 },
      purchaseIntent: { type: Number, default: 0 }
    },
    incrementality: {
      testGroup: { type: Number, default: 0 },
      controlGroup: { type: Number, default: 0 },
      lift: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 }
    },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// Indexes
measurementSchema.index({ campaignId: 1, type: 1 });
measurementSchema.index({ campaignId: 1, timestamp: -1 });
measurementSchema.index({ 'period.start': 1, 'period.end': 1 });

export const Measurement = mongoose.model<IMeasurement>('Measurement', measurementSchema);