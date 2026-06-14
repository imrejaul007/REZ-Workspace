import { FillRate, IFillRate } from '../models/FillRate';
import { FillAnalysis, IFillAnalysis } from '../models/FillAnalysis';
import { logger } from 'utils/logger.js';

export interface AnalysisFactor {
  name: string;
  impact: number;
  description: string;
  category: 'demand' | 'supply' | 'technical' | 'pricing';
}

export interface AnalysisRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  expectedImpact: number;
  implementation: string;
  category: 'inventory' | 'demand' | 'pricing' | 'technical';
}

export class AnalysisService {
  // Analyze fill rate for an inventory
  async analyzeFillRate(inventoryId: string, startDate?: Date, endDate?: Date): Promise<IFillAnalysis> {
    try {
      logger.info('Analyzing fill rate', { inventoryId, startDate, endDate });

      // Get fill rate data
      const query: any = { inventoryId };
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      const fillRates = await FillRate.find(query)
        .sort({ date: -1 })
        .limit(1000)
        .lean();

      if (fillRates.length === 0) {
        throw new Error(`No fill rate data found for inventory ${inventoryId}`);
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(fillRates);

      // Identify factors affecting fill rate
      const factors = this.identifyFactors(fillRates, metrics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, metrics);

      // Create or update analysis record
      const inventoryName = fillRates[0]?.inventoryName;

      const analysis = new FillAnalysis({
        inventoryId,
        inventoryName,
        analysisDate: new Date(),
        factors,
        recommendations,
        metrics
      });

      await analysis.save();

      logger.info('Fill rate analysis completed', {
        inventoryId,
        avgFillRate: metrics.avgFillRate,
        recommendations: recommendations.length
      });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing fill rate', { error, inventoryId });
      throw error;
    }
  }

  // Get historical analysis
  async getHistoricalAnalysis(inventoryId: string, limit: number = 10): Promise<IFillAnalysis[]> {
    try {
      return await FillAnalysis.find({ inventoryId })
        .sort({ analysisDate: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Error getting historical analysis', { error, inventoryId });
      throw error;
    }
  }

  // Get latest analysis
  async getLatestAnalysis(inventoryId?: string): Promise<IFillAnalysis | IFillAnalysis[] | null> {
    try {
      const query = inventoryId ? { inventoryId } : {};
      const results = await FillAnalysis.find(query)
        .sort({ analysisDate: -1 });

      return inventoryId
        ? results[0] || null
        : results;
    } catch (error) {
      logger.error('Error getting latest analysis', { error, inventoryId });
      throw error;
    }
  }

  // Compare fill rate across inventories
  async compareInventories(inventoryIds: string[], startDate?: Date, endDate?: Date): Promise<{
    inventoryId: string;
    avgFillRate: number;
    trend: string;
    rank: number;
  }[]> {
    try {
      const query: any = {};
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      const results = await Promise.all(
        inventoryIds.map(async (inventoryId) => {
          const agg = await FillRate.aggregate([
            { $match: { ...query, inventoryId } },
            {
              $group: {
                _id: inventoryId,
                avgFillRate: { $avg: '$rate' },
                totalImpressions: { $sum: '$impressions' },
                totalFilled: { $sum: '$filled' }
              }
            }
          ]);
          return agg[0] || { _id: inventoryId, avgFillRate: 0, totalImpressions: 0, totalFilled: 0 };
        })
      );

      // Sort by fill rate
      const sorted = results
        .map(r => ({
          inventoryId: r._id,
          avgFillRate: Math.round(r.avgFillRate * 100) / 100,
          trend: r.avgFillRate > 70 ? 'high' : r.avgFillRate > 50 ? 'medium' : 'low',
          rank: 0
        }))
        .sort((a, b) => b.avgFillRate - a.avgFillRate)
        .map((r, i) => ({ ...r, rank: i + 1 }));

      return sorted;
    } catch (error) {
      logger.error('Error comparing inventories', { error, inventoryIds });
      throw error;
    }
  }

  private calculateMetrics(fillRates: IFillRate[]): {
    avgFillRate: number;
    minFillRate: number;
    maxFillRate: number;
    totalImpressions: number;
    totalFilled: number;
    fillRateVariance: number;
  } {
    const rates = fillRates.map(fr => fr.rate);
    const impressions = fillRates.map(fr => fr.impressions);
    const filled = fillRates.map(fr => fr.filled);

    const avgFillRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const minFillRate = Math.min(...rates);
    const maxFillRate = Math.max(...rates);
    const totalImpressions = impressions.reduce((a, b) => a + b, 0);
    const totalFilled = filled.reduce((a, b) => a + b, 0);

    // Calculate variance
    const squaredDiffs = rates.map(r => Math.pow(r - avgFillRate, 2));
    const fillRateVariance = squaredDiffs.reduce((a, b) => a + b, 0) / rates.length;

    return {
      avgFillRate: Math.round(avgFillRate * 100) / 100,
      minFillRate: Math.round(minFillRate * 100) / 100,
      maxFillRate: Math.round(maxFillRate * 100) / 100,
      totalImpressions,
      totalFilled,
      fillRateVariance: Math.round(fillRateVariance * 100) / 100
    };
  }

  private identifyFactors(fillRates: IFillRate[], metrics: any): AnalysisFactor[] {
    const factors: AnalysisFactor[] = [];

    // Time-based patterns
    const hourlyRates = new Map<number, number[]>();
    fillRates.forEach(fr => {
      const hour = new Date(fr.date).getHours();
      if (!hourlyRates.has(hour)) hourlyRates.set(hour, []);
      hourlyRates.get(hour)!.push(fr.rate);
    });

    let maxHourlyVariance = 0;
    let worstHour = 0;
    hourlyRates.forEach((rates, hour) => {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      const variance = rates.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / rates.length;
      if (variance > maxHourlyVariance) {
        maxHourlyVariance = variance;
        worstHour = hour;
      }
    });

    if (maxHourlyVariance > 10) {
      factors.push({
        name: 'Time-based demand variance',
        impact: Math.round(maxHourlyVariance),
        description: `Fill rate varies significantly by time of day, worst at ${worstHour}:00`,
        category: 'demand'
      });
    }

    // Low fill rate factor
    if (metrics.avgFillRate < 50) {
      factors.push({
        name: 'Low overall fill rate',
        impact: 100 - metrics.avgFillRate,
        description: 'Fill rate is below optimal levels, indicating demand-supply mismatch',
        category: 'demand'
      });
    }

    // High variance factor
    if (metrics.fillRateVariance > 25) {
      factors.push({
        name: 'High fill rate volatility',
        impact: Math.round(metrics.fillRateVariance / 2),
        description: 'Fill rate fluctuates significantly, suggesting inconsistent demand patterns',
        category: 'demand'
      });
    }

    // Unfilled inventory factor
    const unfilledRate = ((metrics.totalImpressions - metrics.totalFilled) / metrics.totalImpressions) * 100;
    if (unfilledRate > 30) {
      factors.push({
        name: 'High unfilled inventory',
        impact: unfilledRate,
        description: `${Math.round(unfilledRate)}% of inventory remains unfilled`,
        category: 'supply'
      });
    }

    return factors;
  }

  private generateRecommendations(factors: AnalysisFactor[], metrics: any): AnalysisRecommendation[] {
    const recommendations: AnalysisRecommendation[] = [];

    // Based on factors
    factors.forEach(factor => {
      if (factor.category === 'demand' && factor.impact > 20) {
        recommendations.push({
          priority: 'high',
          action: `Address time-based demand variance: ${factor.description}`,
          expectedImpact: factor.impact * 0.5,
          implementation: 'Analyze historical patterns and adjust pricing or targeting during low-fill hours',
          category: 'demand'
        });
      }

      if (factor.name === 'Low overall fill rate') {
        recommendations.push({
          priority: 'high',
          action: 'Increase demand for inventory',
          expectedImpact: 15,
          implementation: 'Consider expanding to new demand sources, adjusting floor prices, or improving targeting',
          category: 'demand'
        });
      }

      if (factor.name === 'High unfilled inventory') {
        recommendations.push({
          priority: 'medium',
          action: 'Optimize inventory pricing',
          expectedImpact: 10,
          implementation: 'Lower floor prices or implement dynamic pricing to attract more demand',
          category: 'pricing'
        });
      }
    });

    // Sort by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
}