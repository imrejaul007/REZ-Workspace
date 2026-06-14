import { AuctionHistory } from '../models/AuctionHistory';
import { Auction, IAuction } from '../models/Auction';
import { AuctionType, AuctionStats } from '../types';
import logger from 'utils/logger.js';

// Plain object type for auction results (without Mongoose methods)
interface AuctionResult {
  auctionId: string;
  auctionType: AuctionType;
  bids?: any[];
  winner: any;
  price: number;
  secondPrice: number;
  effectiveBid?: number;
  adjustedBid?: number;
  deals?: any[];
  adSlots?: any[];
  status: string;
  timestamp: Date;
  analytics: any;
  reasoning?: string;
  metadata?: any;
}

export class AnalyticsService {
  async getStats(startDate?: Date, endDate?: Date): Promise<AuctionStats> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    logger.info('Fetching auction statistics', { startDate: start, endDate: end });

    try {
      const aggregatedStats = await AuctionHistory.getAggregatedStats(start, end);
      const topBidders = await AuctionHistory.getTopBidders(start, end, 10);
      const typeBreakdown = await this.getAuctionTypeBreakdown(start, end);

      const stats: AuctionStats = {
        totalAuctions: aggregatedStats.totalAuctions || 0,
        completedAuctions: aggregatedStats.completedAuctions || 0,
        noFillAuctions: aggregatedStats.noFillAuctions || 0,
        totalRevenue: aggregatedStats.totalRevenue || 0,
        avgPrice: aggregatedStats.avgPrice || 0,
        avgSecondPrice: aggregatedStats.avgSecondPrice || 0,
        topBidders: topBidders.map((tb: { seatId: string; winCount: number; totalSpend: number }) => ({ seatId: tb.seatId, winCount: tb.winCount, totalSpend: tb.totalSpend })),
        auctionTypeBreakdown: typeBreakdown,
      };
      return stats;
    } catch (error) {
      logger.error('Failed to fetch auction statistics', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private async getAuctionTypeBreakdown(startDate: Date, endDate: Date): Promise<Record<AuctionType, number>> {
    const breakdown: Record<AuctionType, number> = { 'first-price': 0, 'second-price': 0, 'vickrey': 0, 'weighted': 0 };
    try {
      const result = await AuctionHistory.aggregate([{ $match: { timestamp: { $gte: startDate, $lte: endDate } } }, { $group: { _id: '$auctionType', count: { $sum: 1 } } }]);
      for (const item of result) { if (item._id in breakdown) breakdown[item._id as AuctionType] = item.count; }
    } catch (error) { logger.error('Failed to get auction type breakdown', { error: error instanceof Error ? error.message : 'Unknown error' }); }
    return breakdown;
  }

  async getHistory(params: { startDate?: string; endDate?: string; auctionType?: AuctionType; seatId?: string; limit?: number; offset?: number }): Promise<{ auctions: AuctionResult[]; total: number; hasMore: boolean }> {
    const { startDate, endDate, auctionType, seatId, limit = 100, offset = 0 } = params;
    const query: Record<string, any> = {};
    if (startDate || endDate) { query.timestamp = {}; if (startDate) query.timestamp.$gte = new Date(startDate); if (endDate) query.timestamp.$lte = new Date(endDate); }
    if (auctionType) query.auctionType = auctionType;
    if (seatId) query['winner.seatId'] = seatId;

    try {
      const [auctions, total] = await Promise.all([Auction.find(query).sort({ timestamp: -1 }).skip(offset).limit(limit).lean(), Auction.countDocuments(query)]);
      return { auctions: auctions as unknown as AuctionResult[], total, hasMore: offset + auctions.length < total };
    } catch (error) { logger.error('Failed to fetch auction history', { error: error instanceof Error ? error.message : 'Unknown error' }); throw error; }
  }

  async getAuctionById(auctionId: string): Promise<AuctionResult | null> {
    try { const result = await Auction.findOne({ auctionId }).lean(); return result as unknown as AuctionResult | null; }
    catch (error) { logger.error(`Failed to fetch auction ${auctionId}`, { error: error instanceof Error ? error.message : 'Unknown error' }); throw error; }
  }

  async getPriceDistribution(auctionType: AuctionType, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    try {
      const result = await Auction.aggregate([{ $match: { auctionType, status: 'completed', timestamp: { $gte: start, $lte: end } } }, { $group: { _id: null, prices: { $push: '$price' }, min: { $min: '$price' }, max: { $max: '$price' }, mean: { $avg: '$price' } } }]);
      if (!result.length || !result[0].prices.length) return { min: 0, max: 0, mean: 0, median: 0, percentiles: { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 } };
      const prices = result[0].prices.sort((a: number, b: number) => a - b);
      const getPercentile = (arr: number[], p: number) => arr[Math.max(0, Math.ceil((p / 100) * arr.length) - 1)];
      return { min: result[0].min, max: result[0].max, mean: result[0].mean, median: getPercentile(prices, 50), percentiles: { p25: getPercentile(prices, 25), p50: getPercentile(prices, 50), p75: getPercentile(prices, 75), p90: getPercentile(prices, 90), p95: getPercentile(prices, 95) } };
    } catch (error) { logger.error('Failed to calculate price distribution', { error: error instanceof Error ? error.message : 'Unknown error' }); throw error; }
  }

  async getBidderPerformance(seatId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    try {
      const result = await AuctionHistory.aggregate([{ $match: { timestamp: { $gte: startDate }, 'results.status': 'completed' } }, { $unwind: '$topBidders' }, { $match: { 'topBidders.seatId': seatId } }, { $group: { _id: '$topBidders.seatId', totalBids: { $sum: '$topBidders.bidCount' }, totalWins: { $sum: '$topBidders.winCount' }, totalSpend: { $sum: '$topBidders.totalSpend' }, avgBidPrice: { $avg: '$topBidders.avgBidPrice' } } }]);
      if (!result.length) return { totalBids: 0, totalWins: 0, winRate: 0, totalSpend: 0, avgWinPrice: 0, avgBidPrice: 0 };
      const stats = result[0];
      return { totalBids: stats.totalBids, totalWins: stats.totalWins, winRate: stats.totalBids > 0 ? stats.totalWins / stats.totalBids : 0, totalSpend: stats.totalSpend, avgWinPrice: stats.totalWins > 0 ? stats.totalSpend / stats.totalWins : 0, avgBidPrice: stats.avgBidPrice || 0 };
    } catch (error) { logger.error('Failed to calculate bidder performance', { seatId, error: error instanceof Error ? error.message : 'Unknown error' }); throw error; }
  }

  async simulateAuction(bids: { price: number; qualityScore?: number }[], simulations: number = 1000) {
    const bidCount = bids.length;
    const winCounts = new Array(bidCount).fill(0);
    const priceSum = new Array(bidCount).fill(0);
    for (let i = 0; i < simulations; i++) {
      const effectivePrices = bids.map((b, idx) => ({ index: idx, effective: b.price * (b.qualityScore || 1), price: b.price }));
      effectivePrices.sort((a, b) => b.effective - a.effective);
      const winnerIndex = effectivePrices[0].index;
      winCounts[winnerIndex]++;
      const secondPrice = effectivePrices.length > 1 ? effectivePrices[1].effective / (bids[winnerIndex].qualityScore || 1) : effectivePrices[0].price * 0.5;
      priceSum[winnerIndex] += secondPrice;
    }
    const maxWins = Math.max(...winCounts);
    const winnerIndex = winCounts.indexOf(maxWins);
    const distribution = bids.map((_, i) => ({ winnerIndex: i, probability: winCounts[i] / simulations, avgPrice: winCounts[i] > 0 ? priceSum[i] / winCounts[i] : 0 }));
    return { expectedWinner: `seat-${winnerIndex}`, expectedPrice: winCounts[winnerIndex] > 0 ? priceSum[winnerIndex] / winCounts[winnerIndex] : 0, confidence: maxWins / simulations, distribution };
  }
}

export const analyticsService = new AnalyticsService();