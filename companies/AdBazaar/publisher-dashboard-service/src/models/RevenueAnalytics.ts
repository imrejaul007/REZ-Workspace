import mongoose, { Schema, Document } from 'mongoose';

// Revenue analytics document interface
export interface IRevenueAnalytics extends Document {
  publisherId: string;
  date: Date;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  revenue: {
    total: number;
    display: number;
    video: number;
    native: number;
    richMedia: number;
  };
  ecpm: {
    overall: number;
    display: number;
    video: number;
    native: number;
    richMedia: number;
  };
  impressions: {
    total: number;
    viewable: number;
    billable: number;
  };
  clicks: number;
  conversions: number;
  fillRate: number;
  bidRate: number;
  winningBidRate: number;
  adFormats: {
    display: { impressions: number; revenue: number; ecpm: number };
    video: { impressions: number; revenue: number; ecpm: number };
    native: { impressions: number; revenue: number; ecpm: number };
    richMedia: { impressions: number; revenue: number; ecpm: number };
  };
  hourOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday = 0)
  metadata: {
    country?: string;
    deviceType?: string;
    adUnitId?: string;
    campaignId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Revenue analytics schema
const RevenueAnalyticsSchema = new Schema<IRevenueAnalytics>({
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
  currency: {
    type: String,
    enum: ['USD', 'INR', 'EUR', 'GBP'],
    default: 'USD'
  },
  revenue: {
    total: { type: Number, required: true, default: 0 },
    display: { type: Number, default: 0 },
    video: { type: Number, default: 0 },
    native: { type: Number, default: 0 },
    richMedia: { type: Number, default: 0 }
  },
  ecpm: {
    overall: { type: Number, default: 0 },
    display: { type: Number, default: 0 },
    video: { type: Number, default: 0 },
    native: { type: Number, default: 0 },
    richMedia: { type: Number, default: 0 }
  },
  impressions: {
    total: { type: Number, default: 0 },
    viewable: { type: Number, default: 0 },
    billable: { type: Number, default: 0 }
  },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  fillRate: { type: Number, default: 0 },
  bidRate: { type: Number, default: 0 },
  winningBidRate: { type: Number, default: 0 },
  adFormats: {
    display: {
      impressions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ecpm: { type: Number, default: 0 }
    },
    video: {
      impressions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ecpm: { type: Number, default: 0 }
    },
    native: {
      impressions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ecpm: { type: Number, default: 0 }
    },
    richMedia: {
      impressions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ecpm: { type: Number, default: 0 }
    }
  },
  hourOfDay: {
    type: Number,
    min: 0,
    max: 23,
    default: 0
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    default: 0
  },
  metadata: {
    country: String,
    deviceType: String,
    adUnitId: String,
    campaignId: String
  }
}, {
  timestamps: true,
  collection: 'revenue_analytics'
});

// Compound indexes for efficient queries
RevenueAnalyticsSchema.index({ publisherId: 1, date: -1 });
RevenueAnalyticsSchema.index({ publisherId: 1, 'metadata.country': 1, date: -1 });
RevenueAnalyticsSchema.index({ publisherId: 1, 'metadata.deviceType': 1, date: -1 });
RevenueAnalyticsSchema.index({ publisherId: 1, hourOfDay: 1, date: -1 });

// Static method for aggregating revenue by date range
RevenueAnalyticsSchema.statics.aggregateByDateRange = async function(
  publisherId: string,
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  const groupFormat = groupBy === 'day' ? '%Y-%m-%d' :
 groupBy === 'week' ? '%Y-%W' :
                      '%Y-%m';

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
          date: {
            $dateToString: { format: groupFormat, date: '$date' }
          }
        },
        totalRevenue: { $sum: '$revenue.total' },
        displayRevenue: { $sum: '$revenue.display' },
        videoRevenue: { $sum: '$revenue.video' },
        nativeRevenue: { $sum: '$revenue.native' },
        richMediaRevenue: { $sum: '$revenue.richMedia' },
        totalImpressions: { $sum: '$impressions.total' },
        viewableImpressions: { $sum: '$impressions.viewable' },
        billableImpressions: { $sum: '$impressions.billable' },
        totalClicks: { $sum: '$clicks' },
        totalConversions: { $sum: '$conversions' },
        avgEcpm: { $avg: '$ecpm.overall' },
        avgFillRate: { $avg: '$fillRate' }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  return result;
};

// Static method for getting revenue by ad format
RevenueAnalyticsSchema.statics.getRevenueByFormat = async function(
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
        _id: null,
        display: {
          $sum: '$revenue.display'
        },
        video: {
          $sum: '$revenue.video'
        },
        native: {
          $sum: '$revenue.native'
        },
        richMedia: {
          $sum: '$revenue.richMedia'
        },
        displayImpressions: {
          $sum: '$adFormats.display.impressions'
        },
        videoImpressions: {
          $sum: '$adFormats.video.impressions'
        },
        nativeImpressions: {
          $sum: '$adFormats.native.impressions'
        },
        richMediaImpressions: {
          $sum: '$adFormats.richMedia.impressions'
        }
      }
    }
  ]);

  return result[0] || {
    display: 0,
    video: 0,
    native: 0,
    richMedia: 0,
    displayImpressions: 0,
    videoImpressions: 0,
    nativeImpressions: 0,
    richMediaImpressions: 0
  };
};

export const RevenueAnalytics = mongoose.model<IRevenueAnalytics>('RevenueAnalytics', RevenueAnalyticsSchema);
export default RevenueAnalytics;