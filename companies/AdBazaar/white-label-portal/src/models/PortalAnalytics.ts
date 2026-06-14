import mongoose, { Document, Schema } from 'mongoose';

export interface IPortalMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}

export interface IClientMetrics {
  clientId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface IPortalAnalytics extends Document {
  portalId: string;
  date: Date;
  metrics: IPortalMetrics;
  clientMetrics: IClientMetrics[];
  campaigns: {
    campaignId: string;
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }[];
  topLocations: {
    country: string;
    region?: string;
    city?: string;
    impressions: number;
    clicks: number;
  }[];
  topDevices: {
    type: 'desktop' | 'mobile' | 'tablet';
    impressions: number;
    clicks: number;
  }[];
  metadata: {
    generatedAt: Date;
    dataSource: string;
    completeness: number;
  };
}

const PortalMetricsSchema = new Schema<IPortalMetrics>(
  {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    roas: { type: Number, default: 0 },
  },
  { _id: false }
);

const ClientMetricsSchema = new Schema<IClientMetrics>(
  {
    clientId: { type: String, required: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  { _id: false }
);

const CampaignMetricsSchema = new Schema(
  {
    campaignId: { type: String, required: true },
    name: { type: String, required: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
  },
  { _id: false }
);

const LocationMetricsSchema = new Schema(
  {
    country: { type: String, required: true },
    region: { type: String },
    city: { type: String },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { _id: false }
);

const DeviceMetricsSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true,
    },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { _id: false }
);

const PortalAnalyticsSchema = new Schema<IPortalAnalytics>(
  {
    portalId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    metrics: { type: PortalMetricsSchema, default: () => ({}) },
    clientMetrics: { type: [ClientMetricsSchema], default: [] },
    campaigns: { type: [CampaignMetricsSchema], default: [] },
    topLocations: { type: [LocationMetricsSchema], default: [] },
    topDevices: { type: [DeviceMetricsSchema], default: [] },
    metadata: {
      generatedAt: { type: Date, default: Date.now },
      dataSource: { type: String, default: 'ad-server' },
      completeness: { type: Number, default: 100 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PortalAnalyticsSchema.index({ portalId: 1, date: -1 });
PortalAnalyticsSchema.index({ portalId: 1, 'metadata.generatedAt': -1 });
PortalAnalyticsSchema.index({ date: -1 });

// Compound unique index to prevent duplicate entries
PortalAnalyticsSchema.index(
  { portalId: 1, date: 1 },
  { unique: true }
);

// Calculate derived metrics before saving
PortalAnalyticsSchema.pre('save', function (next) {
  const m = this.metrics;
  if (m.impressions > 0) {
    m.ctr = (m.clicks / m.impressions) * 100;
    m.cpm = (m.spend / m.impressions) * 1000;
  }
  if (m.clicks > 0) {
    m.cpc = m.spend / m.clicks;
  }
  if (m.spend > 0) {
    m.roas = m.revenue / m.spend;
  }
  next();
});

// Static method to get date range analytics
PortalAnalyticsSchema.statics.getDateRangeAnalytics = async function (
  portalId: string,
  startDate: Date,
  endDate: Date
): Promise<IPortalAnalytics[]> {
  return this.find({
    portalId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

// Static method to aggregate metrics
PortalAnalyticsSchema.statics.aggregateMetrics = async function (
  portalId: string,
  startDate: Date,
  endDate: Date
): Promise<IPortalMetrics> {
  const result = await this.aggregate([
    { $match: { portalId, date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        impressions: { $sum: '$metrics.impressions' },
        clicks: { $sum: '$metrics.clicks' },
        conversions: { $sum: '$metrics.conversions' },
        spend: { $sum: '$metrics.spend' },
        revenue: { $sum: '$metrics.revenue' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      roas: 0,
    };
  }

  const agg = result[0];
  const metrics: IPortalMetrics = { ...agg, ctr: 0, cpc: 0, cpm: 0, roas: 0 };

  if (metrics.impressions > 0) {
    metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
    metrics.cpm = (metrics.spend / metrics.impressions) * 1000;
  }
  if (metrics.clicks > 0) {
    metrics.cpc = metrics.spend / metrics.clicks;
  }
  if (metrics.spend > 0) {
    metrics.roas = metrics.revenue / metrics.spend;
  }

  return metrics;
};

export const PortalAnalytics = mongoose.model<IPortalAnalytics>(
  'PortalAnalytics',
  PortalAnalyticsSchema
);
