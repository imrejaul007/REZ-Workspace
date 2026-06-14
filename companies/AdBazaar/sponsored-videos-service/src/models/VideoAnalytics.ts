import mongoose, { Schema, Document } from 'mongoose';
import { IVideoAnalytics } from '../types';

export interface IVideoAnalyticsDocument extends Omit<IVideoAnalytics, '_id'>, Document {}

const WatchTimeSchema = new Schema(
  {
    total: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const EngagementSchema = new Schema(
  {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
  },
  { _id: false }
);

const CTRSchema = new Schema(
  {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
  },
  { _id: false }
);

const RetentionSchema = new Schema(
  {
    average: { type: Number, default: 0 },
    dropOffPoints: [{ type: Number }],
  },
  { _id: false }
);

const VideoAnalyticsSchema = new Schema<IVideoAnalyticsDocument>(
  {
    videoId: {
      type: String,
      required: [true, 'Video ID is required'],
      index: true,
    },
    campaignId: {
      type: String,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    watchTime: {
      type: WatchTimeSchema,
      default: () => ({ total: 0, average: 0, completionRate: 0 }),
    },
    engagement: {
      type: EngagementSchema,
      default: () => ({ likes: 0, comments: 0, shares: 0, saves: 0 }),
    },
    ctr: {
      type: CTRSchema,
      default: () => ({ impressions: 0, clicks: 0, rate: 0 }),
    },
    retention: {
      type: RetentionSchema,
      default: () => ({ average: 0, dropOffPoints: [] }),
    },
    deviceBreakdown: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    geoBreakdown: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        // Convert Maps to objects for JSON
        if (ret.deviceBreakdown instanceof Map) {
          ret.deviceBreakdown = Object.fromEntries(ret.deviceBreakdown);
        }
        if (ret.geoBreakdown instanceof Map) {
          ret.geoBreakdown = Object.fromEntries(ret.geoBreakdown);
        }
        return ret;
      },
    },
  }
);

// Indexes for efficient querying
VideoAnalyticsSchema.index({ videoId: 1, date: -1 });
VideoAnalyticsSchema.index({ campaignId: 1, date: -1 });
VideoAnalyticsSchema.index({ date: -1 });

// Compound index for time-series queries
VideoAnalyticsSchema.index({ videoId: 1, campaignId: 1, date: -1 });

// Virtual for total engagement
VideoAnalyticsSchema.virtual('totalEngagement').get(function () {
  return (
    (this.engagement?.likes || 0) +
    (this.engagement?.comments || 0) +
    (this.engagement?.shares || 0) +
    (this.engagement?.saves || 0)
  );
});

// Virtual for engagement rate
VideoAnalyticsSchema.virtual('engagementRate').get(function () {
  if (this.views === 0) return 0;
  return (this.totalEngagement / this.views) * 100;
});

// Static method to get analytics for a date range
VideoAnalyticsSchema.statics.getByDateRange = function (
  videoId: string,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        videoId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$views' },
        totalUniqueViews: { $sum: '$uniqueViews' },
        totalWatchTime: { $sum: '$watchTime.total' },
        avgWatchTime: { $avg: '$watchTime.average' },
        totalEngagement: {
          $sum: {
            $add: [
              '$engagement.likes',
              '$engagement.comments',
              '$engagement.shares',
              '$engagement.saves',
            ],
          },
        },
        avgCTR: { $avg: '$ctr.rate' },
      },
    },
  ]);
};

// Static method to get hourly breakdown
VideoAnalyticsSchema.statics.getHourlyBreakdown = async function (
  videoId: string,
  date: Date
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        videoId,
        date: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: { $hour: '$date' },
        views: { $sum: '$views' },
        engagement: {
          $sum: {
            $add: [
              '$engagement.likes',
              '$engagement.comments',
              '$engagement.shares',
            ],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Static method to upsert analytics
VideoAnalyticsSchema.statics.upsertAnalytics = async function (
  videoId: string,
  date: Date,
  data: Partial<IVideoAnalytics>
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  return this.findOneAndUpdate(
    { videoId, date: startOfDay },
    {
      $inc: {
        views: data.views || 0,
        uniqueViews: data.uniqueViews || 0,
        'watchTime.total': data.watchTime?.total || 0,
        'engagement.likes': data.engagement?.likes || 0,
        'engagement.comments': data.engagement?.comments || 0,
        'engagement.shares': data.engagement?.shares || 0,
        'ctr.impressions': data.ctr?.impressions || 0,
        'ctr.clicks': data.ctr?.clicks || 0,
      },
      $set: {
        campaignId: data.campaignId,
        'watchTime.average': data.watchTime?.average || 0,
        'watchTime.completionRate': data.watchTime?.completionRate || 0,
        'ctr.rate': data.ctr?.rate || 0,
        'retention.average': data.retention?.average || 0,
        'retention.dropOffPoints': data.retention?.dropOffPoints || [],
      },
      $setOnInsert: {
        videoId,
        date: startOfDay,
      },
    },
    { upsert: true, new: true }
  );
};

export const VideoAnalytics = mongoose.model<IVideoAnalyticsDocument>(
  'VideoAnalytics',
  VideoAnalyticsSchema
);
export default VideoAnalytics;