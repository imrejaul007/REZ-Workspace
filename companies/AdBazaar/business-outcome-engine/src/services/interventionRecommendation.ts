import { Intervention, BusinessGoal, Prediction, OutcomeTrackingEvent } from '../models/index.js';
import {
  InterventionType,
  InterventionRecommendation,
  OutcomeType,
  OutcomeStatus,
  PredictionResult,
} from '../types/index.js';
import { interventionLogger } from 'utils/logger.js';
import { recordIntervention, startTimer } from '../utils/metrics.js';

// Generate unique IDs
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Intervention Recommendation Service
 * Recommends actions to achieve business goals based on predictions and current status
 */
export class InterventionRecommendationService {
  /**
   * Get intervention recommendations for a business goal
   */
  async getRecommendations(
    goalId: string,
    maxRecommendations: number = 5
  ): Promise<InterventionRecommendation> {
    const endTimer = startTimer();
    interventionLogger.info('Generating recommendations', { goalId });

    try {
      // Fetch goal and related data
      const goal = await BusinessGoal.findOne({ goalId }).lean();
      if (!goal) {
        throw new Error(`Goal not found: ${goalId}`);
      }

      // Get recent prediction if available
      const prediction = await Prediction.findOne({
        businessId: goal.businessId,
        outcomeType: goal.type,
      })
        .sort({ predictionDate: -1 })
        .lean();

      // Get recent tracking events
      const recentEvents = await OutcomeTrackingEvent.find({
        businessId: goal.businessId,
        outcomeType: goal.type,
      })
        .sort({ timestamp: -1 })
        .limit(30)
        .lean();

      // Calculate progress and trajectory
      const progress = goal.targetValue > 0
        ? ((goal.currentValue / goal.targetValue) * 100)
        : 0;

      const daysRemaining = Math.ceil(
        (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const requiredDailyProgress = daysRemaining > 0
        ? (goal.targetValue - goal.currentValue) / daysRemaining
        : 0;

      // Analyze trajectory from recent events
      const trajectory = this.analyzeTrajectory(recentEvents);
      const isAtRisk = trajectory < requiredDailyProgress && daysRemaining > 0;
      const isBehind = progress < 50 && daysRemaining < 30;

      // Generate recommendations based on goal type and status
      const recommendations = this.generateRecommendations(
        goal,
        prediction,
        progress,
        daysRemaining,
        requiredDailyProgress,
        isAtRisk,
        isBehind
      );

      // Sort by priority and limit
      recommendations.sort((a, b) => a.priority - b.priority);
      const limitedRecommendations = recommendations.slice(0, maxRecommendations);

      // Calculate overall confidence based on data quality
      const confidence = this.calculateConfidence(recentEvents.length, trajectory !== 0);

      // Generate reasoning
      const reasoning = this.generateReasoning(
        goal,
        progress,
        daysRemaining,
        isAtRisk,
        isBehind,
        trajectory,
        requiredDailyProgress
      );

      const result: InterventionRecommendation = {
        recommendations: limitedRecommendations,
        reasoning,
        confidence,
      };

      interventionLogger.info('Recommendations generated', {
        goalId,
        recommendationCount: limitedRecommendations.length,
        confidence,
        duration: endTimer(),
      });

      return result;
    } catch (error) {
      interventionLogger.error('Failed to generate recommendations', error, { goalId });
      throw error;
    }
  }

  /**
   * Analyze trajectory from recent events
   */
  private analyzeTrajectory(events: Array<{ value: number; timestamp: Date }>): number {
    if (events.length < 2) return 0;

    // Sort by timestamp (oldest first)
    const sorted = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate average daily change
    const firstValue = sorted[0].value;
    const lastValue = sorted[sorted.length - 1].value;
    const daysDiff = Math.max(1,
      (sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (lastValue - firstValue) / daysDiff;
  }

  /**
   * Calculate confidence in recommendations
   */
  private calculateConfidence(dataPoints: number, hasTrajectory: boolean): number {
    let confidence = 0.3; // Base confidence

    if (dataPoints >= 30) confidence += 0.3;
    else if (dataPoints >= 14) confidence += 0.2;
    else if (dataPoints >= 7) confidence += 0.1;

    if (hasTrajectory) confidence += 0.2;

    return Math.min(0.9, confidence);
  }

  /**
   * Generate recommendations based on goal context
   */
  private generateRecommendations(
    goal: { businessId: string; type: OutcomeType; targetValue: number; currentValue: number },
    prediction: PredictionResult | null,
    progress: number,
    daysRemaining: number,
    requiredDailyProgress: number,
    isAtRisk: boolean,
    isBehind: boolean
  ): InterventionRecommendation['recommendations'] {
    const recommendations: InterventionRecommendation['recommendations'] = [];
    const gap = goal.targetValue - goal.currentValue;

    // High-priority interventions for at-risk goals
    if (isAtRisk || isBehind) {
      recommendations.push(this.createDiscountRecommendation(goal, gap, 1));
      recommendations.push(this.createReEngagementRecommendation(goal, 2));
      recommendations.push(this.createLoyaltyOfferRecommendation(goal, gap, 3));
    }

    // Outcome-type specific recommendations
    switch (goal.type) {
      case OutcomeType.REVENUE:
        recommendations.push(this.createUpsellRecommendation(goal, 4));
        recommendations.push(this.createCrossSellRecommendation(goal, 5));
        recommendations.push(this.createPremiumUpgradeRecommendation(goal, 6));
        break;

      case OutcomeType.LTV:
        recommendations.push(this.createLoyaltyTierRecommendation(goal, 4));
        recommendations.push(this.createReferralIncentiveRecommendation(goal, 5));
        break;

      case OutcomeType.CHURN:
        recommendations.push(this.createWinBackRecommendation(goal, 4));
        recommendations.push(this.createPersonalizedContentRecommendation(goal, 5));
        break;

      case OutcomeType.CONVERSION:
        recommendations.push(this.createPersonalizedContentRecommendation(goal, 4));
        recommendations.push(this.createLoyaltyOfferRecommendation(goal, gap, 5));
        break;

      case OutcomeType.RETENTION:
        recommendations.push(this.createLoyaltyTierRecommendation(goal, 4));
        recommendations.push(this.createReferralIncentiveRecommendation(goal, 5));
        break;

      case OutcomeType.ENGAGEMENT:
        recommendations.push(this.createPersonalizedContentRecommendation(goal, 4));
        recommendations.push(this.createReEngagementRecommendation(goal, 5));
        break;
    }

    // Add prediction-based recommendation if available
    if (prediction) {
      const predictedVsTarget = goal.targetValue - prediction.predictedValue;
      if (predictedVsTarget > goal.targetValue * 0.1) {
        recommendations.push(this.createAggressiveCampaignRecommendation(goal, 2));
      }
    }

    return recommendations;
  }

  /**
   * Create discount recommendation
   */
  private createDiscountRecommendation(
    goal: { businessId: string; targetValue: number; currentValue: number },
    gap: number,
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    const discountPercent = Math.min(30, Math.max(5, gap / goal.targetValue * 100));
    const estimatedImpact = goal.targetValue * 0.15;

    return {
      interventionType: InterventionType.DISCOUNT,
      priority,
      expectedOutcome: {
        metric: 'revenue',
        improvement: estimatedImpact,
        timeframe: '7 days',
      },
      actions: [
        { step: 1, action: 'Launch limited-time discount campaign', parameters: { percent: discountPercent } },
        { step: 2, action: 'Target high-value customers with personalized offers', parameters: {} },
        { step: 3, action: 'Monitor conversion rates and adjust discount level', parameters: {} },
      ],
      estimatedCost: goal.targetValue * 0.05,
      estimatedROI: 2.5,
      riskLevel: 'medium',
    };
  }

  /**
   * Create re-engagement recommendation
   */
  private createReEngagementRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.RE_ENGAGEMENT,
      priority,
      expectedOutcome: {
        metric: 'active_users',
        improvement: goal.businessId ? 0.2 : 0,
        timeframe: '14 days',
      },
      actions: [
        { step: 1, action: 'Identify dormant customers from last 30 days', parameters: {} },
        { step: 2, action: 'Send re-engagement email with special offer', parameters: { days: 7 } },
        { step: 3, action: 'Follow up with push notification if no response', parameters: {} },
      ],
      estimatedCost: 500,
      estimatedROI: 3.0,
      riskLevel: 'low',
    };
  }

  /**
   * Create loyalty offer recommendation
   */
  private createLoyaltyOfferRecommendation(
    goal: { targetValue: number },
    gap: number,
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.LOYALTY_OFFER,
      priority,
      expectedOutcome: {
        metric: 'repeat_purchases',
        improvement: goal.targetValue * 0.1,
        timeframe: '21 days',
      },
      actions: [
        { step: 1, action: 'Offer double points on next purchase', parameters: {} },
        { step: 2, action: 'Create exclusive loyalty tier upgrade opportunity', parameters: {} },
        { step: 3, action: 'Personalize offer based on purchase history', parameters: {} },
      ],
      estimatedCost: goal.targetValue * 0.03,
      estimatedROI: 4.0,
      riskLevel: 'low',
    };
  }

  /**
   * Create upsell recommendation
   */
  private createUpsellRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.UPSELL,
      priority,
      expectedOutcome: {
        metric: 'average_order_value',
        improvement: 0.25,
        timeframe: '30 days',
      },
      actions: [
        { step: 1, action: 'Implement product recommendation engine', parameters: {} },
        { step: 2, action: 'Train staff on upselling techniques', parameters: {} },
        { step: 3, action: 'Add bundle offers at checkout', parameters: {} },
      ],
      estimatedCost: 1000,
      estimatedROI: 5.0,
      riskLevel: 'low',
    };
  }

  /**
   * Create cross-sell recommendation
   */
  private createCrossSellRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.CROSS_SELL,
      priority,
      expectedOutcome: {
        metric: 'basket_size',
        improvement: 0.3,
        timeframe: '30 days',
      },
      actions: [
        { step: 1, action: 'Analyze purchase patterns for complementary products', parameters: {} },
        { step: 2, action: 'Implement cross-sell suggestions on product pages', parameters: {} },
        { step: 3, action: 'Create product bundles with discount', parameters: {} },
      ],
      estimatedCost: 800,
      estimatedROI: 4.5,
      riskLevel: 'low',
    };
  }

  /**
   * Create premium upgrade recommendation
   */
  private createPremiumUpgradeRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.PREMIUM_UPGRADE,
      priority,
      expectedOutcome: {
        metric: 'customer_value',
        improvement: 0.5,
        timeframe: '60 days',
      },
      actions: [
        { step: 1, action: 'Identify customers eligible for premium tier', parameters: {} },
        { step: 2, action: 'Create limited-time upgrade offer with benefits', parameters: {} },
        { step: 3, action: 'Follow up with personalized upgrade benefits', parameters: {} },
      ],
      estimatedCost: 2000,
      estimatedROI: 3.5,
      riskLevel: 'medium',
    };
  }

  /**
   * Create win-back recommendation
   */
  private createWinBackRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.WIN_BACK,
      priority,
      expectedOutcome: {
        metric: 'reactivated_customers',
        improvement: 0.15,
        timeframe: '30 days',
      },
      actions: [
        { step: 1, action: 'Identify churned customers from last 90 days', parameters: {} },
        { step: 2, action: 'Create win-back campaign with special offer', parameters: {} },
        { step: 3, action: 'Personalize messaging based on previous relationship', parameters: {} },
      ],
      estimatedCost: 1500,
      estimatedROI: 2.0,
      riskLevel: 'medium',
    };
  }

  /**
   * Create personalized content recommendation
   */
  private createPersonalizedContentRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.PERSONALIZED_CONTENT,
      priority,
      expectedOutcome: {
        metric: 'engagement_rate',
        improvement: 0.4,
        timeframe: '14 days',
      },
      actions: [
        { step: 1, action: 'Segment customers based on behavior and preferences', parameters: {} },
        { step: 2, action: 'Create personalized content for each segment', parameters: {} },
        { step: 3, action: 'A/B test content variations', parameters: {} },
      ],
      estimatedCost: 600,
      estimatedROI: 3.0,
      riskLevel: 'low',
    };
  }

  /**
   * Create loyalty tier recommendation
   */
  private createLoyaltyTierRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.LOYALTY_TIER,
      priority,
      expectedOutcome: {
        metric: 'customer_retention',
        improvement: 0.25,
        timeframe: '60 days',
      },
      actions: [
        { step: 1, action: 'Review current loyalty program structure', parameters: {} },
        { step: 2, action: 'Add new premium tier with exclusive benefits', parameters: {} },
        { step: 3, action: 'Promote tier upgrade to high-value customers', parameters: {} },
      ],
      estimatedCost: 1200,
      estimatedROI: 4.0,
      riskLevel: 'low',
    };
  }

  /**
   * Create referral incentive recommendation
   */
  private createReferralIncentiveRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.REFERRAL_INCENTIVE,
      priority,
      expectedOutcome: {
        metric: 'new_customers',
        improvement: 0.2,
        timeframe: '30 days',
      },
      actions: [
        { step: 1, action: 'Create referral program with attractive incentives', parameters: {} },
        { step: 2, action: 'Promote program to existing customers', parameters: {} },
        { step: 3, action: 'Track referral conversions and optimize incentives', parameters: {} },
      ],
      estimatedCost: 1000,
      estimatedROI: 3.5,
      riskLevel: 'low',
    };
  }

  /**
   * Create aggressive campaign recommendation
   */
  private createAggressiveCampaignRecommendation(
    goal: { businessId: string },
    priority: number
  ): InterventionRecommendation['recommendations'][0] {
    return {
      interventionType: InterventionType.DISCOUNT,
      priority,
      expectedOutcome: {
        metric: 'revenue',
        improvement: goal.businessId ? 0.3 : 0,
        timeframe: '7 days',
      },
      actions: [
        { step: 1, action: 'Launch urgent campaign with time-limited offer', parameters: {} },
        { step: 2, action: 'Increase marketing spend by 50%', parameters: {} },
        { step: 3, action: 'Activate all customer touchpoints', parameters: {} },
      ],
      estimatedCost: goal.businessId ? 5000 : 0,
      estimatedROI: 2.0,
      riskLevel: 'high',
    };
  }

  /**
   * Generate reasoning text for recommendations
   */
  private generateReasoning(
    goal: { type: OutcomeType; targetValue: number; currentValue: number },
    progress: number,
    daysRemaining: number,
    isAtRisk: boolean,
    isBehind: boolean,
    trajectory: number,
    requiredDailyProgress: number
  ): string {
    const outcomeTypeName = goal.type.replace('_', ' ');
    let reasoning = '';

    if (isBehind) {
      reasoning = `Current progress (${progress.toFixed(1)}%) is behind schedule with ${daysRemaining} days remaining. `;
      reasoning += `The recommended interventions prioritize quick wins and high-impact actions to close the ${((goal.targetValue - goal.currentValue) / goal.targetValue * 100).toFixed(1)}% gap. `;
    } else if (isAtRisk) {
      reasoning = `While progress (${progress.toFixed(1)}%) is on track, the current trajectory may not meet the ${daysRemaining}-day deadline. `;
      reasoning += `The recommended interventions are designed to accelerate growth and ensure goal achievement. `;
    } else {
      reasoning = `Progress (${progress.toFixed(1)}%) is on track for ${outcomeTypeName} goal. `;
      reasoning += `These recommendations will help optimize performance and potentially exceed targets. `;
    }

    if (trajectory !== 0) {
      const trajectoryDirection = trajectory > 0 ? 'increasing' : 'decreasing';
      reasoning += `The ${outcomeTypeName} trend is ${trajectoryDirection} at ${Math.abs(trajectory).toFixed(2)} per day. `;
    }

    if (requiredDailyProgress > 0) {
      reasoning += `To meet the target, we need to achieve ${requiredDailyProgress.toFixed(2)} per day.`;
    }

    return reasoning;
  }

  /**
   * Apply an intervention
   */
  async applyIntervention(
    goalId: string,
    interventionType: InterventionType,
    description: string,
    expectedImpact: number,
    priority: number,
    options?: { cost?: number; estimatedROI?: number }
  ): Promise<string> {
    const interventionId = generateId('int');

    const intervention = await Intervention.create({
      interventionId,
      goalId,
      businessId: (await BusinessGoal.findOne({ goalId }))?.businessId || '',
      type: interventionType,
      description,
      expectedImpact,
      confidence: 0.7,
      priority,
      cost: options?.cost,
      estimatedROI: options?.estimatedROI,
      status: 'applied',
      appliedAt: new Date(),
    });

    recordIntervention(interventionType, 'applied', expectedImpact);

    interventionLogger.info('Intervention applied', { interventionId, goalId, interventionType });

    return interventionId;
  }

  /**
   * Get interventions for a goal
   */
  async getInterventions(goalId: string): Promise<any[]> {
    return Intervention.find({ goalId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Update intervention result
   */
  async updateInterventionResult(
    interventionId: string,
    actualImpact: number,
    achieved: boolean,
    notes?: string
  ): Promise<void> {
    const intervention = await Intervention.findOneAndUpdate(
      { interventionId },
      {
        status: 'completed',
        result: {
          actualImpact,
          achieved,
          notes,
        },
      },
      { new: true }
    );

    if (intervention) {
      recordIntervention(intervention.type, 'completed', intervention.expectedImpact, actualImpact, achieved);
      interventionLogger.info('Intervention result updated', { interventionId, actualImpact, achieved });
    }
  }
}

// Export singleton instance
export const interventionRecommendationService = new InterventionRecommendationService();
export default interventionRecommendationService;