import { v4 as uuidv4 } from 'uuid';
import { Seat, ISeat, SeatStatus, SeatType, SeatPermissions, RateLimits } from '../models/Seat';
import { logger } from '../utils/logger';
import { seatsGauge } from '../utils/metrics';

export interface CreateSeatInput {
  seatId?: string;
  name: string;
  type: SeatType;
  status?: SeatStatus;
  email?: string;
  phone?: string;
  company?: string;
  billingContact?: ISeat['billingContact'];
  permissions?: Partial<SeatPermissions>;
  rateLimits?: Partial<RateLimits>;
  defaultBidValidation?: boolean;
  bidValidationRules?: ISeat['bidValidationRules'];
  buyerExternalId?: string;
  sellerExternalId?: string;
  ssoEnabled?: boolean;
  ssoProvider?: string;
  ext?: Record<string, unknown>;
}

export interface UpdateSeatInput {
  name?: string;
  status?: SeatStatus;
  email?: string;
  phone?: string;
  company?: string;
  billingContact?: ISeat['billingContact'];
  permissions?: Partial<SeatPermissions>;
  rateLimits?: Partial<RateLimits>;
  defaultBidValidation?: boolean;
  bidValidationRules?: ISeat['bidValidationRules'];
  ssoEnabled?: boolean;
  ssoProvider?: string;
  ext?: Record<string, unknown>;
}

export interface SeatFilter {
  type?: SeatType;
  status?: SeatStatus;
  company?: string;
  page?: number;
  limit?: number;
}

export class SeatService {
  /**
   * Create a new seat
   */
  async createSeat(input: CreateSeatInput): Promise<ISeat> {
    const seatId = input.seatId || `seat_${uuidv4()}`;

    logger.info('Creating seat', {
      seatId,
      name: input.name,
      type: input.type
    });

    try {
      const defaultPermissions: SeatPermissions = {
        canBid: true,
        maxBidPerRequest: 10000,
        maxTotalDailySpend: 100000,
        canCreateDeals: input.type === 'seller',
        canJoinDeals: input.type !== 'seller',
        dealTypes: [],
        canAccessInventory: true,
        canViewAnalytics: true,
        analyticsGranularity: 'daily',
        requiresCreativeReview: false,
        features: {
          realTimeBidding: true,
          programmaticDirect: true,
          preferredDeals: true,
          firstLook: false,
          dealManagement: true,
          privateMarketplace: true,
          audienceTargeting: true,
          viewabilityOptimization: false,
          brandSafetyTools: false
        },
        ...input.permissions
      };

      const defaultRateLimits: RateLimits = {
        requestsPerSecond: 100,
        requestsPerMinute: 5000,
        requestsPerHour: 100000,
        requestsPerDay: 1000000,
        bidsPerSecond: 50,
        bidsPerMinute: 2000,
        ...input.rateLimits
      };

      const seat = new Seat({
        seatId,
        name: input.name,
        type: input.type,
        status: input.status || 'pending',
        email: input.email,
        phone: input.phone,
        company: input.company,
        billingContact: input.billingContact,
        permissions: defaultPermissions,
        rateLimits: defaultRateLimits,
        defaultBidValidation: input.defaultBidValidation ?? true,
        bidValidationRules: input.bidValidationRules,
        buyerExternalId: input.buyerExternalId,
        sellerExternalId: input.sellerExternalId,
        ssoEnabled: input.ssoEnabled ?? false,
        ssoProvider: input.ssoProvider,
        ext: input.ext
      });

      await seat.save();

      // Update gauge
      await this.updateSeatsGauge();

      logger.info('Seat created successfully', { seatId });

      return seat;
    } catch (error) {
      logger.error('Failed to create seat', {
        seatId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get seat by ID
   */
  async getSeat(seatId: string): Promise<ISeat | null> {
    return Seat.findOne({ seatId }).exec();
  }

  /**
   * Get seat by email
   */
  async getSeatByEmail(email: string): Promise<ISeat | null> {
    return Seat.findOne({ email }).exec();
  }

  /**
   * Get seat by external ID
   */
  async getSeatByExternalId(buyerExternalId?: string, sellerExternalId?: string): Promise<ISeat | null> {
    const query: Record<string, unknown> = {};
    if (buyerExternalId) query.buyerExternalId = buyerExternalId;
    if (sellerExternalId) query.sellerExternalId = sellerExternalId;
    return Seat.findOne(query).exec();
  }

  /**
   * List seats with filtering and pagination
   */
  async listSeats(filter: SeatFilter): Promise<{
    seats: ISeat[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.type) query.type = filter.type;
    if (filter.status) query.status = filter.status;
    if (filter.company) query.company = new RegExp(filter.company, 'i');

    const [seats, total] = await Promise.all([
      Seat.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Seat.countDocuments(query)
    ]);

    return {
      seats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update seat
   */
  async updateSeat(seatId: string, input: UpdateSeatInput): Promise<ISeat | null> {
    logger.info('Updating seat', { seatId, updates: Object.keys(input) });

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.company !== undefined) updateData.company = input.company;
    if (input.billingContact !== undefined) updateData.billingContact = input.billingContact;
    if (input.permissions !== undefined) updateData.permissions = input.permissions;
    if (input.rateLimits !== undefined) updateData.rateLimits = input.rateLimits;
    if (input.defaultBidValidation !== undefined) updateData.defaultBidValidation = input.defaultBidValidation;
    if (input.bidValidationRules !== undefined) updateData.bidValidationRules = input.bidValidationRules;
    if (input.ssoEnabled !== undefined) updateData.ssoEnabled = input.ssoEnabled;
    if (input.ssoProvider !== undefined) updateData.ssoProvider = input.ssoProvider;
    if (input.ext !== undefined) updateData.ext = input.ext;

    const seat = await Seat.findOneAndUpdate(
      { seatId },
      { $set: updateData },
      { new: true }
    ).exec();

    if (seat) {
      await this.updateSeatsGauge();
    }

    return seat;
  }

  /**
   * Activate seat
   */
  async activateSeat(seatId: string, approvedBy?: string): Promise<ISeat | null> {
    logger.info('Activating seat', { seatId, approvedBy });

    return Seat.findOneAndUpdate(
      { seatId, status: 'pending' },
      {
        $set: {
          status: 'active',
          approvedAt: new Date(),
          approvedBy
        }
      },
      { new: true }
    ).exec();
  }

  /**
   * Deactivate seat
   */
  async deactivateSeat(seatId: string): Promise<ISeat | null> {
    logger.info('Deactivating seat', { seatId });

    const seat = await Seat.findOneAndUpdate(
      { seatId, status: 'active' },
      { $set: { status: 'inactive' } },
      { new: true }
    ).exec();

    if (seat) {
      await this.updateSeatsGauge();
    }

    return seat;
  }

  /**
   * Suspend seat
   */
  async suspendSeat(
    seatId: string,
    suspendedBy: string,
    reason: string
  ): Promise<ISeat | null> {
    logger.info('Suspending seat', { seatId, suspendedBy, reason });

    const seat = await Seat.findOneAndUpdate(
      { seatId, status: { $in: ['active', 'pending'] } },
      {
        $set: {
          status: 'suspended',
          suspendedAt: new Date(),
          suspendedBy,
          suspensionReason: reason
        }
      },
      { new: true }
    ).exec();

    if (seat) {
      await this.updateSeatsGauge();
    }

    return seat;
  }

  /**
   * Unsuspend seat
   */
  async unsuspendSeat(seatId: string): Promise<ISeat | null> {
    logger.info('Unsuspending seat', { seatId });

    const seat = await Seat.findOneAndUpdate(
      { seatId, status: 'suspended' },
      {
        $set: {
          status: 'active'
        },
        $unset: {
          suspendedAt: '',
          suspendedBy: '',
          suspensionReason: ''
        }
      },
      { new: true }
    ).exec();

    if (seat) {
      await this.updateSeatsGauge();
    }

    return seat;
  }

  /**
   * Update seat statistics
   */
  async updateSeatStats(
    seatId: string,
    stats: {
      totalBids?: number;
      totalSpend?: number;
      averageCpm?: number;
      winRate?: number;
    }
  ): Promise<void> {
    await Seat.updateOne(
      { seatId },
      {
        $set: {
          ...stats,
          lastActivityAt: new Date()
        }
      }
    );
  }

  /**
   * Check if seat can bid
   */
  async canSeatBid(seatId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const seat = await Seat.findOne({ seatId }).exec();

    if (!seat) {
      return { allowed: false, reason: 'Seat not found' };
    }

    if (seat.status !== 'active') {
      return { allowed: false, reason: `Seat status is ${seat.status}` };
    }

    if (!seat.permissions.canBid) {
      return { allowed: false, reason: 'Bidding not allowed for this seat' };
    }

    return { allowed: true };
  }

  /**
   * Get seat rate limit
   */
  async getSeatRateLimit(seatId: string): Promise<RateLimits | null> {
    const seat = await Seat.findOne({ seatId }).exec();
    return seat?.rateLimits || null;
  }

  /**
   * Get seat permissions
   */
  async getSeatPermissions(seatId: string): Promise<SeatPermissions | null> {
    const seat = await Seat.findOne({ seatId }).exec();
    return seat?.permissions || null;
  }

  /**
   * Get seat statistics
   */
  async getSeatStats(): Promise<{
    totalSeats: number;
    activeSeats: number;
    inactiveSeats: number;
    suspendedSeats: number;
    pendingSeats: number;
    buyerSeats: number;
    sellerSeats: number;
    bothSeats: number;
    totalSpend: number;
    averageWinRate: number;
  }> {
    const [statusStats, typeStats, spendStats] = await Promise.all([
      Seat.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Seat.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      Seat.aggregate([
        {
          $group: {
            _id: null,
            totalSpend: { $sum: '$totalSpend' },
            avgWinRate: { $avg: '$winRate' }
          }
        }
      ])
    ]);

    const statusCounts = Object.fromEntries(statusStats.map(s => [s._id, s.count])) as Record<string, number>;
    const typeCounts = Object.fromEntries(typeStats.map(t => [t._id, t.count])) as Record<string, number>;

    return {
      totalSeats: Object.values(statusCounts).reduce((a: number, b: number) => a + b, 0),
      activeSeats: statusCounts.active || 0,
      inactiveSeats: statusCounts.inactive || 0,
      suspendedSeats: statusCounts.suspended || 0,
      pendingSeats: statusCounts.pending || 0,
      buyerSeats: typeCounts.buyer || 0,
      sellerSeats: typeCounts.seller || 0,
      bothSeats: typeCounts.both || 0,
      totalSpend: (spendStats[0]?.totalSpend as number) || 0,
      averageWinRate: (spendStats[0]?.avgWinRate as number) || 0
    };
  }

  /**
   * Update seats gauge metric
   */
  private async updateSeatsGauge(): Promise<void> {
    const [active, inactive, suspended, pending] = await Promise.all([
      Seat.countDocuments({ status: 'active' }),
      Seat.countDocuments({ status: 'inactive' }),
      Seat.countDocuments({ status: 'suspended' }),
      Seat.countDocuments({ status: 'pending' })
    ]);

    seatsGauge.set({ status: 'active' }, active);
    seatsGauge.set({ status: 'inactive' }, inactive);
    seatsGauge.set({ status: 'suspended' }, suspended);
    seatsGauge.set({ status: 'pending' }, pending);
  }
}

export const seatService = new SeatService();
export default seatService;