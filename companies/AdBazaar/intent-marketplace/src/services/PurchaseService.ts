import { v4 as uuidv4 } from 'uuid';
import { SegmentPurchase, SegmentListing } from '../models/index.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { pricingEngine } from './PricingEngine.js';
import type { ISegmentPurchase, PurchaseRequest, PurchaseStatus, DeliveryMetrics } from '../types.js';

const PURCHASE_CACHE_TTL = 60; // 1 minute

export class PurchaseService {
  /**
   * Purchase segment access
   */
  async purchaseSegment(
    advertiserId: string,
    request: PurchaseRequest
  ): Promise<ISegmentPurchase> {
    const { segmentId, campaignId, durationDays, budget } = request;

    // Get segment details
    const segment = await SegmentListing.findOne({ segmentId, status: 'active' }).lean();
    if (!segment) {
      throw new Error(`Segment not found: ${segmentId}`);
    }

    // Calculate price
    const priceQuote = await pricingEngine.calculatePrice(segmentId, {
      durationDays,
      budget,
    });

    if (!priceQuote) {
      throw new Error(`Unable to calculate price for segment: ${segmentId}`);
    }

    // Validate budget
    if (budget < priceQuote.finalPrice) {
      throw new Error(`Budget ${budget} is less than required price ${priceQuote.finalPrice}`);
    }

    const purchaseId = uuidv4();
    const currency = process.env.DEFAULT_CURRENCY || 'INR';
    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const purchase = new SegmentPurchase({
      purchaseId,
      segmentId,
      advertiserId,
      campaignId,
      userCount: segment.userCount,
      pricePerUnit: priceQuote.finalPrice,
      totalCost: priceQuote.finalPrice,
      currency,
      startDate,
      endDate,
      status: 'active',
      deliveryMetrics: {
        impressions: 0,
        uniqueUsersReached: 0,
        ctr: 0,
        conversions: 0,
        attributedRevenue: 0,
        roi: 0,
      },
    });

    await purchase.save();
    logger.info('Segment purchased', {
      purchaseId,
      segmentId,
      advertiserId,
      totalCost: priceQuote.finalPrice,
    });

    return purchase.toObject();
  }

  /**
   * Get purchase by ID
   */
  async getPurchaseById(purchaseId: string): Promise<ISegmentPurchase | null> {
    const cacheKey = `purchase:${purchaseId}`;
    const cached = await cacheGet<ISegmentPurchase>(cacheKey);
    if (cached) return cached;

    const purchase = await SegmentPurchase.findOne({ purchaseId }).lean();
    if (purchase) {
      await cacheSet(cacheKey, purchase as ISegmentPurchase, PURCHASE_CACHE_TTL);
    }

    return purchase as ISegmentPurchase | null;
  }

  /**
   * List purchases for an advertiser
   */
  async listPurchases(
    advertiserId: string,
    options: {
      status?: PurchaseStatus;
      segmentId?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ purchases: ISegmentPurchase[]; total: number }> {
    const { status, segmentId, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { advertiserId };
    if (status) filter.status = status;
    if (segmentId) filter.segmentId = segmentId;

    const [purchases, total] = await Promise.all([
      SegmentPurchase.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SegmentPurchase.countDocuments(filter),
    ]);

    return {
      purchases: purchases as ISegmentPurchase[],
      total,
    };
  }

  /**
   * Update purchase status
   */
  async updatePurchaseStatus(
    purchaseId: string,
    status: PurchaseStatus
  ): Promise<ISegmentPurchase | null> {
    const purchase = await SegmentPurchase.findOneAndUpdate(
      { purchaseId },
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();

    if (purchase) {
      await cacheDelete(`purchase:${purchaseId}`);
      logger.info('Purchase status updated', { purchaseId, status });
    }

    return purchase as ISegmentPurchase | null;
  }

  /**
   * Pause purchase
   */
  async pausePurchase(purchaseId: string): Promise<ISegmentPurchase | null> {
    return this.updatePurchaseStatus(purchaseId, 'paused');
  }

  /**
   * Resume purchase
   */
  async resumePurchase(purchaseId: string): Promise<ISegmentPurchase | null> {
    return this.updatePurchaseStatus(purchaseId, 'active');
  }

  /**
   * Complete purchase
   */
  async completePurchase(purchaseId: string): Promise<ISegmentPurchase | null> {
    return this.updatePurchaseStatus(purchaseId, 'completed');
  }

  /**
   * Update purchase metrics
   */
  async updatePurchaseMetrics(
    purchaseId: string,
    metrics: Partial<DeliveryMetrics>
  ): Promise<ISegmentPurchase | null> {
    const purchase = await SegmentPurchase.findOne({ purchaseId });
    if (!purchase) return null;

    const currentMetrics = purchase.deliveryMetrics || {
      impressions: 0,
      uniqueUsersReached: 0,
      ctr: 0,
      conversions: 0,
      attributedRevenue: 0,
      roi: 0,
    };

    const newMetrics: DeliveryMetrics = {
      ...currentMetrics,
      ...metrics,
    };

    // Recalculate CTR
    if (newMetrics.impressions > 0 && newMetrics.conversions > 0) {
      newMetrics.ctr = (newMetrics.conversions / newMetrics.impressions) * 100;
    }

    // Recalculate ROI
    if (purchase.totalCost > 0) {
      newMetrics.roi = (newMetrics.attributedRevenue - purchase.totalCost) / purchase.totalCost;
    }

    purchase.deliveryMetrics = newMetrics;
    await purchase.save();

    await cacheDelete(`purchase:${purchaseId}`);
    logger.info('Purchase metrics updated', { purchaseId });

    return purchase.toObject();
  }

  /**
   * Get purchase analytics
   */
  async getPurchaseAnalytics(purchaseId: string): Promise<{
    purchase: ISegmentPurchase;
    performance: {
      deliveryRate: number;
      conversionRate: number;
      costPerConversion: number;
      roas: number;
    };
    progress: {
      daysElapsed: number;
      daysRemaining: number;
      percentComplete: number;
    };
  } | null> {
    const purchase = await this.getPurchaseById(purchaseId);
    if (!purchase) return null;

    const metrics = purchase.deliveryMetrics || {
      impressions: 0,
      uniqueUsersReached: 0,
      ctr: 0,
      conversions: 0,
      attributedRevenue: 0,
      roi: 0,
    };

    const totalDuration = purchase.endDate.getTime() - purchase.startDate.getTime();
    const elapsed = Date.now() - purchase.startDate.getTime();
    const daysElapsed = Math.floor(elapsed / (24 * 60 * 60 * 1000));
    const daysRemaining = Math.max(
      0,
      Math.ceil((purchase.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    );
    const percentComplete = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

    const deliveryRate = purchase.userCount > 0
      ? (metrics.uniqueUsersReached / purchase.userCount) * 100
      : 0;
    const conversionRate = purchase.userCount > 0
      ? (metrics.conversions / purchase.userCount) * 100
      : 0;
    const costPerConversion = metrics.conversions > 0
      ? purchase.totalCost / metrics.conversions
      : 0;
    const roas = purchase.totalCost > 0
      ? metrics.attributedRevenue / purchase.totalCost
      : 0;

    return {
      purchase,
      performance: {
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        costPerConversion: Math.round(costPerConversion * 100) / 100,
        roas: Math.round(roas * 100) / 100,
      },
      progress: {
        daysElapsed,
        daysRemaining,
        percentComplete: Math.round(percentComplete * 100) / 100,
      },
    };
  }

  /**
   * Check and complete expired purchases
   */
  async checkExpiredPurchases(): Promise<number> {
    const result = await SegmentPurchase.updateMany(
      {
        status: 'active',
        endDate: { $lt: new Date() },
      },
      { $set: { status: 'completed' } }
    );

    if (result.modifiedCount > 0) {
      logger.info('Expired purchases completed', { count: result.modifiedCount });
    }

    return result.modifiedCount;
  }

  /**
   * Get advertiser's purchase history
   */
  async getPurchaseHistory(
    advertiserId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<{
    purchases: ISegmentPurchase[];
    totalSpent: number;
    totalConversions: number;
    avgROI: number;
  }> {
    const { startDate, endDate, limit = 50 } = options;

    const filter: Record<string, unknown> = { advertiserId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as Record<string, Date>).$gte = startDate;
      if (endDate) (filter.createdAt as Record<string, Date>).$lte = endDate;
    }

    const purchases = await SegmentPurchase.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const totals = purchases.reduce(
      (acc, p) => {
        acc.totalSpent += p.totalCost;
        acc.totalConversions += p.deliveryMetrics?.conversions || 0;
        acc.roiSum += p.deliveryMetrics?.roi || 0;
        acc.roiCount += p.deliveryMetrics?.roi ? 1 : 0;
        return acc;
      },
      { totalSpent: 0, totalConversions: 0, roiSum: 0, roiCount: 0 }
    );

    return {
      purchases: purchases as ISegmentPurchase[],
      totalSpent: Math.round(totals.totalSpent * 100) / 100,
      totalConversions: totals.totalConversions,
      avgROI: totals.roiCount > 0 ? Math.round((totals.roiSum / totals.roiCount) * 100) / 100 : 0,
    };
  }
}

export const purchaseService = new PurchaseService();
