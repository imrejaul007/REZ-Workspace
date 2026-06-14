import { v4 as uuidv4 } from 'uuid';
import { Auction, IAuction, AuctionType, AuctionStatus } from '../models/Auction';
import { BidResponse } from '../models/BidResponse';
import { logger } from '../utils/logger';
import { auctionsTotal, auctionValue } from '../utils/metrics';

interface BidEntry {
  bidId: string;
  seatId: string;
  price: number;
  bidResponseId: string;
  isDealBid: boolean;
  dealId?: string;
}

export interface AuctionResult {
  auctionId: string;
  bidRequestId: string;
  impId: string;
  winnerSeatId: string;
  winnerBidId: string;
  winningPrice: number;
  auctionType: AuctionType;
  secondPrice?: number;
  dealId?: string;
  status: AuctionStatus;
  durationMs: number;
}

export interface RunAuctionInput {
  bidRequestId: string;
  impId: string;
  auctionType?: AuctionType;
  floorPrice?: number;
  reservePrice?: number;
  eligibleDeals?: string[];
}

export class AuctionService {
  /**
   * Run an auction for an impression
   */
  async runAuction(input: RunAuctionInput): Promise<AuctionResult> {
    const startTime = Date.now();
    const auctionId = uuidv4();

    logger.info('Starting auction', {
      auctionId,
      bidRequestId: input.bidRequestId,
      impId: input.impId,
      auctionType: input.auctionType || 'second_price'
    });

    try {
      // Get all bid responses for this request
      const bidResponses = await BidResponse.find({
        bidRequestId: input.bidRequestId,
        status: 'pending'
      }).exec();

      // Extract all bids for this impression
      const allBids: {
        bidId: string;
        seatId: string;
        price: number;
        bidResponseId: string;
        isDealBid: boolean;
        dealId?: string;
      }[] = [];

      for (const response of bidResponses) {
        for (const seatbid of response.seatbid) {
          for (const bid of seatbid.bid) {
            if (bid.impid === input.impId) {
              allBids.push({
                bidId: bid.id,
                seatId: seatbid.seat,
                price: bid.price,
                bidResponseId: response.id,
                isDealBid: false // TODO: Check against deals
              });
            }
          }
        }
      }

      // Sort bids by price (descending)
      allBids.sort((a, b) => b.price - a.price);

      // Create auction record
      const auction = new Auction({
        auctionId,
        bidRequestId: input.bidRequestId,
        impId: input.impId,
        auctionType: input.auctionType || 'second_price',
        status: 'in_progress',
        bidderCount: new Set(allBids.map(b => b.seatId)).size,
        bidCount: allBids.length,
        floorPrice: input.floorPrice || 0,
        reservePrice: input.reservePrice,
        eligibleDealIds: input.eligibleDeals,
        startTime: new Date()
      });

      await auction.save();

      // Check if any bids
      if (allBids.length === 0) {
        auction.status = 'no_bids';
        auction.endTime = new Date();
        auction.timeToComplete = Date.now() - startTime;
        await auction.save();

        auctionsTotal.inc({ type: auction.auctionType, status: 'no_bids' });

        return {
          auctionId,
          bidRequestId: input.bidRequestId,
          impId: input.impId,
          winnerSeatId: '',
          winnerBidId: '',
          winningPrice: 0,
          auctionType: auction.auctionType,
          status: 'no_bids',
          durationMs: Date.now() - startTime
        };
      }

      // Calculate winning bid based on auction type
      let result: AuctionResult;

      switch (input.auctionType || 'second_price') {
        case 'first_price':
          result = this.runFirstPriceAuction(auction, allBids, input.floorPrice || 0);
          break;
        case 'second_price':
          result = this.runSecondPriceAuction(auction, allBids, input.floorPrice || 0);
          break;
        case 'fixed_price':
          result = this.runFixedPriceAuction(auction, allBids, input.floorPrice || 0);
          break;
        case 'hybrid':
          result = this.runHybridAuction(auction, allBids, input.floorPrice || 0);
          break;
        default:
          result = this.runSecondPriceAuction(auction, allBids, input.floorPrice || 0);
      }

      // Update auction with results
      auction.status = result.status;
      auction.winnerBidId = result.winnerBidId;
      auction.winnerSeatId = result.winnerSeatId;
      auction.winningPrice = result.winningPrice;
      auction.secondHighestPrice = result.secondPrice;
      auction.endTime = new Date();
      auction.timeToComplete = Date.now() - startTime;

      // Check for deal bids
      if (result.dealId) {
        auction.winningDealId = result.dealId;
      }

      await auction.save();

      // Mark winning bid response
      if (result.winnerBidId) {
        await BidResponse.updateOne(
          { id: allBids.find(b => b.bidId === result.winnerBidId)?.bidResponseId },
          {
            $set: {
              status: 'winning',
              auctionId,
              winningPrice: result.winningPrice
            }
          }
        );

        // Mark losing bids as lost
        await BidResponse.updateMany(
          {
            bidRequestId: input.bidRequestId,
            status: 'pending',
            _id: { $ne: allBids.find(b => b.bidId === result.winnerBidId)?.bidResponseId }
          },
          { $set: { status: 'lost' } }
        );
      }

      auctionsTotal.inc({ type: auction.auctionType, status: result.status });

      if (result.winningPrice > 0) {
        auctionValue.observe(result.winningPrice / 1000); // Convert to dollars from CPM
      }

      logger.info('Auction completed', {
        auctionId,
        winnerSeatId: result.winnerSeatId,
        winningPrice: result.winningPrice,
        durationMs: result.durationMs
      });

      return result;
    } catch (error) {
      logger.error('Auction failed', {
        auctionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      auctionsTotal.inc({ type: input.auctionType || 'second_price', status: 'error' });
      throw error;
    }
  }

  /**
   * First-price auction: winner pays their bid price
   */
  private runFirstPriceAuction(
    auction: IAuction,
    bids: BidEntry[],
    floorPrice: number
  ): AuctionResult {
    const validBids = bids.filter(b => b.price >= floorPrice);

    if (validBids.length === 0) {
      return this.noBidsResult(auction);
    }

    const winner = validBids[0];
    const secondPrice = validBids.length > 1 ? validBids[1].price : floorPrice;

    return {
      auctionId: auction.auctionId,
      bidRequestId: auction.bidRequestId,
      impId: auction.impId,
      winnerSeatId: winner.seatId,
      winnerBidId: winner.bidId,
      winningPrice: winner.price,
      auctionType: 'first_price',
      secondPrice,
      status: 'completed',
      durationMs: 0
    };
  }

  /**
   * Second-price auction: winner pays second-highest bid
   */
  private runSecondPriceAuction(
    auction: IAuction,
    bids: BidEntry[],
    floorPrice: number
  ): AuctionResult {
    const validBids = bids.filter(b => b.price >= floorPrice);

    if (validBids.length === 0) {
      return this.noBidsResult(auction);
    }

    const winner = validBids[0];
    const secondPrice = validBids.length > 1 ? validBids[1].price : floorPrice;

    return {
      auctionId: auction.auctionId,
      bidRequestId: auction.bidRequestId,
      impId: auction.impId,
      winnerSeatId: winner.seatId,
      winnerBidId: winner.bidId,
      winningPrice: secondPrice,
      auctionType: 'second_price',
      secondPrice: winner.price,
      dealId: winner.dealId,
      status: 'completed',
      durationMs: 0
    };
  }

  /**
   * Fixed price auction: winner pays fixed price
   */
  private runFixedPriceAuction(
    auction: IAuction,
    bids: BidEntry[],
    fixedPrice: number
  ): AuctionResult {
    const validBids = bids.filter(b => b.price >= fixedPrice);

    if (validBids.length === 0) {
      return this.noBidsResult(auction);
    }

    const winner = validBids[0];

    return {
      auctionId: auction.auctionId,
      bidRequestId: auction.bidRequestId,
      impId: auction.impId,
      winnerSeatId: winner.seatId,
      winnerBidId: winner.bidId,
      winningPrice: fixedPrice,
      auctionType: 'fixed_price',
      status: 'completed',
      durationMs: 0
    };
  }

  /**
   * Hybrid auction: deals first, then second-price for open auction
   */
  private runHybridAuction(
    auction: IAuction,
    bids: BidEntry[],
    floorPrice: number
  ): AuctionResult {
    // Separate deal bids and open bids
    const dealBids = bids.filter(b => b.isDealBid && b.dealId);
    const openBids = bids.filter(b => !b.isDealBid);

    // If there are deal bids above floor, run deal auction first
    if (dealBids.length > 0) {
      const validDealBids = dealBids.filter(b => b.price >= floorPrice);
      if (validDealBids.length > 0) {
        const winner = validDealBids[0];
        const secondPrice = validDealBids.length > 1 ? validDealBids[1].price : floorPrice;

        return {
          auctionId: auction.auctionId,
          bidRequestId: auction.bidRequestId,
          impId: auction.impId,
          winnerSeatId: winner.seatId,
          winnerBidId: winner.bidId,
          winningPrice: secondPrice,
          auctionType: 'hybrid',
          secondPrice: winner.price,
          dealId: winner.dealId,
          status: 'completed',
          durationMs: 0
        };
      }
    }

    // Fall back to open auction with second-price
    return this.runSecondPriceAuction(auction, openBids, floorPrice);
  }

  /**
   * Create result for no bids scenario
   */
  private noBidsResult(auction: IAuction): AuctionResult {
    return {
      auctionId: auction.auctionId,
      bidRequestId: auction.bidRequestId,
      impId: auction.impId,
      winnerSeatId: '',
      winnerBidId: '',
      winningPrice: 0,
      auctionType: auction.auctionType,
      status: 'no_bids',
      durationMs: 0
    };
  }

  /**
   * Get auction by ID
   */
  async getAuction(auctionId: string): Promise<IAuction | null> {
    return Auction.findOne({ auctionId }).exec();
  }

  /**
   * Get auctions for a bid request
   */
  async getAuctionsForRequest(bidRequestId: string): Promise<IAuction[]> {
    return Auction.find({ bidRequestId }).exec();
  }

  /**
   * Get auction statistics
   */
  async getAuctionStats(): Promise<{
    totalAuctions: number;
    completedAuctions: number;
    noBidsAuctions: number;
    averageBidsPerAuction: number;
    averageWinningPrice: number;
    auctionTypeBreakdown: Record<string, number>;
  }> {
    const [stats, typeBreakdown] = await Promise.all([
      Auction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalBids: { $sum: '$bidCount' },
            totalPrice: { $sum: '$winningPrice' }
          }
        }
      ]),
      Auction.aggregate([
        {
          $group: {
            _id: '$auctionType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const statusCounts = Object.fromEntries(stats.map(s => [s._id, s.count])) as Record<string, number>;
    const totalBids = stats.reduce((sum, s) => sum + s.totalBids, 0);
    const totalAuctions = Object.values(statusCounts).reduce((a: number, b: number) => a + b, 0);
    const totalPrice = stats.reduce((sum, s) => sum + s.totalPrice, 0);

    return {
      totalAuctions,
      completedAuctions: statusCounts.completed || 0,
      noBidsAuctions: statusCounts.no_bids || 0,
      averageBidsPerAuction: totalAuctions > 0 ? totalBids / totalAuctions : 0,
      averageWinningPrice: totalAuctions > 0 ? totalPrice / totalAuctions : 0,
      auctionTypeBreakdown: Object.fromEntries(typeBreakdown.map(t => [t._id, t.count])) as Record<string, number>
    };
  }
}

export const auctionService = new AuctionService();
export default auctionService;