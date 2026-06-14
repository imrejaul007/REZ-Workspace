import { MerchantProfileDocument } from '../models';
import {
  MerchantInsights,
  InsightSummary,
  Opportunity,
  Threat,
  Recommendation,
  Comparison,
  Prediction,
  OpportunityType,
  ThreatType,
} from '../types';

export class InsightsService {
  /**
   * Generate comprehensive insights for a merchant
   */
  async generateInsights(profile: MerchantProfileDocument): Promise<MerchantInsights> {
    const summary = this.generateSummary(profile);
    const opportunities = this.identifyOpportunities(profile);
    const threats = this.identifyThreats(profile);
    const recommendations = this.generateRecommendations(profile, opportunities, threats);
    const comparisons = this.generateComparisons(profile);
    const predictions = this.generatePredictions(profile);

    return {
      merchantId: profile.merchantId,
      summary,
      opportunities,
      threats,
      recommendations,
      comparisons,
      predictions,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate overall performance summary
   */
  private generateSummary(profile: MerchantProfileDocument): InsightSummary {
    const revenuePatterns = profile.revenuePatterns || {};
    const orderVolume = profile.orderVolume || {};
    const customerDemographics = profile.customerDemographics || {};
    const growthMetrics = profile.growthMetrics || {};

    // Calculate overall performance score
    const revenueScore = (revenuePatterns.revenueGrowth?.mom || 0) > 0 ? 1 : 0;
    const orderScore = (orderVolume.completed || 0) > 0 ? 1 : 0;
    const customerScore = (customerDemographics.retentionRate || 0) > 0.5 ? 1 : 0;
    const growthScore = (growthMetrics.revenue?.percentageChange || 0) > 0 ? 1 : 0;

    const avgScore = (revenueScore + orderScore + customerScore + growthScore) / 4;

    let overallPerformance: InsightSummary['overallPerformance'];
    if (avgScore >= 0.9) overallPerformance = 'excellent';
    else if (avgScore >= 0.75) overallPerformance = 'good';
    else if (avgScore >= 0.5) overallPerformance = 'average';
    else if (avgScore >= 0.25) overallPerformance = 'below_average';
    else overallPerformance = 'poor';

    const keyHighlights = this.identifyHighlights(profile);
    const keyConcerns = this.identifyConcerns(profile);

    // Competitive position (mock calculation)
    const competitivePosition = Math.round(50 + (avgScore * 50));

    return {
      overallPerformance,
      keyHighlights,
      keyConcerns,
      competitivePosition,
    };
  }

  /**
   * Identify key highlights
   */
  private identifyHighlights(profile: MerchantProfileDocument): string[] {
    const highlights: string[] = [];
    const revenuePatterns = profile.revenuePatterns || {};
    const customerDemographics = profile.customerDemographics || {};
    const growthMetrics = profile.growthMetrics || {};

    if ((revenuePatterns.revenueGrowth?.mom || 0) > 10) {
      highlights.push(`Strong revenue growth of ${revenuePatterns.revenueGrowth.mom.toFixed(1)}% MoM`);
    }

    if ((customerDemographics.retentionRate || 0) > 0.7) {
      highlights.push(`Excellent customer retention rate of ${((customerDemographics.retentionRate || 0) * 100).toFixed(0)}%`);
    }

    if ((growthMetrics.orders?.percentageChange || 0) > 15) {
      highlights.push(`Order volume increased by ${growthMetrics.orders.percentageChange.toFixed(1)}%`);
    }

    if ((revenuePatterns.averageOrderValue || 0) > 50) {
      highlights.push(`Above-average order value of $${revenuePatterns.averageOrderValue.toFixed(2)}`);
    }

    const popularItems = profile.popularItems?.items || [];
    if (popularItems.length > 0) {
      highlights.push(`${popularItems.length} popular items driving sales`);
    }

    return highlights;
  }

  /**
   * Identify key concerns
   */
  private identifyConcerns(profile: MerchantProfileDocument): string[] {
    const concerns: string[] = [];
    const revenuePatterns = profile.revenuePatterns || {};
    const customerDemographics = profile.customerDemographics || {};
    const inventoryPatterns = profile.inventoryPatterns || {};
    const healthSignals = profile.healthSignals || {};

    if ((revenuePatterns.revenueGrowth?.mom || 0) < -5) {
      concerns.push(`Revenue declining at ${revenuePatterns.revenueGrowth.mom.toFixed(1)}% MoM`);
    }

    if ((customerDemographics.retentionRate || 0) < 0.5) {
      concerns.push(`Customer retention below 50% - churn risk`);
    }

    if ((inventoryPatterns.outOfStock || 0) > 0) {
      concerns.push(`${inventoryPatterns.outOfStock} products out of stock`);
    }

    const unacknowledgedAlerts = healthSignals.alerts?.filter(a => !a.acknowledged).length || 0;
    if (unacknowledgedAlerts > 0) {
      concerns.push(`${unacknowledgedAlerts} unacknowledged alerts require attention`);
    }

    if ((revenuePatterns.averageOrderValue || 0) < 20) {
      concerns.push(`Low average order value may impact profitability`);
    }

    return concerns;
  }

  /**
   * Identify growth and optimization opportunities
   */
  private identifyOpportunities(profile: MerchantProfileDocument): Opportunity[] {
    const opportunities: Opportunity[] = [];
    const customerDemographics = profile.customerDemographics || {};
    const popularItems = profile.popularItems || {};
    const peakHoursDays = profile.peakHoursDays || {};

    // Cross-selling opportunity
    if (popularItems.items && popularItems.items.length > 0 && popularItems.items.length < 20) {
      opportunities.push({
        id: 'opportunity-cross-sell',
        type: 'product_expansion' as OpportunityType,
        title: 'Expand product offering',
        description: 'Current popular items represent limited variety. Add complementary products to increase basket size.',
        potential: 'high',
        estimatedImpact: { revenue: 5000, engagement: 15 },
        priority: 'high',
        effort: 'medium',
        timeline: '2-3 months',
      });
    }

    // Peak hour optimization
    const peakTimes = peakHoursDays.hourlyDistribution || [];
    const lowHours = peakTimes.filter(h => h.orderCount < 5);
    if (lowHours.length > 5) {
      opportunities.push({
        id: 'opportunity-off-peak',
        type: 'marketing' as OpportunityType,
        title: 'Off-peak marketing campaign',
        description: `Promote ${lowHours.length} hours with low order volume through targeted offers.`,
        potential: 'medium',
        estimatedImpact: { revenue: 2000 },
        priority: 'medium',
        effort: 'low',
        timeline: '1-2 months',
      });
    }

    // Customer segment expansion
    const demographics = customerDemographics.demographics || {};
    const customerTypes = demographics.customerTypes || {};
    if ((customerTypes as unknown).business < 0.2) {
      opportunities.push({
        id: 'opportunity-b2b',
        type: 'customer_segment' as OpportunityType,
        title: 'B2B customer acquisition',
        description: 'Target business customers to diversify revenue streams and increase order values.',
        potential: 'high',
        estimatedImpact: { revenue: 10000, customers: 20 },
        priority: 'high',
        effort: 'high',
        timeline: '3-6 months',
      });
    }

    // New market opportunity
    const locations = demographics.locations || [];
    if (locations.length > 0 && locations.length < 5) {
      opportunities.push({
        id: 'opportunity-expansion',
        type: 'new_market' as OpportunityType,
        title: 'Geographic expansion',
        description: 'Expand presence to new locations based on current customer distribution.',
        potential: 'high',
        estimatedImpact: { revenue: 15000, customers: 50 },
        priority: 'medium',
        effort: 'high',
        timeline: '6-12 months',
      });
    }

    // Automation opportunity
    opportunities.push({
      id: 'opportunity-automation',
      type: 'automation' as OpportunityType,
      title: 'Operational automation',
      description: 'Implement automated inventory management and customer communication systems.',
      potential: 'medium',
      estimatedImpact: { revenue: 5000 },
      priority: 'medium',
      effort: 'medium',
      timeline: '2-4 months',
    });

    return opportunities;
  }

  /**
   * Identify potential threats
   */
  private identifyThreats(profile: MerchantProfileDocument): Threat[] {
    const threats: Threat[] = [];
    const healthSignals = profile.healthSignals || {};
    const growthMetrics = profile.growthMetrics || {};
    const inventoryPatterns = profile.inventoryPatterns || {};

    // Declining growth
    if ((growthMetrics.revenue?.percentageChange || 0) < -10) {
      threats.push({
        id: 'threat-decline',
        type: 'market_change' as ThreatType,
        title: 'Sustained revenue decline',
        description: 'Revenue has been declining for consecutive periods',
        severity: 'high',
        probability: 0.7,
        potentialImpact: 0.8,
        mitigation: 'Conduct root cause analysis and implement corrective actions',
      });
    }

    // Inventory risk
    if ((inventoryPatterns.outOfStock || 0) > (inventoryPatterns.totalProducts || 1) * 0.15) {
      threats.push({
        id: 'threat-inventory',
        type: 'operational' as ThreatType,
        title: 'Inventory management issues',
        description: 'High percentage of products out of stock affecting sales',
        severity: 'high',
        probability: 0.8,
        potentialImpact: 0.7,
        mitigation: 'Improve supplier relationships and inventory forecasting',
      });
    }

    // Customer churn
    if ((healthSignals.alerts?.filter(a => a.type === 'customer_churn').length || 0) > 0) {
      threats.push({
        id: 'threat-churn',
        type: 'competition' as ThreatType,
        title: 'Customer churn risk',
        description: 'Increasing customer attrition to competitors',
        severity: 'medium',
        probability: 0.6,
        potentialImpact: 0.7,
        mitigation: 'Implement loyalty programs and improve customer experience',
      });
    }

    // Competition threat
    threats.push({
      id: 'threat-competition',
      type: 'competition' as ThreatType,
      title: 'Competitive pressure',
      description: 'New competitors entering the market',
      severity: 'medium',
      probability: 0.5,
      potentialImpact: 0.6,
      mitigation: 'Differentiate through unique value propositions',
    });

    return threats;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    profile: MerchantProfileDocument,
    opportunities: Opportunity[],
    threats: Threat[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Based on opportunities
    opportunities.slice(0, 3).forEach((opp, idx) => {
      recommendations.push({
        id: `rec-opp-${idx}`,
        category: opp.type,
        title: `Capitalize on ${opp.type.replace('_', ' ')} opportunity`,
        description: opp.description,
        rationale: `Expected impact: ${JSON.stringify(opp.estimatedImpact)}`,
        expectedOutcome: `Increase revenue and improve market position`,
        priority: opp.priority,
        actionSteps: this.generateActionSteps(opp),
      });
    });

    // Based on threats
    threats.slice(0, 2).forEach((threat, idx) => {
      recommendations.push({
        id: `rec-threat-${idx}`,
        category: 'operations',
        title: `Address ${threat.type.replace('_', ' ')} threat`,
        description: threat.description,
        rationale: `Probability: ${(threat.probability * 100).toFixed(0)}%, Impact: ${(threat.potentialImpact * 100).toFixed(0)}%`,
        expectedOutcome: threat.mitigation || 'Reduce risk exposure',
        priority: threat.severity === 'high' ? 'high' : 'medium',
        actionSteps: threat.mitigation ? [`Implement: ${threat.mitigation}`] : ['Conduct detailed analysis'],
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate action steps for recommendations
   */
  private generateActionSteps(opportunity: Opportunity): string[] {
    const steps: string[] = [];

    switch (opportunity.type) {
      case 'product_expansion':
        steps.push('Analyze current product gaps');
        steps.push('Research complementary products');
        steps.push('Source new suppliers if needed');
        steps.push('Launch pilot with top-selling items');
        break;
      case 'marketing':
        steps.push('Design off-peak promotions');
        steps.push('Set up targeted campaigns');
        steps.push('Monitor conversion rates');
        steps.push('Optimize based on results');
        break;
      case 'customer_segment':
        steps.push('Define target B2B customer profile');
        steps.push('Develop B2B pricing structure');
        steps.push('Create business-focused marketing');
        steps.push('Build dedicated support channel');
        break;
      case 'new_market':
        steps.push('Analyze location data');
        steps.push('Identify high-potential areas');
        steps.push('Plan expansion timeline');
        steps.push('Set up local operations');
        break;
      case 'automation':
        steps.push('Audit current processes');
        steps.push('Select automation tools');
        steps.push('Implement in phases');
        steps.push('Train staff on new systems');
        break;
      default:
        steps.push('Conduct feasibility study');
        steps.push('Develop implementation plan');
        steps.push('Execute and monitor');
    }

    return steps;
  }

  /**
   * Generate competitive comparisons
   */
  private generateComparisons(profile: MerchantProfileDocument): Comparison[] {
    const comparisons: Comparison[] = [];
    const revenuePatterns = profile.revenuePatterns || {};
    const orderVolume = profile.orderVolume || {};
    const customerDemographics = profile.customerDemographics || {};

    // Revenue comparison
    comparisons.push({
      metric: 'Average Order Value',
      merchantValue: revenuePatterns.averageOrderValue || 0,
      industryAverage: 45,
      topPerformers: 80,
      percentile: this.calculatePercentile(revenuePatterns.averageOrderValue || 0, 45, 80),
      trend: (revenuePatterns.averageOrderValue || 0) > 45 ? 'above' : 'below',
    });

    // Order volume comparison
    comparisons.push({
      metric: 'Daily Order Volume',
      merchantValue: orderVolume.averagePerDay || 0,
      industryAverage: 30,
      topPerformers: 60,
      percentile: this.calculatePercentile(orderVolume.averagePerDay || 0, 30, 60),
      trend: (orderVolume.averagePerDay || 0) > 30 ? 'above' : 'below',
    });

    // Customer retention comparison
    comparisons.push({
      metric: 'Customer Retention Rate',
      merchantValue: (customerDemographics.retentionRate || 0) * 100,
      industryAverage: 65,
      topPerformers: 85,
      percentile: this.calculatePercentile((customerDemographics.retentionRate || 0) * 100, 65, 85),
      trend: (customerDemographics.retentionRate || 0) > 0.65 ? 'above' : 'below',
    });

    return comparisons;
  }

  /**
   * Calculate percentile position
   */
  private calculatePercentile(value: number, average: number, top: number): number {
    if (value >= top) return 90;
    if (value <= average * 0.5) return 20;
    return Math.round(20 + ((value - average * 0.5) / (top - average * 0.5)) * 70);
  }

  /**
   * Generate predictions for key metrics
   */
  private generatePredictions(profile: MerchantProfileDocument): Prediction[] {
    const predictions: Prediction[] = [];
    const revenuePatterns = profile.revenuePatterns || {};
    const growthMetrics = profile.growthMetrics || {};

    // Revenue prediction
    const growthRate = growthMetrics.revenue?.percentageChange || revenuePatterns.revenueGrowth?.mom || 0;
    const currentRevenue = revenuePatterns.totalRevenue || 0;
    predictions.push({
      metric: 'Projected Monthly Revenue',
      prediction: Math.round(currentRevenue * (1 + growthRate / 100)),
      confidence: 0.75,
      timeframe: '30 days',
      model: 'linear_regression',
    });

    // Order volume prediction
    const avgOrders = revenuePatterns.daily?.reduce((sum, d) => sum + d.orderCount, 0) / Math.max(revenuePatterns.daily?.length || 1, 1);
    const orderGrowth = growthMetrics.orders?.percentageChange || 0;
    predictions.push({
      metric: 'Projected Monthly Orders',
      prediction: Math.round(avgOrders * 30 * (1 + orderGrowth / 100)),
      confidence: 0.7,
      timeframe: '30 days',
      model: 'moving_average',
    });

    // Customer prediction
    const customerGrowth = growthMetrics.customers?.percentageChange || 0;
    const currentCustomers = profile.customerDemographics?.totalCustomers || 0;
    predictions.push({
      metric: 'Projected Customer Count',
      prediction: Math.round(currentCustomers * (1 + customerGrowth / 100)),
      confidence: 0.65,
      timeframe: '30 days',
      model: 'exponential_smoothing',
    });

    return predictions;
  }
}

export const insightsService = new InsightsService();
export default insightsService;
