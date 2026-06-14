/**
 * Churn Prediction Service - Core business logic
 */

import { ChurnRiskModel, IChurnRisk } from '../models/churnRisk';
import { PredictionModel } from '../models/prediction';
import { AlertModel } from '../models/alert';
import { logger } from '../utils/logger';
import { churnRiskGauge, predictionsCounter, predictionConfidence } from '../utils/metrics';

interface CustomerFeatures {
  loginFrequency: number;
  featureAdoption: number;
  supportTickets: number;
  npsScore: number;
  paymentDelays: number;
  sessionDuration: number;
  campaignsCreated: number;
  daysSinceLastActivity: number;
}

export class ChurnPredictionService {
  /**
   * Calculate churn risk for a customer
   */
  async calculateRisk(customerId: string, features?: CustomerFeatures): Promise<IChurnRisk> {
    logger.info(`Calculating churn risk for customer ${customerId}`);

    // Use provided features or fetch from various sources
    const customerFeatures = features || await this.fetchCustomerFeatures(customerId);

    // Calculate risk score based on features
    const riskAnalysis = this.analyzeRisk(customerFeatures);

    // Calculate time-based probabilities
    const probabilities = this.calculateProbabilities(riskAnalysis.riskScore);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskAnalysis.riskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskAnalysis.factors, riskLevel);

    // Create or update churn risk record
    const now = new Date();
    const nextCalculation = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const churnRisk = await ChurnRiskModel.findOneAndUpdate(
      { customerId },
      {
        customerId,
        riskScore: riskAnalysis.riskScore,
        riskLevel,
        confidence: riskAnalysis.confidence,
        factors: riskAnalysis.factors,
        warningSignals: riskAnalysis.warningSignals,
        positiveSignals: riskAnalysis.positiveSignals,
        predictedChurnDate: probabilities.predictedDate,
        churnProbability30d: probabilities.prob30d,
        churnProbability60d: probabilities.prob60d,
        churnProbability90d: probabilities.prob90d,
        lastCalculated: now,
        nextScheduledCalculation: nextCalculation,
        recommendations,
      },
      { upsert: true, new: true }
    );

    // Store prediction
    await PredictionModel.create({
      customerId,
      modelVersion: '1.0.0',
      riskScore: riskAnalysis.riskScore,
      riskLevel,
      confidence: riskAnalysis.confidence,
      inputFeatures: Object.entries(customerFeatures).map(([name, value]) => ({
        name,
        value,
        normalized: this.normalizeFeature(name, value),
      })),
      factors: riskAnalysis.factors.map(f => ({
        name: f.name,
        contribution: f.impact,
        explanation: f.description,
      })),
      predictions: [
        { timeframe: '30d', probability: probabilities.prob30d, confidence: riskAnalysis.confidence * 0.9 },
        { timeframe: '60d', probability: probabilities.prob60d, confidence: riskAnalysis.confidence * 0.85 },
        { timeframe: '90d', probability: probabilities.prob90d, confidence: riskAnalysis.confidence * 0.8 },
      ],
      calculatedAt: now,
    });

    // Generate alerts if needed
    await this.generateAlerts(customerId, riskAnalysis);

    // Update metrics
    churnRiskGauge.set({ customer_id: customerId, risk_level: riskLevel }, riskAnalysis.riskScore);
    predictionsCounter.inc({ risk_level: riskLevel });
    predictionConfidence.observe(riskAnalysis.confidence);

    logger.info(`Churn risk calculated for ${customerId}: ${riskAnalysis.riskScore} (${riskLevel})`);
    return churnRisk;
  }

  /**
   * Fetch customer features from various sources
   */
  private async fetchCustomerFeatures(customerId: string): Promise<CustomerFeatures> {
    // This would integrate with other services in production
    // For now, return mock data based on customer ID hash
    const hash = customerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

    return {
      loginFrequency: (hash % 30) / 30,
      featureAdoption: ((hash * 7) % 100) / 100,
      supportTickets: (hash % 10) / 10,
      npsScore: (hash % 10) / 10,
      paymentDelays: ((hash * 3) % 5) / 5,
      sessionDuration: ((hash * 2) % 60) / 60,
      campaignsCreated: (hash % 50) / 50,
      daysSinceLastActivity: (hash % 30),
    };
  }

  /**
   * Analyze risk based on features
   */
  private analyzeRisk(features: CustomerFeatures): {
    riskScore: number;
    confidence: number;
    factors: { name: string; impact: number; weight: number; description: string; direction: 'negative' | 'positive' }[];
    warningSignals: string[];
    positiveSignals: string[];
  } {
    const factors: { name: string; impact: number; weight: number; description: string; direction: 'negative' | 'positive' }[] = [];
    const warningSignals: string[] = [];
    const positiveSignals: string[] = [];

    // Login frequency factor
    if (features.loginFrequency < 0.3) {
      factors.push({
        name: 'low_login_frequency',
        impact: 25,
        weight: 0.2,
        description: 'Customer rarely logs in',
        direction: 'negative',
      });
      warningSignals.push('Low login frequency detected');
    } else {
      positiveSignals.push('Regular login activity');
    }

    // Feature adoption factor
    if (features.featureAdoption < 0.4) {
      factors.push({
        name: 'low_feature_adoption',
        impact: 20,
        weight: 0.15,
        description: 'Customer using few features',
        direction: 'negative',
      });
      warningSignals.push('Low feature adoption');
    } else {
      factors.push({
        name: 'high_feature_adoption',
        impact: -15,
        weight: 0.15,
        description: 'Customer using many features',
        direction: 'positive',
      });
      positiveSignals.push('High feature adoption');
    }

    // Support tickets factor
    if (features.supportTickets > 0.6) {
      factors.push({
        name: 'high_support_tickets',
        impact: 20,
        weight: 0.15,
        description: 'High volume of support tickets',
        direction: 'negative',
      });
      warningSignals.push('High support ticket volume');
    }

    // NPS factor
    if (features.npsScore < 0.5) {
      factors.push({
        name: 'low_nps',
        impact: 15,
        weight: 0.1,
        description: 'Low NPS score',
        direction: 'negative',
      });
      warningSignals.push('Low customer satisfaction');
    } else {
      positiveSignals.push('Good customer satisfaction');
    }

    // Payment delays factor
    if (features.paymentDelays > 0.5) {
      factors.push({
        name: 'payment_delays',
        impact: 25,
        weight: 0.2,
        description: 'Payment delays or issues',
        direction: 'negative',
      });
      warningSignals.push('Payment history concerns');
    }

    // Days since last activity
    if (features.daysSinceLastActivity > 14) {
      factors.push({
        name: 'inactivity',
        impact: 20,
        weight: 0.15,
        description: 'No recent activity',
        direction: 'negative',
      });
      warningSignals.push('Customer inactive for extended period');
    }

    // Calculate risk score
    let riskScore = 0;
    factors.forEach(f => {
      if (f.direction === 'negative') {
        riskScore += f.impact * f.weight;
      }
    });
    riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

    // Calculate confidence based on data availability
    const confidence = Math.min(0.95, 0.5 + (factors.length * 0.05));

    return {
      riskScore,
      confidence,
      factors,
      warningSignals,
      positiveSignals,
    };
  }

  /**
   * Calculate churn probabilities
   */
  private calculateProbabilities(riskScore: number): {
    prob30d: number;
    prob60d: number;
    prob90d: number;
    predictedDate?: Date;
  } {
    const prob30d = riskScore > 70 ? 0.3 + (riskScore - 70) * 0.02 :
                    riskScore > 50 ? 0.1 + (riskScore - 50) * 0.01 : riskScore * 0.002;

    const prob60d = riskScore > 60 ? 0.4 + (riskScore - 60) * 0.02 :
                    riskScore > 40 ? 0.15 + (riskScore - 40) * 0.01 : riskScore * 0.003;

    const prob90d = riskScore > 50 ? 0.5 + (riskScore - 50) * 0.02 :
                    riskScore > 30 ? 0.2 + (riskScore - 30) * 0.01 : riskScore * 0.004;

    let predictedDate: Date | undefined;
    if (riskScore > 70) {
      const daysToChurn = Math.max(7, Math.round(90 - riskScore * 0.8));
      predictedDate = new Date(Date.now() + daysToChurn * 24 * 60 * 60 * 1000);
    }

    return {
      prob30d: Math.min(1, prob30d),
      prob60d: Math.min(1, prob60d),
      prob90d: Math.min(1, prob90d),
      predictedDate,
    };
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    factors: { name: string; direction: string }[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Schedule immediate outreach call with customer');
      recommendations.push('Review recent support tickets for root cause');
      recommendations.push('Consider offering retention incentive');
    }

    factors.forEach(f => {
      if (f.name === 'low_login_frequency' && f.direction === 'negative') {
        recommendations.push('Send personalized re-engagement email');
        recommendations.push('Highlight new features not yet explored');
      }
      if (f.name === 'low_feature_adoption' && f.direction === 'negative') {
        recommendations.push('Offer onboarding session to explore features');
      }
      if (f.name === 'high_support_tickets' && f.direction === 'negative') {
        recommendations.push('Review and resolve open support tickets');
        recommendations.push('Proactively reach out to address concerns');
      }
      if (f.name === 'low_nps' && f.direction === 'negative') {
        recommendations.push('Conduct satisfaction survey');
        recommendations.push('Address specific pain points mentioned');
      }
      if (f.name === 'payment_delays' && f.direction === 'negative') {
        recommendations.push('Review payment terms and consider adjustment');
      }
      if (f.name === 'inactivity' && f.direction === 'negative') {
        recommendations.push('Send usage tips and best practices');
        recommendations.push('Consider personalized demo');
      }
    });

    return [...new Set(recommendations)];
  }

  /**
   * Generate alerts based on risk analysis
   */
  private async generateAlerts(customerId: string, riskAnalysis: { riskScore: number; factors: any[] }): Promise<void> {
    const previousRisk = await ChurnRiskModel.findOne({ customerId }).sort({ updatedAt: -1 });

    if (!previousRisk) {
      // First calculation
      if (riskAnalysis.riskScore >= 70) {
        await AlertModel.create({
          customerId,
          type: 'critical_risk',
          severity: 'critical',
          title: 'Critical Churn Risk Detected',
          message: `Customer has critical churn risk score of ${riskAnalysis.riskScore}`,
          riskScore: riskAnalysis.riskScore,
          acknowledged: false,
          resolved: false,
        });
      }
      return;
    }

    const change = riskAnalysis.riskScore - previousRisk.riskScore;

    // Alert on significant risk increase
    if (change >= 20) {
      await AlertModel.create({
        customerId,
        type: 'risk_increase',
        severity: 'warning',
        title: 'Significant Risk Increase',
        message: `Churn risk increased by ${change} points`,
        riskScore: riskAnalysis.riskScore,
        previousRiskScore: previousRisk.riskScore,
        change,
        acknowledged: false,
        resolved: false,
      });
    }

    // Alert on critical risk
    if (riskAnalysis.riskScore >= 70 && previousRisk.riskScore < 70) {
      await AlertModel.create({
        customerId,
        type: 'critical_risk',
        severity: 'critical',
        title: 'Critical Churn Risk Detected',
        message: `Customer has crossed critical threshold with score ${riskAnalysis.riskScore}`,
        riskScore: riskAnalysis.riskScore,
        previousRiskScore: previousRisk.riskScore,
        change,
        acknowledged: false,
        resolved: false,
      });
    }
  }

  /**
   * Normalize a feature value
   */
  private normalizeFeature(name: string, value: number): number {
    const ranges: Record<string, { min: number; max: number }> = {
      loginFrequency: { min: 0, max: 30 },
      featureAdoption: { min: 0, max: 100 },
      supportTickets: { min: 0, max: 10 },
      npsScore: { min: 0, max: 10 },
      paymentDelays: { min: 0, max: 5 },
      sessionDuration: { min: 0, max: 60 },
      campaignsCreated: { min: 0, max: 50 },
      daysSinceLastActivity: { min: 0, max: 90 },
    };

    const range = ranges[name] || { min: 0, max: 1 };
    return (value - range.min) / (range.max - range.min);
  }

  /**
   * Get churn risk for a customer
   */
  async getRisk(customerId: string): Promise<IChurnRisk | null> {
    return ChurnRiskModel.findOne({ customerId }).lean();
  }

  /**
   * Get dashboard data
   */
  async getDashboard(): Promise<{
    totalCustomers: number;
    riskDistribution: Record<string, number>;
    avgRiskScore: number;
    criticalCustomers: IChurnRisk[];
    highRiskCustomers: IChurnRisk[];
  }> {
    const allRisks = await ChurnRiskModel.find().lean();

    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalScore = 0;

    allRisks.forEach(risk => {
      riskDistribution[risk.riskLevel]++;
      totalScore += risk.riskScore;
    });

    return {
      totalCustomers: allRisks.length,
      riskDistribution,
      avgRiskScore: allRisks.length > 0 ? Math.round(totalScore / allRisks.length) : 0,
      criticalCustomers: allRisks.filter(r => r.riskLevel === 'critical').slice(0, 20),
      highRiskCustomers: allRisks.filter(r => r.riskLevel === 'high').slice(0, 20),
    };
  }

  /**
   * Get high risk customers
   */
  async getHighRiskCustomers(limit: number = 50): Promise<IChurnRisk[]> {
    return ChurnRiskModel.find({ riskLevel: { $in: ['high', 'critical'] } })
      .sort({ riskScore: -1 })
      .limit(limit)
      .lean();
  }
}

export const churnPredictionService = new ChurnPredictionService();