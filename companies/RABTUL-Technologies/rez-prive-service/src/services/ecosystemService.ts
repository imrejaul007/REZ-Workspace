/**
 * Ecosystem Integration Service
 * Connects Prive with other ReZ services
 *
 * Integrations:
 * - Creator QR: Award Prive coins on bookings
 * - AdBazaar: Prive tier targeting for campaigns
 * - DOOH: Prive content targeting
 * - Karma: Unified scoring
 * - Rendez: Prive membership for dating
 * - Intent Graph: Behavioral signals
 */

import axios from 'axios';
import { PriveEngagement } from '../models/PriveEngagement';
import eligibilityService from './eligibilityService';
import coinService from './coinService';
import { EngagementAction, UnifiedScoreResponse, PillarId } from '../types';
import { logger } from '../config/logger';

// Service URLs
const KARMA_SERVICE_URL = process.env.KARMA_SERVICE_URL || 'https://rez-karma-service.onrender.com';
const INTENT_GRAPH_URL = process.env.INTENT_GRAPH_URL || 'https://rez-intent-graph.onrender.com';
const RENDEZ_SERVICE_URL = process.env.RENDEZ_SERVICE_URL || 'https://rez-rendez-service.onrender.com';

class EcosystemService {
  /**
   * Record engagement signal from unknown ecosystem service
   */
  async recordEngagementSignal(
    userId: string,
    action: EngagementAction,
    source: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Save to database
    const engagement = new PriveEngagement({
      userId,
      action,
      source,
      metadata,
      processed: false,
    });

    await engagement.save();

    // Update pillar scores based on action
    await this.updatePillarFromEngagement(userId, action, metadata);

    // Propagate to other services
    await this.propagateToEcosystem(userId, action, source, metadata);

    logger.info('Engagement signal recorded', { userId, action, source });
  }

  /**
   * Update pillar scores based on engagement action
   */
  private async updatePillarFromEngagement(
    userId: string,
    action: EngagementAction,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const pillarScores: Record<string, number> = {};

    switch (action) {
      case 'booking':
        pillarScores['engagement'] = 2;
        pillarScores['economic'] = 1;
        break;
      case 'review':
        pillarScores['engagement'] = 1;
        pillarScores['influence'] = 1;
        break;
      case 'campaign':
        pillarScores['engagement'] = 1;
        pillarScores['brand_affinity'] = 2;
        break;
      case 'referral':
        pillarScores['network'] = 3;
        pillarScores['engagement'] = 1;
        break;
      case 'dooh_scan':
        pillarScores['engagement'] = 1;
        break;
      case 'social_share':
        pillarScores['influence'] = 2;
        pillarScores['network'] = 1;
        break;
      case 'checkin':
        pillarScores['engagement'] = 1;
        break;
    }

    // Update each pillar
    for (const [pillarId, scoreChange] of Object.entries(pillarScores)) {
      await eligibilityService.updatePillarScore(userId, pillarId as PillarId, scoreChange);
    }
  }

  /**
   * Propagate engagement to other ecosystem services
   */
  private async propagateToEcosystem(
    userId: string,
    action: EngagementAction,
    source: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Send to Karma service
    if (source !== 'karma') {
      this.syncToKarma(userId, action, metadata).catch((err) => {
        logger.error('Failed to sync to Karma', { userId, error: err.message });
      });
    }

    // Send to Intent Graph
    if (source !== 'intent_graph') {
      this.syncToIntentGraph(userId, action, metadata).catch((err) => {
        logger.error('Failed to sync to Intent Graph', { userId, error: err.message });
      });
    }

    // Send to Rendez (for dating engagement)
    if (source !== 'rendez') {
      this.syncToRendez(userId, action, metadata).catch((err) => {
        logger.error('Failed to sync to Rendez', { userId, error: err.message });
      });
    }
  }

  /**
   * Sync engagement to Karma service
   */
  private async syncToKarma(
    userId: string,
    action: EngagementAction,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Map Prive actions to Karma actions
    const karmaActionMap: Record<EngagementAction, { action: string; points: number }> = {
      booking: { action: 'purchase', points: 10 },
      review: { action: 'review', points: 5 },
      campaign: { action: 'campaign', points: 20 },
      referral: { action: 'referral', points: 15 },
      dooh_scan: { action: 'engagement', points: 2 },
      social_share: { action: 'share', points: 5 },
      checkin: { action: 'checkin', points: 1 },
    };

    const karmaAction = karmaActionMap[action];

    await axios.post(
      `${KARMA_SERVICE_URL}/api/karma/sync`,
      {
        userId,
        action: karmaAction.action,
        points: karmaAction.points,
        metadata,
        source: 'prive',
      },
      {
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
      }
    );
  }

  /**
   * Sync engagement to Intent Graph
   */
  private async syncToIntentGraph(
    userId: string,
    action: EngagementAction,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await axios.post(
      `${INTENT_GRAPH_URL}/api/signals`,
      {
        userId,
        signal: {
          type: action,
          source: 'prive',
          value: 1,
          metadata,
        },
      },
      {
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
      }
    );
  }

  /**
   * Sync engagement to Rendez
   */
  private async syncToRendez(
    userId: string,
    action: EngagementAction,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (action === 'checkin' || action === 'social_share') {
      await axios.post(
        `${RENDEZ_SERVICE_URL}/api/engagement`,
        {
          userId,
          type: action,
          metadata,
          source: 'prive',
        },
        {
          headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
        }
      );
    }
  }

  /**
   * Get unified score combining Prive and Karma
   */
  async getUnifiedScore(userId: string): Promise<UnifiedScoreResponse> {
    const priveEligibility = await eligibilityService.getEligibility(userId);

    let karmaLevel: string | undefined;
    let karmaScore: number | undefined;

    try {
      const karmaResponse = await axios.get(`${KARMA_SERVICE_URL}/api/karma/${userId}/score`, {
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
      });
      karmaLevel = karmaResponse.data?.level;
      karmaScore = karmaResponse.data?.score;
    } catch {
      // Karma not available
    }

    // Calculate combined multiplier
    const priveMultiplier = priveEligibility.tier === 'elite' ? 1.5 :
                           priveEligibility.tier === 'signature' ? 1.25 :
                           priveEligibility.tier === 'entry' ? 1.1 : 1.0;

    const karmaMultiplier = karmaLevel === 'L4' ? 2.0 :
                          karmaLevel === 'L3' ? 1.5 :
                          karmaLevel === 'L2' ? 1.25 : 1.0;

    const combinedMultiplier = priveMultiplier * karmaMultiplier;

    return {
      userId,
      priveScore: priveEligibility.score,
      priveTier: priveEligibility.tier,
      karmaLevel,
      karmaScore,
      combinedMultiplier: Math.round(combinedMultiplier * 100) / 100,
      pillarBreakdown: priveEligibility.pillars,
      ecosystemConnections: [
        { service: 'creator_qr', connected: true },
        { service: 'adbazaar', connected: true },
        { service: 'dooh', connected: true },
        { service: 'karma', connected: !!karmaLevel },
        { service: 'rendez', connected: true },
        { service: 'intent_graph', connected: true },
      ],
    };
  }

  /**
   * Check if user qualifies for ecosystem-specific benefits
   */
  async checkEcosystemBenefits(
    userId: string,
    service: string
  ): Promise<{ eligible: boolean; benefits: string[]; tier: string }> {
    const eligibility = await eligibilityService.getEligibility(userId);

    const benefits: string[] = [];

    switch (service) {
      case 'creator_qr':
        if (eligibility.tier !== 'none') {
          benefits.push('Prive coin bonus on bookings');
        }
        if (eligibility.tier === 'elite') {
          benefits.push('Elite creator badge');
          benefits.push('Priority listing');
        }
        break;

      case 'adbazaar':
        if (eligibility.tier !== 'none') {
          benefits.push('Tiered campaign rewards');
        }
        if (eligibility.tier === 'signature' || eligibility.tier === 'elite') {
          benefits.push('Exclusive campaigns');
        }
        if (eligibility.tier === 'elite') {
          benefits.push('Elite-only campaigns');
        }
        break;

      case 'dooh':
        if (eligibility.tier !== 'none') {
          benefits.push('Prive content visibility');
        }
        if (eligibility.tier === 'elite') {
          benefits.push('Elite VIP content');
          benefits.push('VIP CTA');
        }
        break;

      case 'karma':
        if (eligibility.tier !== 'none') {
          benefits.push('Enhanced Karma conversion');
          benefits.push('Pillar-synced scoring');
        }
        break;

      case 'rendez':
        if (eligibility.tier !== 'none') {
          benefits.push('Verified member badge');
        }
        if (eligibility.tier === 'signature' || eligibility.tier === 'elite') {
          benefits.push('Priority matching');
        }
        if (eligibility.tier === 'elite') {
          benefits.push('Elite member profile highlight');
        }
        break;
    }

    return {
      eligible: eligibility.tier !== 'none',
      benefits,
      tier: eligibility.tier,
    };
  }
}

export const ecosystemService = new EcosystemService();
export default ecosystemService;
