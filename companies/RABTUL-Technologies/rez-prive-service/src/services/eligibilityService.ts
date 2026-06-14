/**
 * Eligibility Service
 * Core 6-Pillar eligibility calculation engine
 */

import mongoose from 'mongoose';
import { PriveAccess, IPriveAccess } from '../models/PriveAccess';
import {
  PillarId,
  PillarScore,
  PriveTier,
  AccessState,
  PILLAR_WEIGHTS,
  EligibilityResponse,
  PillarMetrics,
  EngagementAction,
} from '../types';
import { logger } from '../config/logger';

// Pillar metadata
const PILLAR_META: Record<PillarId, { name: string; shortName: string; icon: string; color: string }> = {
  engagement: { name: 'Engagement', shortName: 'ENG', icon: 'activity', color: '#4CAF50' },
  trust: { name: 'Trust', shortName: 'TRU', icon: 'shield', color: '#2196F3' },
  influence: { name: 'Influence', shortName: 'INF', icon: 'star', color: '#FF9800' },
  economic: { name: 'Economic', shortName: 'ECO', icon: 'trending-up', color: '#9C27B0' },
  brand_affinity: { name: 'Brand Affinity', shortName: 'BRN', icon: 'heart', color: '#E91E63' },
  network: { name: 'Network', shortName: 'NET', icon: 'users', color: '#00BCD4' },
};

class EligibilityService {
  /**
   * Get user eligibility
   */
  async getEligibility(userId: string): Promise<EligibilityResponse> {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Get or create PriveAccess record
    const accessDoc = await PriveAccess.findOne({ userId: userObjId });

    if (!accessDoc) {
      // Create default record
      const newAccess = await this.createDefaultAccess(userObjId);
      return this.buildEligibilityResponse(newAccess);
    }

    return this.buildEligibilityResponse(accessDoc);
  }

  /**
   * Create default access record
   */
  private async createDefaultAccess(userId: mongoose.Types.ObjectId): Promise<IPriveAccess | null> {
    const defaultPillars = this.calculateDefaultPillars();

    const access = new PriveAccess({
      userId,
      tier: 'none',
      accessState: 'active',
      totalScore: 0,
      trustScore: 100,
      pillars: defaultPillars,
      source: 'auto_qualify',
    });

    const saved = await access.save();
    return saved as IPriveAccess;
  }

  /**
   * Calculate default pillars
   */
  private calculateDefaultPillars(): PillarScore[] {
    return Object.entries(PILLAR_WEIGHTS).map(([id, weight]) => ({
      id: id as PillarId,
      name: PILLAR_META[id as PillarId].name,
      shortName: PILLAR_META[id as PillarId].shortName,
      score: 0,
      weight,
      weightedScore: 0,
      trend: 'stable' as const,
      icon: PILLAR_META[id as PillarId].icon,
      color: PILLAR_META[id as PillarId].color,
      description: '',
      improvementTips: ['Start using the app to improve your score'],
    }));
  }

  /**
   * Build eligibility response
   */
  private buildEligibilityResponse(access: IPriveAccess | null): EligibilityResponse {
    if (!access) {
      throw new Error('Access record is null');
    }
    const { tier, accessState, totalScore, trustScore, pillars, gracePeriodEnds } = access;

    // Determine eligibility
    const isEligible = tier !== 'none' && ['active', 'grace_period'].includes(accessState);

    // Calculate reason
    let reason: string | undefined;
    if (!isEligible) {
      if (accessState === 'suspended') {
        reason = 'Account suspended due to trust issues';
      } else if (accessState === 'revoked') {
        reason = 'Account access has been revoked';
      } else if (totalScore < 50) {
        reason = `Score ${totalScore} below minimum threshold (50)`;
      }
    }

    return {
      isEligible,
      score: totalScore,
      tier,
      accessState,
      trustScore,
      pillars: pillars.map((p) => ({
        id: p.id,
        name: p.name,
        shortName: p.shortName,
        score: p.score,
        weight: p.weight,
        weightedScore: p.weightedScore || p.score * p.weight,
        trend: p.trend,
        icon: p.icon,
        color: p.color,
        description: p.description,
        improvementTips: p.improvementTips,
      })),
      metrics: {} as PillarMetrics, // Simplified for now
      gracePeriodEnds,
      reason,
    };
  }

  /**
   * Recalculate eligibility scores
   */
  async recalculateEligibility(
    userId: string,
    metrics: Partial<PillarMetrics>
  ): Promise<EligibilityResponse> {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Calculate pillar scores
    const pillars = this.calculatePillarScores(metrics);

    // Calculate total score
    const totalScore = pillars.reduce((sum, p) => sum + p.weightedScore, 0);

    // Calculate trust score
    const trustScore = this.calculateTrustScore(metrics.trust);

    // Determine tier
    const tier = this.determineTier(totalScore);

    // Determine access state
    const accessState = this.determineAccessState(totalScore, trustScore);

    // Get existing access or create new
    let access = await PriveAccess.findOne({ userId: userObjId });
    if (!access) {
      access = new PriveAccess({ userId: userObjId });
    }

    // Update access
    access.totalScore = totalScore;
    access.trustScore = trustScore;
    access.tier = tier;
    access.accessState = accessState;
    access.pillars = pillars;
    access.lastRecalculated = new Date();

    // Handle grace period
    if (accessState === 'grace_period' && !access.gracePeriodEnds) {
      const graceEnd = new Date();
      graceEnd.setDate(graceEnd.getDate() + 30);
      access.gracePeriodEnds = graceEnd;
    }

    await access.save();

    logger.info('Eligibility recalculated', { userId, totalScore, tier, accessState });

    return this.buildEligibilityResponse(access as IPriveAccess);
  }

  /**
   * Calculate pillar scores from metrics
   */
  private calculatePillarScores(metrics: Partial<PillarMetrics>): PillarScore[] {
    return Object.entries(PILLAR_WEIGHTS).map(([id, weight]) => {
      const pillarId = id as PillarId;
      const meta = PILLAR_META[pillarId];
      let score = 0;

      // Calculate score based on metrics
      switch (pillarId) {
        case 'engagement':
          if (metrics.engagement) {
            const { transactions30d, activeDays30d, categoriesUsed } = metrics.engagement;
            score = Math.min(100,
              (transactions30d / 20) * 40 +
              (activeDays30d / 20) * 30 +
              (categoriesUsed * 10)
            );
          }
          break;
        case 'trust':
          if (metrics.trust) {
            const { disputeRate, flaggedReviews } = metrics.trust;
            score = Math.max(0, Math.min(100, 100 - (disputeRate * 2) - (flaggedReviews * 10)));
          }
          break;
        case 'influence':
          if (metrics.influence) {
            const { totalFollowers, engagementRate } = metrics.influence;
            score = Math.min(100, (totalFollowers / 1000) * 50 + (engagementRate * 0.5));
          }
          break;
        case 'economic':
          if (metrics.economic) {
            const { gmv30d, avgOrderValue } = metrics.economic;
            score = Math.min(100, (gmv30d / 10000) * 50 + (avgOrderValue / 500) * 50);
          }
          break;
        case 'brand_affinity':
          if (metrics.brandAffinity) {
            const { campaignAcceptanceRate, brandLoyaltyScore } = metrics.brandAffinity;
            score = Math.min(100, campaignAcceptanceRate + brandLoyaltyScore);
          }
          break;
        case 'network':
          if (metrics.network) {
            const { referralCount, communityEngagement } = metrics.network;
            score = Math.min(100, referralCount * 10 + communityEngagement);
          }
          break;
      }

      return {
        id: pillarId,
        name: meta.name,
        shortName: meta.shortName,
        score: Math.round(score),
        weight,
        weightedScore: Math.round(score * weight * 100) / 100,
        trend: 'stable' as const,
        icon: meta.icon,
        color: meta.color,
        description: this.getPillarDescription(pillarId, score),
        improvementTips: this.getImprovementTips(pillarId, score),
      };
    });
  }

  /**
   * Calculate trust score
   */
  private calculateTrustScore(trustMetrics?: { disputeRate?: number; flaggedReviews?: number; fakeBillDetected?: boolean }): number {
    if (!trustMetrics) return 100;

    const { disputeRate = 0, flaggedReviews = 0, fakeBillDetected = false } = trustMetrics;

    if (fakeBillDetected) return 0;

    let score = 100;
    score -= disputeRate * 2;
    score -= flaggedReviews * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine tier from score
   */
  private determineTier(score: number): PriveTier {
    if (score >= 85) return 'elite';
    if (score >= 70) return 'signature';
    if (score >= 50) return 'entry';
    return 'none';
  }

  /**
   * Determine access state
   */
  private determineAccessState(score: number, trustScore: number): AccessState {
    // Trust is a hard gate
    if (trustScore < 60) return 'suspended';

    if (score >= 70) return 'active';
    if (score >= 50) return 'active';

    return 'active'; // Can still be active but without tier
  }

  /**
   * Get pillar description
   */
  private getPillarDescription(pillarId: PillarId, score: number): string {
    const descriptions: Record<PillarId, { low: string; mid: string; high: string }> = {
      engagement: {
        low: 'Just getting started with the platform',
        mid: 'Regularly using the app for transactions',
        high: 'Highly engaged with multiple activities',
      },
      trust: {
        low: 'Some issues with account verification',
        mid: 'Good standing with verified account',
        high: 'Trusted member with excellent record',
      },
      influence: {
        low: 'Building your presence',
        mid: 'Growing following and engagement',
        high: 'Influential with strong reach',
      },
      economic: {
        low: 'Occasional transactions',
        mid: 'Regular spending across categories',
        high: 'High-value customer with premium purchases',
      },
      brand_affinity: {
        low: 'Exploring brands',
        mid: 'Engaged with brand campaigns',
        high: 'Strong brand loyalty and advocacy',
      },
      network: {
        low: 'Building your network',
        mid: 'Active in the community',
        high: 'Well-connected with quality referrals',
      },
    };

    const d = descriptions[pillarId];
    if (score < 33) return d.low;
    if (score < 66) return d.mid;
    return d.high;
  }

  /**
   * Get improvement tips for pillar
   */
  private getImprovementTips(pillarId: PillarId, score: number): string[] {
    const tips: Record<PillarId, string[]> = {
      engagement: [
        'Make more transactions',
        'Use the app daily',
        'Try different categories',
      ],
      trust: [
        'Keep dispute rate low',
        'Get verified',
        'Avoid flagged reviews',
      ],
      influence: [
        'Share content on social media',
        'Engage with your followers',
        'Participate in campaigns',
      ],
      economic: [
        'Increase order frequency',
        'Try premium categories',
        'Use multiple merchants',
      ],
      brand_affinity: [
        'Accept brand invitations',
        'Provide brand feedback',
        'Complete brand campaigns',
      ],
      network: [
        'Refer friends',
        'Join community events',
        'Engage with other users',
      ],
    };

    return score >= 80 ? ['Maintain your excellent score!'] : tips[pillarId];
  }

  /**
   * Update single pillar score
   */
  async updatePillarScore(
    userId: string,
    pillarId: PillarId,
    scoreChange: number
  ): Promise<void> {
    const userObjId = new mongoose.Types.ObjectId(userId);

    await PriveAccess.updateOne(
      { userId: userObjId },
      {
        $inc: { 'pillars.$[elem].score': scoreChange },
        $set: { lastUpdated: new Date() },
      },
      { arrayFilters: [{ 'elem.id': pillarId }] }
    );

    // Recalculate total and tier
    await this.recalculateFromPillars(userId);
  }

  /**
   * Recalculate from existing pillar scores
   */
  private async recalculateFromPillars(userId: string): Promise<void> {
    const access = await PriveAccess.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!access) return;

    const totalScore = access.pillars.reduce((sum, p) => sum + (p.score * p.weight), 0);
    const tier = this.determineTier(totalScore);

    await PriveAccess.updateOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        totalScore,
        tier,
        lastRecalculated: new Date(),
      }
    );
  }
}

export const eligibilityService = new EligibilityService();
export default eligibilityService;
