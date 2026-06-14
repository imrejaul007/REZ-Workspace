import mongoose, { Schema, Document } from 'mongoose';

// Performance metric document interface
export interface IPerformanceMetric extends Document {
  publisherId: string;
  date: Date;
  adUnitId: string;
  adFormat: 'display' | 'video' | 'native' | 'richMedia';
  impressions: {
    total: number;
    viewable: number;
    billable: number;
    firstQuartile: number;
    midpoint: number;
    thirdQuartile: number;
    complete: number;
  };
  clicks: number;
  ctr: number;
  fillRate: number;
  bidRate: number;
  winningBidRate: number;
  ecpm: number;
  revenue: number;
  cpc: number;
  cpa: number;
  engagement: {
    timeOnAd: number;
    interactionRate: number;
    expansionRate: number;
  };
  viewability: {
    measurableImpressions: number;
    viewableImpressions: number;
    viewabilityRate: number;
    inViewRate: number;
  };
  bidMetrics: {
    totalBids: number;
    winningBids: number;
    avgBidPrice: number;
    minBidPrice: number;
    maxBidPrice: number;
  };
  deviceType: 'desktop' | 'mobile' | 'tablet';
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

// Performance metric schema
const PerformanceMetricSchema = new Schema<IPerformanceMetric>({
  publisherId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  adUnitId: {
    type: String,
    required: true,
    index: true
  },
  adFormat: {
    type: String,
    enum: ['display', 'video', 'native', 'richMedia'],
    required: true
  },
  impressions: {
    total: { type: Number, default: 0 },
    viewable: { type: Number, default: 0 },
    billable: { type: Number, default: 0 },
    firstQuartile: { type: Number, default: 0 },
    midpoint: { type: Number, default: 0 },
    thirdQuartile: { type: Number, default: 0 },
    complete: { type: Number, default: 0 }
  },
  clicks: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  fillRate: { type: Number, default: 0 },
  bidRate: { type: Number, default: 0 },
  winningBidRate: { type: Number, default: 0 },
  ecpm: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  cpa: { type: Number, default: 0 },
  engagement: {
    timeOnAd: { type: Number, default: 0 },
    interactionRate: { type: Number, default: 0 },
    expansionRate: { type: Number, default: 0 }
  },
  viewability: {
    measurableImpressions: { type: Number, default: 0 },
    viewableImpressions: { type: Number, default: 0 },
    viewabilityRate: { type: Number, default: 0 },
    inViewRate: { type: Number, default: 0 }
  },
  bidMetrics: {
    totalBids: { type: Number, default: 0 },
    winningBids: { type: Number, default: 0 },
    avgBidPrice: { type: Number, default: 0 },
    minBidPrice: { type: Number, default: 0 },
    maxBidPrice: { type: Number, default: 0 }
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop'
  },
  country: {
    type: String,
    default: 'unknown'
  }
}, {
  timestamps: true,
  collection: 'performance_metrics'
});

// Compound indexes
PerformanceMetricSchema.index({ publisherId: 1, date: -1 });
PerformanceMetricSchema.index({ publisherId: 1, adUnitId: 1, date: -1 });
PerformanceMetricSchema.index({ publisherId: 1, adFormat: 1, date: -1 });
PerformanceMetricSchema.index({ publisherId: 1, deviceType: 1, date: -1 });
PerformanceMetricSchema.index({ publisherId: 1, country: 1, date: -1 });

// Static method for getting top performing ad units
PerformanceMetricSchema.statics.getTopPerformers = async function(
  publisherId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 10,
  sortBy: 'revenue' | 'ctr' | 'ecpm' = 'revenue'
) {
  const result = await this.aggregate([
    {
      $match: {
        publisherId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$adUnitId',
        totalRevenue: { $sum: '$revenue' },
        totalImpressions: { $sum: '$impressions.total' },
        totalClicks: { $sum: '$clicks' },
        avgCtr: { $avg: '$ctr' },
        avgEcpm: { $avg: '$ecpm' },
        avgFillRate: { $avg: '$fillRate' }
      }
    },
    {
      $addFields: {
        effectiveCtr: {
          $cond: {
            if: { $eq: ['$totalImpressions', 0] },
            then: 0,
            else: { $divide: ['$totalClicks', '$totalImpressions'] }
          }
        }
      }
    },
    { $sort: { [sortBy]: -1 } },
    { $limit: limit }
  ]);

  return result;
};

// Static method for getting performance by device type
PerformanceMetricSchema.statics.getByDeviceType = async function(
  publisherId: string,
  startDate: Date,
  endDate: Date
) {
  const result = await this.aggregate([
    {
      $match: {
        publisherId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$deviceType',
        totalImpressions: { $sum: '$impressions.total' },
        viewableImpressions: { $sum: '$impressions.viewable' },
        totalClicks: { $sum: '$clicks' },
        totalRevenue: { $sum: '$revenue' },
        avgCtr: { $avg: '$ctr' },
        avgEcpm: { $avg: '$ecpm' },
        avgFillRate: { $avg: '$fillRate' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  return result;
};

// Static method for getting performance by country
PerformanceMetricSchema.statics.getByCountry = async function(
  publisherId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 20
) {
  const result = await this.aggregate([
    {
      $match: {
        publisherId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$country',
        totalImpressions: { $sum: '$impressions.total' },
        viewableImpressions: { $sum: '$impressions.viewable' },
        totalClicks: { $sum: '$clicks' },
        totalRevenue: { $sum: '$revenue' },
        avgCtr: { $avg: '$ctr' },
        avgEcpm: { $avg: '$ecpm' },
        avgFillRate: { $avg: '$fillRate' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ]);

  return result;
};

// Static method for getting hourly performance
PerformanceMetricSchema.statics.getHourlyPerformance = async function(
  publisherId: string,
  startDate: Date,
  endDate: Date
) {
  const result = await this.aggregate([
    {
      $match: {
        publisherId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $hour: '$date'
        },
        totalImpressions: { $sum: '$impressions.total' },
        totalClicks: { $sum: '$clicks' },
        totalRevenue: { $sum: '$revenue' },
        avgCtr: { $avg: '$ctr' },
        avgEcpm: { $avg: '$ecpm' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return result;
};

export const PerformanceMetric = mongoose.model<IPerformanceMetric>('PerformanceMetric', PerformanceMetricSchema);
export default PerformanceMetric;