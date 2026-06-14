import { v4 as uuidv4 } from 'uuid';
import { Deal, IDeal, DealType, DealStatus } from '../models/Deal';
import { logger } from '../utils/logger';
import { activeDealsGauge } from '../utils/metrics';

export interface CreateDealInput {
  dealId?: string;
  buyerId: string;
  sellerId: string;
  currency?: string;
  type: DealType;
  basePriceCpm: number;
  minimumPriceCpm?: number;
  maximumPriceCpm?: number;
  priceModel?: 'cpm' | 'cpc' | 'cpa' | 'fixed';
  impressionLimit?: number;
  clickLimit?: number;
  conversionLimit?: number;
  budgetLimit?: number;
  targeting?: IDeal['targeting'];
  startTime?: Date;
  endTime?: Date;
  buyerSeatId?: string;
  sellerSeatId?: string;
  requiresApproval?: boolean;
  name?: string;
  description?: string;
  externalDealId?: string;
  ext?: Record<string, unknown>;
}

export interface UpdateDealInput {
  status?: DealStatus;
  basePriceCpm?: number;
  minimumPriceCpm?: number;
  maximumPriceCpm?: number;
  targeting?: IDeal['targeting'];
  startTime?: Date;
  endTime?: Date;
  impressionLimit?: number;
  clickLimit?: number;
  conversionLimit?: number;
  budgetLimit?: number;
  requiresApproval?: boolean;
  name?: string;
  description?: string;
  ext?: Record<string, unknown>;
}

export interface DealFilter {
  buyerId?: string;
  sellerId?: string;
  buyerSeatId?: string;
  sellerSeatId?: string;
  type?: DealType;
  status?: DealStatus;
  startTime?: Date;
  endTime?: Date;
  page?: number;
  limit?: number;
}

export class DealService {
  /**
   * Create a new deal
   */
  async createDeal(input: CreateDealInput): Promise<IDeal> {
    const dealId = input.dealId || `deal_${uuidv4()}`;

    logger.info('Creating deal', {
      dealId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      type: input.type
    });

    try {
      const deal = new Deal({
        dealId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        currency: input.currency || 'USD',
        type: input.type,
        status: input.requiresApproval ? 'pending' : 'active',
        basePriceCpm: input.basePriceCpm,
        minimumPriceCpm: input.minimumPriceCpm,
        maximumPriceCpm: input.maximumPriceCpm,
        priceModel: input.priceModel || 'cpm',
        impressionLimit: input.impressionLimit,
        clickLimit: input.clickLimit,
        conversionLimit: input.conversionLimit,
        budgetLimit: input.budgetLimit,
        targeting: input.targeting,
        startTime: input.startTime,
        endTime: input.endTime,
        buyerSeatId: input.buyerSeatId,
        sellerSeatId: input.sellerSeatId,
        requiresApproval: input.requiresApproval || false,
        name: input.name,
        description: input.description,
        externalDealId: input.externalDealId,
        ext: input.ext
      });

      await deal.save();

      // Update gauge
      await this.updateActiveDealsGauge();

      logger.info('Deal created successfully', { dealId });

      return deal;
    } catch (error) {
      logger.error('Failed to create deal', {
        dealId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get deal by ID
   */
  async getDeal(dealId: string): Promise<IDeal | null> {
    return Deal.findOne({ dealId }).exec();
  }

  /**
   * Get deal by external ID
   */
  async getDealByExternalId(externalDealId: string): Promise<IDeal | null> {
    return Deal.findOne({ externalDealId }).exec();
  }

  /**
   * List deals with filtering and pagination
   */
  async listDeals(filter: DealFilter): Promise<{
    deals: IDeal[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.buyerId) query.buyerId = filter.buyerId;
    if (filter.sellerId) query.sellerId = filter.sellerId;
    if (filter.buyerSeatId) query.buyerSeatId = filter.buyerSeatId;
    if (filter.sellerSeatId) query.sellerSeatId = filter.sellerSeatId;
    if (filter.type) query.type = filter.type;
    if (filter.status) query.status = filter.status;

    if (filter.startTime || filter.endTime) {
      query.startTime = {};
      if (filter.startTime) (query.startTime as Record<string, Date>).$gte = filter.startTime;
      if (filter.endTime) (query.startTime as Record<string, Date>).$lte = filter.endTime;
    }

    const [deals, total] = await Promise.all([
      Deal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Deal.countDocuments(query)
    ]);

    return {
      deals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update deal
   */
  async updateDeal(dealId: string, input: UpdateDealInput): Promise<IDeal | null> {
    logger.info('Updating deal', { dealId, updates: Object.keys(input) });

    const updateData: Record<string, unknown> = {};

    if (input.status !== undefined) updateData.status = input.status;
    if (input.basePriceCpm !== undefined) updateData.basePriceCpm = input.basePriceCpm;
    if (input.minimumPriceCpm !== undefined) updateData.minimumPriceCpm = input.minimumPriceCpm;
    if (input.maximumPriceCpm !== undefined) updateData.maximumPriceCpm = input.maximumPriceCpm;
    if (input.targeting !== undefined) updateData.targeting = input.targeting;
    if (input.startTime !== undefined) updateData.startTime = input.startTime;
    if (input.endTime !== undefined) updateData.endTime = input.endTime;
    if (input.impressionLimit !== undefined) updateData.impressionLimit = input.impressionLimit;
    if (input.clickLimit !== undefined) updateData.clickLimit = input.clickLimit;
    if (input.conversionLimit !== undefined) updateData.conversionLimit = input.conversionLimit;
    if (input.budgetLimit !== undefined) updateData.budgetLimit = input.budgetLimit;
    if (input.requiresApproval !== undefined) updateData.requiresApproval = input.requiresApproval;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.ext !== undefined) updateData.ext = input.ext;

    const deal = await Deal.findOneAndUpdate(
      { dealId },
      { $set: updateData },
      { new: true }
    ).exec();

    if (deal) {
      await this.updateActiveDealsGauge();
    }

    return deal;
  }

  /**
   * Approve deal
   */
  async approveDeal(dealId: string, approvedBy: string): Promise<IDeal | null> {
    logger.info('Approving deal', { dealId, approvedBy });

    return Deal.findOneAndUpdate(
      { dealId, status: 'pending' },
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
   * Pause deal
   */
  async pauseDeal(dealId: string): Promise<IDeal | null> {
    logger.info('Pausing deal', { dealId });

    const deal = await Deal.findOneAndUpdate(
      { dealId, status: 'active' },
      { $set: { status: 'paused' } },
      { new: true }
    ).exec();

    if (deal) {
      await this.updateActiveDealsGauge();
    }

    return deal;
  }

  /**
   * Resume paused deal
   */
  async resumeDeal(dealId: string): Promise<IDeal | null> {
    logger.info('Resuming deal', { dealId });

    const deal = await Deal.findOneAndUpdate(
      { dealId, status: 'paused' },
      { $set: { status: 'active' } },
      { new: true }
    ).exec();

    if (deal) {
      await this.updateActiveDealsGauge();
    }

    return deal;
  }

  /**
   * Expire deal
   */
  async expireDeal(dealId: string): Promise<IDeal | null> {
    logger.info('Expiring deal', { dealId });

    const deal = await Deal.findOneAndUpdate(
      { dealId, status: { $in: ['active', 'paused'] } },
      { $set: { status: 'expired' } },
      { new: true }
    ).exec();

    if (deal) {
      await this.updateActiveDealsGauge();
    }

    return deal;
  }

  /**
   * Record impression for deal
   */
  async recordImpression(dealId: string, cpm: number): Promise<void> {
    await Deal.updateOne(
      { dealId },
      {
        $inc: {
          impressionsServed: 1,
          spentAmount: cpm / 1000
        },
        $set: { averageCpm: cpm }
      }
    );

    // Check if limit reached
    const deal = await Deal.findOne({ dealId }).exec();
    if (deal) {
      if (deal.impressionLimit && deal.impressionsServed >= deal.impressionLimit) {
        await this.expireDeal(dealId);
      } else if (deal.budgetLimit && (deal.spentAmount || 0) >= deal.budgetLimit) {
        await this.expireDeal(dealId);
      }
    }
  }

  /**
   * Record click for deal
   */
  async recordClick(dealId: string): Promise<void> {
    await Deal.updateOne(
      { dealId },
      { $inc: { clicksCount: 1 } }
    );
  }

  /**
   * Record conversion for deal
   */
  async recordConversion(dealId: string, revenue: number): Promise<void> {
    await Deal.updateOne(
      { dealId },
      {
        $inc: {
          conversionsCount: 1,
          totalRevenue: revenue
        }
      }
    );
  }

  /**
   * Get eligible deals for a bid request
   */
  async getEligibleDeals(params: {
    buyerId: string;
    sellerId?: string;
    inventoryId?: string;
    country?: string;
    deviceType?: number;
  }): Promise<IDeal[]> {
    const now = new Date();

    const query: Record<string, unknown> = {
      buyerId: params.buyerId,
      status: 'active'
    };

    // Add time-based conditions
    query.$and = [
      { $or: [{ startTime: { $lte: now } }, { startTime: null }] },
      { $or: [{ endTime: { $gte: now } }, { endTime: null }] }
    ];

    if (params.sellerId) query.sellerId = params.sellerId;

    const deals = await Deal.find(query).exec();

    // Filter by targeting criteria
    return deals.filter(deal => {
      const targeting = deal.targeting;
      if (!targeting) return true;

      // Check inventory targeting
      if (targeting.inventoryIds?.length && params.inventoryId) {
        if (!targeting.inventoryIds.includes(params.inventoryId)) return false;
      }
      if (targeting.excludedInventoryIds?.length && params.inventoryId) {
        if (targeting.excludedInventoryIds.includes(params.inventoryId)) return false;
      }

      // Check geo targeting
      if (targeting.countries?.length && params.country) {
        if (!targeting.countries.includes(params.country)) return false;
      }

      // Check device targeting
      if (targeting.deviceTypes?.length && params.deviceType !== undefined) {
        if (!targeting.deviceTypes.includes(params.deviceType)) return false;
      }

      return true;
    });
  }

  /**
   * Get deal statistics
   */
  async getDealStats(): Promise<{
    totalDeals: number;
    activeDeals: number;
    pausedDeals: number;
    pendingDeals: number;
    expiredDeals: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    averageCpm: number;
    dealTypeBreakdown: Record<string, number>;
  }> {
    const [stats, typeBreakdown] = await Promise.all([
      Deal.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            impressions: { $sum: '$impressionsServed' },
            clicks: { $sum: '$clicksCount' },
            conversions: { $sum: '$conversionsCount' },
            revenue: { $sum: '$totalRevenue' },
            avgCpm: { $avg: '$averageCpm' }
          }
        }
      ]),
      Deal.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const statusCounts = Object.fromEntries(stats.map(s => [s._id, s.count])) as Record<string, number>;
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
      totalDeals: Object.values(statusCounts).reduce((a: number, b: number) => a + b, 0),
      activeDeals: statusCounts.active || 0,
      pausedDeals: statusCounts.paused || 0,
      pendingDeals: statusCounts.pending || 0,
      expiredDeals: statusCounts.expired || 0,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      totalRevenue: totals.revenue,
      averageCpm: totals.impressions > 0 ? totals.revenue / totals.impressions * 1000 : 0,
      dealTypeBreakdown: Object.fromEntries(typeBreakdown.map(t => [t._id, t.count])) as Record<string, number>
    };
  }

  /**
   * Update the active deals gauge metric
   */
  private async updateActiveDealsGauge(): Promise<void> {
    const activeCount = await Deal.countDocuments({ status: 'active' });
    activeDealsGauge.set(activeCount);
  }
}

export const dealService = new DealService();
export default dealService;