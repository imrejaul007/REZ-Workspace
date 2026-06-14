import { IDeal, DealStage, STAGE_ORDER } from '../models/deal.model';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { calculateProgressionVelocity, daysSince } from '../utils/deal.utils';

export interface AIScoreResult {
  aiScore: number;
  probability: number;
  factors: AIScoreFactor[];
  recommendations: string[];
  lastAiAnalysis: Date;
}

export interface AIScoreFactor {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  description: string;
}

interface ScoredDeal extends IDeal {
  aiScore: number;
}

class AIScoringService {
  private readonly AI_SCORING_ENABLED = process.env.AI_SCORING_ENABLED === 'true';

  // ==============================================
  // MAIN SCORING FUNCTION
  // ==============================================

  async scoreDeal(deal: IDeal, force: boolean = false): Promise<AIScoreResult> {
    // Check if scoring is needed (cache for 1 hour)
    if (!force && deal.lastAiAnalysis) {
      const hoursSinceLastAnalysis = (Date.now() - new Date(deal.lastAiAnalysis).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastAnalysis < 1) {
        return {
          aiScore: deal.aiScore || 50,
          probability: deal.probability,
          factors: [],
          recommendations: [],
          lastAiAnalysis: deal.lastAiAnalysis,
        };
      }
    }

    // Calculate all factors
    const factors: AIScoreFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // 1. Budget Match Score (weight: 25)
    const budgetScore = this.calculateBudgetMatchScore(deal);
    factors.push(budgetScore);
    totalScore += budgetScore.contribution;
    totalWeight += budgetScore.weight;

    // 2. Timeline Alignment Score (weight: 20)
    const timelineScore = this.calculateTimelineScore(deal);
    factors.push(timelineScore);
    totalScore += timelineScore.contribution;
    totalWeight += timelineScore.weight;

    // 3. Broker Performance Score (weight: 20)
    const brokerScore = await this.calculateBrokerPerformanceScore(deal);
    factors.push(brokerScore);
    totalScore += brokerScore.contribution;
    totalWeight += brokerScore.weight;

    // 4. Engagement Score (weight: 20)
    const engagementScore = this.calculateEngagementScore(deal);
    factors.push(engagementScore);
    totalScore += engagementScore.contribution;
    totalWeight += engagementScore.weight;

    // 5. Stage Progression Velocity (weight: 15)
    const velocityScore = this.calculateVelocityScore(deal);
    factors.push(velocityScore);
    totalScore += velocityScore.contribution;
    totalWeight += velocityScore.weight;

    // Calculate final AI score (0-100)
    const aiScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;

    // Generate recommendations
    const recommendations = this.generateRecommendations(deal, factors);

    const result: AIScoreResult = {
      aiScore,
      probability: deal.probability,
      factors,
      recommendations,
      lastAiAnalysis: new Date(),
    };

    // Cache the result
    await this.cacheAIScore(deal.dealId, result);

    logger.info('AI score calculated', { dealId: deal.dealId, aiScore });

    return result;
  }

  // ==============================================
  // BUDGET MATCH SCORING
  // ==============================================

  private calculateBudgetMatchScore(deal: IDeal): AIScoreFactor {
    const askingPrice = deal.askingPrice;
    const negotiatedPrice = deal.negotiatedPrice || askingPrice;

    let score = 50;
    let description = '';

    if (deal.dealType === 'sale' || deal.dealType === 'purchase') {
      // For sales, closer to asking price = more likely to close
      if (negotiatedPrice >= askingPrice * 0.95) {
        score = 90;
        description = 'Price at or above asking - high confidence';
      } else if (negotiatedPrice >= askingPrice * 0.90) {
        score = 75;
        description = 'Minor negotiation, close to asking price';
      } else if (negotiatedPrice >= askingPrice * 0.80) {
        score = 60;
        description = 'Moderate discount requested';
      } else if (negotiatedPrice >= askingPrice * 0.70) {
        score = 40;
        description = 'Significant discount - may indicate budget issues';
      } else {
        score = 20;
        description = 'Large discount requested - low probability';
      }
    } else if (deal.dealType === 'rental') {
      // For rentals, monthly rent alignment
      score = 70;
      description = 'Rental deal - standard pricing';
    }

    return {
      name: 'Budget Match',
      score,
      weight: 25,
      contribution: score * 25,
      description,
    };
  }

  // ==============================================
  // TIMELINE ALIGNMENT SCORING
  // ==============================================

  private calculateTimelineScore(deal: IDeal): AIScoreFactor {
    let score = 50;
    let description = '';

    // Check payment milestones
    const overdueMilestones = deal.paymentMilestones.filter(m => m.status === 'overdue');
    const upcomingMilestones = deal.paymentMilestones.filter(m => {
      const daysUntilDue = (new Date(m.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return m.status === 'pending' && daysUntilDue > 0 && daysUntilDue <= 7;
    });

    if (overdueMilestones.length > 0) {
      score = 20;
      description = `${overdueMilestones.length} overdue payment(s) - high risk`;
    } else if (upcomingMilestones.length > 0) {
      score = 80;
      description = `${upcomingMilestones.length} payment(s) due soon - active engagement`;
    } else if (deal.handoverDate) {
      const daysUntilHandover = (new Date(deal.handoverDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilHandover > 0 && daysUntilHandover <= 30) {
        score = 85;
        description = `Handover in ${Math.round(daysUntilHandover)} days - on track`;
      } else if (daysUntilHandover > 30 && daysUntilHandover <= 90) {
        score = 70;
        description = 'Handover scheduled within 3 months';
      } else if (daysUntilHandover > 90) {
        score = 60;
        description = 'Handover scheduled beyond 3 months';
      } else {
        score = 30;
        description = 'Handover date passed - needs attention';
      }
    } else {
      description = 'No specific timeline set';
    }

    return {
      name: 'Timeline Alignment',
      score,
      weight: 20,
      contribution: score * 20,
      description,
    };
  }

  // ==============================================
  // BROKER PERFORMANCE SCORING
  // ==============================================

  private async calculateBrokerPerformanceScore(deal: IDeal): Promise<AIScoreFactor> {
    let score = 50;
    let description = '';

    try {
      // Try to get broker stats from cache
      const cacheKey = `broker:${deal.brokerId}:stats`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        const stats = JSON.parse(cached);
        // Calculate score based on win rate
        const winRate = stats.won / (stats.won + stats.lost + 1);
        score = Math.round(winRate * 100);
        description = `Broker has ${stats.won} wins, ${stats.lost} losses`;
      } else {
        // Default score if no data
        description = 'Broker performance data not available';
      }
    } catch (error) {
      logger.warn('Failed to fetch broker stats for scoring', { brokerId: deal.brokerId });
      description = 'Unable to assess broker performance';
    }

    return {
      name: 'Broker Performance',
      score,
      weight: 20,
      contribution: score * 20,
      description,
    };
  }

  // ==============================================
  // ENGAGEMENT SCORING
  // ==============================================

  private calculateEngagementScore(deal: IDeal): AIScoreFactor {
    let score = 50;
    let description = '';

    // Count engagement signals
    const offerCount = deal.offers.length;
    const milestoneCount = deal.paymentMilestones.length;
    const stageHistoryLength = deal.stageHistory.length;
    const daysSinceCreation = daysSince(deal.createdAt);

    // Calculate engagement ratio
    const engagementPoints = offerCount * 10 + milestoneCount * 5 + stageHistoryLength * 5;
    const engagementRate = engagementPoints / Math.max(1, daysSinceCreation);

    if (engagementRate >= 2) {
      score = 90;
      description = 'Highly engaged - multiple touchpoints';
    } else if (engagementRate >= 1) {
      score = 75;
      description = 'Good engagement level';
    } else if (engagementRate >= 0.5) {
      score = 55;
      description = 'Moderate engagement';
    } else if (engagementRate > 0) {
      score = 35;
      description = 'Low engagement - needs follow-up';
    } else {
      score = 20;
      description = 'No recent engagement - at risk';
    }

    // Stage-based adjustment
    const stageIndex = STAGE_ORDER.indexOf(deal.stage);
    if (stageIndex >= 4) { // Agreement or later
      score = Math.min(100, score + 10);
      description += ' - advanced stage';
    }

    return {
      name: 'Engagement',
      score,
      weight: 20,
      contribution: score * 20,
      description,
    };
  }

  // ==============================================
  // VELOCITY SCORING
  // ==============================================

  private calculateVelocityScore(deal: IDeal): AIScoreFactor {
    let score = 50;
    let description = '';

    const velocity = calculateProgressionVelocity(deal.stageHistory);

    if (velocity >= 0.5) {
      // Stage progression per day
      score = 85;
      description = 'Fast progression through pipeline';
    } else if (velocity >= 0.2) {
      score = 70;
      description = 'Normal progression pace';
    } else if (velocity > 0) {
      score = 50;
      description = 'Slow progression - monitor closely';
    } else {
      // Check if stalled
      const lastActivity = deal.stageHistory[deal.stageHistory.length - 1];
      if (lastActivity) {
        const daysStalled = daysSince(new Date(lastActivity.changedAt));
        if (daysStalled > 30) {
          score = 20;
          description = `Stalled for ${daysStalled} days - at risk`;
        } else if (daysStalled > 14) {
          score = 40;
          description = `No activity for ${daysStalled} days`;
        } else {
          score = 60;
          description = 'Early stage, normal pace';
        }
      } else {
        description = 'New deal - insufficient data';
      }
    }

    return {
      name: 'Stage Velocity',
      score,
      weight: 15,
      contribution: score * 15,
      description,
    };
  }

  // ==============================================
  // RECOMMENDATIONS
  // ==============================================

  private generateRecommendations(deal: IDeal, factors: AIScoreFactor[]): string[] {
    const recommendations: string[] = [];

    // Check each factor for low scores
    const lowFactors = factors.filter(f => f.score < 40);
    for (const factor of lowFactors) {
      switch (factor.name) {
        case 'Budget Match':
          recommendations.push('Review pricing strategy - consider adjusting expectations');
          break;
        case 'Timeline Alignment':
          recommendations.push('Set clear milestones and payment schedule');
          break;
        case 'Broker Performance':
          recommendations.push('Consider additional broker support or training');
          break;
        case 'Engagement':
          recommendations.push('Increase touchpoints with client - schedule follow-up');
          break;
        case 'Stage Velocity':
          recommendations.push('Accelerate deal progression - identify blockers');
          break;
      }
    }

    // Check for specific deal conditions
    if (deal.offers.length === 0 && deal.stage !== DealStage.INQUIRY) {
      recommendations.push('Send formal offer to move deal forward');
    }

    if (deal.paymentMilestones.filter(m => m.status === 'overdue').length > 0) {
      recommendations.push('Urgent: Address overdue payments immediately');
    }

    if (deal.status === 'on_hold') {
      recommendations.push('Deal is on hold - review and reactivate or close');
    }

    // Stage-specific recommendations
    if (deal.stage === DealStage.NEGOTIATION && deal.offers.length > 0) {
      const lastOffer = deal.offers[deal.offers.length - 1];
      if (lastOffer.status === 'pending') {
        recommendations.push('Follow up on pending offer response');
      }
    }

    // Default recommendation if none specific
    if (recommendations.length === 0) {
      recommendations.push('Deal progressing well - maintain current approach');
    }

    return recommendations;
  }

  // ==============================================
  // BATCH SCORING
  // ==============================================

  async scoreDeals(deals: IDeal[]): Promise<Map<string, AIScoreResult>> {
    const results = new Map<string, AIScoreResult>();

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < deals.length; i += batchSize) {
      const batch = deals.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(deal => this.scoreDeal(deal, true))
      );

      for (let j = 0; j < batch.length; j++) {
        results.set(batch[j].dealId, batchResults[j]);
      }
    }

    return results;
  }

  // ==============================================
  // PRIORITY QUEUE
  // ==============================================

  async getPriorityDeals(brokerId?: string, limit: number = 10): Promise<ScoredDeal[]> {
    const cacheKey = `priority_deals:${brokerId || 'all'}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // This would be called from deal service with filtered deals
    // For now, return empty array - implementation depends on deal service
    return [];
  }

  // ==============================================
  // CACHE MANAGEMENT
  // ==============================================

  private async cacheAIScore(dealId: string, result: AIScoreResult): Promise<void> {
    try {
      await redis.setex(
        `ai_score:${dealId}`,
        3600, // 1 hour TTL
        JSON.stringify(result)
      );
    } catch (error) {
      logger.warn('Failed to cache AI score', { dealId });
    }
  }

  async getCachedScore(dealId: string): Promise<AIScoreResult | null> {
    try {
      const cached = await redis.get(`ai_score:${dealId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  // ==============================================
  // ANALYTICS
  // ==============================================

  async getAIScoreDistribution(brokerId?: string): Promise<Record<string, number>> {
    // This would aggregate scores by range
    return {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };
  }

  async getScoreTrend(dealId: string): Promise<Array<{ date: Date; score: number }>> {
    // Would track score changes over time
    return [];
  }
}

export const aiScoringService = new AIScoringService();