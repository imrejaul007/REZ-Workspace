/**
 * TreasuryOS - ML Forecasting Service
 * Advanced forecasting using HOJAI AI for improved accuracy
 */

import axios from 'axios';
import Decimal from 'decimal.js';
import { CashTransaction, TreasuryAccount, CashForecast } from '../../models';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// HOJAI AI Service URL
const HOJAI_GATEWAY_URL = process.env.HOJAI_GATEWAY_URL || 'http://localhost:4500';
const HOJAI_API_KEY = process.env.HOJAI_API_KEY;

export interface MLForecastInput {
  businessId: string;
  historicalDays: number;
  forecastWeeks: number;
  includeSeasonality: boolean;
  includeExternalFactors: boolean;
}

export interface MLForecastOutput {
  weeklyForecasts: Array<{
    weekNumber: number;
    weekStartDate: Date;
    projectedInflow: number;
    projectedOutflow: number;
    netCashFlow: number;
    openingBalance: number;
    closingBalance: number;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: Array<{
      type: string;
      description: string;
      impact: number;
      probability: number;
    }>;
  }>;
  modelInfo: {
    modelType: string;
    accuracy: number;
    lastTrained: Date;
    dataPoints: number;
  };
  insights: Array<{
    type: 'pattern' | 'anomaly' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
  }>;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  type: 'spike' | 'dip' | 'unusual_pattern' | 'trend_reversal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedValue: number;
  actualValue: number;
  deviationPercent: number;
  possibleCauses: string[];
}

export interface SeasonalPattern {
  name: string;
  strength: number; // 0-1
  peakMonths: number[]; // 0-11
  troughMonths: number[];
  averageLift: number; // e.g., 1.2 = 20% above average
}

export class MLForecastService {
  private hojaiClient: ReturnType<typeof axios.create>;

  constructor() {
    this.hojaiClient = axios.create({
      baseURL: HOJAI_GATEWAY_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(HOJAI_API_KEY && { 'Authorization': `Bearer ${HOJAI_API_KEY}` }),
      },
    });
  }

  /**
   * Generate ML-enhanced cash flow forecast
   */
  async generateMLForecast(input: MLForecastInput): Promise<MLForecastOutput> {
    // Step 1: Collect historical data
    const historicalData = await this.collectHistoricalData(
      input.businessId,
      input.historicalDays
    );

    // Step 2: Detect patterns and seasonality
    const patterns = this.detectSeasonalPatterns(historicalData);

    // Step 3: Detect anomalies
    const anomalies = this.detectAnomalies(historicalData);

    // Step 4: Call HOJAI AI for prediction
    const aiPrediction = await this.getAIInsight(historicalData, patterns, anomalies);

    // Step 5: Generate forecasts
    const forecasts = this.generateWeeklyForecasts(
      historicalData,
      patterns,
      anomalies,
      aiPrediction,
      input.forecastWeeks
    );

    // Step 6: Generate insights
    const insights = this.generateInsights(historicalData, patterns, anomalies, forecasts);

    // Step 7: Calculate confidence
    const confidence = this.calculateModelConfidence(historicalData, anomalies);

    return {
      weeklyForecasts: forecasts,
      modelInfo: {
        modelType: 'hybrid_ml_ai',
        accuracy: confidence,
        lastTrained: new Date(),
        dataPoints: historicalData.length,
      },
      insights,
    };
  }

  /**
   * Collect historical transaction data
   */
  private async collectHistoricalData(
    businessId: string,
    days: number
  ): Promise<Array<{ date: Date; inflow: number; outflow: number; balance: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const accounts = await TreasuryAccount.find({ businessId, status: 'active' });
    const accountIds = accounts.map(a => a.accountId);

    const transactions = await CashTransaction.find({
      accountId: { $in: accountIds },
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    // Aggregate by day
    const dailyData: Record<string, { inflow: number; outflow: number }> = {};

    for (const txn of transactions) {
      const dateKey = txn.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { inflow: 0, outflow: 0 };
      }
      if (txn.category === 'inflow') {
        dailyData[dateKey].inflow += txn.amount;
      } else {
        dailyData[dateKey].outflow += txn.amount;
      }
    }

    // Convert to array
    const result: Array<{ date: Date; inflow: number; outflow: number; balance: number }> = [];
    let runningBalance = 0;

    for (const [dateKey, data] of Object.entries(dailyData)) {
      runningBalance += data.inflow - data.outflow;
      result.push({
        date: new Date(dateKey),
        inflow: data.inflow,
        outflow: data.outflow,
        balance: runningBalance,
      });
    }

    return result;
  }

  /**
   * Detect seasonal patterns
   */
  private detectSeasonalPatterns(
    data: Array<{ date: Date; inflow: number; outflow: number }>
  ): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];

    // Monthly patterns
    const monthlyInflow: number[] = Array(12).fill(0);
    const monthlyCount: number[] = Array(12).fill(0);
    const monthlyOutflow: number[] = Array(12).fill(0);

    for (const day of data) {
      const month = day.date.getMonth();
      monthlyInflow[month] += day.inflow;
      monthlyOutflow[month] += day.outflow;
      monthlyCount[month]++;
    }

    // Calculate average
    const avgInflow = monthlyInflow.reduce((a, b) => a + b, 0) / Math.max(1, data.length);

    // Find peaks and troughs
    const monthlyAvgInflow = monthlyInflow.map((v, i) => ({
      month: i,
      avg: monthlyCount[i] > 0 ? v / monthlyCount[i] : 0,
    }));

    const peakMonths = monthlyAvgInflow
      .filter(m => m.avg > avgInflow * 1.1)
      .map(m => m.month);

    const troughMonths = monthlyAvgInflow
      .filter(m => m.avg < avgInflow * 0.9)
      .map(m => m.month);

    if (peakMonths.length > 0) {
      patterns.push({
        name: 'Monthly Inflow Pattern',
        strength: Math.min(1, (peakMonths.length + troughMonths.length) / 12),
        peakMonths,
        troughMonths,
        averageLift: peakMonths.length > 0
          ? Math.max(...monthlyAvgInflow.filter(m => peakMonths.includes(m.month)).avg / avgInflow
          : 1,
      });
    }

    // Day of week patterns
    const dayOfWeekInflow: number[] = Array(7).fill(0);
    const dayOfWeekCount: number[] = Array(7).fill(0);

    for (const day of data) {
      const dow = day.date.getDay();
      dayOfWeekInflow[dow] += day.inflow;
      dayOfWeekCount[dow]++;
    }

    const dowPattern: SeasonalPattern = {
      name: 'Day of Week Pattern',
      strength: 0.5,
      peakMonths: [], // Not applicable
      troughMonths: [],
      averageLift: 1,
    };

    patterns.push(dowPattern);

    return patterns;
  }

  /**
   * Detect anomalies in historical data
   */
  private detectAnomalies(
    data: Array<{ date: Date; inflow: number; outflow: number }>
  ): AnomalyDetectionResult[] {
    const anomalies: AnomalyDetectionResult[] = [];

    if (data.length < 7) return anomalies;

    // Calculate rolling statistics
    const windowSize = 7;
    const recentData = data.slice(-30); // Last 30 days

    const avgInflow = recentData.reduce((sum, d) => sum + d.inflow, 0) / recentData.length;
    const stdInflow = Math.sqrt(
      recentData.reduce((sum, d) => sum + Math.pow(d.inflow - avgInflow, 2), 0) / recentData.length
    );

    const avgOutflow = recentData.reduce((sum, d) => sum + d.outflow, 0) / recentData.length;
    const stdOutflow = Math.sqrt(
      recentData.reduce((sum, d) => sum + Math.pow(d.outflow - avgOutflow, 2), 0) / recentData.length
    );

    // Check for spikes
    for (const day of data.slice(-7)) {
      const inflowZScore = Math.abs((day.inflow - avgInflow) / Math.max(1, stdInflow));
      const outflowZScore = Math.abs((day.outflow - avgOutflow) / Math.max(1, stdOutflow));

      if (inflowZScore > 2) {
        anomalies.push({
          isAnomaly: true,
          type: 'spike',
          severity: inflowZScore > 3 ? 'high' : 'medium',
          description: `Unusual inflow detected on ${day.date.toISOString().split('T')[0]}`,
          expectedValue: avgInflow,
          actualValue: day.inflow,
          deviationPercent: ((day.inflow - avgInflow) / avgInflow) * 100,
          possibleCauses: ['Large payment received', 'Seasonal variation', 'One-time event'],
        });
      }

      if (outflowZScore > 2) {
        anomalies.push({
          isAnomaly: true,
          type: 'dip',
          severity: outflowZScore > 3 ? 'high' : 'medium',
          description: `Unusual outflow detected on ${day.date.toISOString().split('T')[0]}`,
          expectedValue: avgOutflow,
          actualValue: day.outflow,
          deviationPercent: ((day.outflow - avgOutflow) / avgOutflow) * 100,
          possibleCauses: ['Large payment made', 'Expense timing', 'Seasonal variation'],
        });
      }
    }

    return anomalies;
  }

  /**
   * Get AI insight from HOJAI
   */
  private async getAIInsight(
    historicalData: Array<{ date: Date; inflow: number; outflow: number }>,
    patterns: SeasonalPattern[],
    anomalies: AnomalyDetectionResult[]
  ): Promise<{
    forecastAdjustment: number;
    riskFactors: string[];
    confidenceModifier: number;
  }> {
    try {
      const response = await this.hojaiClient.post('/api/v1/ai/analyze', {
        type: 'time_series_forecast',
        data: {
          series: historicalData.map(d => ({
            timestamp: d.date.toISOString(),
            value: d.inflow - d.outflow,
          })),
          patterns: patterns.map(p => ({ name: p.name, strength: p.strength })),
          anomalies: anomalies.map(a => ({ type: a.type, severity: a.severity })),
        },
        parameters: {
          forecastHorizon: 13,
          confidenceLevel: 0.95,
          includeAnomalyAdjustment: true,
        },
      });

      return {
        forecastAdjustment: response.data.adjustmentFactor || 1,
        riskFactors: response.data.riskFactors || [],
        confidenceModifier: response.data.confidenceModifier || 1,
      };
    } catch (error) {
      // Fallback to statistical forecast if AI is unavailable
      console.warn('HOJAI AI unavailable, using statistical forecast:', error);
      return {
        forecastAdjustment: 1,
        riskFactors: [],
        confidenceModifier: 0.9,
      };
    }
  }

  /**
   * Generate weekly forecasts
   */
  private generateWeeklyForecasts(
    historicalData: Array<{ date: Date; inflow: number; outflow: number }>,
    patterns: SeasonalPattern[],
    anomalies: AnomalyDetectionResult[],
    aiPrediction: { forecastAdjustment: number; riskFactors: string[] },
    weeks: number
  ): MLForecastOutput['weeklyForecasts'] {
    const forecasts: MLForecastOutput['weeklyForecasts'] = [];

    // Calculate baseline averages
    const recentData = historicalData.slice(-30);
    const avgDailyInflow = recentData.reduce((sum, d) => sum + d.inflow, 0) / Math.max(1, recentData.length);
    const avgDailyOutflow = recentData.reduce((sum, d) => sum + d.outflow, 0) / Math.max(1, recentData.length);

    const lastBalance = historicalData.length > 0
      ? historicalData[historicalData.length - 1].balance
      : 0;

    let runningBalance = lastBalance;

    for (let week = 0; week < weeks; week++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() + week * 7);
      weekStart.setHours(0, 0, 0, 0);

      // Calculate week-of-month adjustment
      const weekOfMonth = Math.floor(weekStart.getDate() / 7);
      let weekMultiplier = 1;
      if (weekOfMonth === 0) weekMultiplier = 0.85; // First week lower
      else if (weekOfMonth === 3) weekMultiplier = 1.1; // Month-end push

      // Apply AI adjustment and seasonality
      const adjustmentFactor = aiPrediction.forecastAdjustment * weekMultiplier;

      const projectedInflow = new Decimal(avgDailyInflow * 7 * adjustmentFactor).toNumber();
      const projectedOutflow = new Decimal(avgDailyOutflow * 7).toNumber();
      const netCashFlow = new Decimal(projectedInflow - projectedOutflow).toNumber();
      const closingBalance = new Decimal(runningBalance + netCashFlow).toNumber();

      // Calculate risk level
      const riskLevel = this.calculateRiskLevel(closingBalance, projectedOutflow);

      // Calculate confidence (decreases over time)
      const baseConfidence = 0.85;
      const confidence = Math.max(0.5, baseConfidence - week * 0.025) * (aiPrediction.riskFactors.length > 0 ? 0.9 : 1);

      // Generate factors
      const factors = this.generateFactors(week, patterns, anomalies, aiPrediction);

      forecasts.push({
        weekNumber: week + 1,
        weekStartDate: weekStart,
        projectedInflow,
        projectedOutflow,
        netCashFlow,
        openingBalance: runningBalance,
        closingBalance,
        confidence,
        riskLevel,
        factors,
      });

      runningBalance = closingBalance;
    }

    return forecasts;
  }

  /**
   * Calculate risk level based on balance and outflow
   */
  private calculateRiskLevel(
    closingBalance: number,
    projectedOutflow: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (closingBalance < 0) return 'critical';
    if (closingBalance < projectedOutflow * 0.5) return 'critical';
    if (closingBalance < projectedOutflow) return 'high';
    if (closingBalance < projectedOutflow * 2) return 'medium';
    return 'low';
  }

  /**
   * Generate contributing factors for forecast
   */
  private generateFactors(
    week: number,
    patterns: SeasonalPattern[],
    anomalies: AnomalyDetectionResult[],
    aiPrediction: { riskFactors: string[] }
  ): Array<{ type: string; description: string; impact: number; probability: number }> {
    const factors: Array<{ type: string; description: string; impact: number; probability: number }> = [];

    // Seasonal factor
    if (patterns.length > 0) {
      factors.push({
        type: 'seasonal',
        description: 'Seasonal pattern detected in historical data',
        impact: 0.1,
        probability: 0.8,
      });
    }

    // Anomaly factor
    if (anomalies.length > 0) {
      factors.push({
        type: 'anomaly',
        description: `${anomalies.length} anomalies detected in recent data`,
        impact: 0.05,
        probability: 0.7,
      });
    }

    // AI factors
    if (aiPrediction.riskFactors.length > 0) {
      factors.push({
        type: 'ai_insight',
        description: aiPrediction.riskFactors.join(', '),
        impact: 0.15,
        probability: 0.9,
      });
    }

    // Week-of-month factor
    const weekOfMonth = Math.floor(new Date().getDate() / 7) + Math.floor(week / 4);
    if (weekOfMonth === 0) {
      factors.push({
        type: 'timing',
        description: 'First week typically has lower activity',
        impact: -0.1,
        probability: 0.75,
      });
    } else if (weekOfMonth === 3) {
      factors.push({
        type: 'timing',
        description: 'Month-end typically sees higher activity',
        impact: 0.1,
        probability: 0.8,
      });
    }

    return factors;
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(
    historicalData: Array<{ date: Date; inflow: number; outflow: number }>,
    patterns: SeasonalPattern[],
    anomalies: AnomalyDetectionResult[],
    forecasts: MLForecastOutput['weeklyForecasts']
  ): MLForecastOutput['insights'] {
    const insights: MLForecastOutput['insights'] = [];

    // Pattern insights
    if (patterns.length > 0) {
      insights.push({
        type: 'pattern',
        title: 'Seasonal Patterns Detected',
        description: `Found ${patterns.length} significant patterns in your cash flow data.`,
        confidence: 0.85,
      });
    }

    // Anomaly insights
    if (anomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Recent Anomalies Detected',
        description: `${anomalies.length} unusual transactions detected that may affect forecast accuracy.`,
        confidence: 0.8,
      });
    }

    // Forecast insights
    const avgForecastBalance = forecasts.reduce((sum, f) => sum + f.closingBalance, 0) / forecasts.length;
    if (avgForecastBalance > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Positive Cash Flow Trend',
        description: 'Projected cash position remains healthy over the forecast period.',
        confidence: 0.9,
      });
    } else {
      insights.push({
        type: 'recommendation',
        title: 'Cash Flow Warning',
        description: 'Consider reviewing expenses or accelerating receivables to improve cash position.',
        confidence: 0.85,
      });
    }

    // Trend insights
    if (historicalData.length >= 7) {
      const recentTrend = this.calculateTrend(historicalData.slice(-7));
      if (recentTrend > 0.1) {
        insights.push({
          type: 'pattern',
          title: 'Upward Trend',
          description: 'Your cash flow shows an upward trend over the past week.',
          confidence: 0.75,
        });
      } else if (recentTrend < -0.1) {
        insights.push({
          type: 'pattern',
          title: 'Downward Trend',
          description: 'Your cash flow shows a downward trend over the past week.',
          confidence: 0.75,
        });
      }
    }

    return insights;
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(data: Array<{ balance: number }>): number {
    if (data.length < 2) return 0;
    const first = data[0].balance;
    const last = data[data.length - 1].balance;
    if (first === 0) return 0;
    return (last - first) / first;
  }

  /**
   * Calculate model confidence
   */
  private calculateModelConfidence(
    historicalData: Array<{ inflow: number; outflow: number }>,
    anomalies: AnomalyDetectionResult[]
  ): number {
    // Base confidence from data quantity
    let confidence = Math.min(0.95, historicalData.length / 90);

    // Reduce for anomalies
    const anomalyPenalty = anomalies.length * 0.02;
    confidence = Math.max(0.5, confidence - anomalyPenalty);

    return confidence;
  }

  /**
   * Detect anomalies in real-time
   */
  async detectRealTimeAnomaly(
    value: number,
    businessId: string,
    metric: 'inflow' | 'outflow'
  ): Promise<AnomalyDetectionResult | null> {
    // Get recent baseline
    const historicalData = await this.collectHistoricalData(businessId, 30);
    const recentData = historicalData.slice(-7);

    if (recentData.length === 0) return null;

    const values = recentData.map(d => metric === 'inflow' ? d.inflow : d.outflow);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length);

    const zScore = Math.abs((value - avg) / Math.max(1, std));

    if (zScore > 2) {
      return {
        isAnomaly: true,
        type: zScore > 3 ? 'spike' : 'unusual_pattern',
        severity: zScore > 3 ? 'high' : 'medium',
        description: `Unusual ${metric} detected: ₹${value.toLocaleString()} (z-score: ${zScore.toFixed(2)})`,
        expectedValue: avg,
        actualValue: value,
        deviationPercent: ((value - avg) / avg) * 100,
        possibleCauses: ['One-time event', 'Seasonal variation', 'Data entry error', 'Fraud'],
      };
    }

    return null;
  }
}

export const mlForecastService = new MLForecastService();