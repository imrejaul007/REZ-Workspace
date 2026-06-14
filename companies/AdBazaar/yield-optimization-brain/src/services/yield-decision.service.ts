import { v4 as uuidv4 } from 'uuid';
import {
  YieldDecisionRequest,
  YieldDecision,
  YieldConstraints,
  AdCreative,
  EligibleAd,
} from '../types/index.js';
import { YieldDecision as YieldDecisionModel } from '../models/index.js';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

export class YieldDecisionService {
  /**
   * Make yield optimization decision for an impression opportunity
   */
  async makeDecision(request: YieldDecisionRequest): Promise<YieldDecision> {
    const startTime = Date.now();
    const decisionId = uuidv4();

    try {
      logger.info('Making yield decision', {
        decisionId,
        inventoryId: request.inventorySlot.id,
        eligibleAdsCount: request.eligibleAds.length,
        optimizationGoal: request.optimizationGoal || 'revenue',
      });

      // Filter eligible ads
      const eligibleAds = this.filterEligibleAds(request.eligibleAds, request.constraints);

      if (eligibleAds.length === 0) {
        logger.info('No eligible ads found', { decisionId });
        return this.createNoAdDecision(decisionId, startTime, request.optimizationGoal || 'revenue');
      }

      // Calculate scores for each ad
      const scoredAds = await this.scoreAds(eligibleAds, request);

      // Select the best ad
      const selected = this.selectBestAd(scoredAds);

      // Calculate bid and revenue
      const { bid, floorPrice } = this.calculateBid(selected, request);
      const expectedRevenue = this.calculateExpectedRevenue(bid, selected.ad.ctr, selected.ad.conversionRate);
      const expectedCTR = this.interpolateCTR(selected.score, request.userContext.intentScore);
      const expectedCVR = selected.ad.conversionRate;

      // Create decision
      const decision: YieldDecision = {
        selectedAd: selected.ad,
        bid,
        floorPrice,
        expectedRevenue,
        expectedCTR,
        expectedCVR,
        confidence: selected.confidence,
        decisionReason: selected.reason,
        alternativeAds: this.getAlternatives(scoredAds),
        metadata: {
          timestamp: new Date(),
          decisionId,
          processingTimeMs: Date.now() - startTime,
          optimizationGoal: request.optimizationGoal || 'revenue',
        },
      };

      // Persist decision
      await this.persistDecision(decision, request);

      logger.info('Yield decision made', {
        decisionId,
        selectedAdId: selected.ad.id,
        bid,
        expectedRevenue,
        confidence: selected.confidence,
        processingTimeMs: Date.now() - startTime,
      });

      return decision;
    } catch (error) {
      logger.error('Error making yield decision', {
        decisionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Filter ads based on constraints
   */
  private filterEligibleAds(ads: EligibleAd[], constraints?: YieldConstraints): EligibleAd[] {
    return ads.filter(({ ad, eligibility }) => {
      if (!eligibility.matched) return false;

      if (constraints?.maxFrequency && ad.frequency > constraints.maxFrequency) {
        return false;
      }

      if (constraints?.minCTR && ad.ctr < constraints.minCTR) {
        return false;
      }

      return true;
    });
  }

  /**
   * Score ads based on optimization goal
   */
  private async scoreAds(
    ads: EligibleAd[],
    request: YieldDecisionRequest
  ): Promise<ScoredAd[]> {
    const goal = request.optimizationGoal || 'revenue';
    const weights = config.yield.defaultWeights;
    const userIntent = request.userContext.intentScore;

    return ads.map(({ ad }) => {
      let revenueScore = 0;
      let conversionScore = 0;
      let ltvScore = 0;
      let ctrScore = 0;
      let brandSafetyScore = 1;
      let reasons: string[] = [];

      // Revenue score (bid * probability of conversion)
      const expectedBid = ad.bid * (1 + ad.conversionRate);
      revenueScore = Math.min(expectedBid / 10, 1); // Normalize to 0-1
      reasons.push(`Expected bid: $${expectedBid.toFixed(2)}`);

      // Conversion score
      conversionScore = ad.conversionRate;
      reasons.push(`Conversion rate: ${(ad.conversionRate * 100).toFixed(2)}%`);

      // LTV score (based on CPA and historical performance)
      const ltvScoreValue = ad.cpa > 0 ? Math.min(100 / ad.cpa, 1) : 0.5;
      ltvScore = ltvScoreValue;
      reasons.push(`CPA-based LTV score: ${ltvScoreValue.toFixed(2)}`);

      // CTR score (normalized)
      ctrScore = Math.min(ad.ctr * 10, 1);
      reasons.push(`CTR score: ${(ad.ctr * 100).toFixed(2)}%`);

      // Brand safety score
      if (ad.qualityScore !== undefined) {
        brandSafetyScore = ad.qualityScore / 100;
      }

      // Calculate weighted score based on goal
      let totalScore: number;
      switch (goal) {
        case 'conversions':
          totalScore =
            revenueScore * weights.revenue * 0.3 +
            conversionScore * weights.conversions * 0.5 +
            ctrScore * weights.ctr * 0.2;
          break;
        case 'ltv':
          totalScore =
            revenueScore * weights.revenue * 0.2 +
            ltvScore * weights.ltv * 0.5 +
            conversionScore * weights.conversions * 0.3;
          break;
        case 'revenue':
        default:
          totalScore =
            revenueScore * weights.revenue +
            conversionScore * weights.conversions * 0.8 +
            ltvScore * weights.ltv * 0.5 +
            ctrScore * weights.ctr +
            brandSafetyScore * weights.brandSafety;
          break;
      }

      // Boost for intent match
      const intentBoost = 1 + (userIntent * 0.2);
      totalScore *= intentBoost;

      // Calculate confidence
      const confidence = this.calculateConfidence(ad, request);

      return {
        ad,
        score: totalScore,
        revenueScore,
        conversionScore,
        ltvScore,
        ctrScore,
        brandSafetyScore,
        confidence,
        reason: reasons.join('; '),
      };
    });
  }

  /**
   * Calculate confidence score for a decision
   */
  private calculateConfidence(ad: AdCreative, request: YieldDecisionRequest): number {
    let confidence = 0.7; // Base confidence

    // More eligible ads = lower confidence in selection
    confidence -= Math.min(request.eligibleAds.length * 0.02, 0.2);

    // Higher intent = higher confidence
    confidence += request.userContext.intentScore * 0.15;

    // Historical performance affects confidence
    if (ad.frequency > 0) {
      confidence += 0.1;
    }

    // Quality score affects confidence
    if (ad.qualityScore !== undefined) {
      confidence += (ad.qualityScore / 100) * 0.1;
    }

    return Math.max(config.yield.confidence.minConfidence, Math.min(1, confidence));
  }

  /**
   * Select the best ad based on scores
   */
  private selectBestAd(scoredAds: ScoredAd[]): ScoredAd {
    // Sort by score descending
    scoredAds.sort((a, b) => b.score - a.score);

    // Return top candidate
    return scoredAds[0];
  }

  /**
   * Calculate optimal bid
   */
  private calculateBid(
    selected: ScoredAd,
    request: YieldDecisionRequest
  ): { bid: number; floorPrice: number } {
    const baseBid = selected.ad.bid;
    const userIntent = request.userContext.intentScore;
    const intentMultiplier = 1 + (userIntent * 0.3);

    // Apply context-based adjustment
    let contextMultiplier = 1;
    const context = request.inventorySlot.context.toLowerCase();

    if (context.includes('premium') || context.includes('high-value')) {
      contextMultiplier = 1.5;
    } else if (context.includes('standard')) {
      contextMultiplier = 1.0;
    } else if (context.includes('remnant')) {
      contextMultiplier = 0.8;
    }

    // Calculate final bid
    let bid = baseBid * intentMultiplier * contextMultiplier;

    // Apply floor price
    const floorPrice = request.inventorySlot.floorPrice || config.yield.floorPrice.defaultFloor;
    bid = Math.max(bid, floorPrice);

    // Cap at max bid
    bid = Math.min(bid, config.yield.bid.maxBid);

    return {
      bid: Math.round(bid * 100) / 100,
      floorPrice,
    };
  }

  /**
   * Calculate expected revenue
   */
  private calculateExpectedRevenue(bid: number, ctr: number, cvr: number): number {
    // Expected revenue = bid * CTR * CVR (simplified model)
    const expectedClicks = ctr;
    const expectedConversions = cvr;
    return bid * expectedClicks * expectedConversions;
  }

  /**
   * Interpolate CTR based on score
   */
  private interpolateCTR(score: number, intentScore: number): number {
    const baseCTR = 0.02; // 2% base CTR
    const maxCTR = 0.08; // 8% max CTR

    const scoreFactor = Math.min(score, 1);
    const intentFactor = intentScore;

    return baseCTR + (maxCTR - baseCTR) * scoreFactor * intentFactor;
  }

  /**
   * Get alternative ads for consideration
   */
  private getAlternatives(scoredAds: ScoredAd[], maxAlternatives = 3): {
    ad: AdCreative;
    expectedRevenue: number;
    probability: number;
  }[] {
    const totalScore = scoredAds.reduce((sum, a) => sum + a.score, 0);

    return scoredAds.slice(1, maxAlternatives + 1).map(scored => ({
      ad: scored.ad,
      expectedRevenue: this.calculateExpectedRevenue(
        scored.ad.bid,
        scored.ad.ctr,
        scored.ad.conversionRate
      ),
      probability: totalScore > 0 ? scored.score / totalScore : 0,
    }));
  }

  /**
   * Create no-ad decision
   */
  private createNoAdDecision(
    decisionId: string,
    startTime: number,
    optimizationGoal: string
  ): YieldDecision {
    return {
      selectedAd: null,
      bid: 0,
      floorPrice: 0,
      expectedRevenue: 0,
      expectedCTR: 0,
      expectedCVR: 0,
      confidence: 1,
      decisionReason: 'No eligible ads match the constraints',
      metadata: {
        timestamp: new Date(),
        decisionId,
        processingTimeMs: Date.now() - startTime,
        optimizationGoal,
      },
    };
  }

  /**
   * Persist decision to database
   */
  private async persistDecision(decision: YieldDecision, request: YieldDecisionRequest): Promise<void> {
    try {
      const doc = new YieldDecisionModel({
        decisionId: decision.metadata.decisionId,
        inventorySlotId: request.inventorySlot.id,
        inventoryType: request.inventorySlot.type,
        userContext: request.userContext,
        selectedAdId: decision.selectedAd?.id || 'no_ad',
        advertiserId: decision.selectedAd?.advertiserId || 'none',
        bid: decision.bid,
        floorPrice: decision.floorPrice,
        expectedRevenue: decision.expectedRevenue,
        expectedCTR: decision.expectedCTR,
        expectedCVR: decision.expectedCVR,
        confidence: decision.confidence,
        decisionReason: decision.decisionReason,
        optimizationGoal: decision.metadata.optimizationGoal,
        processingTimeMs: decision.metadata.processingTimeMs,
        timestamp: decision.metadata.timestamp,
      });

      await doc.save();
    } catch (error) {
      logger.error('Failed to persist decision', {
        decisionId: decision.metadata.decisionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - decision should still be returned
    }
  }

  /**
   * Get decision history
   */
  async getDecisionHistory(
    inventoryId?: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100
  ): Promise<YieldDecision[]> {
    const query: Record<string, unknown> = {};

    if (inventoryId) {
      query.inventorySlotId = inventoryId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        (query.timestamp as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.timestamp as Record<string, Date>).$lte = endDate;
      }
    }

    const docs = await YieldDecisionModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return docs.map(doc => ({
      selectedAd: {
        id: doc.selectedAdId,
        advertiserId: doc.advertiserId,
        advertiserName: '',
        campaignId: '',
        type: 'image' as const,
        format: '',
        bid: doc.bid,
        ctr: doc.expectedCTR || 0,
        conversionRate: doc.expectedCVR || 0,
        cpa: 0,
        frequency: 0,
      },
      bid: doc.bid,
      floorPrice: doc.floorPrice,
      expectedRevenue: doc.expectedRevenue,
      expectedCTR: doc.expectedCTR || 0,
      expectedCVR: doc.expectedCVR || 0,
      confidence: doc.confidence || 0,
      decisionReason: doc.decisionReason || '',
      metadata: {
        timestamp: doc.timestamp,
        decisionId: doc.decisionId,
        processingTimeMs: doc.processingTimeMs || 0,
        optimizationGoal: doc.optimizationGoal,
      },
    }));
  }
}

interface ScoredAd {
  ad: AdCreative;
  score: number;
  revenueScore: number;
  conversionScore: number;
  ltvScore: number;
  ctrScore: number;
  brandSafetyScore: number;
  confidence: number;
  reason: string;
}

export const yieldDecisionService = new YieldDecisionService();