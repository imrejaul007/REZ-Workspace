import mongoose, { Schema, Document } from 'mongoose';
import { PacingStatusEnum } from '../types';

export interface IHourlyData {
  hour: number;
  spent: number;
  impressions: number;
  clicks: number;
}

export interface IPacingStatusDocument extends Document {
  campaignId: string;
  date: Date;
  spent: number;
  remaining: number;
  pacePercentage: number;
  projectedSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  status: PacingStatusEnum;
  hourlyData: IHourlyData[];
  createdAt: Date;
  updatedAt: Date;
}

const HourlyDataSchema = new Schema<IHourlyData>(
  {
    hour: {
      type: Number,
      required: true,
      min: 0,
      max: 23
    },
    spent: {
      type: Number,
      required: true,
      default: 0
    },
    impressions: {
      type: Number,
      required: true,
      default: 0
    },
    clicks: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { _id: false }
);

const PacingStatusSchema = new Schema<IPacingStatusDocument>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    spent: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    remaining: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    pacePercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 200
    },
    projectedSpend: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    impressions: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    clicks: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    conversions: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    ctr: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    cpc: {
      type: Number,
      default: 0,
      min: 0
    },
    cpm: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(PacingStatusEnum),
      default: PacingStatusEnum.ON_TRACK
    },
    hourlyData: [HourlyDataSchema]
  },
  {
    timestamps: true
  }
);

// Compound index for efficient querying
PacingStatusSchema.index({ campaignId: 1, date: -1 });
PacingStatusSchema.index({ date: -1 });
PacingStatusSchema.index({ status: 1 });

// Virtual for calculating efficiency score
PacingStatusSchema.virtual('efficiencyScore').get(function () {
  // Combine CTR, conversion rate, and cost efficiency
  const ctrScore = Math.min(this.ctr * 10, 100); // Max 100 points from CTR
  const conversionScore = this.impressions > 0
    ? Math.min((this.conversions / this.impressions) * 1000, 50)
    : 0; // Max 50 points from conversions
  const costScore = this.spent > 0
    ? Math.max(0, 100 - (this.projectedSpend / this.spent) * 50)
    : 50; // Cost efficiency

  return Math.round((ctrScore + conversionScore + costScore) / 3);
});

// Method to determine pacing status
PacingStatusSchema.methods.determineStatus = function (): PacingStatusEnum {
  if (this.pacePercentage >= 100) {
    return PacingStatusEnum.EXHAUSTED;
  }
  if (this.pacePercentage >= 95 && this.pacePercentage < 100) {
    return PacingStatusEnum.AHEAD;
  }
  if (this.pacePercentage >= 85 && this.pacePercentage <= 105) {
    return PacingStatusEnum.ON_TRACK;
  }
  if (this.pacePercentage < 85) {
    return PacingStatusEnum.BEHIND;
  }
  return PacingStatusEnum.ON_TRACK;
};

// Static method to get latest status for a campaign
PacingStatusSchema.statics.getLatestStatus = function (campaignId: string) {
  return this.findOne({ campaignId })
    .sort({ date: -1 })
    .exec();
};

// Static method to get status history
PacingStatusSchema.statics.getStatusHistory = function (
  campaignId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    campaignId,
    date: { $gte: startDate, $lte: endDate }
  })
    .sort({ date: -1 })
    .exec();
};

// Static method to aggregate daily stats
PacingStatusSchema.statics.aggregateDailyStats = async function (
  campaignId: string,
  date: Date
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await this.aggregate([
    {
      $match: {
        campaignId,
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: '$campaignId',
        totalSpent: { $sum: '$spent' },
        totalImpressions: { $sum: '$impressions' },
        totalClicks: { $sum: '$clicks' },
        totalConversions: { $sum: '$conversions' },
        avgCtr: { $avg: '$ctr' },
        avgCpc: { $avg: '$cpc' },
        avgCpm: { $avg: '$cpm' },
        recordCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || null;
};

export const PacingStatus = mongoose.model<IPacingStatusDocument>(
  'PacingStatus',
  PacingStatusSchema
);