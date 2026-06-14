import { Forecast } from '../models/Forecast';
import { DemandTrend } from '../models/DemandTrend';
import { ForecastAnalytics } from '../models/ForecastAnalytics';
import { logger } from '../utils/logger';
import { forecastRequestsTotal } from '../utils/metrics';

// Recommendation interface
export interface Recommendation {
  id: string;
  type: 'pricing' | 'timing' | 'marketing' | 'inventory' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    metric: string;
    current: number;
    projected: number;
    improvement: number;
  };
  action: string;
  rationale: string;
}

// Recommendation response
export interface RecommendationResponse {
  success: boolean;
  data?: Recommendation[];
  error?: string;
}

// Recommendation Service
class RecommendationService {
  /**
   * Get recommendations for an event
   */
  async getRecommendations(eventId: string): Promise<RecommendationResponse> {
    try {
      // Get forecast
      const forecast = await Forecast.findOne({ eventId });
      if (!forecast) {
        forecastRequestsTotal.inc({ type: 'recommendations', status: 'not_found' });
        return {
          success: false,
          error: `Forecast for event ${eventId} not found`
        };
      }

      // Get trends
      const trends = await DemandTrend.find({ eventId })
        .sort({ date: -1 })
        .limit(30);

      // Get analytics
      const analytics = await ForecastAnalytics.findOne({ eventId })
        .sort({ createdAt: -1 });

      // Generate recommendations
      const recommendations: Recommendation[] = [];

      // 1. Pricing recommendations
      const pricingRecs = this.generatePricingRecommendations(forecast, trends, analytics);
      recommendations.push(...pricingRecs);

      // 2. Timing recommendations
      const timingRecs = this.generateTimingRecommendations(forecast, trends);
      recommendations.push(...timingRecs);

      // 3. Marketing recommendations
      const marketingRecs = this.generateMarketingRecommendations(forecast, trends, analytics);
      recommendations.push(...marketingRecs);

      // 4. Inventory recommendations
      const inventoryRecs = this.generateInventoryRecommendations(forecast, trends);
      recommendations.push(...inventoryRecs);

      // 5. General recommendations
      const generalRecs = this.generateGeneralRecommendations(forecast, trends, analytics);
      recommendations.push(...generalRecs);

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      forecastRequestsTotal.inc({ type: 'recommendations', status: 'success' });
      return {
        success: true,
        data: recommendations
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get recommendations', { error: errorMessage, eventId });
      forecastRequestsTotal.inc({ type: 'recommendations', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate pricing recommendations
   */
  private generatePricingRecommendations(
    forecast: InstanceType<typeof Forecast>,
    trends: InstanceType<typeof DemandTrend>[],
    analytics: InstanceType<typeof ForecastAnalytics> | null
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // High demand pricing
    if (forecast.confidence.score >= 0.75 && forecast.predicted.totalDemand > 5000) {
      recommendations.push({
        id: 'pricing-high-demand',
        type: 'pricing',
        priority: 'high',
        title: 'Consider Premium Pricing',
        description: 'High demand forecast suggests opportunity for dynamic pricing',
        impact: {
          metric: 'Revenue per unit',
          current: 100,
          projected: 120,
          improvement: 20
        },
        action: 'Implement tiered pricing with 15-20% premium during peak periods',
        rationale: `Predicted demand of ${forecast.predicted.totalDemand} with ${(forecast.confidence.score * 100).toFixed(0)}% confidence`
      });
    }

    // Low confidence discount
    if (forecast.confidence.score < 0.5) {
      recommendations.push({
        id: 'pricing-conservative',
        type: 'pricing',
        priority: 'medium',
        title: 'Use Conservative Pricing',
        description: 'Low forecast confidence - consider promotional pricing to drive demand',
        impact: {
          metric: 'Units sold',
          current: 100,
          projected: 130,
          improvement: 30
        },
        action: 'Offer early bird discounts to secure advance sales',
        rationale: 'Low confidence score of ' + (forecast.confidence.score * 100).toFixed(0) + '%'
      });
    }

    // Trend-based pricing
    if (trends.length >= 3) {
      const recentTrend = trends[0];
      if (recentTrend.trend.direction === 'increasing') {
        recommendations.push({
          id: 'pricing-increase',
          type: 'pricing',
          priority: 'high',
          title: 'Raise Prices as Demand Increases',
          description: 'Demand trend is increasing - adjust pricing upward',
          impact: {
            metric: 'Revenue',
            current: 100,
            projected: 115,
            improvement: 15
          },
          action: 'Increase prices by 10% as demand velocity increases',
          rationale: `Velocity: ${recentTrend.trend.velocity.toFixed(1)}% per day`
        });
      } else if (recentTrend.trend.direction === 'decreasing') {
        recommendations.push({
          id: 'pricing-promotion',
          type: 'pricing',
          priority: 'high',
          title: 'Launch Promotional Campaign',
          description: 'Demand trend is declining - consider promotional pricing',
          impact: {
            metric: 'Units sold',
            current: 100,
            projected: 125,
            improvement: 25
          },
          action: 'Offer10-15% discount with limited time validity',
          rationale: `Velocity: ${recentTrend.trend.velocity.toFixed(1)}% per day (declining)`
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate timing recommendations
   */
  private generateTimingRecommendations(
    forecast: InstanceType<typeof Forecast>,
    trends: InstanceType<typeof DemandTrend>[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const daysUntilEvent = Math.ceil((forecast.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Launch timing
    if (daysUntilEvent > 30) {
      recommendations.push({
        id: 'timing-early-launch',
        type: 'timing',
        priority: 'high',
        title: 'Launch Marketing Campaign Early',
        description: `Event is ${daysUntilEvent} days away - start awareness campaign now`,
        impact: {
          metric: 'Awareness',
          current: 10,
          projected: 50,
          improvement: 400
        },
        action: 'Begin social media and email campaigns immediately',
        rationale: `${daysUntilEvent} days until event - early awareness drives demand`
      });
    } else if (daysUntilEvent > 7 && daysUntilEvent <= 30) {
      recommendations.push({
        id: 'timing-peak-campaign',
        type: 'timing',
        priority: 'high',
        title: 'Intensify Marketing Efforts',
        description: 'Peak booking window approaching',
        impact: {
          metric: 'Bookings',
          current: 50,
          projected: 80,
          improvement: 60
        },
        action: 'Increase ad spend by 50% and send reminder emails',
        rationale: `${daysUntilEvent} days until event - peak decision window`
      });
    } else if (daysUntilEvent <= 7) {
      recommendations.push({
        id: 'timing-last-call',
        type: 'timing',
        priority: 'medium',
        title: 'Last Call Campaign',
        description: 'Final push for ticket sales',
        impact: {
          metric: 'Last-minute sales',
          current: 20,
          projected: 40,
          improvement: 100
        },
        action: 'Send urgency-focused campaigns and limited-time offers',
        rationale: `${daysUntilEvent} days until event - last call for sales`
      });
    }

    // Peak time recommendations
    const peakHour = forecast.predicted.hourly?.reduce((max, h) =>
      h.demand > max.demand ? h : max
    , forecast.predicted.hourly![0]);

    if (peakHour) {
      recommendations.push({
        id: 'timing-peak-hour',
        type: 'timing',
        priority: 'low',
        title: 'Peak Hour Optimization',
        description: `Peak demand expected at ${peakHour.hour}:00`,
        impact: {
          metric: 'Conversion',
          current: 100,
          projected: 110,
          improvement: 10
        },
        action: 'Schedule marketing pushes around peak hours',
        rationale: `Peak demand of ${peakHour.demand} expected at hour ${peakHour.hour}`
      });
    }

    return recommendations;
  }

  /**
   * Generate marketing recommendations
   */
  private generateMarketingRecommendations(
    forecast: InstanceType<typeof Forecast>,
    trends: InstanceType<typeof DemandTrend>[],
    analytics: InstanceType<typeof ForecastAnalytics> | null
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Social signals
    if (trends.length > 0) {
      const avgSocial = trends.reduce((a, t) => a + t.signals.social, 0) / trends.length;
      if (avgSocial > 70) {
        recommendations.push({
          id: 'marketing-social',
          type: 'marketing',
          priority: 'high',
          title: 'Leverage Social Momentum',
          description: 'High social media interest detected',
          impact: {
            metric: 'Reach',
            current: 1000,
            projected: 5000,
            improvement: 400
          },
          action: 'Amplify organic posts and consider influencer partnerships',
          rationale: `Social signal score: ${avgSocial.toFixed(0)}/100`
        });
      } else if (avgSocial < 40) {
        recommendations.push({
          id: 'marketing-boost',
          type: 'marketing',
          priority: 'high',
          title: 'Boost Social Media Presence',
          description: 'Low social media interest - need marketing push',
          impact: {
            metric: 'Social reach',
            current: 500,
            projected: 2000,
            improvement: 300
          },
          action: 'Invest in paid social campaigns and influencer outreach',
          rationale: `Social signal score: ${avgSocial.toFixed(0)}/100 (below threshold)`
        });
      }
    }

    // Weather impact
    if (forecast.factors.weather > 10) {
      recommendations.push({
        id: 'marketing-weather',
        type: 'marketing',
        priority: 'medium',
        title: 'Weather Contingency Plan',
        description: 'Weather may impact outdoor event attendance',
        impact: {
          metric: 'Attendance',
          current: 100,
          projected: 85,
          improvement: -15
        },
        action: 'Prepare indoor alternatives and communicate backup plans',
        rationale: `Weather factor impact: ${forecast.factors.weather}%`
      });
    }

    // Competitor events
    if (forecast.factors.competitor > 15) {
      recommendations.push({
        id: 'marketing-competitor',
        type: 'marketing',
        priority: 'high',
        title: 'Differentiate from Competitors',
        description: 'Competing events may impact demand',
        impact: {
          metric: 'Market share',
          current: 30,
          projected: 40,
          improvement: 33
        },
        action: 'Highlight unique value propositions and early bird offers',
        rationale: `Competitor impact: ${forecast.factors.competitor}%`
      });
    }

    // Category-specific marketing
    const categoryMarketing: Record<string, Recommendation> = {
      concert: {
        id: 'marketing-concert',
        type: 'marketing',
        priority: 'medium',
        title: 'Artist/Performer Promotion',
        description: 'Concert events benefit from performer-focused marketing',
        impact: { metric: 'Tickets', current: 100, projected: 150, improvement: 50 },
        action: 'Feature artist prominently in all marketing materials',
        rationale: 'Concert category performs better with artist-focused campaigns'
      },
      sports: {
        id: 'marketing-sports',
        type: 'marketing',
        priority: 'medium',
        title: 'Team/Player Promotion',
        description: 'Sports events benefit from team-focused marketing',
        impact: { metric: 'Tickets', current: 100, projected: 140, improvement: 40 },
        action: 'Feature teams and star players in marketing',
        rationale: 'Sports category performs better with team-focused campaigns'
      },
      conference: {
        id: 'marketing-conference',
        type: 'marketing',
        priority: 'medium',
        title: 'Speaker Promotion',
        description: 'Conference events benefit from speaker-focused marketing',
        impact: { metric: 'Registrations', current: 100, projected: 130, improvement: 30 },
        action: 'Feature keynote speakers and agenda in marketing',
        rationale: 'Conference category performs better with speaker-focused campaigns'
      }
    };

    if (forecast.category in categoryMarketing) {
      recommendations.push(categoryMarketing[forecast.category]);
    }

    return recommendations;
  }

  /**
   * Generate inventory recommendations
   */
  private generateInventoryRecommendations(
    forecast: InstanceType<typeof Forecast>,
    trends: InstanceType<typeof DemandTrend>[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // High demand inventory
    if (forecast.predicted.totalDemand > 10000) {
      recommendations.push({
        id: 'inventory-high',
        type: 'inventory',
        priority: 'high',
        title: 'Prepare for High Demand',
        description: 'Prepare additional inventory and staffing',
        impact: {
          metric: 'Capacity utilization',
          current: 80,
          projected: 95,
          improvement: 19
        },
        action: 'Increase capacity by 20% and add staff for peak times',
        rationale: `Predicted demand: ${forecast.predicted.totalDemand}`
      });
    }

    // Peak day preparation
    const peakDay = forecast.predicted.daily.find(d =>
      d.date.getTime() === forecast.predicted.peakDate.getTime()
    );

    if (peakDay) {
      const peakToAvg = peakDay.predicted / (forecast.predicted.totalDemand / forecast.predicted.daily.length);
      if (peakToAvg > 1.5) {
        recommendations.push({
          id: 'inventory-peak',
          type: 'inventory',
          priority: 'high',
          title: 'Peak Day Inventory Surge',
          description: `Peak day demand is ${(peakToAvg * 100).toFixed(0)}% of average`,
          impact: {
            metric: 'Inventory',
            current: 100,
            projected: 150,
            improvement: 50
          },
          action: 'Pre-position inventory for peak day and schedule extra staff',
          rationale: `Peak day: ${peakDay.date.toDateString()}`
        });
      }
    }

    // Low demand contingency
    if (forecast.predicted.totalDemand < 1000) {
      recommendations.push({
        id: 'inventory-low',
        type: 'inventory',
        priority: 'medium',
        title: 'Consider Downscaling',
        description: 'Lower demand forecast - consider smaller venue or reduced inventory',
        impact: {
          metric: 'Cost savings',
          current: 100,
          projected: 75,
          improvement: -25
        },
        action: 'Evaluate venue options and optimize resource allocation',
        rationale: `Predicted demand: ${forecast.predicted.totalDemand} (low)`
      });
    }

    return recommendations;
  }

  /**
   * Generate general recommendations
   */
  private generateGeneralRecommendations(
    forecast: InstanceType<typeof Forecast>,
    trends: InstanceType<typeof DemandTrend>[],
    analytics: InstanceType<typeof ForecastAnalytics> | null
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Calibration recommendation
    if (forecast.status !== 'calibrated') {
      recommendations.push({
        id: 'general-calibrate',
        type: 'general',
        priority: 'medium',
        title: 'Calibrate Forecast',
        description: 'Forecast has not been calibrated with actual data',
        impact: {
          metric: 'Accuracy',
          current: 70,
          projected: 85,
          improvement: 21
        },
        action: 'Review and adjust forecast based on current demand signals',
        rationale: 'Calibration improves accuracy by 10-15%'
      });
    }

    // Real-time monitoring
    recommendations.push({
      id: 'general-monitor',
      type: 'general',
      priority: 'high',
      title: 'Enable Real-time Monitoring',
      description: 'Track demand trends as event approaches',
      impact: {
        metric: 'Response time',
        current: 24,
        projected: 4,
        improvement: 83
      },
      action: 'Set up alerts for demand threshold changes',
      rationale: 'Real-time monitoring enables quick response to demand changes'
    });

    // Historical comparison
    if (forecast.factors.historical > 0) {
      recommendations.push({
        id: 'general-historical',
        type: 'general',
        priority: 'low',
        title: 'Compare with Historical Performance',
        description: 'Historical data available for comparison',
        impact: {
          metric: 'Benchmarking',
          current: 100,
          projected: 105,
          improvement: 5
        },
        action: 'Review similar past events for insights',
        rationale: `Historical baseline: ${forecast.factors.historical}`
      });
    }

    // Analytics insights
    if (analytics && analytics.insights.recommendations.length > 0) {
      analytics.insights.recommendations.forEach((rec, index) => {
        recommendations.push({
          id: `general-analytics-${index}`,
          type: 'general',
          priority: 'medium',
          title: 'Based on Analytics',
          description: rec,
          impact: {
            metric: 'Various',
            current: 100,
            projected: 110,
            improvement: 10
          },
          action: rec,
          rationale: 'Generated from forecast analytics'
        });
      });
    }

    return recommendations;
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;