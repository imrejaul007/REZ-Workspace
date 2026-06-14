import mongoose, { Schema, Document, Model } from 'mongoose';

// Benchmark metrics interface
export interface IBenchmarkMetrics {
  avgEngagementRate: number;
  avgPostingFrequency: number;
  avgFollowerGrowth: number;
  topContentTypes: string[];
  bestPostingTimes: string[];
}

// BenchmarkData - Industry benchmarks for comparison
export interface IBenchmarkData extends Document {
  industry: string;
  date: Date;
  metrics: IBenchmarkMetrics;
  sampleSize: number;
  createdAt: Date;
}

const BenchmarkMetricsSchema = new Schema<IBenchmarkMetrics>(
  {
    avgEngagementRate: { type: Number, default: 0 },
    avgPostingFrequency: { type: Number, default: 0 },
    avgFollowerGrowth: { type: Number, default: 0 },
    topContentTypes: { type: [String], default: [] },
    bestPostingTimes: { type: [String], default: [] },
  },
  { _id: false }
);

const BenchmarkDataSchema = new Schema<IBenchmarkData>(
  {
    industry: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    metrics: { type: BenchmarkMetricsSchema, default: () => ({}) },
    sampleSize: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for efficient queries
BenchmarkDataSchema.index({ industry: 1, date: -1 });

// Static methods
BenchmarkDataSchema.statics.findLatest = function (industry: string) {
  return this.findOne({ industry }).sort({ date: -1 }).exec();
};

BenchmarkDataSchema.statics.findByDateRange = function (
  industry: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    industry,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 })
    .exec();
};

BenchmarkDataSchema.statics.getTrend = async function (industry: string, months: number = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const benchmarks = await this.find({
    industry,
    date: { $gte: startDate },
  })
    .sort({ date: 1 })
    .exec();

  if (benchmarks.length < 2) return null;

  const first = benchmarks[0];
  const last = benchmarks[benchmarks.length - 1];

  return {
    engagementRateChange: last.metrics.avgEngagementRate - first.metrics.avgEngagementRate,
    postingFrequencyChange: last.metrics.avgPostingFrequency - first.metrics.avgPostingFrequency,
    followerGrowthChange: last.metrics.avgFollowerGrowth - first.metrics.avgFollowerGrowth,
    topContentTypesTrend: last.metrics.topContentTypes,
    bestPostingTimesTrend: last.metrics.bestPostingTimes,
    period: months,
    dataPoints: benchmarks.length,
  };
};

export const BenchmarkData: Model<IBenchmarkData> = mongoose.model<IBenchmarkData>(
  'BenchmarkData',
  BenchmarkDataSchema
);

// Alert model for competitor activity
export interface ICompetitorAlert extends Document {
  competitorId: mongoose.Types.ObjectId;
  platform: string;
  type: 'new_post' | 'viral_content' | 'follower_spike' | 'engagement_change' | 'new_strategy';
  severity: 'low' | 'medium' | 'high';
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

const CompetitorAlertSchema = new Schema<ICompetitorAlert>(
  {
    competitorId: { type: Schema.Types.ObjectId, ref: 'Competitor', required: true, index: true },
    platform: { type: String, required: true },
    type: {
      type: String,
      enum: ['new_post', 'viral_content', 'follower_spike', 'engagement_change', 'new_strategy'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: () => ({}) },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
CompetitorAlertSchema.index({ competitorId: 1, createdAt: -1 });
CompetitorAlertSchema.index({ read: 1, createdAt: -1 });

// Static methods
CompetitorAlertSchema.statics.findUnread = function (limit: number = 50) {
  return this.find({ read: false }).sort({ createdAt: -1 }).limit(limit).exec();
};

CompetitorAlertSchema.statics.markAsRead = function (alertIds: string[]) {
  return this.updateMany({ _id: { $in: alertIds } }, { read: true }).exec();
};

CompetitorAlertSchema.statics.getAlertSummary = async function (days: number = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        highSeverity: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export const CompetitorAlert: Model<ICompetitorAlert> = mongoose.model<ICompetitorAlert>(
  'CompetitorAlert',
  CompetitorAlertSchema
);
