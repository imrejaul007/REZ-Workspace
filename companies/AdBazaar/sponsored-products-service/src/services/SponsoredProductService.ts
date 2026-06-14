import { v4 as uuidv4 } from 'uuid';
import { SponsoredProduct, SponsoredProductDocument } from '../models';
import {
  CreateSponsoredProductDTO,
  UpdateSponsoredProductDTO,
  PlaceBidDTO,
  SearchProductsDTO,
  Performance,
  PaginatedResponse,
  BidStrategy,
} from '../types';
import { AppError } from '../middleware/errorHandler';
import { redisClient } from '../config/database';

export class SponsoredProductService {
  /**
   * Create a new sponsored product
   */
  async create(dto: CreateSponsoredProductDTO, merchantId: string): Promise<SponsoredProductDocument> {
    const sponsoredId = `SPON-${uuidv4().substring(0, 8).toUpperCase()}`;

    const sponsoredProduct = new SponsoredProduct({
      sponsoredId,
      campaignId: dto.campaignId,
      merchantId,
      productId: dto.productId,
      product: dto.product,
      bid: {
        ...dto.bid,
      },
      budget: {
        ...dto.budget,
        spent: 0,
      },
      targeting: dto.targeting || {
        keywords: [],
        categoryMatch: false,
      },
      performance: {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        orders: 0,
        revenue: 0,
        acos: 0,
        searchRank: 0,
      },
      status: 'active',
    });

    const saved = await sponsoredProduct.save();

    // Cache in Redis
    await this.cacheProduct(saved);

    return saved;
  }

  /**
   * Get sponsored product by ID
   */
  async getById(sponsoredId: string, merchantId?: string): Promise<SponsoredProductDocument | null> {
    // Try cache first
    const cached = await redisClient.get(`sponsored:${sponsoredId}`);
    if (cached) {
      const product = JSON.parse(cached);
      if (!merchantId || product.merchantId === merchantId) {
        return product as SponsoredProductDocument;
      }
    }

    const query: Record<string, string> = { sponsoredId };
    if (merchantId) {
      query.merchantId = merchantId;
    }

    return SponsoredProduct.findOne(query);
  }

  /**
   * List sponsored products for a merchant
   */
  async listByMerchant(
    merchantId: string,
    options: {
      status?: string;
      campaignId?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<SponsoredProductDocument>> {
    const { status, campaignId, page = 1, limit = 20 } = options;

    const query: Record<string, string> = { merchantId };
    if (status) query.status = status;
    if (campaignId) query.campaignId = campaignId;

    const [products, total] = await Promise.all([
      SponsoredProduct.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      SponsoredProduct.countDocuments(query),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update sponsored product
   */
  async update(
    sponsoredId: string,
    dto: UpdateSponsoredProductDTO,
    merchantId: string
  ): Promise<SponsoredProductDocument> {
    const product = await SponsoredProduct.findOne({ sponsoredId, merchantId });

    if (!product) {
      throw new AppError('Sponsored product not found', 404, 'SPONSORED_NOT_FOUND');
    }

    // Update fields
    if (dto.bid) {
      if (dto.bid.amount !== undefined) product.bid.amount = dto.bid.amount;
      if (dto.bid.strategy !== undefined) product.bid.strategy = dto.bid.strategy;
      if (dto.bid.maxBid !== undefined) product.bid.maxBid = dto.bid.maxBid;
    }

    if (dto.budget) {
      if (dto.budget.daily !== undefined) product.budget.daily = dto.budget.daily;
      if (dto.budget.total !== undefined) product.budget.total = dto.budget.total;
      if (dto.budget.spent !== undefined) product.budget.spent = dto.budget.spent;
    }

    if (dto.targeting) {
      if (dto.targeting.keywords !== undefined) product.targeting.keywords = dto.targeting.keywords;
      if (dto.targeting.categoryMatch !== undefined) product.targeting.categoryMatch = dto.targeting.categoryMatch;
      if (dto.targeting.priceRange !== undefined) product.targeting.priceRange = dto.targeting.priceRange;
    }

    if (dto.status) {
      product.status = dto.status;
    }

    const updated = await product.save();

    // Update cache
    await this.cacheProduct(updated);

    return updated;
  }

  /**
   * Delete sponsored product
   */
  async delete(sponsoredId: string, merchantId: string): Promise<boolean> {
    const result = await SponsoredProduct.findOneAndDelete({ sponsoredId, merchantId });

    if (result) {
      // Remove from cache
      await redisClient.del(`sponsored:${sponsoredId}`);
      return true;
    }

    return false;
  }

  /**
   * Place a bid for product placement
   */
  async placeBid(dto: PlaceBidDTO, merchantId: string): Promise<SponsoredProductDocument> {
    const product = await SponsoredProduct.findOne({
      sponsoredId: dto.sponsoredId,
      merchantId,
    });

    if (!product) {
      throw new AppError('Sponsored product not found', 404, 'SPONSORED_NOT_FOUND');
    }

    if (product.status !== 'active') {
      throw new AppError('Cannot place bid on inactive sponsored product', 400, 'INVALID_STATUS');
    }

    // Check budget
    if (product.budget.spent >= product.budget.total) {
      product.status = 'outbid';
      await product.save();
      throw new AppError('Budget exhausted', 400, 'BUDGET_EXHAUSTED');
    }

    // Validate bid amount
    const bidAmount = dto.amount;
    const maxBid = dto.maxBid || product.bid.maxBid;

    if (bidAmount > maxBid) {
      throw new AppError(`Bid amount exceeds maximum bid of ${maxBid}`, 400, 'BID_EXCEEDS_MAX');
    }

    // Update bid
    product.bid.amount = bidAmount;
    if (dto.maxBid) {
      product.bid.maxBid = dto.maxBid;
    }

    const updated = await product.save();

    // Update cache
    await this.cacheProduct(updated);

    // Log bid event
    await this.logBidEvent(dto.sponsoredId, bidAmount, 'placed');

    return updated;
  }

  /**
   * Search sponsored products
   */
  async search(dto: SearchProductsDTO): Promise<PaginatedResponse<SponsoredProductDocument>> {
    const { query, category, minPrice, maxPrice, merchantId, status, page = 1, limit = 20 } = dto;

    const searchQuery: Record<string, unknown> = {};

    if (query) {
      searchQuery.$text = { $search: query };
    }

    if (category) {
      searchQuery['product.category'] = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      searchQuery['product.price'] = {};
      if (minPrice !== undefined) {
        (searchQuery['product.price'] as Record<string, number>).$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (searchQuery['product.price'] as Record<string, number>).$lte = maxPrice;
      }
    }

    if (merchantId) {
      searchQuery.merchantId = merchantId;
    }

    searchQuery.status = status || 'active';

    const [products, total] = await Promise.all([
      SponsoredProduct.find(searchQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ 'performance.searchRank': 1, 'performance.ctr': -1 }),
      SponsoredProduct.countDocuments(searchQuery),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get performance metrics for a sponsored product
   */
  async getPerformance(
    sponsoredId: string,
    merchantId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      groupBy?: 'day' | 'week' | 'month';
    } = {}
  ): Promise<{
    current: Performance;
    history: Array<{
      period: string;
      impressions: number;
      clicks: number;
      orders: number;
      revenue: number;
      acos: number;
    }>;
    summary: {
      totalImpressions: number;
      totalClicks: number;
      totalOrders: number;
      totalRevenue: number;
      avgCtr: number;
      avgAcos: number;
    };
  }> {
    const product = await SponsoredProduct.findOne({ sponsoredId, merchantId });

    if (!product) {
      throw new AppError('Sponsored product not found', 404, 'SPONSORED_NOT_FOUND');
    }

    // Current performance
    const current: Performance = {
      impressions: product.performance.impressions,
      clicks: product.performance.clicks,
      ctr: product.performance.ctr,
      orders: product.performance.orders,
      revenue: product.performance.revenue,
      acos: product.performance.acos,
      searchRank: product.performance.searchRank,
    };

    // For now, return current metrics
    // In production, you'd aggregate historical data from a performance history collection
    const history: Array<{
      period: string;
      impressions: number;
      clicks: number;
      orders: number;
      revenue: number;
      acos: number;
    }> = [];

    const summary = {
      totalImpressions: current.impressions,
      totalClicks: current.clicks,
      totalOrders: current.orders,
      totalRevenue: current.revenue,
      avgCtr: current.ctr,
      avgAcos: current.acos,
    };

    return { current, history, summary };
  }

  /**
   * Update performance metrics
   */
  async updatePerformance(
    sponsoredId: string,
    metrics: Partial<Performance>
  ): Promise<SponsoredProductDocument> {
    const product = await SponsoredProduct.findOne({ sponsoredId });

    if (!product) {
      throw new AppError('Sponsored product not found', 404, 'SPONSORED_NOT_FOUND');
    }

    // Update metrics
    if (metrics.impressions !== undefined) product.performance.impressions = metrics.impressions;
    if (metrics.clicks !== undefined) product.performance.clicks = metrics.clicks;
    if (metrics.orders !== undefined) product.performance.orders = metrics.orders;
    if (metrics.revenue !== undefined) product.performance.revenue = metrics.revenue;
    if (metrics.searchRank !== undefined) product.performance.searchRank = metrics.searchRank;

    // Recalculate derived metrics
    if (product.performance.impressions > 0) {
      product.performance.ctr = (product.performance.clicks / product.performance.impressions) * 100;
    }

    if (product.performance.revenue > 0) {
      const totalSpend = product.bid.amount * product.performance.clicks;
      product.performance.acos = (totalSpend / product.performance.revenue) * 100;
    }

    const updated = await product.save();

    // Update cache
    await this.cacheProduct(updated);

    return updated;
  }

  /**
   * Auto-bidding: Adjust bid based on performance
   */
  async autoBid(sponsoredId: string): Promise<SponsoredProductDocument> {
    const product = await SponsoredProduct.findOne({ sponsoredId });

    if (!product) {
      throw new AppError('Sponsored product not found', 404, 'SPONSORED_NOT_FOUND');
    }

    if (product.bid.strategy !== 'auto') {
      throw new AppError('Auto-bidding is only available for products with auto strategy', 400, 'INVALID_STRATEGY');
    }

    // Simple auto-bid logic: increase bid if ACOS is low, decrease if high
    const targetAcos = 25; // Target 25% ACOS
    const currentAcos = product.performance.acos;
    const currentBid = product.bid.amount;
    const maxBid = product.bid.maxBid;

    let newBid = currentBid;

    if (currentAcos < targetAcos && currentAcos > 0) {
      // ACOS is good, can increase bid slightly
      newBid = Math.min(currentBid * 1.1, maxBid);
    } else if (currentAcos > targetAcos * 1.5) {
      // ACOS is too high, reduce bid
      newBid = currentBid * 0.9;
    }

    if (newBid !== currentBid) {
      product.bid.amount = newBid;
      await product.save();
      await this.cacheProduct(product);
      await this.logBidEvent(sponsoredId, newBid, 'adjusted');
    }

    return product;
  }

  /**
   * Check for outbid products and update status
   */
  async checkOutbidProducts(): Promise<number> {
    // Find products with exhausted budget
    const outbidProducts = await SponsoredProduct.find({
      $expr: { $gte: ['$budget.spent', '$budget.total'] },
      status: 'active',
    });

    for (const product of outbidProducts) {
      product.status = 'outbid';
      await product.save();
      await this.cacheProduct(product);
    }

    return outbidProducts.length;
  }

  /**
   * Cache product in Redis
   */
  private async cacheProduct(product: SponsoredProductDocument): Promise<void> {
    try {
      await redisClient.setEx(
        `sponsored:${product.sponsoredId}`,
        300, // 5 minutes TTL
        JSON.stringify(product.toObject())
      );
    } catch (error) {
      logger.error('Failed to cache product:', error);
    }
  }

  /**
   * Log bid event to Redis
   */
  private async logBidEvent(sponsoredId: string, amount: number, status: string): Promise<void> {
    try {
      const event = {
        sponsoredId,
        amount,
        status,
        timestamp: new Date().toISOString(),
      };

      await redisClient.lPush(`bid_events:${sponsoredId}`, JSON.stringify(event));
      await redisClient.lTrim(`bid_events:${sponsoredId}`, 0, 99); // Keep last 100 events
    } catch (error) {
      logger.error('Failed to log bid event:', error);
    }
  }

  /**
   * Get products by campaign
   */
  async getByCampaign(campaignId: string, merchantId?: string): Promise<SponsoredProductDocument[]> {
    const query: Record<string, string> = { campaignId };
    if (merchantId) {
      query.merchantId = merchantId;
    }
    return SponsoredProduct.find(query).sort({ 'performance.searchRank': 1 });
  }

  /**
   * Get top performing products
   */
  async getTopPerforming(limit: number = 10): Promise<SponsoredProductDocument[]> {
    return SponsoredProduct.find({ status: 'active' })
      .sort({ 'performance.ctr': -1, 'performance.orders': -1 })
      .limit(limit);
  }
}

export const sponsoredProductService = new SponsoredProductService();