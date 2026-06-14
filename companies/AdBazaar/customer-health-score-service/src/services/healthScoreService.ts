/**
 * Health Score Service - Core business logic
 */

import { HealthScoreModel, IHealthScore } from '../models/healthScore';
import { MetricModel, IMetric } from '../models/metric';
import { AlertModel } from '../models/alert';
import { HistoryModel } from '../models/history';
import { logger } from '../utils/logger';
import { healthScoreGauge, calculationDuration } from '../utils/metrics';
import axios from 'axios';

interface ScoreComponents {
  engagementScore: number;
  usageScore: number;
  paymentScore: number;
  supportScore: number;
  adoptionScore: number;
}

interface CalculateResult {
  overallScore: number;
  components: ScoreComponents;
  factors: { name: string; value: number; weight: number; description: string }[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alerts: { type: string; severity: string; title: string; message: string }[];
}

export class HealthScoreService {
  /**
   * Get health score for a customer
   */
  async getHealthScore(customerId: string): Promise<IHealthScore | null> {
    return HealthScoreModel.findOne({ customerId }).lean();
  }

  /**
   * Calculate health score for a customer
   */
  async calculateScore(customerId: string, force: boolean = false): Promise<CalculateResult> {
    const startTime = Date.now();
    const timerEnd = calculationDuration.startTimer({ customer_id: customerId });

    try {
      logger.info(`Calculating health score for customer ${customerId}`);

      // Get metrics from various sources
      const metrics = await this.gatherMetrics(customerId);

      // Calculate component scores
      const components = await this.calculateComponents(customerId, metrics);

      // Calculate overall score
      const weights = {
        engagement: 0.25,
        usage: 0.25,
        payment: 0.20,
        support: 0.15,
        adoption: 0.15,
      };

      const overallScore = Math.round(
        components.engagementScore * weights.engagement +
        components.usageScore * weights.usage +
        components.paymentScore * weights.payment +
        components.supportScore * weights.support +
        components.adoptionScore * weights.adoption
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore, components);

      // Generate factors
      const factors = this.generateFactors(components, metrics);

      // Generate alerts
      const alerts = await this.generateAlerts(customerId, overallScore, components);

      // Store history
      await this.storeHistory(customerId, overallScore, components, factors, startTime);

      // Update or create health score
      await this.updateHealthScore(customerId, overallScore, components, factors, riskLevel);

      // Update metrics
      healthScoreGauge.set({ customer_id: customerId }, overallScore);

      const duration = Date.now() - startTime;
      timerEnd();

      logger.info(`Health score calculated for ${customerId}: ${overallScore} (${duration}ms)`);

      return {
        overallScore,
        components,
        factors,
        riskLevel,
        alerts,
      };
    } catch (error) {
      logger.error(`Failed to calculate health score for ${customerId}`, { error });
      throw error;
    }
  }

  /**
   * Gather metrics from various sources
   */
  private async gatherMetrics(customerId: string): Promise<IMetric[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return MetricModel.find({
      customerId,
      timestamp: { $gte: thirtyDaysAgo },
    }).lean();
  }

  /**
   * Calculate component scores
   */
  private async calculateComponents(customerId: string, metrics: IMetric[]): Promise<ScoreComponents> {
    // Get metrics by category
    const getMetricValue = (category: string, name: string): number => {
      const metric = metrics.find(m => m.category === category && m.name === name);
      return metric?.value ?? 0;
    };

    // Calculate engagement score (0-100)
    const loginFrequency = getMetricValue('engagement', 'login_frequency');
    const featureAdoption = getMetricValue('engagement', 'feature_adoption');
    const sessionDuration = getMetricValue('engagement', 'session_duration');
    const engagementScore = Math.min(100, (loginFrequency * 0.4 + featureAdoption * 0.3 + sessionDuration * 0.3));

    // Calculate usage score (0-100)
    const apiCalls = getMetricValue('usage', 'api_calls');
    const campaignsCreated = getMetricValue('usage', 'campaigns_created');
    const dataVolume = getMetricValue('usage', 'data_volume');
    const usageScore = Math.min(100, (apiCalls * 0.4 + campaignsCreated * 0.3 + dataVolume * 0.3));

    // Calculate payment score (0-100)
    const paymentTimeliness = getMetricValue('payment', 'payment_timeliness');
    const invoiceSettled = getMetricValue('payment', 'invoice_settled');
    const creditUtilization = getMetricValue('payment', 'credit_utilization');
    const paymentScore = paymentTimeliness * 0.4 + invoiceSettled * 0.3 + creditUtilization * 0.3;

    // Calculate support score (0-100)
    const ticketResolution = getMetricValue('support', 'ticket_resolution_time');
    const npsScore = getMetricValue('support', 'nps_score');
    const satisfactionRating = getMetricValue('support', 'satisfaction_rating');
    const supportScore = (100 - Math.min(ticketResolution, 100)) * 0.3 + npsScore * 0.4 + satisfactionRating * 0.3;

    // Calculate adoption score (0-100)
    const coreFeaturesUsed = getMetricValue('adoption', 'core_features_used');
    const integrationsEnabled = getMetricValue('adoption', 'integrations_enabled');
    const teamMembersActive = getMetricValue('adoption', 'team_members_active');
    const adoptionScore = coreFeaturesUsed * 0.4 + integrationsEnabled * 0.3 + teamMembersActive * 0.3;

    return {
      engagementScore: Math.round(engagementScore),
      usageScore: Math.round(usageScore),
      paymentScore: Math.round(paymentScore),
      supportScore: Math.round(supportScore),
      adoptionScore: Math.round(adoptionScore),
    };
  }

  /**
   * Determine risk level based on score and components
   */
  private determineRiskLevel(
    overallScore: number,
    components: ScoreComponents
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (overallScore >= 80) return 'low';
    if (overallScore >= 60) return 'medium';

    // Check for critical components
    const criticalComponents = [
      components.paymentScore < 40,
      components.usageScore < 30,
      components.engagementScore < 30,
    ].filter(Boolean).length;

    if (criticalComponents >= 2 || overallScore < 30) return 'critical';
    return 'high';
  }

  /**
   * Generate contributing factors
   */
  private generateFactors(
    components: ScoreComponents,
    metrics: IMetric[]
  ): { name: string; value: number; weight: number; description: string }[] {
    const factors: { name: string; value: number; weight: number; description: string }[] = [];

    // Engagement factors
    factors.push({
      name: 'login_frequency',
      value: metrics.find(m => m.name === 'login_frequency')?.value ?? 0,
      weight: 0.15,
      description: 'How often the customer logs in',
    });

    factors.push({
      name: 'feature_adoption',
      value: metrics.find(m => m.name === 'feature_adoption')?.value ?? 0,
      weight: 0.10,
      description: 'Percentage of features being used',
    });

    // Usage factors
    factors.push({
      name: 'api_usage',
      value: components.usageScore,
      weight: 0.20,
      description: 'API call volume relative to plan',
    });

    factors.push({
      name: 'campaign_activity',
      value: metrics.find(m => m.name === 'campaigns_created')?.value ?? 0,
      weight: 0.10,
      description: 'Number of active campaigns',
    });

    // Payment factors
    factors.push({
      name: 'payment_history',
      value: components.paymentScore,
      weight: 0.15,
      description: 'Payment timeliness and history',
    });

    // Support factors
    factors.push({
      name: 'satisfaction',
      value: components.supportScore,
      weight: 0.10,
      description: 'NPS and satisfaction scores',
    });

    // Adoption factors
    factors.push({
      name: 'team_engagement',
      value: components.adoptionScore,
      weight: 0.10,
      description: 'Active team members',
    });

    return factors;
  }

  /**
   * Generate alerts based on score changes
   */
  private async generateAlerts(
    customerId: string,
    overallScore: number,
    components: ScoreComponents
  ): Promise<{ type: string; severity: string; title: string; message: string }[]> {
    const alerts: { type: string; severity: string; title: string; message: string }[] = [];

    // Get previous score
    const previousScore = await HealthScoreModel.findOne({ customerId }).sort({ updatedAt: -1 });

    if (previousScore) {
      const scoreChange = overallScore - previousScore.overallScore;

      if (scoreChange <= -20) {
        alerts.push({
          type: 'score_drop',
          severity: 'critical',
          title: 'Significant Score Drop',
          message: `Health score dropped by ${Math.abs(scoreChange)} points`,
        });
      } else if (scoreChange <= -10) {
        alerts.push({
          type: 'score_drop',
          severity: 'warning',
          title: 'Score Decrease',
          message: `Health score decreased by ${Math.abs(scoreChange)} points`,
        });
      }
    }

    // Check for low engagement
    if (components.engagementScore < 40) {
      alerts.push({
        type: 'engagement_drop',
        severity: 'warning',
        title: 'Low Engagement',
        message: 'Customer engagement is below 40%',
      });
    }

    // Check for payment issues
    if (components.paymentScore < 50) {
      alerts.push({
        type: 'payment_issue',
        severity: 'critical',
        title: 'Payment Risk',
        message: 'Payment score indicates potential issues',
      });
    }

    // Create alert records
    for (const alert of alerts) {
      await AlertModel.create({
        customerId,
        type: alert.type as any,
        severity: alert.severity as any,
        title: alert.title,
        message: alert.message,
        scoreValue: overallScore,
        previousScore: previousScore?.overallScore,
        change: overallScore - (previousScore?.overallScore ?? overallScore),
        acknowledged: false,
        resolved: false,
      });
    }

    return alerts;
  }

  /**
   * Store calculation history
   */
  private async storeHistory(
    customerId: string,
    overallScore: number,
    components: ScoreComponents,
    factors: { name: string; value: number; weight: number; description: string }[],
    startTime: number
  ): Promise<void> {
    await HistoryModel.create({
      customerId,
      date: new Date(),
      overallScore,
      engagementScore: components.engagementScore,
      usageScore: components.usageScore,
      paymentScore: components.paymentScore,
      supportScore: components.supportScore,
      adoptionScore: components.adoptionScore,
      riskLevel: this.determineRiskLevel(overallScore, components),
      metrics: [],
      factors: factors.map(f => ({
        name: f.name,
        value: f.value,
        weight: f.weight,
      })),
      calculatedBy: 'health-score-service',
      calculationDuration: Date.now() - startTime,
    });
  }

  /**
   * Update or create health score record
   */
  private async updateHealthScore(
    customerId: string,
    overallScore: number,
    components: ScoreComponents,
    factors: { name: string; value: number; weight: number; description: string }[],
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    const now = new Date();
    const nextCalculation = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    await HealthScoreModel.findOneAndUpdate(
      { customerId },
      {
        customerId,
        overallScore,
        engagementScore: components.engagementScore,
        usageScore: components.usageScore,
        paymentScore: components.paymentScore,
        supportScore: components.supportScore,
        adoptionScore: components.adoptionScore,
        riskLevel,
        lastCalculated: now,
        nextScheduledCalculation: nextCalculation,
        factors,
        $push: {
          trends: {
            $each: [{ date: now, score: overallScore, change: 0 }],
            $slice: -30, // Keep last 30 days
          },
        },
      },
      { upsert: true }
    );
  }

  /**
   * Get health score history
   */
  async getHistory(customerId: string, days: number = 30): Promise<IHealthScore[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return HistoryModel.find({
      customerId,
      date: { $gte: startDate },
    }).sort({ date: -1 }).lean();
  }

  /**
   * Get dashboard summary
   */
  async getDashboard(): Promise<{
    totalCustomers: number;
    avgHealthScore: number;
    riskDistribution: Record<string, number>;
    topAtRisk: { customerId: string; score: number }[];
    topHealthy: { customerId: string; score: number }[];
  }> {
    const scores = await HealthScoreModel.find().lean();

    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalScore = 0;

    scores.forEach(score => {
      riskDistribution[score.riskLevel]++;
      totalScore += score.overallScore;
    });

    const sortedByScore = [...scores].sort((a, b) => a.overallScore - b.overallScore);

    return {
      totalCustomers: scores.length,
      avgHealthScore: scores.length > 0 ? Math.round(totalScore / scores.length) : 0,
      riskDistribution,
      topAtRisk: sortedByScore.slice(0, 10).map(s => ({ customerId: s.customerId, score: s.overallScore })),
      topHealthy: sortedByScore.slice(-10).reverse().map(s => ({ customerId: s.customerId, score: s.overallScore })),
    };
  }
}

export const healthScoreService = new HealthScoreService();