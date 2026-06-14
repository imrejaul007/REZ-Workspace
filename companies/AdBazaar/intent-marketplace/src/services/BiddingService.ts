import { v4 as uuidv4 } from 'uuid';
import { MarketplaceBid, MarketplaceBidDocument } from '../models/index.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';
import { logger } from '../config/logger.js';
import type { IMarketplaceBid, BidRequest, BidStatus } from '../types.js';

const BID_CACHE_TTL = 60; // 1 minute
const AUCTION_DURATION_DEFAULT = 30; // minutes

export class BiddingService {
  /**
   * Submit a new bid for a segment
   */
  async submitBid(advertiserId: string, bidRequest: BidRequest): Promise<IMarketplaceBid> {
    const { segmentId, bidAmount, maxBudget, campaignId, auctionDurationMinutes = AUCTION_DURATION_DEFAULT } = bidRequest;

    // Get current winning bid
    const currentWinning = await this.getCurrentWinningBid(segmentId);

    // Check if new bid outbids current
    const newBidWins = !currentWinning || bidAmount > currentWinning.bidAmount;

    const bidId = uuidv4();
    const auctionEndsAt = new Date(Date.now() + auctionDurationMinutes * 60 * 1000);

    const bid = new MarketplaceBid({
      bidId,
      segmentId,
      advertiserId,
      bidAmount,
      maxBudget,
      campaignId,
      status: newBidWins ? 'winning' : 'pending',
      currentWinningBid: newBidWins ? bidAmount : currentWinning?.bidAmount,
      auctionEndsAt,
    });

    await bid.save();

    // If this bid wins, update previous winning bid
    if (newBidWins && currentWinning) {
      await MarketplaceBid.findByIdAndUpdate(currentWinning._id, {
        status: 'outbid',
      });
 }

    // Cache the winning bid
    if (newBidWins) {
      await cacheSet(`bid:winning:${segmentId}`, bid.toObject(), BID_CACHE_TTL);
    }

    logger.info('Bid submitted', {
      bidId,
      segmentId,
      advertiserId,
      bidAmount,
      status: newBidWins ? 'winning' : 'pending',
    });

    return bid.toObject();
  }

  /**
   * Get current winning bid for a segment
   */
  async getCurrentWinningBid(segmentId: string): Promise<IMarketplaceBid | null> {
    // Try cache first
    const cacheKey = `bid:winning:${segmentId}`;
    const cached = await cacheGet<IMarketplaceBid>(cacheKey);
    if (cached) {
      return cached;
    }

    const winningBid = await MarketplaceBid.findOne({
      segmentId,
      status: 'winning',
      auctionEndsAt: { $gt: new Date() },
    })
      .sort({ bidAmount: -1 })
      .lean();

    if (winningBid) {
      await cacheSet(cacheKey, winningBid, BID_CACHE_TTL);
    }

    return winningBid as IMarketplaceBid | null;
  }

  /**
   * Get bid history for a segment
   */
  async getBidHistory(
    segmentId: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<{ bids: IMarketplaceBid[]; total: number }> {
    const { limit = 50, page = 1 } = options;
    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      MarketplaceBid.find({ segmentId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketplaceBid.countDocuments({ segmentId }),
    ]);

    return {
      bids: bids as IMarketplaceBid[],
      total,
    };
  }

  /**
   * Get bids for an advertiser
   */
  async getAdvertiserBids(
    advertiserId: string,
    options: { status?: BidStatus; limit?: number; page?: number } = {}
  ): Promise<{ bids: IMarketplaceBid[]; total: number }> {
    const { status, limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { advertiserId };
    if (status) filter.status = status;

    const [bids, total] = await Promise.all([
      MarketplaceBid.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketplaceBid.countDocuments(filter),
    ]);

    return {
      bids: bids as IMarketplaceBid[],
      total,
    };
  }

  /**
   * Get bid by ID
   */
  async getBidById(bidId: string): Promise<IMarketplaceBid | null> {
    const bid = await MarketplaceBid.findOne({ bidId }).lean();
    return bid as IMarketplaceBid | null;
  }

  /**
   * Update bid status
   */
  async updateBidStatus(bidId: string, status: BidStatus): Promise<IMarketplaceBid | null> {
    const bid = await MarketplaceBid.findOneAndUpdate(
      { bidId },
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();

    if (bid) {
      await cacheDelete(`bid:winning:${(bid as IMarketplaceBid).segmentId}`);
      logger.info('Bid status updated', { bidId, status });
    }

    return bid as IMarketplaceBid | null;
  }

  /**
   * Expire old bids
   */
  async expireOldBids(): Promise<number> {
    const result = await MarketplaceBid.updateMany(
      {
        status: { $in: ['pending', 'winning'] },
        auctionEndsAt: { $lt: new Date() },
      },
      { $set: { status: 'expired' } }
    );

    if (result.modifiedCount > 0) {
      logger.info('Expired old bids', { count: result.modifiedCount });
    }

    return result.modifiedCount;
  }

  /**
   * Get auction status for a segment
   */
  async getAuctionStatus(segmentId: string): Promise<{
    segmentId: string;
    isActive: boolean;
    currentWinningBid: IMarketplaceBid | null;
    bidCount: number;
    auctionEndsAt: Date | null;
 minBidIncrement: number;
  }> {
    const currentWinning = await this.getCurrentWinningBid(segmentId);
    const bidCount = await MarketplaceBid.countDocuments({
      segmentId,
      status: { $in: ['pending', 'winning'] },
      auctionEndsAt: { $gt: new Date() },
    });

    return {
      segmentId,
      isActive: currentWinning !== null && currentWinning.auctionEndsAt && currentWinning.auctionEndsAt > new Date(),
      currentWinningBid: currentWinning,
      bidCount,
      auctionEndsAt: currentWinning?.auctionEndsAt || null,
      minBidIncrement: currentWinning ? Math.max(currentWinning.bidAmount * 0.05, 0.01) : 0.10,
    };
  }

  /**
   * Calculate suggested bid based on historical data
   */
  async getSuggestedBid(segmentId: string): Promise<{
    segmentId: string;
    suggestedBid: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  }> {
    const recentBids = await MarketplaceBid.find({
      segmentId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (recentBids.length === 0) {
      return {
        segmentId,
        suggestedBid: 0.50,
        confidence: 'low',
        reasoning: 'No recent bids, using base price',
      };
    }

    const avgBid = recentBids.reduce((sum, b) => sum + b.bidAmount, 0) / recentBids.length;
    const winningBids = recentBids.filter((b) => b.status === 'winning');
    const avgWinningBid = winningBids.length > 0
      ? winningBids.reduce((sum, b) => sum + b.bidAmount, 0) / winningBids.length
      : avgBid;

    return {
      segmentId,
      suggestedBid: Math.round(avgWinningBid * 1.1 * 100) / 100, // 10% above average winning bid
      confidence: recentBids.length >= 5 ? 'high' : 'medium',
      reasoning: `Based on ${recentBids.length} recent bids, avg winning: ${avgWinningBid.toFixed(2)}`,
    };
  }
}

export const biddingService = new BiddingService();
