import { SegmentListing } from '../models/index.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import { logger } from '../config/logger.js';
import type { ISegmentListing, PricingModel, DeliveryMetrics } from '../types.js';

const PRICING_CACHE_TTL = 60; // 1 minute

export interface PriceQuote {
  segmentId: string;
  basePrice: number;
  finalPrice: number;
  pricingModel: PricingModel;
  currency: string;
  breakdown: {
    basePrice: number;
    qualityAdjustment: number;
    demandMultiplier: number;
    durationDiscount: number;
  };
  estimatedReach: number;
  estimatedDelivery: number;
}

export class PricingEngine {
  private readonly defaultCurrency: string;
  private readonly defaultCPM: number;

  constructor() {
    this.defaultCurrency = process.env.DEFAULT_CURRENCY || 'INR';
    this.defaultCPM = parseFloat(process.env.DEFAULT_CPM || '0.50');
  }

  /**
   * Calculate price for a segment purchase
   */
  async calculatePrice(
    segmentId: string,
    options: {
      durationDays: number;
      targetReach?: number;
      budget?: number;
    }
  ): Promise<PriceQuote | null> {
    const { durationDays, targetReach, budget } = options;

    // Get segment
    const segment = await SegmentListing.findOne({ segmentId, status: 'active' }).lean();
    if (!segment) {
      logger.warn('Segment not found for pricing', { segmentId });
      return null;
    }

    // Calculate base price
    let basePrice = segment.price;

    // Quality adjustment (higher quality = higher price)
    const qualityAdjustment = this.calculateQualityAdjustment(segment.qualityScore);

    // Demand multiplier (based on recent activity)
    const demandMultiplier = await this.calculateDemandMultiplier(segmentId);

    // Duration discount (longer commitment = lower per-day cost)
    const durationDiscount = this.calculateDurationDiscount(durationDays);

    // Calculate final price
    const finalPrice = basePrice * qualityAdjustment * demandMultiplier * durationDiscount;

    // Calculate estimated reach
    const estimatedReach = targetReach || segment.userCount;
    const estimatedDelivery = this.estimateDelivery(segment, estimatedReach, durationDays);

    return {
      segmentId,
      basePrice: segment.price,
      finalPrice: Math.round(finalPrice * 100) / 100,
      pricingModel: segment.pricingModel,
      currency: this.defaultCurrency,
      breakdown: {
        basePrice: segment.price,
        qualityAdjustment,
        demandMultiplier,
        durationDiscount,
      },
      estimatedReach,
      estimatedDelivery,
    };
  }

  /**
   * Calculate quality adjustment factor
   */
  private calculateQualityAdjustment(qualityScore: number): number {
    // Quality score 0-100 maps to 0.8-1.5 multiplier
    return 0.8 + (qualityScore / 100) * 0.7;
  }

  /**
   * Calculate demand multiplier based on recent purchases/bids
   */
  private async calculateDemandMultiplier(segmentId: string): Promise<number> {
    const cacheKey = `pricing:demand:${segmentId}`;
    const cached = await cacheGet<number>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    // In production, this would look at recent purchase/bid activity
    // For now, return a base multiplier
    const multiplier = 1.0 + (Math.random() * 0.3); // 1.0 - 1.3

    await cacheSet(cacheKey, multiplier, PRICING_CACHE_TTL);
    return multiplier;
  }

  /**
   * Calculate duration discount
   */
  private calculateDurationDiscount(durationDays: number): number {
    if (durationDays <= 7) return 1.0;
    if (durationDays <= 14) return 0.95;
    if (durationDays <= 30) return 0.90;
    if (durationDays <= 60) return 0.85;
    if (durationDays <= 90) return 0.80;
    return 0.75; // Max discount for 90+ days
  }

  /**
   * Estimate delivery based on segment and duration
   */
  private estimateDelivery(segment: ISegmentListing, targetReach: number, durationDays: number): number {
    // Base delivery rate from conversion rate
    const baseDeliveryRate = segment.avgConversionRate / 100;

    // Adjust for duration (longer = more opportunity for delivery)
    const durationFactor = Math.min(durationDays / 30, 2); // Cap at 2x for 60+ days

    // Calculate estimated delivery percentage
    const estimatedDelivery = Math.min(baseDeliveryRate * durationFactor * 100, 95);

    return Math.round(estimatedDelivery * 100) / 100;
  }

  /**
   * Calculate RTB (Real-Time Bidding) price
   */
  async calculateRTBPrice(
    segmentId: string,
    options: {
      estimatedImpressions: number;
      currentWinningBid?: number;
    }
  ): Promise<{
    segmentId: string;
    estimatedCPM: number;
    totalCost: number;
    estimatedImpressions: number;
    floorPrice: number;
    recommendation: 'bid_higher' | 'bid_equal' | 'bid_lower' | 'skip';
  } | null> {
    const { estimatedImpressions, currentWinningBid } = options;

    const segment = await SegmentListing.findOne({ segmentId, status: 'active' }).lean();
    if (!segment) return null;

    // Floor price is the base CPM
    const floorPrice = segment.price;

    // If there's a current winning bid, recommend above it
    const recommendedBid = currentWinningBid
      ? Math.max(currentWinningBid * 1.1, floorPrice)
      : floorPrice;

    const estimatedCPM = recommendedBid;
    const totalCost = (estimatedCPM * estimatedImpressions) / 1000;

    let recommendation: 'bid_higher' | 'bid_equal' | 'bid_lower' | 'skip';
    if (!currentWinningBid) {
      recommendation = 'bid_equal';
    } else if (recommendedBid > currentWinningBid * 1.2) {
      recommendation = 'bid_higher';
    } else if (recommendedBid < currentWinningBid) {
      recommendation = 'bid_lower';
    } else {
      recommendation = 'bid_equal';
    }

    return {
      segmentId,
      estimatedCPM: Math.round(estimatedCPM * 1000) / 1000,
      totalCost: Math.round(totalCost * 100) / 100,
      estimatedImpressions,
      floorPrice,
      recommendation,
    };
  }

  /**
   * Get price comparison across segments
   */
  async comparePrices(
    segmentIds: string[],
    options: { durationDays: number }
  ): Promise<Array<PriceQuote & { rank: number }>> {
    const quotes = await Promise.all(
      segmentIds.map(async (segmentId) => {
        const quote = await this.calculatePrice(segmentId, { durationDays: options.durationDays });
        return quote ? { ...quote, rank: 0 } : null;
      })
    );

    // Filter and sort by final price
    const validQuotes = quotes
      .filter((q): q is PriceQuote & { rank: number } => q !== null)
      .sort((a, b) => a.finalPrice - b.finalPrice)
      .map((q, index) => ({ ...q, rank: index + 1 }));

    return validQuotes;
  }

  /**
   * Calculate ROI estimate for a segment purchase
   */
  async estimateROI(
    segmentId: string,
    options: {
      budget: number;
      durationDays: number;
    }
  ): Promise<{
    segmentId: string;
    estimatedROI: number;
    estimatedConversions: number;
    estimatedRevenue: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  } | null> {
    const { budget, durationDays } = options;

    const segment = await SegmentListing.findOne({ segmentId, status: 'active' }).lean();
    if (!segment) return null;

    // Calculate estimated conversions based on historical conversion rate
    const estimatedConversions = Math.floor((budget / segment.price) * (segment.avgConversionRate / 100));

    // Estimate revenue (assume avg order value of 500 INR)
    const avgOrderValue = 500;
    const estimatedRevenue = estimatedConversions * avgOrderValue;

    // Calculate ROI
    const estimatedROI = budget > 0 ? (estimatedRevenue - budget) / budget : 0;

    // Confidence based on how much historical data we have
    const confidence: 'high' | 'medium' | 'low' =
      segment.qualityScore >= 90 ? 'high' : segment.qualityScore >= 75 ? 'medium' : 'low';

    return {
      segmentId,
      estimatedROI: Math.round(estimatedROI * 100) / 100,
      estimatedConversions,
      estimatedRevenue,
      confidence,
      reasoning: `Based on ${segment.avgConversionRate}% historical conversion rate and ${segment.qualityScore} quality score`,
    };
  }
}

export const pricingEngine = new PricingEngine();