import { MerchantProfileDocument, MerchantScoreModel } from '../models';
import {
  MerchantRecommendations,
  StrategicRecommendation,
  PrioritizedAction,
  NextBestAction,
} from '../types';

export class RecommendationService {
  /**
   * Generate personalized recommendations for a merchant
   */
  async generateRecommendations(profile: MerchantProfileDocument): Promise<MerchantRecommendations> {
    const scores = await MerchantScoreModel.findOne({ merchantId: profile.merchantId });
    const strategicRecommendations = this.generateStrategicRecommendations(profile, scores);
    const prioritizedActions = this.generatePrioritizedActions(profile, scores, strategicRecommendations);
    const nextBestActions = this.generateNextBestActions(profile, scores);

    const generatedAt = new Date();
    const validUntil = new Date(generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // Valid for 7 days

    return {
      merchantId: profile.merchantId,
      recommendations: strategicRecommendations,
      prioritizedActions,
      nextBestActions,
      generatedAt,
      validUntil,
    };
  }

  /**
   * Generate strategic recommendations based on merchant profile
   */
  private generateStrategicRecommendations(
    profile: MerchantProfileDocument,
    scores: unknown
  ): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = [];
    const healthScore = scores?.healthScore?.score || 50;
    const growthScore = scores?.growthScore?.score || 50;
    const engagementScore = scores?.engagementScore?.score || 50;

    // Growth recommendations
    if (growthScore < 70) {
      recommendations.push({
        id: 'strat-growth-1',
        category: 'growth',
        title: 'Accelerate revenue growth',
        description: 'Focus on increasing average order value and customer acquisition',
        impact: { revenue: 15000, cost: 2000, effort: 5 },
        timeframe: 'short_term',
        priority: 1,
        confidence: 0.8,
      });
    }

    // Efficiency recommendations
    if (healthScore < 70) {
      recommendations.push({
        id: 'strat-efficiency-1',
        category: 'efficiency',
        title: 'Improve operational efficiency',
        description: 'Optimize inventory management and reduce out-of-stock incidents',
        impact: { revenue: 5000, cost: -3000, effort: 4 },
        timeframe: 'short_term',
        priority: 2,
        confidence: 0.85,
      });
    }

    // Retention recommendations
    const retentionRate = profile.customerDemographics?.retentionRate || 0;
    if (retentionRate < 0.6) {
      recommendations.push({
        id: 'strat-retention-1',
        category: 'retention',
        title: 'Implement customer loyalty program',
        description: 'Launch rewards program to improve customer retention and lifetime value',
        impact: { revenue: 8000, cost: 1500, effort: 6 },
        timeframe: 'short_term',
        priority: 1,
        confidence: 0.75,
      });
    }

    // Marketing recommendations
    const peakHours = profile.peakHoursDays?.hourlyDistribution || [];
    const hasOffPeak = peakHours.some(h => h.orderCount < 10);
    if (hasOffPeak) {
      recommendations.push({
        id: 'strat-marketing-1',
        category: 'marketing',
        title: 'Off-peak promotion campaign',
        description: 'Target slow hours with special promotions to balance demand',
        impact: { revenue: 6000, cost: 1000, effort: 3 },
        timeframe: 'quick_win',
        priority: 2,
        confidence: 0.9,
      });
    }

    // Operations recommendations
    if (profile.inventoryPatterns?.outOfStock && profile.inventoryPatterns.outOfStock > 0) {
      recommendations.push({
        id: 'strat-ops-1',
        category: 'operations',
        title: 'Improve inventory forecasting',
        description: 'Implement better demand prediction to reduce stockouts',
        impact: { revenue: 10000, cost: 0, effort: 5 },
        timeframe: 'long_term',
        priority: 1,
        confidence: 0.7,
      });
    }

    // Finance recommendations
    const aov = profile.revenuePatterns?.averageOrderValue || 0;
    if (aov < 40) {
      recommendations.push({
        id: 'strat-finance-1',
        category: 'finance',
        title: 'Increase average order value',
        description: 'Bundle products and offer volume discounts to increase basket size',
        impact: { revenue: 12000, cost: 0, effort: 2 },
        timeframe: 'quick_win',
        priority: 3,
        confidence: 0.85,
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate prioritized action items
   */
  private generatePrioritizedActions(
    profile: MerchantProfileDocument,
    scores,
    recommendations: StrategicRecommendation[]
  ): PrioritizedAction[] {
    const actions: PrioritizedAction[] = [];

    // Critical health actions
    if ((scores?.healthScore?.score || 50) < 40) {
      actions.push({
        id: 'action-health-1',
        action: 'Address critical health issues immediately',
        reason: 'Health score is below 40 - immediate attention required',
        expectedResult: 'Improve health score to above 60',
        priority: 1,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Growth actions
    if ((scores?.growthScore?.score || 50) < 60) {
      actions.push({
        id: 'action-growth-1',
        action: 'Launch customer acquisition campaign',
        reason: 'Growth score indicates need for customer base expansion',
        expectedResult: 'Increase new customer acquisition by 25%',
        priority: 2,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        assignedTeam: 'Marketing',
      });
    }

    // Top recommendation actions
    recommendations.slice(0, 2).forEach((rec, idx) => {
      actions.push({
        id: `action-rec-${idx}`,
        action: `Implement: ${rec.title}`,
        reason: rec.description,
        expectedResult: rec.impact.revenue > 0 ? `$${rec.impact.revenue} additional revenue` : 'Cost reduction',
        priority: rec.priority + 2,
        assignedTeam: this.getTeamForCategory(rec.category),
      });
    });

    // Inventory actions
    const outOfStock = profile.inventoryPatterns?.outOfStock || 0;
    if (outOfStock > 0) {
      actions.push({
        id: 'action-inventory-1',
        action: 'Restock top-selling out-of-stock items',
        reason: `${outOfStock} products currently out of stock`,
        expectedResult: 'Reduce out-of-stock to 0',
        priority: 1,
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get team assignment based on category
   */
  private getTeamForCategory(category: string): string {
    const teamMap: Record<string, string> = {
      growth: 'Growth Team',
      efficiency: 'Operations',
      retention: 'Customer Success',
      marketing: 'Marketing',
      operations: 'Operations',
      finance: 'Finance',
    };
    return teamMap[category] || 'General';
  }

  /**
   * Generate next best actions for immediate execution
   */
  private generateNextBestActions(
    profile: MerchantProfileDocument,
    scores: unknown
  ): NextBestAction[] {
    const actions: NextBestAction[] = [];

    // Health-based next actions
    const healthComponents = scores?.healthScore?.components || {};
    if (healthComponents.feedback < 0.7) {
      actions.push({
        action: 'Respond to pending customer feedback',
        context: 'Feedback score below target',
        personalization: 'Review all unresponded feedback items and address concerns',
        conversionProbability: 0.85,
      });
    }

    if (healthComponents.inventory < 0.7) {
      actions.push({
        action: 'Review low-stock inventory items',
        context: 'Inventory health needs improvement',
        personalization: 'Prioritize items with high demand and low stock',
        conversionProbability: 0.8,
      });
    }

    // Growth-based next actions
    const growthComponents = scores?.growthScore?.components || {};
    if (growthComponents.customerGrowth < 0.5) {
      actions.push({
        action: 'Launch referral program',
        context: 'Customer acquisition below target',
        personalization: 'Offer existing customers incentive to refer new ones',
        conversionProbability: 0.7,
      });
    }

    // Engagement-based next actions
    if (profile.lastSyncedAt) {
      const hoursSinceSync = (Date.now() - new Date(profile.lastSyncedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceSync > 24) {
        actions.push({
          action: 'Update merchant profile',
          context: 'Profile not updated recently',
          personalization: 'Sync latest data and update business information',
          conversionProbability: 0.9,
        });
      }
    }

    // Alert-based next action
    const unacknowledgedAlerts = profile.healthSignals?.alerts?.filter(a => !a.acknowledged) || [];
    if (unacknowledgedAlerts.length > 0) {
      actions.push({
        action: 'Review and acknowledge alerts',
        context: `${unacknowledgedAlerts.length} pending alerts`,
        personalization: 'Address high-severity alerts first',
        conversionProbability: 0.95,
      });
    }

    return actions;
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
