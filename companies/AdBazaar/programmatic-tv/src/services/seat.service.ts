import { v4 as uuidv4 } from 'uuid';
import {
  BidderSeat,
  SeatFilter,
  PaginationParams,
  ListResponse,
} from '../types/index.js';
import { BidderSeatModel } from '../models/index.js';
import { getRedisClient } from './database.js';
import { config } from '../config/index.js';

export class SeatService {
  private redis = getRedisClient();

  /**
   * Register a new bidder seat
   */
  async registerSeat(data: Omit<BidderSeat, 'seatId' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>): Promise<BidderSeat> {
    const seat = {
      ...data,
      seatId: data.seatId || `seat-${uuidv4()}`,
    };

    const doc = new BidderSeatModel(seat);
    const saved = await doc.save();

    // Invalidate seat cache
    await this.invalidateSeatCache();

    return saved.toObject() as BidderSeat;
  }

  /**
   * Get a seat by ID
   */
  async getSeatById(seatId: string): Promise<BidderSeat | null> {
    // Check cache first
    const cacheKey = `seat:${seatId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const doc = await BidderSeatModel.findOne({ seatId });
    if (doc) {
      const seat = doc.toObject() as BidderSeat;
      await this.redis.setex(
        cacheKey,
        config.redis.ttl.seatCache,
        JSON.stringify(seat)
      );
      return seat;
    }

    return null;
  }

  /**
   * Get a seat by advertiser ID
   */
  async getSeatByAdvertiserId(advertiserId: string): Promise<BidderSeat | null> {
    const doc = await BidderSeatModel.findOne({ advertiserId });
    return doc ? (doc.toObject() as BidderSeat) : null;
  }

  /**
   * List seats with filtering and pagination
   */
  async listSeats(
    filter: SeatFilter,
    pagination: PaginationParams
  ): Promise<ListResponse<BidderSeat>> {
    const query: Record<string, unknown> = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.advertiserId) {
      query.advertiserId = filter.advertiserId;
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { seatId: { $regex: filter.search, $options: 'i' } },
        { organizationName: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const sort: Record<string, 1 | -1> = {};
    if (pagination.sortBy) {
      sort[pagination.sortBy] = pagination.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const [items, total] = await Promise.all([
      BidderSeatModel.find(query).sort(sort).skip(skip).limit(pagination.limit).lean(),
      BidderSeatModel.countDocuments(query),
    ]);

    return {
      items: items as BidderSeat[],
      total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Update a seat
   */
  async updateSeat(
    seatId: string,
    data: Partial<BidderSeat>
  ): Promise<BidderSeat | null> {
    const doc = await BidderSeatModel.findOneAndUpdate(
      { seatId },
      data,
      { new: true, runValidators: true }
    );

    if (doc) {
      // Invalidate cache
      await this.invalidateSeatCache(seatId);
      return doc.toObject() as BidderSeat;
    }

    return null;
  }

  /**
   * Update seat status
   */
  async updateSeatStatus(
    seatId: string,
    status: 'active' | 'suspended' | 'inactive'
  ): Promise<BidderSeat | null> {
    return this.updateSeat(seatId, { status });
  }

  /**
   * Delete a seat
   */
  async deleteSeat(seatId: string): Promise<boolean> {
    const result = await BidderSeatModel.deleteOne({ seatId });
    if (result.deletedCount > 0) {
      await this.invalidateSeatCache(seatId);
      return true;
    }
    return false;
  }

  /**
   * Record seat activity
   */
  async recordActivity(seatId: string): Promise<void> {
    await BidderSeatModel.updateOne(
      { seatId },
      { lastActivityAt: new Date() }
    );
    await this.invalidateSeatCache(seatId);
  }

  /**
   * Update bid limits
   */
  async updateBidLimits(
    seatId: string,
    limits: BidderSeat['bidLimits']
  ): Promise<BidderSeat | null> {
    return this.updateSeat(seatId, { bidLimits: limits });
  }

  /**
   * Add SSP connection
   */
  async addSSPConnection(seatId: string, sspId: string): Promise<BidderSeat | null> {
    const seat = await this.getSeatById(seatId);
    if (!seat) return null;

    if (!seat.sspConnections.includes(sspId)) {
      return this.updateSeat(seatId, {
        sspConnections: [...seat.sspConnections, sspId],
      });
    }

    return seat;
  }

  /**
   * Remove SSP connection
   */
  async removeSSPConnection(seatId: string, sspId: string): Promise<BidderSeat | null> {
    const seat = await this.getSeatById(seatId);
    if (!seat) return null;

    return this.updateSeat(seatId, {
      sspConnections: seat.sspConnections.filter((s) => s !== sspId),
    });
  }

  /**
   * Get active seats
   */
  async getActiveSeats(): Promise<BidderSeat[]> {
    const docs = await BidderSeatModel.find({ status: 'active' }).lean();
    return docs as BidderSeat[];
  }

  /**
   * Check if seat can bid
   */
  async canBid(seatId: string, amount: number): Promise<{ canBid: boolean; reason?: string }> {
    const seat = await this.getSeatById(seatId);
    if (!seat) {
      return { canBid: false, reason: 'Seat not found' };
    }

    if (seat.status !== 'active') {
      return { canBid: false, reason: 'Seat is not active' };
    }

    if (seat.bidLimits?.perBidMax && amount > seat.bidLimits.perBidMax) {
      return { canBid: false, reason: 'Amount exceeds per-bid limit' };
    }

    return { canBid: true };
  }

  /**
   * Invalidate seat cache
   */
  private async invalidateSeatCache(seatId?: string): Promise<void> {
    if (seatId) {
      await this.redis.del(`seat:${seatId}`);
    }
    const keys = await this.redis.keys('seat:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Singleton instance
let seatService: SeatService | null = null;

export function getSeatService(): SeatService {
  if (!seatService) {
    seatService = new SeatService();
  }
  return seatService;
}