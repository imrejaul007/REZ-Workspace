import mongoose, { Schema } from 'mongoose';
import { ISearchPerformance } from '../types';

const SearchPerformanceSchema = new Schema<ISearchPerformance>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'SearchCampaign',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    ctr: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    cpc: {
      type: Number,
      default: 0,
      min: 0,
    },
    spend: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversions: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    roas: {
      type: Number,
      default: 0,
    },
    qualityScore: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    avgPosition: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'search_performance',
  }
);

// Indexes
SearchPerformanceSchema.index({ campaignId: 1, date: -1 }, { unique: true });
SearchPerformanceSchema.index({ date: -1 });

// Pre-save hook to calculate CTR and other metrics
SearchPerformanceSchema.pre('save', function(next) {
  if (this.impressions > 0) {
    this.ctr = (this.clicks / this.impressions) * 100;
  }
  if (this.clicks > 0) {
    this.cpc = this.spend / this.clicks;
  }
  if (this.clicks > 0) {
    this.conversionRate = (this.conversions / this.clicks) * 100;
  }
  if (this.spend > 0) {
    this.roas = this.revenue / this.spend;
  }
  next();
});

// Static methods
SearchPerformanceSchema.statics.findByCampaignAndPeriod = function(
  campaignId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    campaignId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 });
};

SearchPerformanceSchema.statics.aggregateByPeriod = function(
  campaignId: string,
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  const formatString = groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'week' ? '%Y-%W' : '%Y-%m';

  return this.aggregate([
    {
      $match: {
        campaignId: new mongoose.Types.ObjectId(campaignId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: formatString, date: '$date' } },
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' },
        spend: { $sum: '$spend' },
        conversions: { $sum: '$conversions' },
        revenue: { $sum: '$revenue' },
        avgCpc: { $avg: '$cpc' },
        avgQualityScore: { $avg: '$qualityScore' },
        avgPosition: { $avg: '$avgPosition' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

SearchPerformanceSchema.statics.getTotalMetrics = function(campaignId: string) {
  return this.aggregate([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: '$impressions' },
        totalClicks: { $sum: '$clicks' },
        totalSpend: { $sum: '$spend' },
        totalConversions: { $sum: '$conversions' },
        totalRevenue: { $sum: '$revenue' },
        avgCtr: { $avg: '$ctr' },
        avgCpc: { $avg: '$cpc' },
        avgRoas: { $avg: '$roas' },
        avgQualityScore: { $avg: '$qualityScore' },
      },
    },
  ]);
};

export const SearchPerformance = mongoose.model<ISearchPerformance>('SearchPerformance', SearchPerformanceSchema);