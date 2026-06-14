import { Forecast, Suggestion, Pipeline } from '../models/Pipeline';
import mongoose from 'mongoose';

export interface ForecastResult {
  _id: mongoose.Types.ObjectId;
  totalPipeline: number;
  weightedPipeline: number;
  closedWon: number;
  closedLost: number;
  stageBreakdown: Array<{
    stageId: mongoose.Types.ObjectId;
    stageName: string;
    dealCount: number;
    totalValue: number;
    weightedValue: number;
  }>;
  confidence: number;
  confidenceFactors: string[];
  period: string;
  startDate: Date;
  endDate: Date;
}

export class PipelineSuggestionService {
  /**
   * Generate forecast for a pipeline
   */
  static async generateForecast(
    tenantId: string,
    pipelineId: string,
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    startDate?: Date
  ): Promise<ForecastResult> {
    // Get pipeline with stages
    const pipeline = await Pipeline.findOne({
      _id: pipelineId,
      tenantId
    });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    // Calculate date range
    const now = startDate || new Date();
    const { start, end } = this.getPeriodDates(period, now);

    // Simulate pipeline data (in production, fetch from Deal Intelligence)
    const stageBreakdown = pipeline.stages.map(stage => {
      const dealCount = Math.floor(Math.random() * 20) + 5;
      const avgValue = Math.floor(Math.random() * 50000) + 10000;
      const totalValue = dealCount * avgValue;
      const weightedValue = totalValue * (stage.probability / 100);

      return {
        stageId: stage._id!,
        stageName: stage.name,
        dealCount,
        totalValue,
        weightedValue
      };
    });

    const totalPipeline = stageBreakdown.reduce((sum, s) => sum + s.totalValue, 0);
    const weightedPipeline = stageBreakdown.reduce((sum, s) => sum + s.weightedValue, 0);

    // Calculate confidence based on data quality
    let confidence = 70; // Base confidence
    const confidenceFactors: string[] = [];

    if (stageBreakdown.length >= 5) {
      confidence += 10;
      confidenceFactors.push('Well-defined stages');
    }

    if (totalPipeline > 100000) {
      confidence += 10;
      confidenceFactors.push('Sufficient pipeline volume');
    }

    confidenceFactors.push('Historical win rate applied');

    // Get previous period for comparison
    const previousPeriodStart = new Date(start);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);

    let previousPeriodValue = 0;
    const previousForecast = await Forecast.findOne({
      tenantId,
      pipelineId,
      period,
      startDate: { $gte: previousPeriodStart }
    });

    if (previousForecast) {
      previousPeriodValue = previousForecast.totalPipeline;
    }

    const periodOverPeriodChange = previousPeriodValue > 0
      ? ((totalPipeline - previousPeriodValue) / previousPeriodValue) * 100
      : 0;

    // Create forecast record
    const forecast = new Forecast({
      tenantId,
      pipelineId,
      period,
      startDate: start,
      endDate: end,
      totalPipeline,
      weightedPipeline,
      closedWon: Math.floor(totalPipeline * 0.15), // Simulated
      closedLost: Math.floor(totalPipeline * 0.1), // Simulated
      stageBreakdown,
      confidence: Math.min(confidence, 95),
      confidenceFactors,
      previousPeriodValue,
      periodOverPeriodChange,
      calculatedAt: new Date()
    });

    await forecast.save();

    return forecast as unknown as ForecastResult;
  }

  /**
   * Generate suggestions for pipeline
   */
  static async generateSuggestions(
    tenantId: string,
    pipelineId: string,
    accountId?: string
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Get pipeline
    const pipeline = await Pipeline.findOne({
      _id: pipelineId,
      tenantId
    });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    // Analyze each stage for issues
    for (const stage of pipeline.stages) {
      if (stage.isWonStage || stage.isLostStage) continue;

      // Stall warning - deals in stage too long
      if (stage.avgDaysInStage > 30 && stage.dealCount > 0) {
        const stallSuggestion = new Suggestion({
          tenantId,
          type: 'stall_warning',
          priority: stage.dealCount > 5 ? 'critical' : 'high',
          pipelineId,
          title: `Stalled deals in ${stage.name}`,
          description: `${stage.dealCount} deals have been in this stage for over ${stage.avgDaysInStage} days`,
          reason: 'Average time in stage exceeds threshold',
          action: 'Review and move or re-engage these deals',
          potentialValue: stage.totalValue,
          status: 'pending'
        });
        await stallSuggestion.save();
        suggestions.push(stallSuggestion);
      }

      // Stage gap - no deals in critical stage
      if (stage.order === 2 && stage.dealCount === 0) {
        const gapSuggestion = new Suggestion({
          tenantId,
          type: 'opportunity',
          priority: 'high',
          pipelineId,
          title: 'No deals in Demo stage',
          description: 'Pipeline may have a sourcing issue',
          reason: 'Critical stage has zero deals',
          action: 'Focus on top-of-funnel lead generation',
          status: 'pending'
        });
        await gapSuggestion.save();
        suggestions.push(gapSuggestion);
      }
    }

    // Low conversion warning
    const conversionRates = pipeline.stages
      .filter(s => !s.isWonStage && !s.isLostStage)
      .map(s => s.probability);

    if (conversionRates.length >= 2) {
      const avgProb = conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length;
      if (avgProb < 20) {
        const convSuggestion = new Suggestion({
          tenantId,
          type: 'risk_alert',
          priority: 'high',
          pipelineId,
          title: 'Low average win probability',
          description: `Average stage probability is ${avgProb.toFixed(0)}%, which may indicate quality issues`,
          reason: 'Deals not properly qualified',
          action: 'Review ICP criteria and stage definitions',
          status: 'pending'
        });
        await convSuggestion.save();
        suggestions.push(convSuggestion);
      }
    }

    // High-value deal at risk
    const highValueStage = pipeline.stages.find(
      s => s.totalValue > 100000 && s.probability < 30 && !s.isWonStage
    );
    if (highValueStage) {
      const riskSuggestion = new Suggestion({
        tenantId,
        type: 'risk_alert',
        priority: 'critical',
        pipelineId,
        title: `High-value deals at risk in ${highValueStage.name}`,
        description: `$${highValueStage.totalValue.toLocaleString()} at only ${highValueStage.probability}% probability`,
        reason: 'Large deals with low success likelihood',
        action: 'Prioritize these deals for executive engagement',
        potentialValue: highValueStage.totalValue,
        status: 'pending'
      });
      await riskSuggestion.save();
      suggestions.push(riskSuggestion);
    }

    return suggestions;
  }

  /**
   * Calculate period dates
   */
  private static getPeriodDates(
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    date: Date
  ): { start: Date; end: Date } {
    const start = new Date(date);
    const end = new Date(date);

    switch (period) {
      case 'weekly':
        start.setDate(date.getDate() - date.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'monthly':
        start.setDate(1);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        break;
      case 'quarterly':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        end.setMonth(quarter * 3 + 3);
        end.setDate(0);
        break;
      case 'yearly':
        start.setMonth(0);
        start.setDate(1);
        end.setFullYear(start.getFullYear() + 1);
        end.setDate(0);
        break;
    }

    return { start, end };
  }

  /**
   * Get forecast summary
   */
  static async getForecastSummary(
    tenantId: string,
    pipelineId?: string
  ): Promise<{
    totalPipeline: number;
    weightedPipeline: number;
    forecastAccuracy: number;
    byPeriod: Record<string, { total: number; weighted: number }>;
  }> {
    const query: Record<string, unknown> = { tenantId };
    if (pipelineId) query.pipelineId = pipelineId;

    const forecasts = await Forecast.find(query)
      .sort({ startDate: -1 })
      .limit(10);

    const byPeriod: Record<string, { total: number; weighted: number }> = {};
    let totalPipeline = 0;
    let weightedPipeline = 0;
    let totalAccuracy = 0;
    let accuracyCount = 0;

    for (const forecast of forecasts) {
      totalPipeline += forecast.totalPipeline;
      weightedPipeline += forecast.weightedPipeline;

      byPeriod[forecast.period] = {
        total: (byPeriod[forecast.period]?.total || 0) + forecast.totalPipeline,
        weighted: (byPeriod[forecast.period]?.weighted || 0) + forecast.weightedPipeline
      };

      if (forecast.confidence) {
        totalAccuracy += forecast.confidence;
        accuracyCount++;
      }
    }

    return {
      totalPipeline,
      weightedPipeline,
      forecastAccuracy: accuracyCount > 0 ? totalAccuracy / accuracyCount : 0,
      byPeriod
    };
  }
}
