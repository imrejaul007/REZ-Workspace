import { BidRequest } from '../models/BidRequest';
import { BidResponse } from '../models/BidResponse';
import { Deal } from '../models/Deal';
import { Seat } from '../models/Seat';
import { Auction } from '../models/Auction';
import { logger } from '../utils/logger';

export interface ExchangeStats {
  timestamp: Date;
  exchange: {
    name: string;
    currency: string;
    uptime: number;
  };
  requests: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    expired: number;
    error: number;
    averageBidsPerRequest: number;
  };
  responses: {
    total: number;
    pending: number;
    winning: number;
    lost: number;
    expired: number;
    averageBidCount: number;
  };
  auctions: {
    total: number;
    completed: number;
    noBids: number;
    cancelled: number;
    averageBidsPerAuction: number;
    averageWinningPrice: number;
    totalValue: number;
  };
  deals: {
    total: number;
    active: number;
    paused: number;
    pending: number;
    expired: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
  };
  seats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
    buyerSeats: number;
    sellerSeats: number;
    totalSpend: number;
  };
  performance: {
    averageResponseTime: number;
    requestsPerSecond: number;
    bidsPerSecond: number;
  };
}

export interface TimeSeriesData {
  timestamp: Date;
  requests: number;
  responses: number;
  auctions: number;
  winningAuctions: number;
  totalValue: number;
  averagePrice: number;
}

export class StatsService {
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  /**
   * Get comprehensive exchange statistics
   */
  async getExchangeStats(): Promise<ExchangeStats> {
    logger.info('Getting exchange statistics');

    const [
      requestStats,
      responseStats,
      auctionStats,
      dealStats,
      seatStats,
      performanceStats
    ] = await Promise.all([
      this.getRequestStats(),
      this.getResponseStats(),
      this.getAuctionStats(),
      this.getDealStats(),
      this.getSeatStats(),
      this.getPerformanceStats()
    ]);

    return {
      timestamp: new Date(),
      exchange: {
        name: process.env.EXCHANGE_NAME || 'OpenRTB Exchange',
        currency: process.env.CURRENCY || 'USD',
        uptime: Date.now() - this.startTime.getTime()
      },
      requests: requestStats,
      responses: responseStats,
      auctions: auctionStats,
      deals: dealStats,
      seats: seatStats,
      performance: performanceStats
    };
  }

  /**
   * Get request statistics
   */
  private async getRequestStats(): Promise<ExchangeStats['requests']> {
    const stats = await BidRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBids: { $sum: '$bidCount' }
        }
      }
    ]);

    const counts = Object.fromEntries(stats.map(s => [s._id, s.count])) as Record<string, number>;
    const totalBids = stats.reduce((sum, s) => sum + s.totalBids, 0);
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);

    return {
      total,
      pending: counts.pending || 0,
      processing: counts.processing || 0,
      completed: counts.completed || 0,
      expired: counts.expired || 0,
      error: counts.error || 0,
      averageBidsPerRequest: total > 0 ? totalBids / total : 0
    };
  }

  /**
   * Get response statistics
   */
  private async getResponseStats(): Promise<ExchangeStats['responses']> {
    const stats = await BidResponse.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = Object.fromEntries(stats.map(s => [s._id, s.count])) as Record<string, number>;
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);

    return {
      total,
      pending: counts.pending || 0,
      winning: counts.winning || 0,
      lost: counts.lost || 0,
      expired: counts.expired || 0,
      averageBidCount: 0 // Would need to join with requests
    };
  }

  /**
   * Get auction statistics
   */
  private async getAuctionStats(): Promise<ExchangeStats['auctions']> {
    const stats = await Auction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBids: { $sum: '$bidCount' },
          totalPrice: { $sum: '$winningPrice' }
        }
      }
    ]);

    const counts = Object.fromEntries(stats.map(s => [s._id, s.count])) as Record<string, number>;
    const totals = stats.reduce(
      (acc, s) => ({
        bids: acc.bids + s.totalBids,
        price: acc.price + s.totalPrice
      }),
      { bids: 0, price: 0 }
    );
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);

    return {
      total,
      completed: counts.completed || 0,
      noBids: counts.no_bids || 0,
      cancelled: counts.cancelled || 0,
      averageBidsPerAuction: total > 0 ? totals.bids / total : 0,
      averageWinningPrice: total > 0 ? totals.price / total : 0,
      totalValue: totals.price
    };
  }

  /**
   * Get deal statistics
   */
  private async getDealStats(): Promise<ExchangeStats['deals']> {
    const stats = await Deal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          impressions: { $sum: '$impressionsServed' },
          clicks: { $sum: '$clicksCount' },
          conversions: { $sum: '$conversionsCount' },
          revenue: { $sum: '$totalRevenue' }
        }
      }
    ]);

    const counts = Object.fromEntries(stats.map(s => [s._id, s.count])) as Record<string, number>;
    const totals = stats.reduce(
      (acc, s) => ({
        impressions: acc.impressions + s.impressions,
        clicks: acc.clicks + s.clicks,
        conversions: acc.conversions + s.conversions,
        revenue: acc.revenue + s.revenue
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    );

    return {
      total: Object.values(counts).reduce((a: number, b: number) => a + b, 0),
      active: counts.active || 0,
      paused: counts.paused || 0,
      pending: counts.pending || 0,
      expired: counts.expired || 0,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      totalRevenue: totals.revenue
    };
  }

  /**
   * Get seat statistics
   */
  private async getSeatStats(): Promise<ExchangeStats['seats']> {
    const [statusStats, typeStats, spendStats] = await Promise.all([
      Seat.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Seat.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Seat.aggregate([
        { $group: { _id: null, totalSpend: { $sum: '$totalSpend' } } }
      ])
    ]);

    const statusCounts = Object.fromEntries(statusStats.map(s => [s._id, s.count])) as Record<string, number>;
    const typeCounts = Object.fromEntries(typeStats.map(t => [t._id, t.count])) as Record<string, number>;

    return {
      total: Object.values(statusCounts).reduce((a: number, b: number) => a + b, 0),
      active: statusCounts.active || 0,
      inactive: statusCounts.inactive || 0,
      suspended: statusCounts.suspended || 0,
      pending: statusCounts.pending || 0,
      buyerSeats: typeCounts.buyer || 0,
      sellerSeats: typeCounts.seller || 0,
      totalSpend: (spendStats[0]?.totalSpend as number) || 0
    };
  }

  /**
   * Get performance statistics
   */
  private async getPerformanceStats(): Promise<ExchangeStats['performance']> {
    // Calculate requests per second based on recent requests
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await BidRequest.countDocuments({
      createdAt: { $gte: oneHourAgo }
    });

    return {
      averageResponseTime: 0, // Would need instrumentation
      requestsPerSecond: recentRequests / 3600,
      bidsPerSecond: 0 // Would need instrumentation
    };
  }

  /**
   * Get time series data for a period
   */
  async getTimeSeriesData(
    startTime: Date,
    endTime: Date,
    interval: 'hour' | 'day' = 'hour'
  ): Promise<TimeSeriesData[]> {
    const intervalMs = interval === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const [requestData, auctionData] = await Promise.all([
      BidRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: startTime, $lte: endTime }
          }
        },
        {
          $group: {
            _id: {
              $toDate: {
                $subtract: [
                  { $toLong: '$createdAt' },
                  { $mod: [{ $toLong: '$createdAt' }, intervalMs] }
                ]
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Auction.aggregate([
        {
          $match: {
            createdAt: { $gte: startTime, $lte: endTime }
          }
        },
        {
          $group: {
            _id: {
              $toDate: {
                $subtract: [
                  { $toLong: '$createdAt' },
                  { $mod: [{ $toLong: '$createdAt' }, intervalMs] }
                ]
              }
            },
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalValue: { $sum: '$winningPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Combine data into time series
    const timeSeriesMap = new Map<number, TimeSeriesData>();

    // Add request data
    for (const r of requestData) {
      const ts = r._id.getTime();
      timeSeriesMap.set(ts, {
        timestamp: r._id,
        requests: r.count,
        responses: 0,
        auctions: 0,
        winningAuctions: 0,
        totalValue: 0,
        averagePrice: 0
      });
    }

    // Add auction data
    for (const a of auctionData) {
      const ts = a._id.getTime();
      const existing = timeSeriesMap.get(ts) || {
        timestamp: a._id,
        requests: 0,
        responses: 0,
        auctions: 0,
        winningAuctions: 0,
        totalValue: 0,
        averagePrice: 0
      };
      existing.auctions = a.total;
      existing.winningAuctions = a.completed;
      existing.totalValue = a.totalValue;
      existing.averagePrice = a.completed > 0 ? a.totalValue / a.completed : 0;
      timeSeriesMap.set(ts, existing);
    }

    return Array.from(timeSeriesMap.values()).sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Get top bidders by spend
   */
  async getTopBidders(limit: number = 10): Promise<{
    seatId: string;
    seatName: string;
    totalSpend: number;
    totalBids: number;
    winRate: number;
  }[]> {
    return Seat.aggregate([
      { $match: { totalSpend: { $gt: 0 } } },
      { $sort: { totalSpend: -1 } },
      { $limit: limit },
      {
        $project: {
          seatId: 1,
          seatName: '$name',
          totalSpend: 1,
          totalBids: 1,
          winRate: 1
        }
      }
    ]);
  }

  /**
   * Get top deals by revenue
   */
  async getTopDeals(limit: number = 10): Promise<{
    dealId: string;
    dealName: string;
    type: string;
    totalRevenue: number;
    impressions: number;
    averageCpm: number;
  }[]> {
    return Deal.aggregate([
      { $match: { totalRevenue: { $gt: 0 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          dealId: 1,
          dealName: '$name',
          type: 1,
          totalRevenue: 1,
          impressions: '$impressionsServed',
          averageCpm: 1
        }
      }
    ]);
  }
}

export const statsService = new StatsService();
export default statsService;