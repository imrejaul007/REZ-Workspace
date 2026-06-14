import mongoose, { Schema, Model } from 'mongoose';
import {
  IAnalytics,
  IAnalyticsDocument,
  ITopProduct,
  IEarningsByDay,
} from '../types';

const TopProductSchema = new Schema<ITopProduct>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    name: {
      type: String,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const EarningsByDaySchema = new Schema<IEarningsByDay>(
  {
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    orders: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: [true, 'Creator ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProducts: {
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
    pageViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
      min: 0,
    },
    topProducts: {
      type: [TopProductSchema],
      default: [],
    },
    earningsByDay: {
      type: [EarningsByDaySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for creator and date
AnalyticsSchema.index({ creatorId: 1, date: -1 });
AnalyticsSchema.index({ creatorId: 1, createdAt: -1 });

// Static methods
AnalyticsSchema.statics.findByCreator = function (creatorId: string) {
  return this.find({ creatorId }).sort({ date: -1 });
};

AnalyticsSchema.statics.findByCreatorAndDateRange = function (
  creatorId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    creatorId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: -1 });
};

AnalyticsSchema.statics.getLatestByCreator = function (creatorId: string) {
  return this.findOne({ creatorId }).sort({ date: -1 });
};

AnalyticsSchema.statics.aggregateCreatorStats = async function (
  creatorId: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        creatorId: new mongoose.Types.ObjectId(creatorId),
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$creatorId',
        totalEarnings: { $sum: '$totalEarnings' },
        totalOrders: { $sum: '$totalOrders' },
        totalProducts: { $sum: '$totalProducts' },
        totalPageViews: { $sum: '$pageViews' },
        totalUniqueVisitors: { $sum: '$uniqueVisitors' },
        avgConversionRate: { $avg: '$conversionRate' },
        days: { $sum: 1 },
      },
    },
    {
      $addFields: {
        avgDailyEarnings: { $divide: ['$totalEarnings', '$days'] },
        avgDailyOrders: { $divide: ['$totalOrders', '$days'] },
        conversionRate: {
          $cond: {
            if: { $eq: ['$totalPageViews', 0] },
            then: 0,
            else: {
              $multiply: [
                { $divide: ['$totalOrders', '$totalPageViews'] },
                100,
              ],
            },
          },
        },
      },
    },
  ]);

  return stats[0] || null;
};

AnalyticsSchema.statics.getTopProductsByCreator = async function (
  creatorId: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const topProducts = await this.aggregate([
    {
      $match: {
        creatorId: new mongoose.Types.ObjectId(creatorId),
        date: { $gte: startDate },
      },
    },
    { $unwind: '$topProducts' },
    {
      $group: {
        _id: '$topProducts.productId',
        name: { $first: '$topProducts.name' },
        totalCount: { $sum: '$topProducts.count' },
        totalRevenue: { $sum: '$topProducts.revenue' },
      },
    },
    { $sort: { totalCount: -1 } },
    { $limit: 10 },
  ]);

  return topProducts;
};

// Instance method to add earnings
AnalyticsSchema.methods.addEarnings = async function (
  amount: number,
  orderCount: number = 1
) {
  this.totalEarnings += amount;
  this.totalOrders += orderCount;
  return this.save();
};

// Instance method to update conversion metrics
AnalyticsSchema.methods.updateConversion = async function (
  pageViews: number,
  uniqueVisitors: number
) {
  this.pageViews += pageViews;
  this.uniqueVisitors += uniqueVisitors;
  if (this.pageViews > 0) {
    this.conversionRate = (this.totalOrders / this.pageViews) * 100;
  }
  return this.save();
};

export const Analytics: Model<IAnalyticsDocument> = mongoose.model<IAnalyticsDocument>(
  'Analytics',
  AnalyticsSchema
);

export default Analytics;