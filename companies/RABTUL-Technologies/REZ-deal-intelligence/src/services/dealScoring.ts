/**
 * REZ Deal Intelligence - Deal Scoring Service
 *
 * AI-powered deal scoring and prediction engine
 */

import { DealModel, IDeal, DealTemperature } from '../models/Deal.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

interface ScoringInput {
  companyScore?: number;
  signalScore?: number;
  engagementScore?: number;
  activityCount?: number;
  sentimentScore?: number;
  stageProgress?: number;
  daysStalled?: number;
}

interface ScoringResult {
  overall: number;
  breakdown: {
    companyFit: number;
    intent: number;
    engagement: number;
    activity: number;
    sentiment: number;
  };
  temperature: DealTemperature;
  factors: Array<{ name: string; score: number; weight: number }>;
}

interface Recommendation {
  type: 'next_action' | 'risk' | 'opportunity' | 'insight';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  confidence: number;
}

// ============================================================================
// Deal Scoring Service
// ============================================================================

export class DealScoringService {
  /**
   * Calculate comprehensive deal score
   */
  static calculateScore(input: ScoringInput): ScoringResult {
    const weights = config.SCORING_CONFIG.weights;

    // Default values
    const scores = {
      companyFit: input.companyScore || 50,
      intent: input.signalScore || 30,
      engagement: input.engagementScore || 40,
      activity: this.calculateActivityScore(input.activityCount || 0),
      sentiment: input.sentimentScore || 50,
    };

    // Calculate weighted overall score
    const overall = Math.round(
      scores.companyFit * weights.companyScore +
      scores.intent * weights.signalScore +
      scores.engagement * weights.engagementScore +
      scores.activity * weights.activityScore +
      scores.sentiment * weights.sentimentScore
    );

    // Determine temperature
    let temperature: DealTemperature;
    if (overall >= config.SCORING_CONFIG.thresholds.hot) {
      temperature = 'hot';
    } else if (overall >= config.SCORING_CONFIG.thresholds.warm) {
      temperature = 'warm';
    } else {
      temperature = 'cold';
    }

    // Build factor breakdown
    const factors = [
      { name: 'Company Fit', score: scores.companyFit, weight: weights.companyScore },
      { name: 'Intent Signals', score: scores.intent, weight: weights.signalScore },
      { name: 'Engagement', score: scores.engagement, weight: weights.engagementScore },
      { name: 'Activity', score: scores.activity, weight: weights.activityScore },
      { name: 'Sentiment', score: scores.sentiment, weight: weights.sentimentScore },
    ];

    // Add stall penalty if applicable
    if (input.daysStalled && input.daysStalled > 7) {
      const stallPenalty = Math.min(input.daysStalled * 2, 30);
      factors.push({
        name: 'Stall Penalty',
        score: -stallPenalty,
        weight: 0,
      });
    }

    return {
      overall: Math.max(0, Math.min(100, overall)),
      breakdown: scores,
      temperature,
      factors,
    };
  }

  /**
   * Calculate activity score based on count
   */
  private static calculateActivityScore(activityCount: number): number {
    if (activityCount === 0) return 10;
    if (activityCount <= 3) return 30;
    if (activityCount <= 7) return 50;
    if (activityCount <= 15) return 70;
    if (activityCount <= 30) return 85;
    return 95;
  }

  /**
   * Predict win probability
   */
  static predictWinProbability(deal: Partial<IDeal>): {
    probability: number;
    confidence: number;
    method: 'rule_based' | 'ml_model' | 'historical';
    factors: Array<{ name: string; contribution: number }>;
  } {
    const stageProgress = this.getStageProgress(deal.stage);
    const score = deal.score?.overall || 50;

    // Rule-based probability calculation
    let probability = (score * 0.4) + (stageProgress * 0.3) + (50 * 0.3);

    // Adjust for stage
    const stageMultipliers: Record<string, number> = {
      lead: 0.7,
      qualified: 0.85,
      proposal: 0.95,
      negotiation: 1.1,
      closed_won: 1.0,
      closed_lost: 0.0,
    };
    probability *= (stageMultipliers[deal.stage || 'lead'] || 0.8);

    // Calculate confidence based on available data
    let confidence = 0.5; // Base confidence
    if (deal.companyId) confidence += 0.1;
    if (deal.conversationIds?.length) confidence += 0.15;
    if (deal.activityCount) confidence += 0.1;
    if (deal.signalIds?.length) confidence += 0.15;

    // Factor contributions
    const factors = [
      { name: 'Deal Score', contribution: (score / 100) * 40 },
      { name: 'Stage Progress', contribution: stageProgress * 30 },
      { name: 'Base Rate', contribution: 30 },
    ];

    return {
      probability: Math.round(Math.max(0, Math.min(100, probability))),
      confidence: Math.min(1, confidence),
      method: 'rule_based',
      factors,
    };
  }

  /**
   * Get stage progress percentage
   */
  private static getStageProgress(stage?: string): number {
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won'];
    if (!stage || stage === 'closed_lost') return 0;
    const index = stages.indexOf(stage);
    return ((index + 1) / stages.length) * 100;
  }

  /**
   * Generate recommendations for a deal
   */
  static generateRecommendations(deal: Partial<IDeal>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const score = deal.score;

    // High-value deal recommendations
    if ((deal.value || 0) > 100000 && score?.overall && score.overall >= 60) {
      recommendations.push({
        type: 'opportunity',
        title: 'High-Value Deal Alert',
        description: `This $${(deal.value! / 1000).toFixed(0)}K deal has strong signals. Consider escalating to leadership.`,
        priority: 'high',
        action: 'Schedule executive meeting',
        confidence: 0.85,
      });
    }

    // Low engagement recommendation
    if (score?.engagement && score.engagement < 40) {
      recommendations.push({
        type: 'next_action',
        title: 'Increase Engagement',
        description: 'This deal has low engagement. Send personalized outreach to reconnect.',
        priority: 'high',
        action: 'Trigger outbound sequence',
        confidence: 0.8,
      });
    }

    // Stalled deal risk
    if ((deal.daysInStage || 0) > 14) {
      recommendations.push({
        type: 'risk',
        title: 'Deal May Be Stalled',
        description: `Deal has been in stage for ${deal.daysInStage} days without movement.`,
        priority: score?.overall && score.overall >= 60 ? 'high' : 'medium',
        action: 'Schedule check-in call',
        confidence: 0.75,
      });
    }

    // Low intent signals
    if (score?.intent && score.intent < 30) {
      recommendations.push({
        type: 'insight',
        title: 'Low Intent Signals',
        description: 'Target company shows limited buying intent. Consider qualification call.',
        priority: 'medium',
        action: 'Run discovery call',
        confidence: 0.7,
      });
    }

    // Positive signals
    if (score?.sentiment && score.sentiment > 70) {
      recommendations.push({
        type: 'opportunity',
        title: 'Positive Sentiment Detected',
        description: 'Recent conversations show positive sentiment. Good time to push forward.',
        priority: 'medium',
        action: 'Send proposal',
        confidence: 0.8,
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, config.RECOMMENDATION_CONFIG.maxRecommendations);
  }

  /**
   * Detect risk factors
   */
  static detectRiskFactors(deal: Partial<IDeal>): Array<{
    factor: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }> {
    const risks: Array<{ factor: string; severity: 'high' | 'medium' | 'low'; description: string }> = [];

    // Long time in stage
    if ((deal.daysInStage || 0) > 21) {
      risks.push({
        factor: 'extended_stage_time',
        severity: 'high',
        description: `Deal has been in current stage for ${deal.daysInStage} days`,
      });
    } else if ((deal.daysInStage || 0) > 14) {
      risks.push({
        factor: 'potential_stall',
        severity: 'medium',
        description: `Deal showing signs of stalling after ${deal.daysInStage} days`,
      });
    }

    // Low score
    if ((deal.score?.overall || 0) < 30) {
      risks.push({
        factor: 'low_fit_score',
        severity: 'high',
        description: 'Deal has low ICP fit score - may not be a good fit',
      });
    }

    // Low engagement
    if ((deal.score?.engagement || 0) < 20) {
      risks.push({
        factor: 'no_engagement',
        severity: 'high',
        description: 'No meaningful engagement detected',
      });
    }

    // Negative sentiment
    if ((deal.score?.sentiment || 50) < 30) {
      risks.push({
        factor: 'negative_sentiment',
        severity: 'medium',
        description: 'Recent interactions show negative sentiment',
      });
    }

    // No signals
    if (!deal.signalIds?.length && (deal.score?.intent || 0) < 40) {
      risks.push({
        factor: 'no_intent_signals',
        severity: 'medium',
        description: 'No buying intent signals detected for this account',
      });
    }

    return risks;
  }

  /**
   * Score a deal and update in database
   */
  static async scoreDeal(dealId: string): Promise<IDeal | null> {
    const deal = await DealModel.findOne({ dealId });
    if (!deal) return null;

    // Calculate new score
    const scoringResult = this.calculateScore({
      companyScore: deal.score?.companyFit,
      signalScore: deal.score?.intent,
      engagementScore: deal.score?.engagement,
      sentimentScore: deal.score?.sentiment,
      daysStalled: deal.daysInStage > 7 ? deal.daysInStage - 7 : 0,
    });

    // Generate predictions and recommendations
    const winPrediction = this.predictWinProbability(deal);
    const recommendations = this.generateRecommendations(deal);
    const riskFactors = this.detectRiskFactors(deal);

    // Update deal
    deal.score = scoringResult.breakdown;
    deal.score.overall = scoringResult.overall;
    deal.temperature = scoringResult.temperature;
    deal.winPrediction = {
      ...winPrediction,
      lastUpdated: new Date(),
    };
    deal.recommendations = recommendations.map(r => ({
      id: uuidv4(),
      ...r,
      createdAt: new Date(),
    }));
    deal.riskFactors = riskFactors.map(r => ({
      ...r,
      detectedAt: new Date(),
    }));

    await deal.save();

    logger.info('Deal scored', {
      dealId,
      overall: scoringResult.overall,
      temperature: scoringResult.temperature,
    });

    return deal;
  }
}

export default DealScoringService;
