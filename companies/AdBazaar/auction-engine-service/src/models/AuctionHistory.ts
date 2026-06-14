import mongoose, { Schema, Document, Model } from 'mongoose';
import { AuctionType, AuctionStatus } from '../types';

// Win Record Schema (for tracking bidder performance)
const WinRecordSchema = new Schema({
  auctionId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  price: { type: Number, required: true },
  secondPrice: { type: Number },
  bids: Number,
}, { _id: false });

// Auction History Schema
export interface IAuctionHistory extends Document {
  auctionId: string;
  auctionType: AuctionType;
  results: {
    winner: {
      seatId: string;
      adId: string;
      price: number;
    };
    price: number;
    secondPrice: number;
    status: AuctionStatus;
  };
  analytics: {
    totalBids: number;
    bidFloor: number;
    bidCeiling: number;
    spread: number;
    avgBidPrice: number;
    medianBidPrice: number;
  };
  topBidders: Array<{
    seatId: string;
    bidCount: number;
    winCount: number;
    totalSpend: number;
    avgBidPrice: number;
  }>;
  revenue: {
    total: number;
    byType: Record<AuctionType, number>;
  };
  timestamp: Date;
  metadata: {
    date: string; // YYYY-MM-DD for daily aggregation
    hour: number; // 0-23
    dayOfWeek: number; // 0-6
  };
}

// Static methods interface
export interface IAuctionHistoryStatic extends Model<IAuctionHistory> {
  getAggregatedStats(startDate: Date, endDate: Date, auctionType?: AuctionType): Promise<{
    totalAuctions: number;
    completedAuctions: number;
    noFillAuctions: number;
    totalRevenue: number;
    avgPrice: number;
    avgSecondPrice: number;
    avgBids: number;
  }>;
  getTopBidders(startDate: Date, endDate: Date, limit?: number): Promise<Array<{
    seatId: string;
    winCount: number;
    totalSpend: number;
    avgBidPrice: number;
  }>>;
}

const AuctionHistorySchema = new Schema<IAuctionHistory>({
  auctionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  auctionType: {
    type: String,
    required: true,
    enum: ['first-price', 'second-price', 'vickrey', 'weighted'],
    index: true,
  },
  results: {
    winner: {
      seatId: String,
      adId: String,
      price: Number,
    },
    price: { type: Number, required: true },
    secondPrice: Number,
    status: {
      type: String,
      enum: ['completed', 'no-fill', 'cancelled'],
      required: true,
    },
  },
  analytics: {
    totalBids: { type: Number, required: true },
    bidFloor: { type: Number, required: true },
    bidCeiling: { type: Number, required: true },
    spread: { type: Number, required: true },
    avgBidPrice: Number,
    medianBidPrice: Number,
  },
  topBidders: [{
    seatId: String,
    bidCount: Number,
    winCount: Number,
    totalSpend: Number,
    avgBidPrice: Number,
  }],
  revenue: {
    total: { type: Number, default: 0 },
    byType: { type: Map, of: Number, default: {} },
  },
  timestamp: { type: Date, required: true, index: true },
  metadata: {
    date: { type: String, index: true },
    hour: Number,
    dayOfWeek: Number,
  },
}, {
  timestamps: true,
  collection: 'auction_history',
});

// Indexes for analytics queries
AuctionHistorySchema.index({ timestamp: -1 });
AuctionHistorySchema.index({ 'metadata.date': -1 });
AuctionHistorySchema.index({ auctionType: 1, timestamp: -1 });
AuctionHistorySchema.index({ 'results.winner.seatId': 1, timestamp: -1 });
AuctionHistorySchema.index({ 'analytics.totalBids': -1 });

// Static method to get aggregated stats
AuctionHistorySchema.statics.getAggregatedStats = async function(
  startDate: Date,
  endDate: Date,
  auctionType?: AuctionType
) {
  const match: any = {
    timestamp: { $gte: startDate, $lte: endDate },
  };
 if (auctionType) {
    match.auctionType = auctionType;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAuctions: { $sum: 1 },
        completedAuctions: {
          $sum: { $cond: [{ $eq: ['$results.status', 'completed'] }, 1, 0] },
        },
        noFillAuctions: {
          $sum: { $cond: [{ $eq: ['$results.status', 'no-fill'] }, 1, 0] },
        },
        totalRevenue: { $sum: '$revenue.total' },
        avgPrice: { $avg: '$results.price' },
        avgSecondPrice: { $avg: '$results.secondPrice' },
        avgBids: { $avg: '$analytics.totalBids' },
      },
    },
  ]);

  return stats[0] || {
    totalAuctions: 0,
    completedAuctions: 0,
    noFillAuctions: 0,
    totalRevenue: 0,
    avgPrice: 0,
    avgSecondPrice: 0,
    avgBids: 0,
  };
};

// Static method to get top bidders
AuctionHistorySchema.statics.getTopBidders = async function(
  startDate: Date,
  endDate: Date,
  limit: number = 10
) {
  const result = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        'results.status': 'completed',
      },
    },
    { $unwind: '$topBidders' },
    {
      $group: {
        _id: '$topBidders.seatId',
        winCount: { $sum: '$topBidders.winCount' },
        totalSpend: { $sum: '$topBidders.totalSpend' },
        avgBidPrice: { $avg: '$topBidders.avgBidPrice' },
      },
    },
    { $sort: { winCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        seatId: '$_id',
        winCount: 1,
        totalSpend: 1,
        avgBidPrice: 1,
      },
    },
  ]);

  return result;
};

export const AuctionHistory = mongoose.model<IAuctionHistory, IAuctionHistoryStatic>('AuctionHistory', AuctionHistorySchema);
