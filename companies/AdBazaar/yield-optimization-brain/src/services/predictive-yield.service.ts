import {
  YieldPredictionRequest,
  YieldPrediction,
} from '../types/index.js';
import { YieldPrediction as YieldPredictionModel, YieldDecision } from '../models/index.js';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

export class PredictiveYieldService {
  /**
   * Predict future yield based on trends and patterns
   */
  async predictYield(request: YieldPredictionRequest): Promise<YieldPrediction> {
    const { horizon, inventoryType = 'all', context = 'all' } = request;

    logger.info('Predicting yield', { horizon, inventoryType, context });

    try {
      // Gather historical data
      const historicalData = await this.gatherHistoricalData(inventoryType, context, horizon);

      // Calculate factors affecting yield
      const factors = this.calculateFactors(historicalData);

      // Predict yield
      const predictedYield = this.predictYieldValue(factors, historicalData);

      // Calculate confidence
      const confidence = this.calculateConfidence(historicalData, factors);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(historicalData, factors);

      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, riskFactors);

      // Persist prediction
      await this.persistPrediction(request, predictedYield, confidence, factors, riskFactors);

      logger.info('Yield prediction complete', {
        horizon,
        predictedYield,
        confidence,
      });

      return {
        horizon,
        predictedYield,
        confidence,
        factors,
        recommendations,
        riskFactors,
      };
    } catch (error) {
      logger.error('Error predicting yield', {
        horizon,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gather historical data for prediction
   */
  private async gatherHistoricalData(
    inventoryType: string,
    context: string,
    horizon: string
  ): Promise<HistoricalDataPoint[]> {
    // Get appropriate time window for training
    const trainingWindow = this.getTrainingWindow(horizon);
    const startDate = new Date(Date.now() - trainingWindow);

    const query: Record<string, unknown> = {
      timestamp: { $gte: startDate },
    };

    if (inventoryType !== 'all') {
      query.inventoryType = inventoryType;
    }

    const decisions = await YieldDecision.find(query)
      .select('bid floorPrice expectedRevenue expectedCTR expectedCVR timestamp')
      .sort({ timestamp: 1 })
      .lean();

    // Convert to data points
    const dataPoints: HistoricalDataPoint[] = decisions.map(d => ({
      timestamp: d.timestamp,
      bid: d.bid,
      floorPrice: d.floorPrice,
      revenue: d.expectedRevenue,
      ctr: d.expectedCTR || 0,
      cvr: d.expectedCVR || 0,
    }));

    return dataPoints;
  }

  /**
   * Get training window based on prediction horizon
   */
  private getTrainingWindow(horizon: string): number {
    const windows: Record<string, number> = {
      '1h': 24 * 60 * 60 * 1000, // 1 day of history for 1 hour prediction
      '6h': 7 * 24 * 60 * 60 * 1000, // 7 days for 6 hour prediction
      '24h': 14 * 24 * 60 * 60 * 1000, // 14 days for 24 hour prediction
      '7d': 30 * 24 * 60 * 60 * 1000, // 30 days for 7 day prediction
    };

    return windows[horizon] || windows['24h'];
  }

  /**
   * Calculate factors that affect yield
   */
  private calculateFactors(dataPoints: HistoricalDataPoint[]): YieldPrediction['factors'] {
    if (dataPoints.length < 2) {
      return [];
    }

    const factors: YieldPrediction['factors'] = [];

    // Revenue trend
    const revenueTrend = this.calculateTrend(dataPoints.map(d => d.revenue));
    factors.push({
      name: 'Revenue Trend',
      contribution: revenueTrend.slope,
      trend: revenueTrend.direction,
    });

    // Bid trend
    const bidTrend = this.calculateTrend(dataPoints.map(d => d.bid));
    factors.push({
      name: 'Bid Trend',
      contribution: bidTrend.slope,
      trend: bidTrend.direction,
    });

    // CTR trend
    const ctrTrend = this.calculateTrend(dataPoints.map(d => d.ctr));
    factors.push({
      name: 'CTR Trend',
      contribution: ctrTrend.slope,
      trend: ctrTrend.direction,
    });

    // CVR trend
    const cvrTrend = this.calculateTrend(dataPoints.map(d => d.cvr));
    factors.push({
      name: 'Conversion Trend',
      contribution: cvrTrend.slope,
      trend: cvrTrend.direction,
    });

    // Volatility factor
    const volatility = this.calculateVolatility(dataPoints.map(d => d.revenue));
    factors.push({
      name: 'Market Volatility',
      contribution: volatility,
      trend: volatility > 0.3 ? 'increasing' : volatility < 0.1 ? 'decreasing' : 'stable',
    });

    return factors;
  }

  /**
   * Calculate trend from data series
   */
  private calculateTrend(values: number[]): { slope: number; direction: 'increasing' | 'decreasing' | 'stable' } {
    if (values.length < 2) {
      return { slope: 0, direction: 'stable' };
    }

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Normalize slope
    const avgValue = sumY / n;
    const normalizedSlope = avgValue > 0 ? slope / avgValue : 0;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (normalizedSlope > 0.01) {
      direction = 'increasing';
    } else if (normalizedSlope < -0.01) {
      direction = 'decreasing';
    } else {
      direction = 'stable';
    }

    return { slope: normalizedSlope, direction };
  }

  /**
   * Calculate volatility of data
   */
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;

    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean;
  }

  /**
   * Predict yield value
   */
  private predictYieldValue(
    factors: YieldPrediction['factors'],
    dataPoints: HistoricalDataPoint[]
  ): number {
    if (dataPoints.length === 0) {
      return 0;
    }

    // Calculate baseline from recent data
    const recentData = dataPoints.slice(-Math.min(100, dataPoints.length));
    const baselineRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length;
    const baselineCTR = recentData.reduce((sum, d) => sum + d.ctr, 0) / recentData.length;
    const baselineCVR = recentData.reduce((sum, d) => sum + d.cvr, 0) / recentData.length;

    // Apply factor adjustments
    let adjustment = 1;
    for (const factor of factors) {
      if (factor.name === 'Revenue Trend' || factor.name === 'Bid Trend') {
        adjustment += factor.contribution;
      }
    }

    // Calculate predicted yield
    const predictedRevenue = baselineRevenue * adjustment;

    // Factor in CTR and CVR
    const avgCTR = recentData.reduce((sum, d) => sum + d.ctr, 0) / recentData.length;
    const avgCVR = recentData.reduce((sum, d) => sum + d.cvr, 0) / recentData.length;

    // Yield = revenue adjusted by engagement metrics
    return predictedRevenue * (1 + avgCTR) * (1 + avgCVR);
  }

  /**
   * Calculate confidence in prediction
   */
  private calculateConfidence(
    dataPoints: HistoricalDataPoint[],
    factors: YieldPrediction['factors']
  ): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (dataPoints.length > 100) {
      confidence += 0.2;
    } else if (dataPoints.length > 50) {
      confidence += 0.1;
    }

    // Stable trends = higher confidence
    const stableFactors = factors.filter(f => f.trend === 'stable').length;
    confidence += stableFactors * 0.05;

    // Low volatility = higher confidence
    const volatilityFactor = factors.find(f => f.name === 'Market Volatility');
    if (volatilityFactor && volatilityFactor.contribution < 0.2) {
      confidence += 0.1;
    }

    // Consistent patterns = higher confidence
    if (dataPoints.length > 10) {
      const recentData = dataPoints.slice(-Math.min(10, dataPoints.length));
      const variance = this.calculateVolatility(recentData.map(d => d.revenue));
      if (variance < 0.2) {
        confidence += 0.1;
      }
    }

    return Math.min(0.95, Math.max(0.5, confidence));
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    dataPoints: HistoricalDataPoint[],
    factors: YieldPrediction['factors']
  ): YieldPrediction['riskFactors'] {
    const riskFactors: YieldPrediction['riskFactors'] = [];

    // Check for declining trends
    const revenueTrend = factors.find(f => f.name === 'Revenue Trend');
    if (revenueTrend && revenueTrend.trend === 'decreasing') {
      riskFactors.push({
        factor: 'Declining Revenue Trend',
        probability: 0.7,
        impact: 'high',
      });
    }

    // Check for high volatility
    const volatilityFactor = factors.find(f => f.name === 'Market Volatility');
    if (volatilityFactor && volatilityFactor.contribution > 0.4) {
      riskFactors.push({
        factor: 'High Market Volatility',
        probability: 0.6,
        impact: 'medium',
      });
    }

    // Check for bid pressure
    const bidTrend = factors.find(f => f.name === 'Bid Trend');
    if (bidTrend && bidTrend.trend === 'decreasing') {
      riskFactors.push({
        factor: 'Declining Bid Values',
        probability: 0.5,
        impact: 'medium',
      });
    }

    // Check for low data volume
    if (dataPoints.length < 20) {
      riskFactors.push({
        factor: 'Limited Historical Data',
        probability: 0.4,
        impact: 'low',
      });
    }

    return riskFactors;
  }

  /**
   * Generate recommendations based on prediction
   */
  private generateRecommendations(
    factors: YieldPrediction['factors'],
    riskFactors: YieldPrediction['riskFactors']
  ): YieldPrediction['recommendations'] {
    const recommendations: YieldPrediction['recommendations'] = [];

    // Based on trends
    const revenueTrend = factors.find(f => f.name === 'Revenue Trend');
    if (revenueTrend) {
      if (revenueTrend.trend === 'increasing') {
        recommendations.push({
          action: 'Consider increasing floor prices to capture more value',
          expectedImpact: 0.15,
          priority: 'high',
        });
      } else if (revenueTrend.trend === 'decreasing') {
        recommendations.push({
          action: 'Review competitive positioning - revenue trending down',
          expectedImpact: -0.1,
          priority: 'high',
        });
      }
    }

    // Based on bid trends
    const bidTrend = factors.find(f => f.name === 'Bid Trend');
    if (bidTrend && bidTrend.trend === 'increasing') {
      recommendations.push({
        action: 'Increase bid floor to match rising market bids',
        expectedImpact: 0.08,
        priority: 'medium',
      });
    }

    // Based on risk factors
    if (riskFactors.some(r => r.factor === 'High Market Volatility')) {
      recommendations.push({
        action: 'Implement dynamic floor pricing to manage volatility risk',
        expectedImpact: 0.05,
        priority: 'medium',
      });
    }

    if (riskFactors.some(r => r.factor === 'Limited Historical Data')) {
      recommendations.push({
        action: 'Continue monitoring - limited data for accurate prediction',
        expectedImpact: 0,
        priority: 'low',
      });
    }

    return recommendations;
  }

  /**
   * Persist prediction to database
   */
  private async persistPrediction(
    request: YieldPredictionRequest,
    predictedYield: number,
    confidence: number,
    factors: YieldPrediction['factors'],
    riskFactors: YieldPrediction['riskFactors']
  ): Promise<void> {
    try {
      const doc = new YieldPredictionModel({
        inventoryType: request.inventoryType || 'all',
        context: request.context || 'all',
        horizon: request.horizon,
        predictedYield,
        confidence,
        factors,
        riskFactors,
        timestamp: new Date(),
      });

      await doc.save();
    } catch (error) {
      logger.error('Failed to persist prediction', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get prediction history
   */
  async getPredictionHistory(
    inventoryType?: string,
    horizon?: string,
    limit = 30
  ): Promise<YieldPrediction[]> {
    const query: Record<string, unknown> = {};

    if (inventoryType) {
      query.inventoryType = inventoryType;
    }

    if (horizon) {
      query.horizon = horizon;
    }

    const docs = await YieldPredictionModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return docs.map(doc => ({
      horizon: doc.horizon,
      predictedYield: doc.predictedYield,
      confidence: doc.confidence,
      factors: doc.factors,
      recommendations: [],
      riskFactors: doc.riskFactors,
    }));
  }
}

interface HistoricalDataPoint {
  timestamp: Date;
  bid: number;
  floorPrice: number;
  revenue: number;
  ctr: number;
  cvr: number;
}

export const predictiveYieldService = new PredictiveYieldService();