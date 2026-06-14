import { CampaignPacing, PacingStatus } from '../models';
import { PacingStrategy, IOptimizationRequest, IOptimizationResult, PacingStatusEnum } from '../types';
import { optimizationLogger } from '../utils/logger';
import { optimizationRequestsTotal, optimizationBudgetAdjustment } from '../utils/metrics';
import axios from 'axios';

export class OptimizationService {
  /**
   * Optimize pacing for a campaign
   */
  async optimizePacing(campaignId: string, request: IOptimizationRequest): Promise<IOptimizationResult> {
    optimizationLogger.info('Optimizing pacing', { campaignId, request });

    const pacing = await CampaignPacing.findOne({ campaignId });
    if (!pacing) {
      throw new Error(`Campaign pacing not found for ${campaignId}`);
    }

    const latestStatus = await PacingStatus.getLatestStatus(campaignId);
    const currentSpent = latestStatus?.spent || 0;
    const remaining = pacing.totalBudget - currentSpent;

    let result: IOptimizationResult;

    switch (request.adjustmentType) {
      case 'budget':
        result = await this.optimizeBudget(pacing, request, currentSpent, remaining);
        break;
      case 'bid':
        result = await this.optimizeBid(pacing, request, currentSpent, remaining);
        break;
      case 'schedule':
        result = await this.optimizeSchedule(pacing, request, currentSpent, remaining);
        break;
      default:
        throw new Error(`Unknown adjustment type: ${request.adjustmentType}`);
    }

    // Record metrics
    optimizationRequestsTotal.inc({ adjustment_type: request.adjustmentType, success: result.success.toString() });
    if (result.adjustedBudget) {
      const adjustment = result.adjustedBudget - pacing.totalBudget;
      optimizationBudgetAdjustment.observe(adjustment);
    }

    optimizationLogger.info('Optimization completed', { campaignId, result });

    return result;
  }

  /**
   * Optimize budget allocation
   */
  private async optimizeBudget(
    pacing: any,
    request: IOptimizationRequest,
    currentSpent: number,
    remaining: number
  ): Promise<IOptimizationResult> {
    const warnings: string[] = [];
    const now = new Date();
    const endDate = new Date(pacing.endDate);
    const startDate = new Date(pacing.startDate);

    // Calculate days remaining
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(1, totalDays - elapsedDays);

    // Current pace percentage
    const expectedSpend = (elapsedDays / totalDays) * pacing.totalBudget;
    const currentPace = expectedSpend > 0 ? (currentSpent / expectedSpend) * 100 : 0;

    let newBudget: number;
    let newDailyBudget: number;
    let newPacePercentage: number;

    if (request.targetPace > currentPace) {
      // Need to accelerate spending
      const requiredDailySpend = remaining / daysRemaining;
      newDailyBudget = requiredDailySpend;
      newBudget = currentSpent + (requiredDailySpend * daysRemaining);
      newPacePercentage = request.targetPace;

      if (requiredDailySpend > pacing.dailyBudget * 1.5) {
        warnings.push('Recommended daily spend is 50% higher than current');
      }
    } else if (request.targetPace < currentPace) {
      // Need to slow down spending
      const targetSpend = remaining * (request.targetPace / 100);
      newDailyBudget = targetSpend / daysRemaining;
      newBudget = currentSpent + targetSpend;
      newPacePercentage = request.targetPace;

      if (newDailyBudget < pacing.dailyBudget * 0.5) {
        warnings.push('Recommended daily spend is 50% lower than current');
      }
    } else {
      // Already at target pace
      newBudget = pacing.totalBudget;
      newDailyBudget = remaining / daysRemaining;
      newPacePercentage = currentPace;
    }

    // Update pacing configuration
    pacing.totalBudget = newBudget;
    pacing.dailyBudget = newDailyBudget;
    await pacing.save();

    // Calculate estimated completion date
    const estimatedCompletionDate = new Date(now);
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + daysRemaining);

    return {
      success: true,
      adjustedBudget: newBudget,
      adjustedDailyBudget: newDailyBudget,
      newPacePercentage,
      estimatedCompletionDate,
      warnings
    };
  }

  /**
   * Optimize bid strategy
   */
  private async optimizeBid(
    pacing: any,
    request: IOptimizationRequest,
    currentSpent: number,
    remaining: number
  ): Promise<IOptimizationResult> {
    const warnings: string[] = [];

    // Get historical performance data
    const recentStatuses = await PacingStatus.find({ campaignId: pacing.campaignId })
      .sort({ date: -1 })
      .limit(7);

    if (recentStatuses.length === 0) {
      warnings.push('Insufficient historical data for bid optimization');
      return {
        success: true,
        warnings
      };
    }

    // Calculate average metrics
    const avgCtr = recentStatuses.reduce((sum, s) => sum + s.ctr, 0) / recentStatuses.length;
    const avgCpc = recentStatuses.reduce((sum, s) => sum + s.cpc, 0) / recentStatuses.length;
    const avgCpm = recentStatuses.reduce((sum, s) => sum + s.cpm, 0) / recentStatuses.length;

    // Calculate optimal bid adjustment
    let bidAdjustment = 1.0;
    const currentPace = request.targetPace;

    if (currentPace < 85) {
      // Behind pace - increase bids slightly
      bidAdjustment = 1.1 + (85 - currentPace) / 100;
      warnings.push(`Increasing bids by ${((bidAdjustment - 1) * 100).toFixed(0)}% to accelerate`);
    } else if (currentPace > 105) {
      // Ahead of pace - decrease bids
      bidAdjustment = 0.9 - (currentPace - 105) / 100;
      warnings.push(`Decreasing bids by ${((1 - bidAdjustment) * 100).toFixed(0)}% to slow down`);
    }

    // Notify campaign service of bid adjustment
    try {
      await this.notifyCampaignService(pacing.campaignId, {
        type: 'bid_adjustment',
        adjustment: bidAdjustment,
        reason: request.reason
      });
    } catch (error: any) {
      optimizationLogger.warn('Failed to notify campaign service', { error: error.message });
    }

    return {
      success: true,
      newPacePercentage: currentPace,
      warnings
    };
  }

  /**
   * Optimize schedule
   */
  private async optimizeSchedule(
    pacing: any,
    request: IOptimizationRequest,
    currentSpent: number,
    remaining: number
  ): Promise<IOptimizationResult> {
    const warnings: string[] = [];

    // Analyze hourly performance patterns
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStatus = await PacingStatus.findOne({
      campaignId: pacing.campaignId,
      date: today
    });

    if (todayStatus && todayStatus.hourlyData.length > 0) {
      // Find peak hours
      const hourlySpends = todayStatus.hourlyData.map(h => ({ hour: h.hour, spend: h.spent }));
      hourlySpends.sort((a, b) => b.spend - a.spend);

      const peakHours = hourlySpends.slice(0, 4).map(h => h.hour);

      // Generate optimized schedule
      const customSchedule: Record<string, number> = {};
      const peakWeight = 1.5;
      const offPeakWeight = 0.5;

      for (let hour = 0; hour < 24; hour++) {
        if (peakHours.includes(hour)) {
          customSchedule[hour.toString()] = peakWeight;
        } else {
          customSchedule[hour.toString()] = offPeakWeight;
        }
      }

      // Update pacing schedule
      pacing.customSchedule = customSchedule;
      await pacing.save();

      warnings.push(`Optimized schedule: Peak hours ${peakHours.join(', ')}`);
    } else {
      warnings.push('Insufficient hourly data for schedule optimization');
    }

    return {
      success: true,
      warnings
    };
  }

  /**
   * Auto-optimize all campaigns behind schedule
   */
  async autoOptimizeBehindCampaigns(): Promise<{
    optimized: number;
    skipped: number;
    errors: Array<{ campaignId: string; error: string }>;
  }> {
    optimizationLogger.info('Running auto-optimization for behind campaigns');

    const activeCampaigns = await CampaignPacing.findActiveCampaigns();
    const behindCampaigns = [];

    for (const campaign of activeCampaigns) {
      const status = await PacingStatus.getLatestStatus(campaign.campaignId);
      if (status && status.status === PacingStatusEnum.BEHIND) {
        behindCampaigns.push(campaign);
      }
    }

    const errors: Array<{ campaignId: string; error: string }> = [];
    let optimized = 0;

    for (const campaign of behindCampaigns) {
      try {
        await this.optimizePacing(campaign.campaignId, {
          targetPace: 95,
          adjustmentType: 'budget',
          reason: 'Auto-optimization: Campaign behind schedule'
        });
        optimized++;
      } catch (error: any) {
        errors.push({ campaignId: campaign.campaignId, error: error.message });
      }
    }

    optimizationLogger.info('Auto-optimization completed', { optimized, skipped: behindCampaigns.length - optimized });

    return {
      optimized,
      skipped: behindCampaigns.length - optimized,
      errors
    };
  }

  /**
   * Get optimization recommendations
   */
  async getRecommendations(campaignId: string): Promise<{
    currentPace: number;
    recommendations: Array<{ type: string; action: string; impact: string }>;
  }> {
    const pacing = await CampaignPacing.findOne({ campaignId });
    if (!pacing) {
      throw new Error(`Campaign pacing not found for ${campaignId}`);
    }

    const status = await PacingStatus.getLatestStatus(campaignId);
    const currentPace = status?.pacePercentage || 0;

    const recommendations: Array<{ type: string; action: string; impact: string }> = [];

    if (currentPace < 80) {
      recommendations.push({
        type: 'budget',
        action: 'Increase daily budget by 20%',
        impact: 'Will help reach target pace by end of campaign'
      });
    }

    if (currentPace > 110) {
      recommendations.push({
        type: 'budget',
        action: 'Decrease daily budget by 15%',
        impact: 'Prevents budget exhaustion before campaign end'
      });
    }

    // Check for high-cost hours
    if (status && status.hourlyData.length > 0) {
      const avgHourlySpend = status.spent / 24;
      const highCostHours = status.hourlyData.filter(h => h.spent > avgHourlySpend * 1.5);
      if (highCostHours.length > 0) {
        recommendations.push({
          type: 'schedule',
          action: `Reduce spending during hours: ${highCostHours.map(h => h.hour).join(', ')}`,
          impact: 'Will reduce overall campaign cost by optimizing schedule'
        });
      }
    }

    return { currentPace, recommendations };
  }

  /**
   * Notify campaign service of adjustments
   */
  private async notifyCampaignService(campaignId: string, adjustment: any): Promise<void> {
    const campaignServiceUrl = process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:4000';

    try {
      await axios.post(`${campaignServiceUrl}/api/internal/pacing-adjustment`, {
        campaignId,
        ...adjustment
      }, {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
        },
        timeout: 5000
      });
    } catch (error: any) {
      optimizationLogger.warn('Failed to notify campaign service', { error: error.message });
    }
  }
}

export const optimizationService = new OptimizationService();