import { v4 as uuidv4 } from 'uuid';
import {
  PrivateDeal,
  DealStatus,
  DealType,
  DealFilter,
  PaginationParams,
  ListResponse,
} from '../types/index.js';
import { PrivateDealModel, IPrivateDealDocument } from '../models/index.js';
import { getRedisClient } from './database.js';
import { config } from '../config/index.js';

export class DealService {
  private redis = getRedisClient();

  /**
   * Create a new private deal
   */
  async createDeal(data: Omit<PrivateDeal, 'dealId' | 'createdAt' | 'updatedAt'>): Promise<PrivateDeal> {
    const deal: Omit<PrivateDeal, 'createdAt' | 'updatedAt'> & { _id?: string } = {
      ...data,
      dealId: data.dealId || `deal-${uuidv4()}`,
    };

    const doc = new PrivateDealModel(deal);
    const saved = await doc.save();

    // Invalidate deal cache
    await this.invalidateDealCache();

    return saved.toObject() as PrivateDeal;
  }

  /**
   * Get a deal by ID
   */
  async getDealById(dealId: string): Promise<PrivateDeal | null> {
    // Check cache first
    const cacheKey = `deal:${dealId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const doc = await PrivateDealModel.findOne({ dealId });
    if (doc) {
      const deal = doc.toObject() as PrivateDeal;
      await this.redis.setex(
        cacheKey,
        config.redis.ttl.dealCache,
        JSON.stringify(deal)
      );
      return deal;
    }

    return null;
  }

  /**
   * List deals with filtering and pagination
   */
  async listDeals(
    filter: DealFilter,
    pagination: PaginationParams
  ): Promise<ListResponse<PrivateDeal>> {
    const query: Record<string, unknown> = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.advertiserId) {
      query.advertiserId = filter.advertiserId;
    }

    if (filter.publisherId) {
      query.publisherId = filter.publisherId;
    }

    if (filter.startDate || filter.endDate) {
      query.startDate = {};
      if (filter.startDate) {
        (query.startDate as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.startDate as Record<string, Date>).$lte = filter.endDate;
      }
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { dealId: { $regex: filter.search, $options: 'i' } },
        { advertiserName: { $regex: filter.search, $options: 'i' } },
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
      PrivateDealModel.find(query).sort(sort).skip(skip).limit(pagination.limit).lean(),
      PrivateDealModel.countDocuments(query),
    ]);

    return {
      items: items as PrivateDeal[],
      total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Update a deal
   */
  async updateDeal(
    dealId: string,
    data: Partial<PrivateDeal>,
    updatedBy: string
  ): Promise<PrivateDeal | null> {
    const doc = await PrivateDealModel.findOneAndUpdate(
      { dealId },
      { ...data, updatedBy },
      { new: true, runValidators: true }
    );

    if (doc) {
      // Invalidate cache
      await this.invalidateDealCache(dealId);
      return doc.toObject() as PrivateDeal;
    }

    return null;
  }

  /**
   * Update deal status
   */
  async updateDealStatus(
    dealId: string,
    status: DealStatus,
    updatedBy: string
  ): Promise<PrivateDeal | null> {
    return this.updateDeal(dealId, { status }, updatedBy);
  }

  /**
   * Delete a deal (soft delete by setting status)
   */
  async deleteDeal(dealId: string, updatedBy: string): Promise<boolean> {
    const result = await PrivateDealModel.updateOne(
      { dealId },
      { status: DealStatus.EXPIRED, updatedBy }
    );

    if (result.modifiedCount > 0) {
      await this.invalidateDealCache(dealId);
      return true;
    }

    return false;
  }

  /**
   * Get active deals for a publisher
   */
  async getActiveDealsForPublisher(publisherId: string): Promise<PrivateDeal[]> {
    const now = new Date();
    const docs = await PrivateDealModel.find({
      publisherId,
      status: DealStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ priority: -1, floorPrice: -1 })
      .lean();

    return docs as PrivateDeal[];
  }

  /**
   * Check if a deal exists and is valid
   */
  async isDealValid(dealId: string): Promise<boolean> {
    const deal = await this.getDealById(dealId);
    if (!deal) return false;

    const now = new Date();
    return (
      deal.status === DealStatus.ACTIVE &&
      deal.startDate <= now &&
      deal.endDate >= now
    );
  }

  /**
   * Get deals by advertiser
   */
  async getDealsByAdvertiser(advertiserId: string): Promise<PrivateDeal[]> {
    const docs = await PrivateDealModel.find({
      advertiserId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return docs as PrivateDeal[];
  }

  /**
   * Increment impressions delivered
   */
  async incrementImpressionsDelivered(dealId: string, count: number = 1): Promise<void> {
    await PrivateDealModel.updateOne(
      { dealId },
      { $inc: { impressionsDelivered: count } }
    );
    await this.invalidateDealCache(dealId);
  }

  /**
   * Update budget spent
   */
  async updateBudgetSpent(dealId: string, amount: number): Promise<void> {
    await PrivateDealModel.updateOne(
      { dealId },
      { $inc: { budgetSpent: amount } }
    );
    await this.invalidateDealCache(dealId);
  }

  /**
   * Invalidate deal cache
   */
  private async invalidateDealCache(dealId?: string): Promise<void> {
    if (dealId) {
      await this.redis.del(`deal:${dealId}`);
    }
    // Clear all deal list caches (simplified - in production use cache tags)
    const keys = await this.redis.keys('deal:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Singleton instance
let dealService: DealService | null = null;

export function getDealService(): DealService {
  if (!dealService) {
    dealService = new DealService();
  }
  return dealService;
}