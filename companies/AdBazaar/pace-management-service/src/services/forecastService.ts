import { PacingForecast, PacingStatus, CampaignPacing, IPacingForecastDocument } from '../models';
import { IForecastFactor } from '../types';
import { forecastLogger } from '../utils/logger';
import { forecastAccuracy } from '../utils/metrics';
import { redisClient } from './redisClient';
import { REDIS_KEYS } from '../types';

export interface ForecastResult {
  campaignId: string;
  date: Date;
  projectedSpend: number;
  projectedImpressions: number;
  projectedClicks: number;
  projectedConversions: number;
  confidence: number;
  confidenceLabel: string;
  factors: IForecastFactor[];
  projectedEndDate?: Date;
  budgetExhaustionDate?: Date;
  daysToCompletion?: number;
}

export interface ForecastInput {
  forecastDays?: number;
  includeFactors?: boolean;
}

export class ForecastService {
  /**
   * Get forecast for a campaign
   */
  async getForecast(campaignId: string, input: ForecastInput = {}): Promise<ForecastResult | null> {
    const { forecastDays = 7, includeFactors = true } = input;

    forecastLogger.debug('Getting forecast', { campaignId, forecastDays });

    // Check cache
    const cacheKey = REDIS_KEYS.PACING_FORECAST(campaignId);
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      forecastLogger.debug('Returning cached forecast', { campaignId });
      return JSON.parse(cached);
    }

    const pacing = await CampaignPacing.findOne({ campaignId });
    if (!pacing) {
      forecastLogger.warn('Campaign pacing not found', { campaignId });
      return null;
    }

    // Get historical data for forecast
    const historicalData = await this.getHistoricalData(campaignId, forecastDays);
    if (historicalData.length === 0) {
      forecastLogger.warn('No historical data for forecast', { campaignId });
      return this.createDefaultForecast(pacing);
    }

    // Calculate forecast
    const forecast = await this.calculateForecast(pacing, historicalData, includeFactors);

    // Save forecast to database
    await PacingForecast.generateForecast(campaignId, historicalData);

    // Cache forecast
    await redisClient.setEx(cacheKey, 300, JSON.stringify(forecast));

    return forecast;
  }

  /**
   * Get forecast history
   */
  async getForecastHistory(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IPacingForecastDocument[]> {
    forecastLogger.debug('Getting forecast history', { campaignId, startDate, endDate });
    return PacingForecast.getForecastRange(campaignId, startDate, endDate);
  }

  /**
   * Calculate forecast accuracy
   */
  async calculateAccuracy(campaignId: string, historicalDays: number = 7): Promise<number | null> {
    forecastLogger.debug('Calculating forecast accuracy', { campaignId, historicalDays });

    const accuracy = await PacingForecast.calculateAccuracy(campaignId, historicalDays);

    if (accuracy !== null) {
      forecastAccuracy.set({ campaign_id: campaignId }, accuracy);
    }

    return accuracy;
  }

  /**
   * Get forecast for multiple campaigns
   */
  async getBulkForecast(campaignIds: string[]): Promise<Map<string, ForecastResult>> {
    forecastLogger.debug('Getting bulk forecast', { count: campaignIds.length });

    const results = new Map<string, ForecastResult>();

    for (const campaignId of campaignIds) {
      const forecast = await this.getForecast(campaignId);
      if (forecast) {
        results.set(campaignId, forecast);
      }
    }

    return results;
  }

  /**
   * Get dashboard forecast summary
   */
  async getDashboardForecast(): Promise<{
    totalProjectedSpend: number;
    campaignsOnTrack: number;
    campaignsAtRisk: number;
    campaignsExhausted: number;
    averageConfidence: number;
  }> {
    forecastLogger.debug('Getting dashboard forecast');

    const activeCampaigns = await CampaignPacing.findActiveCampaigns();
    const forecasts = await this.getBulkForecast(activeCampaigns.map(c => c.campaignId));

    let totalProjectedSpend = 0;
    let campaignsOnTrack = 0;
    let campaignsAtRisk = 0;
    let campaignsExhausted = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const forecast of forecasts.values()) {
      totalProjectedSpend += forecast.projectedSpend;

      if (forecast.budgetExhaustionDate && forecast.budgetExhaustionDate <= new Date(pacing.endDate)) {
        campaignsExhausted++;
      } else if (forecast.confidence >= 70) {
        campaignsOnTrack++;
      } else {
        campaignsAtRisk++;
      }

      totalConfidence += forecast.confidence;
      confidenceCount++;
    }

    return {
      totalProjectedSpend,
      campaignsOnTrack,
      campaignsAtRisk,
      campaignsExhausted,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0
    };
  }

  /**
   * Get historical data for forecasting
   */
  private async getHistoricalData(
    campaignId: string,
    days: number
  ): Promise<Array<{ date: Date; spent: number; impressions: number; clicks: number; conversions: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const statuses = await PacingStatus.find({
      campaignId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    return statuses.map(s => ({
      date: s.date,
      spent: s.spent,
      impressions: s.impressions,
      clicks: s.clicks,
      conversions: s.conversions
    }));
  }

  /**
   * Calculate forecast based on historical data
   */
  private async calculateForecast(
    pacing: any,
    historicalData: Array<{ date: Date; spent: number; impressions: number; clicks: number; conversions: number }>,
    includeFactors: boolean
  ): Promise<ForecastResult> {
    const now = new Date();
    const endDate = new Date(pacing.endDate);
    const daysRemaining = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((endDate.getTime() - new Date(pacing.startDate).getTime()) / (1000 * 60 * 60 * 24));

    // Calculate averages
    const avgSpent = historicalData.reduce((sum, d) => sum + d.spent, 0) / historicalData.length;
    const avgImpressions = historicalData.reduce((sum, d) => sum + d.impressions, 0) / historicalData.length;
    const avgClicks = historicalData.reduce((sum, d) => sum + d.clicks, 0) / historicalData.length;
    const avgConversions = historicalData.reduce((sum, d) => sum + d.conversions, 0) / historicalData.length;

    // Project to remaining days
    const projectedSpend = avgSpent * daysRemaining;
    const projectedImpressions = avgImpressions * daysRemaining;
    const projectedClicks = avgClicks * daysRemaining;
    const projectedConversions = avgConversions * daysRemaining;

    // Calculate confidence
    const variance = historicalData.reduce((sum, d) => {
      const diff = d.spent - avgSpent;
      return sum + (diff * diff);
    }, 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / (avgSpent || 1);
    const confidence = Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));

    // Identify factors
    const factors: IForecastFactor[] = includeFactors ? this.identifyFactors(historicalData) : [];

    // Calculate projected dates
    const currentSpent = historicalData[0]?.spent || 0;
    const remaining = pacing.totalBudget - currentSpent;

    let budgetExhaustionDate: Date | undefined;
    let projectedEndDate: Date | undefined;
    let daysToCompletion: number | undefined;

    if (remaining > 0 && avgSpent > 0) {
      daysToCompletion = Math.ceil(remaining / avgSpent);
      projectedEndDate = new Date(now);
      projectedEndDate.setDate(projectedEndDate.getDate() + daysToCompletion);

      if (projectedEndDate > endDate) {
        budgetExhaustionDate = endDate;
      } else {
        budgetExhaustionDate = projectedEndDate;
      }
    }

    return {
      campaignId: pacing.campaignId,
      date: now,
      projectedSpend: Math.round(projectedSpend * 100) / 100,
      projectedImpressions: Math.round(projectedImpressions),
      projectedClicks: Math.round(projectedClicks),
      projectedConversions: Math.round(projectedConversions),
      confidence: Math.round(confidence),
      confidenceLabel: this.getConfidenceLabel(confidence),
      factors,
      projectedEndDate,
      budgetExhaustionDate,
      daysToCompletion
    };
  }

  /**
   * Identify factors affecting forecast
   */
  private identifyFactors(
    historicalData: Array<{ date: Date; spent: number; impressions: number; clicks: number; conversions: number }>
  ): IForecastFactor[] {
    const factors: IForecastFactor[] = [];

    if (historicalData.length < 2) return factors;

    // Check for trend
    const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
    const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.spent, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.spent, 0) / secondHalf.length;

    if (secondHalfAvg > firstHalfAvg * 1.1) {
      factors.push({
        factor: 'accelerating_spend',
        impact: 0.2,
        description: 'Spend is accelerating compared to previous period'
      });
    } else if (secondHalfAvg < firstHalfAvg * 0.9) {
      factors.push({
        factor: 'decelerating_spend',
        impact: -0.1,
        description: 'Spend is decelerating compared to previous period'
      });
    }

    // Weekend pattern
    const weekendData = historicalData.filter(d => {
      const day = new Date(d.date).getDay();
      return day === 0 || day === 6;
    });
    const weekdayData = historicalData.filter(d => {
      const day = new Date(d.date).getDay();
      return day !== 0 && day !== 6;
    });

    if (weekendData.length > 0 && weekdayData.length > 0) {
      const weekendAvg = weekendData.reduce((sum, d) => sum + d.spent, 0) / weekendData.length;
      const weekdayAvg = weekdayData.reduce((sum, d) => sum + d.spent, 0) / weekdayData.length;

      if (weekendAvg !== weekdayAvg) {
        factors.push({
          factor: 'weekend_pattern',
          impact: (weekendAvg - weekdayAvg) / weekdayAvg,
          description: `Weekend spending is ${weekendAvg > weekdayAvg ? 'higher' : 'lower'} than weekdays`
        });
      }
    }

    // Performance metrics trend
    const recentData = historicalData.slice(0, Math.min(3, historicalData.length));
    const ctrTrend = recentData.map(d => d.clicks / (d.impressions || 1));
    if (ctrTrend.length >= 2) {
      const ctrChange = ctrTrend[0] - ctrTrend[ctrTrend.length - 1];
      if (Math.abs(ctrChange) > 0.01) {
        factors.push({
          factor: 'ctr_trend',
          impact: ctrChange,
          description: `CTR is ${ctrChange > 0 ? 'improving' : 'declining'}`
        });
      }
    }

    return factors;
  }

  /**
   * Create default forecast when no historical data
   */
  private createDefaultForecast(pacing: any): ForecastResult {
    const now = new Date();
    const endDate = new Date(pacing.endDate);
    const daysRemaining = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailySpend = pacing.totalBudget / daysRemaining;

    return {
      campaignId: pacing.campaignId,
      date: now,
      projectedSpend: pacing.totalBudget,
      projectedImpressions: 0,
      projectedClicks: 0,
      projectedConversions: 0,
      confidence: 30,
      confidenceLabel: 'Very Low',
      factors: [{
        factor: 'no_historical_data',
        impact: 0,
        description: 'Insufficient data for accurate forecast'
      }],
      projectedEndDate: endDate,
      budgetExhaustionDate: endDate,
      daysToCompletion: daysRemaining
    };
  }

  /**
   * Get confidence label
   */
  private getConfidenceLabel(confidence: number): string {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 75) return 'High';
    if (confidence >= 60) return 'Medium';
    if (confidence >= 40) return 'Low';
    return 'Very Low';
  }
}

export const forecastService = new ForecastService();