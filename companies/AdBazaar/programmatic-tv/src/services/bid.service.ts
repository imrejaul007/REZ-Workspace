import {
  CTVBidRequest,
  CTVBidResponse,
  Bid,
  BidSeat,
  AuctionType,
  Imp,
  DeviceType,
  CTVDeviceCategory,
} from '../types/index.js';
import { getDealService } from './deal.service.js';
import { getSeatService } from './seat.service.js';
import { getFloorService } from './floor.service.js';
import { config } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

interface BidContext {
  seatId: string;
  advertiserId: string;
  timestamp: Date;
}

export class BidService {
  private dealService = getDealService();
  private seatService = getSeatService();
  private floorService = getFloorService();

  /**
   * Process a single bid request
   */
  async processBidRequest(
    request: CTVBidRequest,
    context: BidContext
  ): Promise<CTVBidResponse> {
    const response: CTVBidResponse = {
      id: request.id,
      bidid: `bid-${uuidv4()}`,
      cur: config.defaultCurrency,
      seatbid: [],
    };

    // Validate request
    if (!this.validateBidRequest(request)) {
      response.nbr = 1; // Invalid request
      return response;
    }

    // Check seat authorization
    const seatCheck = await this.seatService.canBid(context.seatId, 0);
    if (!seatCheck.canBid) {
      response.nbr = 2; // Seat not authorized
      return response;
    }

    // Process each impression
    const seatbids: BidSeat[] = [];
    for (const imp of request.imp) {
      const bid = await this.processImpression(imp, request, context);
      if (bid) {
        seatbids.push({
          seat: context.seatId,
          bid: [bid],
        });
      }
    }

    response.seatbid = seatbids;
    return response;
  }

  /**
   * Process a single impression
   */
  private async processImpression(
    imp: Imp,
    request: CTVBidRequest,
    context: BidContext
  ): Promise<Bid | null> {
    // Get floor price
    const floorPrice = await this.calculateImpressionFloorPrice(imp, request);

    // Check for private deals
    const deals = await this.getMatchingDeals(imp, request, context);
    if (deals.length > 0) {
      // Process PMP deals
      return this.processPMPDeals(imp, request, deals, floorPrice, context);
    }

    // Standard auction
    const bid = await this.createBid(imp, request, floorPrice, context);
    return bid;
  }

  /**
   * Calculate floor price for an impression
   */
  private async calculateImpressionFloorPrice(
    imp: Imp,
    request: CTVBidRequest
  ): Promise<number> {
    // Start with impression-level floor
    let floor = imp.bidfloor || config.auction.minBidFloor;

    // Get device type from request
    const deviceType = this.extractDeviceType(request.device?.devicetype);

    // Get geo from request
    const geo = request.device?.geo?.country;

    // Get content category from app/site
    const contentCategory = request.app?.cat?.[0] || request.site?.cat?.[0];

    // Calculate contextual floor
    const contextualFloor = await this.floorService.calculateFloorPrice({
      geo,
      deviceType,
      contentCategory,
    });

    // Use higher of the two floors
    floor = Math.max(floor, contextualFloor);

    return floor;
  }

  /**
   * Extract CTV device category from OpenRTB device type
   */
  private extractDeviceType(
    deviceType?: DeviceType
  ): CTVDeviceCategory | undefined {
    switch (deviceType) {
      case DeviceType.CONNECTED_TV:
        return CTVDeviceCategory.SMART_TV;
      case DeviceType.SET_TOP_BOX:
        return CTVDeviceCategory.SET_TOP_BOX;
      default:
        return undefined;
    }
  }

  /**
   * Get matching PMP deals
   */
  private async getMatchingDeals(
    imp: Imp,
    request: CTVBidRequest,
    context: BidContext
  ): Promise<Array<{ id: string; floorPrice: number }>> {
    if (!imp.pmp?.deals || imp.pmp.deals.length === 0) {
      return [];
    }

    const matchingDeals: Array<{ id: string; floorPrice: number }> = [];

    for (const deal of imp.pmp.deals) {
      // Check if deal is valid
      const isValid = await this.dealService.isDealValid(deal.id);
      if (!isValid) continue;

      // Get deal details for floor price
      const dealDetails = await this.dealService.getDealById(deal.id);
      if (!dealDetails) continue;

      // Check advertiser authorization
      if (dealDetails.advertiserId !== context.advertiserId) continue;

      matchingDeals.push({
        id: deal.id,
        floorPrice: Math.max(deal.bidfloor || dealDetails.floorPrice, 0),
      });
    }

    return matchingDeals;
  }

  /**
   * Process PMP deals
   */
  private async processPMPDeals(
    imp: Imp,
    request: CTVBidRequest,
    deals: Array<{ id: string; floorPrice: number }>,
    fallbackFloor: number,
    context: BidContext
  ): Promise<Bid | null> {
    // For PMP, bid at deal floor price
    const deal = deals[0]; // Take first matching deal
    if (!deal) return null;

    const bid: Bid = {
      id: `bid-${uuidv4()}`,
      impid: imp.id,
      price: deal.floorPrice,
      dealid: deal.id,
      // In production, set adm, nurl, burl etc.
    };

    return bid;
  }

  /**
   * Create a bid object
   */
  private async createBid(
    imp: Imp,
    request: CTVBidRequest,
    floorPrice: number,
    context: BidContext
  ): Promise<Bid | null> {
    // In a real implementation, this would:
    // 1. Evaluate the request against targeting criteria
    // 2. Calculate optimal bid price
    // 3. Select creative to serve
    // 4. Generate bid response

    // For now, return a basic bid if price is above floor
    const bidPrice = this.calculateBidPrice(floorPrice, request.at);

    if (bidPrice < floorPrice) {
      return null; // Below floor, don't bid
    }

    const bid: Bid = {
      id: `bid-${uuidv4()}`,
      impid: imp.id,
      price: bidPrice,
      crid: `creative-${uuidv4()}`, // Placeholder
      ext: {
        seatId: context.seatId,
        timestamp: context.timestamp.toISOString(),
      },
    };

    // Add video dimensions if available
    if (imp.video) {
      bid.w = imp.video.w || 1920;
      bid.h = imp.video.h || 1080;
      bid.dur = imp.video.maxduration;
    }

    return bid;
  }

  /**
   * Calculate bid price based on auction type
   */
  private calculateBidPrice(floorPrice: number, auctionType?: AuctionType): number {
    switch (auctionType) {
      case AuctionType.FIRST_PRICE:
        // First price: bid slightly above floor
        return floorPrice * 1.05;
      case AuctionType.SECOND_PRICE:
        // Second price: bid at floor
        return floorPrice;
      case AuctionType.FIXED_PRICE:
        // Fixed price: bid at floor
        return floorPrice;
      default:
        // Default to second price
        return floorPrice;
    }
  }

  /**
   * Validate bid request
   */
  private validateBidRequest(request: CTVBidRequest): boolean {
    // Must have request ID
    if (!request.id) return false;

    // Must have at least one impression
    if (!request.imp || request.imp.length === 0) return false;

    // Each impression must have an ID
    for (const imp of request.imp) {
      if (!imp.id) return false;
    }

    // Must have either site or app
    if (!request.site && !request.app) return false;

    return true;
  }

  /**
   * Process batch bid requests
   */
  async processBatchRequests(
    requests: CTVBidRequest[],
    context: BidContext,
    options?: { parallel?: boolean; timeout?: number }
  ): Promise<CTVBidResponse[]> {
    if (options?.parallel) {
      // Process in parallel
      return Promise.all(
        requests.map((req) => this.processBidRequest(req, context))
      );
    } else {
      // Process sequentially
      const responses: CTVBidResponse[] = [];
      for (const req of requests) {
        const response = await this.processBidRequest(req, context);
        responses.push(response);
      }
      return responses;
    }
  }
}

// Singleton instance
let bidService: BidService | null = null;

export function getBidService(): BidService {
  if (!bidService) {
    bidService = new BidService();
  }
  return bidService;
}