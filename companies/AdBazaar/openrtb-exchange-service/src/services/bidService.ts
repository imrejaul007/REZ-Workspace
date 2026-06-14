import { v4 as uuidv4 } from 'uuid';
import { BidRequest, IBidRequest } from '../models/BidRequest';
import { BidResponse, IBidResponse, Bid } from '../models/BidResponse';
import { Auction } from '../models/Auction';
import { logger } from '../utils/logger';
import { bidRequestsTotal, bidResponsesTotal, bidLatency } from '../utils/metrics';

export interface CreateBidRequestInput {
  requestId?: string;
  imp: IBidRequest['imp'];
  site?: IBidRequest['site'];
  app?: IBidRequest['app'];
  device?: IBidRequest['device'];
  user?: IBidRequest['user'];
  test?: number;
  tmax?: number;
  wseat?: string[];
  bseat?: string[];
  allimps?: number;
  cur?: string[];
  source?: IBidRequest['source'];
  regs?: IBidRequest['regs'];
  ext?: Record<string, unknown>;
  auctionType?: number;
}

export interface CreateBidResponseInput {
  bidRequestId: string;
  id?: string;
  bidid?: string;
  cur?: string;
  customdata?: string;
  nbr?: number;
  seatbid: {
    seat: string;
    group?: number;
    expire?: number;
    bid: Omit<Bid, 'ext'>[];
  }[];
  ext?: Record<string, unknown>;
}

export interface BidValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class BidService {
  /**
   * Create a new bid request (OpenRTB 2.6 compliant)
   */
  async createBidRequest(input: CreateBidRequestInput): Promise<IBidRequest> {
    const startTime = Date.now();
    const requestId = input.requestId || uuidv4();

    logger.info('Creating bid request', {
      requestId,
      impCount: input.imp.length,
      tmax: input.tmax
    });

    try {
      const bidRequest = new BidRequest({
        requestId,
        imp: input.imp,
        site: input.site,
        app: input.app,
        device: input.device,
        user: input.user,
        test: input.test || 0,
        tmax: input.tmax || 5000,
        wseat: input.wseat,
        bseat: input.bseat,
        allimps: input.allimps,
        cur: input.cur || ['USD'],
        source: input.source,
        regs: input.regs,
        ext: input.ext,
        status: 'pending',
        bidCount: 0,
        auctionType: input.auctionType || 2
      });

      await bidRequest.save();

      const duration = (Date.now() - startTime) / 1000;
      bidLatency.observe({ type: 'create_request' }, duration);
      bidRequestsTotal.inc({ status: 'created' });

      logger.info('Bid request created successfully', {
        requestId,
        durationMs: Date.now() - startTime
      });

      return bidRequest;
    } catch (error) {
      logger.error('Failed to create bid request', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      bidRequestsTotal.inc({ status: 'error' });
      throw error;
    }
  }

  /**
   * Get bid request by ID
   */
  async getBidRequest(requestId: string): Promise<IBidRequest | null> {
    return BidRequest.findOne({ requestId }).exec();
  }

  /**
   * Get bid response by ID
   */
  async getBidResponse(bidResponseId: string): Promise<IBidResponse | null> {
    return BidResponse.findOne({ id: bidResponseId }).exec();
  }

  /**
   * Get bid responses for a request
   */
  async getBidResponsesForRequest(requestId: string): Promise<IBidResponse[]> {
    return BidResponse.find({ bidRequestId: requestId }).exec();
  }

  /**
   * Create a bid response
   */
  async createBidResponse(input: CreateBidResponseInput): Promise<IBidResponse> {
    const startTime = Date.now();
    const responseId = input.id || uuidv4();

    logger.info('Creating bid response', {
      responseId,
      bidRequestId: input.bidRequestId,
      seatCount: input.seatbid.length
    });

    try {
      // Validate bid request exists
      const bidRequest = await BidRequest.findOne({ requestId: input.bidRequestId });
      if (!bidRequest) {
        throw new Error(`Bid request not found: ${input.bidRequestId}`);
      }

      // Validate bids
      const validBids = this.validateBids(input.seatbid, bidRequest);

      const bidResponse = new BidResponse({
        bidRequestId: input.bidRequestId,
        id: responseId,
        bidid: input.bidid,
        cur: input.cur || 'USD',
        customdata: input.customdata,
        nbr: input.nbr,
        seatbid: input.seatbid.map(sb => ({
          ...sb,
          bid: sb.bid.filter(b => validBids.includes(b.id))
        })),
        ext: input.ext,
        status: 'pending'
      });

      await bidResponse.save();

      // Update bid request
      await BidRequest.updateOne(
        { requestId: input.bidRequestId },
        {
          $inc: { bidCount: 1 },
          $set: { status: 'processing' }
        }
      );

      const duration = (Date.now() - startTime) / 1000;
      bidLatency.observe({ type: 'create_response' }, duration);
      bidResponsesTotal.inc({ status: 'created', has_bids: input.seatbid.some(sb => sb.bid.length > 0) ? 'true' : 'false' });

      logger.info('Bid response created successfully', {
        responseId,
        bidRequestId: input.bidRequestId,
        durationMs: Date.now() - startTime
      });

      return bidResponse;
    } catch (error) {
      logger.error('Failed to create bid response', {
        responseId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      bidResponsesTotal.inc({ status: 'error', has_bids: 'false' });
      throw error;
    }
  }

  /**
   * Validate bids against the bid request
   */
  private validateBids(
    seatbids: CreateBidResponseInput['seatbid'],
    bidRequest: IBidRequest
  ): string[] {
    const validBidIds: string[] = [];
    const impressionIds = new Set(bidRequest.imp.map(i => i.id));

    for (const seatbid of seatbids) {
      for (const bid of seatbid.bid) {
        // Check if impression ID is valid
        if (!impressionIds.has(bid.impid)) {
          logger.warn('Invalid impression ID in bid', {
            bidId: bid.id,
            impid: bid.impid,
            validImpIds: Array.from(impressionIds)
          });
          continue;
        }

        // Check if price is non-negative
        if (bid.price < 0) {
          logger.warn('Negative bid price', { bidId: bid.id, price: bid.price });
          continue;
        }

        // Get impression for floor check
        const imp = bidRequest.imp.find(i => i.id === bid.impid);
        if (imp && imp.bidfloor && bid.price < imp.bidfloor) {
          logger.warn('Bid below floor', {
            bidId: bid.id,
            price: bid.price,
            floor: imp.bidfloor
          });
          continue;
        }

        validBidIds.push(bid.id);
      }
    }

    return validBidIds;
  }

  /**
   * Validate a bid request (OpenRTB 2.6 compliance check)
   */
  validateBidRequest(input: CreateBidRequestInput): BidValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!input.imp || input.imp.length === 0) {
      errors.push('At least one impression (imp) is required');
    }

    // Validate impressions
    if (input.imp) {
      for (let i = 0; i < input.imp.length; i++) {
        const imp = input.imp[i];
        if (!imp.id) {
          errors.push(`Impression ${i} missing required field: id`);
        }
        if (!imp.banner && !imp.video && !imp.audio && !imp.native) {
          errors.push(`Impression ${i} must have at least one of: banner, video, audio, native`);
        }
        if (imp.video && (!imp.video.mimes || imp.video.mimes.length === 0)) {
          errors.push(`Impression ${i} video requires mimes array`);
        }
      }
    }

    // Site or App required
    if (!input.site && !input.app) {
      errors.push('Either site or app object is required');
    }

    // Device recommended
    if (!input.device) {
      warnings.push('Device object is recommended for better targeting');
    }

    // User recommended
    if (!input.user) {
      warnings.push('User object is recommended for better targeting');
    }

    // Tmax validation
    if (input.tmax !== undefined && (input.tmax < 0 || input.tmax > 10000)) {
      warnings.push('tmax should be between 0 and 10000 milliseconds');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Update bid request status
   */
  async updateBidRequestStatus(requestId: string, status: IBidRequest['status']): Promise<void> {
    await BidRequest.updateOne(
      { requestId },
      {
        $set: {
          status,
          ...(status === 'completed' || status === 'expired' || status === 'error'
            ? { processedAt: new Date() }
            : {})
        }
      }
    );
  }

  /**
   * Mark bid response as winning
   */
  async markBidResponseAsWinning(
    bidResponseId: string,
    auctionId: string,
    price: number
  ): Promise<void> {
    await BidResponse.updateOne(
      { id: bidResponseId },
      {
        $set: {
          status: 'winning',
          auctionId,
          winningPrice: price
        }
      }
    );
  }

  /**
   * Mark bid response as lost
   */
  async markBidResponseAsLost(bidRequestId: string, excludeResponseId?: string): Promise<void> {
    const query: Record<string, unknown> = {
      bidRequestId,
      status: 'pending'
    };
    if (excludeResponseId) {
      query.id = { $ne: excludeResponseId };
    }

    await BidResponse.updateMany(
      query,
      { $set: { status: 'lost' } }
    );
  }

  /**
   * Get pending bid requests for processing
   */
  async getPendingBidRequests(limit: number = 100): Promise<IBidRequest[]> {
    return BidRequest.find({
      status: { $in: ['pending', 'processing'] }
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get exchange statistics
   */
  async getExchangeStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    totalResponses: number;
    winningResponses: number;
    averageBidCount: number;
  }> {
    const [requestStats, responseStats] = await Promise.all([
      BidRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      BidResponse.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const requestCounts = Object.fromEntries(requestStats.map(r => [r._id, r.count])) as Record<string, number>;
    const responseCounts = Object.fromEntries(responseStats.map(r => [r._id, r.count])) as Record<string, number>;

    const avgBidCount = await BidRequest.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          avgBidCount: { $avg: '$bidCount' }
        }
      }
    ]);

    return {
      totalRequests: Object.values(requestCounts).reduce((a: number, b: number) => a + b, 0),
      pendingRequests: (requestCounts.pending || 0) + (requestCounts.processing || 0),
      completedRequests: requestCounts.completed || 0,
      totalResponses: Object.values(responseCounts).reduce((a: number, b: number) => a + b, 0),
      winningResponses: responseCounts.winning || 0,
      averageBidCount: (avgBidCount[0]?.avgBidCount as number) || 0
    };
  }
}

export const bidService = new BidService();
export default bidService;