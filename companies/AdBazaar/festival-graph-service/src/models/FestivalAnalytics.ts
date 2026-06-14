import mongoose, { Schema, Document } from 'mongoose';

export interface IAdImpression {
  adId: string;
  campaignId: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'dooh';
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface IDailyMetric {
  date: Date;
  impressions: number;
  uniqueUsers: number;
  ticketSales: number;
  revenue: number;
  socialMentions: number;
  searchVolume: number;
}

export interface IFestivalAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  festivalId: mongoose.Types.ObjectId;
  period: 'daily' | 'weekly' | 'monthly' | 'overall';
  startDate: Date;
  endDate: Date;
  impressions: {
    total: number;
    byChannel: {
      dooh: number;
      mobile: number;
      social: number;
      web: number;
    };
    byLocation: Record<string, number>; // city -> count
  };
  ticketSales: {
    total: number;
    sold: number;
    available: number;
    revenue: number;
    conversionRate: number;
  };
  engagement: {
    avgSessionDuration: number; // in seconds
    bounceRate: number;
    pageViews: number;
    socialShares: number;
    hashtagMentions: number;
  };
  targeting: {
    demographics: {
      ageGroups: Record<string, number>; // "18-24" -> count
      gender: Record<string, number>; // "male", "female", "other"
    };
    interests: Record<string, number>; // interest -> score
    locations: Array<{
      city: string;
      impressions: number;
      conversionRate: number;
    }>;
  };
  roi: {
    totalSpend: number;
    totalRevenue: number;
    revenuePerImpression: number;
    costPerAcquisition: number;
    returnOnAdSpend: number; // ROAS
  };
  dailyMetrics: IDailyMetric[];
  adImpressions: IAdImpression[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AdImpressionSchema = new Schema<IAdImpression>(
  {
    adId: { type: String, required: true },
    campaignId: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'dooh'],
      required: true,
    },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
  },
  { _id: false }
);

const DailyMetricSchema = new Schema<IDailyMetric>(
  {
    date: { type: Date, required: true, index: true },
    impressions: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    ticketSales: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    socialMentions: { type: Number, default: 0 },
    searchVolume: { type: Number, default: 0 },
  },
  { _id: false }
);

const FestivalAnalyticsSchema = new Schema<IFestivalAnalytics>(
  {
    festivalId: {
      type: Schema.Types.ObjectId,
      ref: 'Festival',
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'overall'],
      default: 'overall',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    impressions: {
      total: { type: Number, default: 0 },
      byChannel: {
        dooh: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        social: { type: Number, default: 0 },
        web: { type: Number, default: 0 },
      },
      byLocation: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    ticketSales: {
      total: { type: Number, default: 0 },
      sold: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
    },
    engagement: {
      avgSessionDuration: { type: Number, default: 0 },
      bounceRate: { type: Number, default: 0 },
      pageViews: { type: Number, default: 0 },
      socialShares: { type: Number, default: 0 },
      hashtagMentions: { type: Number, default: 0 },
    },
    targeting: {
      demographics: {
        ageGroups: { type: Map, of: Number, default: {} },
        gender: { type: Map, of: Number, default: {} },
      },
      interests: { type: Map, of: Number, default: {} },
      locations: [
        {
          city: String,
          impressions: Number,
          conversionRate: Number,
          _id: false,
        },
      ],
    },
    roi: {
      totalSpend: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      revenuePerImpression: { type: Number, default: 0 },
      costPerAcquisition: { type: Number, default: 0 },
      returnOnAdSpend: { type: Number, default: 0 },
    },
    dailyMetrics: {
      type: [DailyMetricSchema],
      default: [],
    },
    adImpressions: {
      type: [AdImpressionSchema],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
FestivalAnalyticsSchema.index({ festivalId: 1, period: 1 });
FestivalAnalyticsSchema.index({ festivalId: 1, startDate: 1, endDate: 1 });
FestivalAnalyticsSchema.index({ 'impressions.total': -1 });

export const FestivalAnalytics = mongoose.model<IFestivalAnalytics>('FestivalAnalytics', FestivalAnalyticsSchema);