import { nanoid } from 'nanoid';
import { Bid, IBid, IAuction, Auction } from '../models';
import { logger } from '../utils/logger';
import { PlaceBidInput, CreateAuctionInput, BidStatus } from '../utils/validation';

export class BiddingService {
  /**
   * Generate a unique bid ID
   */
  private generateBidId(): string {
    return `BID-${nanoid(16)}`;
  }

  /**
   * Generate a unique auction ID
   */
  private generateAuctionId(): string {
    return `AUC-${nanoid(16)}`;
  }

  /**
   * Create a new auction
   */
  async createAuction(input: CreateAuctionInput): Promise<IAuction> {
    const auctionId = this.generateAuctionId();

    const auction = new Auction({
      auctionId,
      slotId: input.slotId,
      bidFloor: input.bidFloor,
      timeoutMs: input.timeoutMs,
      metadata: input.metadata,
      status: 'active',
      startedAt: new Date(),
    });

    await auction.save();

    logger.info('Auction created', {
      auctionId,
      slotId: input.slotId,
      bidFloor: input.bidFloor,
      timeoutMs: input.timeoutMs,
    });

    return auction;
  }

  /**
   * Place a bid in an auction
   */
  async placeBid(input: PlaceBidInput): Promise<IBid> {
    // Find the auction
    const auction = await Auction.findOne({
      auctionId: input.auctionId,
      status: 'active',
    });

    if (!auction) {
      const error = new Error('Auction not found or not active');
      (error as any).statusCode = 404;
      throw error;
    }

    // Check if auction has expired
    const elapsed = Date.now() - auction.startedAt.getTime();
    if (elapsed > auction.timeoutMs) {
      // Mark auction as expired
      auction.status = 'expired';
      auction.endedAt = new Date();
      await auction.save();

      const error = new Error('Auction has expired');
      (error as any).statusCode = 410;
      throw error;
    }

    // Check bid amount against bid floor
    if (input.amount < auction.bidFloor) {
      const error = new Error(`Bid amount must be at least ${auction.bidFloor}`);
      (error as any).statusCode = 400;
      throw error;
    }

    const bidId = this.generateBidId();
    const timestamp = new Date();

    const bid = new Bid({
      bidId,
      auctionId: input.auctionId,
      advertiserId: input.advertiserId,
      campaignId: input.campaignId,
      slotId: input.slotId,
      amount: input.amount,
      currency: input.currency || 'INR',
      status: 'pending',
      creativeId: input.creativeId,
      bidFloor: auction.bidFloor,
      timestamp,
    });

    await bid.save();

    logger.info('Bid placed', {
      bidId,
      auctionId: input.auctionId,
      advertiserId: input.advertiserId,
      amount: input.amount,
      currency: input.currency,
    });

    // Check if this is the highest bid and determine winners
    await this.evaluateAuction(input.auctionId);

    return bid;
  }

  /**
   * Evaluate an auction and determine the winning bid
   */
  async evaluateAuction(auctionId: string): Promise<IAuction> {
    const auction = await Auction.findOne({ auctionId });

    if (!auction || auction.status !== 'active') {
      throw new Error('Auction not found or not active');
    }

    // Get all pending bids for this auction, sorted by amount (highest first)
    const pendingBids = await Bid.find({
      auctionId,
      status: 'pending',
    }).sort({ amount: -1, timestamp: 1 });

    if (pendingBids.length === 0) {
      // No bids, mark auction as completed with no winner
      auction.status = 'completed';
      auction.endedAt = new Date();
      await auction.save();

      logger.info('Auction completed with no bids', { auctionId });
      return auction;
    }

    const highestBid = pendingBids[0];

    // Check if highest bid meets bid floor
    if (highestBid.amount < auction.bidFloor) {
      auction.status = 'completed';
      auction.endedAt = new Date();
      await auction.save();

      // Mark all bids as lost
      await Bid.updateMany(
        { auctionId, status: 'pending' },
        { status: 'lost' as BidStatus }
      );

      logger.info('Auction completed - highest bid below floor', {
        auctionId,
        highestBid: highestBid.bidId,
        amount: highestBid.amount,
        bidFloor: auction.bidFloor,
      });

      return auction;
    }

    // Mark the highest bid as won
    highestBid.status = 'won';
    await highestBid.save();

    // Mark all other pending bids as lost
    await Bid.updateMany(
      {
        auctionId,
        status: 'pending',
        bidId: { $ne: highestBid.bidId },
      },
      { status: 'lost' as BidStatus }
    );

    // Mark auction as completed
    auction.status = 'completed';
    auction.endedAt = new Date();
    auction.winningBidId = highestBid.bidId;
    auction.winningAmount = highestBid.amount;
    await auction.save();

    logger.info('Auction completed with winner', {
      auctionId,
      winningBidId: highestBid.bidId,
      winningAmount: highestBid.amount,
      advertiserId: highestBid.advertiserId,
    });

    return auction;
  }

  /**
   * Get auction result
   */
  async getAuctionResult(auctionId: string): Promise<{
    auction: IAuction;
    bids: IBid[];
    winner?: IBid;
  }> {
    const auction = await Auction.findOne({ auctionId });

    if (!auction) {
      const error = new Error('Auction not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const bids = await Bid.find({ auctionId }).sort({ amount: -1, timestamp: 1 });
    const winner = bids.find((b: IBid) => b.status === 'won');

    return {
      auction,
      bids,
      winner,
    };
  }

  /**
   * Get bid by ID
   */
  async getBidById(bidId: string): Promise<IBid | null> {
    return Bid.findOne({ bidId });
  }

  /**
   * Get all bids with pagination
   */
  async getAllBids(
    page: number = 1,
    limit: number = 20,
    status?: BidStatus
  ): Promise<{ bids: IBid[]; total: number; page: number; totalPages: number }> {
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const total = await Bid.countDocuments(query);
    const bids = await Bid.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      bids,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get bids by auction ID
   */
  async getBidsByAuction(auctionId: string): Promise<IBid[]> {
    return Bid.find({ auctionId }).sort({ amount: -1, timestamp: 1 });
  }

  /**
   * Get bids by advertiser ID
   */
  async getBidsByAdvertiser(
    advertiserId: string,
    page: number = 1,
    limit: number = 20,
    status?: BidStatus
  ): Promise<{ bids: IBid[]; total: number; page: number; totalPages: number }> {
    const query: any = { advertiserId };
    if (status) {
      query.status = status;
    }

    const total = await Bid.countDocuments(query);
    const bids = await Bid.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      bids,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get bids by campaign ID
   */
  async getBidsByCampaign(
    campaignId: string,
    page: number = 1,
    limit: number = 20,
    status?: BidStatus
  ): Promise<{ bids: IBid[]; total: number; page: number; totalPages: number }> {
    const query: any = { campaignId };
    if (status) {
      query.status = status;
    }

    const total = await Bid.countDocuments(query);
    const bids = await Bid.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      bids,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get advertiser bid statistics
   */
  async getAdvertiserStats(advertiserId: string): Promise<{
    totalBids: number;
    wonBids: number;
    lostBids: number;
    pendingBids: number;
    expiredBids: number;
    winRate: number;
    totalSpend: number;
    averageBidAmount: number;
    highestBid: number;
    lowestBid: number;
  }> {
    const bids = await Bid.find({ advertiserId });

    const stats = {
      totalBids: bids.length,
      wonBids: 0,
      lostBids: 0,
      pendingBids: 0,
      expiredBids: 0,
      winRate: 0,
      totalSpend: 0,
      averageBidAmount: 0,
      highestBid: 0,
      lowestBid: 0,
    };

    if (bids.length === 0) {
      return stats;
    }

    let totalAmount = 0;
    let highest = 0;
    let lowest = Infinity;

    for (const bid of bids) {
      switch (bid.status) {
        case 'won':
          stats.wonBids++;
          stats.totalSpend += bid.amount;
          break;
        case 'lost':
          stats.lostBids++;
          break;
        case 'pending':
          stats.pendingBids++;
          break;
        case 'expired':
          stats.expiredBids++;
          break;
      }

      totalAmount += bid.amount;
      if (bid.amount > highest) highest = bid.amount;
      if (bid.amount < lowest) lowest = bid.amount;
    }

    stats.winRate = stats.totalBids > 0 ? (stats.wonBids / stats.totalBids) * 100 : 0;
    stats.averageBidAmount = totalAmount / bids.length;
    stats.highestBid = highest;
    stats.lowestBid = lowest === Infinity ? 0 : lowest;

    return stats;
  }

  /**
   * Cancel a pending bid
   */
  async cancelBid(bidId: string): Promise<IBid | null> {
    const bid = await Bid.findOne({ bidId });

    if (!bid) {
      const error = new Error('Bid not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (bid.status !== 'pending') {
      const error = new Error('Only pending bids can be cancelled');
      (error as any).statusCode = 400;
      throw error;
    }

    bid.status = 'expired';
    await bid.save();

    logger.info('Bid cancelled', { bidId, advertiserId: bid.advertiserId });

    return bid;
  }

  /**
   * Expire stale pending bids
   */
  async expireStaleBids(olderThanMs: number = 60000): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);

    const result = await Bid.updateMany(
      {
        status: 'pending',
        timestamp: { $lt: cutoff },
      },
      { status: 'expired' as BidStatus }
    );

    if (result.modifiedCount > 0) {
      logger.info('Expired stale bids', { count: result.modifiedCount });
    }

    return result.modifiedCount;
  }
}

export const biddingService = new BiddingService();