import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  analyticsId: string;
  contentId: string;
  contentType: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  metrics: {
    impressions: number;
    views: number;
    uniqueViews: number;
    avgTimeOnPage: number;
    bounceRate: number;
    engagementRate: number;
    conversionRate?: number;
    shares: number;
    comments: number;
    likes: number;
    saves: number;
    clickThroughRate?: number;
  };
  trends: {
    viewsChange: number;
    engagementChange: number;
    avgTimeChange: number;
  };
  topReferrers: Array<{
    source: string;
    views: number;
    conversionRate: number;
  }>;
  topLocations: Array<{
    country: string;
    views: number;
    engagementRate: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  audienceRetention: Array<{
    period: string;
    retention: number;
  }>;
  calculatedAt: Date;
  createdAt: Date;
}

const TopReferrerSchema = new Schema({
  source: { type: String, required: true },
  views: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 }
}, { _id: false });

const TopLocationSchema = new Schema({
  country: { type: String, required: true },
  views: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 }
}, { _id: false });

const AudienceRetentionSchema = new Schema({
  period: { type: String, required: true },
  retention: { type: Number, default: 0 }
}, { _id: false });

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    analyticsId: { type: String, required: true, unique: true, index: true },
    contentId: { type: String, required: true, index: true },
    contentType: { type: String, required: true },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    metrics: {
      impressions: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      avgTimeOnPage: { type: Number, default: 0 },
      bounceRate: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
      conversionRate: Number,
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      clickThroughRate: Number
    },
    trends: {
      viewsChange: { type: Number, default: 0 },
      engagementChange: { type: Number, default: 0 },
      avgTimeChange: { type: Number, default: 0 }
    },
    topReferrers: [TopReferrerSchema],
    topLocations: [TopLocationSchema],
    deviceBreakdown: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    },
    audienceRetention: [AudienceRetentionSchema],
    calculatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

AnalyticsSchema.index({ contentId: 1, period: 1, startDate: -1 });
AnalyticsSchema.index({ contentType: 1, startDate: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);