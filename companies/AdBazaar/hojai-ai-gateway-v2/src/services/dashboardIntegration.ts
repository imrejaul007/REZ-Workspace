/**
 * AdBazaar Dashboard Integration
 *
 * Hooks to connect Hojai AI Gateway to AdBazaar Dashboard.
 */

import { HojaiAIService } from './aiService';
import { CacheService } from './cache';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardContext {
  tenantId: string;
  merchantId?: string;
  userId?: string;
}

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export class DashboardIntegration {
  constructor(
    private aiService: HojaiAIService,
    private cacheService: CacheService
  ) {}

  // ==========================================================================
  // CAMPAIGN INTELLIGENCE
  // ==========================================================================

  /**
   * Get campaign recommendations for dashboard
   */
  async getCampaignRecommendations(params: {
    merchantId: string;
    objective: string;
    budget: number;
  }): Promise<{
    recommendedObjective: string;
    suggestedBudget: number;
    targetingSuggestions: Record<string, unknown>;
    estimatedPerformance: {
      impressions: number;
      clicks: number;
      conversions: number;
      roas: number;
    };
    creativeSuggestions: {
      headlines: string[];
      ctas: string[];
    };
  }> {
    const { objective, budget } = params;

    // Get targeting optimization
    const targeting = await this.aiService.optimizeTargeting(objective, budget);

    // Get campaign prediction
    const prediction = await this.aiService.predictCampaign(budget);

    // Get creative suggestions
    const creative = await this.aiService.generateCreative('Your Product', objective);

    return {
      recommendedObjective: objective,
      suggestedBudget: budget,
      targetingSuggestions: targeting.targetingParams,
      estimatedPerformance: {
        impressions: prediction.expectedImpressions,
        clicks: prediction.expectedClicks,
        conversions: prediction.expectedConversions,
        roas: prediction.expectedROAS,
      },
      creativeSuggestions: {
        headlines: creative.headlines,
        ctas: creative.ctas,
      },
    };
  }

  // ==========================================================================
  // AUDIENCE INSIGHTS
  // ==========================================================================

  /**
   * Get audience insights for dashboard
   */
  async getAudienceInsights(params: {
    merchantId: string;
    criteria?: Record<string, unknown>;
  }): Promise<{
    segments: Array<{
      id: string;
      name: string;
      size: number;
      matchScore: number;
      characteristics: string[];
    }>;
    totalReach: number;
    demographics: {
      age: Record<string, number>;
      location: Record<string, number>;
    };
  }> {
    const segments = await this.aiService.generateAudience(params.criteria);

    return {
      segments: segments.segments.map(s => ({
        ...s,
        characteristics: this.getSegmentCharacteristics(s.name),
      })),
      totalReach: segments.totalReach,
      demographics: {
        age: { '25-34': 0.4, '35-44': 0.3, '18-24': 0.2, '45+': 0.1 },
        location: { Mumbai: 0.3, Delhi: 0.25, Bangalore: 0.2, 'Other': 0.25 },
      },
    };
  }

  private getSegmentCharacteristics(segmentName: string): string[] {
    const characteristics: Record<string, string[]> = {
      'High Intent': ['Recently searched', 'High engagement', 'Purchase ready'],
      'Price Sensitive': ['Deal seekers', 'Compare prices', 'Use coupons'],
      'Loyal Customers': ['Repeat buyers', 'Brand advocates', 'High LTV'],
      'New Users': ['First-time visitors', 'Exploring', 'No purchase history'],
      'Win-Back': ['Inactive 30+ days', 'Previous customers', 'Churn risk'],
    };
    return characteristics[segmentName] || ['General audience'];
  }

  // ==========================================================================
  // USER INTELLIGENCE
  // ==========================================================================

  /**
   * Get user intelligence for customer view
   */
  async getUserIntelligence(userId: string): Promise<{
    intent: {
      current: string;
      confidence: number;
      recommendations: string[];
    };
    behavior: {
      churnRisk: 'low' | 'medium' | 'high';
      ltvScore: number;
      purchaseProbability: number;
    };
    nextBestAction: {
      action: string;
      confidence: number;
      expectedOutcome: string;
    };
  }> {
    // Check cache
    const cached = await this.cacheService.get(`user:${userId}`);
    if (cached) {
      return cached as ReturnType<typeof this.getUserIntelligence extends (...args: unknown[]) => Promise<infer T> ? T : never>;
    }

    // Get predictions
    const [intent, behavior, nextAction] = await Promise.all([
      this.aiService.predictIntent(userId),
      this.aiService.predictBehavior(userId),
      this.aiService.nextBestAction(userId),
    ]);

    const result = {
      intent: {
        current: intent.intent,
        confidence: intent.confidence,
        recommendations: intent.recommendations,
      },
      behavior: {
        churnRisk: behavior.churnRisk,
        ltvScore: behavior.ltvScore,
        purchaseProbability: behavior.purchaseProbability,
      },
      nextBestAction: {
        action: nextAction.action,
        confidence: nextAction.confidence,
        expectedOutcome: nextAction.expectedOutcome,
      },
    };

    // Cache for 5 minutes
    await this.cacheService.set(`user:${userId}`, result, 300);

    return result;
  }

  // ==========================================================================
  // PERFORMANCE PREDICTION
  // ==========================================================================

  /**
   * Predict campaign performance
   */
  async predictPerformance(params: {
    objective: string;
    budget: number;
    targeting: Record<string, unknown>;
  }): Promise<{
    predictions: {
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      cpm: number;
      cpc: number;
      roas: number;
    };
    confidence: number;
    factors: string[];
    recommendations: string[];
  }> {
    const { objective, budget, targeting } = params;

    const prediction = await this.aiService.predictCampaign(budget, targeting);

    return {
      predictions: {
        impressions: prediction.expectedImpressions,
        clicks: prediction.expectedClicks,
        conversions: prediction.expectedConversions,
        ctr: prediction.expectedClicks / prediction.expectedImpressions,
        cpm: prediction.expectedCPM,
        cpc: prediction.expectedCPC,
        roas: prediction.expectedROAS,
      },
      confidence: prediction.confidence,
      factors: [
        'Historical campaign data',
        'Audience targeting',
        'Budget allocation',
      ],
      recommendations: this.getPerformanceRecommendations(prediction),
    };
  }

  private getPerformanceRecommendations(prediction: {
    expectedROAS: number;
    expectedCTR: number;
  }): string[] {
    const recommendations: string[] = [];

    if (prediction.expectedROAS < 2) {
      recommendations.push('Consider adjusting targeting to improve ROAS');
    }

    if (prediction.expectedCTR < 0.03) {
      recommendations.push('Test new creative variations to improve CTR');
    }

    recommendations.push('Monitor campaign performance in first 24 hours');

    return recommendations;
  }

  // ==========================================================================
  // FRAUD MONITORING
  // ==========================================================================

  /**
   * Check for fraud indicators
   */
  async checkFraud(params: {
    campaignId: string;
    events: Array<{ type: string; timestamp: number; userId: string }>;
  }): Promise<{
    isSafe: boolean;
    riskScore: number;
    indicators: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    recommendations: string[];
  }> {
    const fraudCheck = await this.aiService.detectFraud(undefined, params.events);

    return {
      isSafe: !fraudCheck.isFraudulent,
      riskScore: fraudCheck.fraudScore,
      indicators: fraudCheck.riskFactors.map(factor => ({
        type: factor,
        severity: 'medium' as const,
        description: `Detected ${factor.toLowerCase()}`,
      })),
      recommendations: fraudCheck.isFraudulent
        ? ['Pause campaign', 'Review fraud settings', 'Contact support']
        : ['Continue monitoring', 'Set up alerts'],
    };
  }
}
