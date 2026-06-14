import { campaignService } from './campaign.service.js';
import { redisService } from './redis.service.js';
import { CTVCampaignModel } from '../models/index.js';
import { PacingStatus, PacingAdjustment } from '../types/index.js';

class PacingService {
  /**
   * Calculate current pacing status for a campaign
   */
  async getPacingStatus(campaignId: string): Promise<PacingStatus | null> {
    const campaign = await campaignService.getCampaignStats(campaignId);
    if (!campaign) {
      return null;
    }

    const dailySpend = await redisService.getDailySpend(campaignId);
    const dailyRemaining = Math.max(0, campaign.budget.daily - dailySpend);

    // Calculate expected pacing based on time of day
    const now = new Date();
    const hoursPassed = now.getHours();
    const totalHours = 24;
    const expectedPacingPercent = (hoursPassed / totalHours) * 100;

    // Calculate actual pacing based on spend
    const actualPacingPercent = campaign.budget.daily > 0
      ? (dailySpend / campaign.budget.daily) * 100
      : 0;

    // Determine pacing type performance
    let pacingType = campaign.pacing.type;
    let recommendations: string[] = [];

    // Generate recommendations based on pacing
    const pacingDiff = actualPacingPercent - expectedPacingPercent;

    if (pacingDiff < -10) {
      // Behind schedule
      recommendations.push('Campaign is behind expected pacing. Consider increasing bid or relaxing targeting.');
      if (pacingType === 'even') {
        recommendations.push('Consider switching to ASAP pacing to catch up.');
      }
    } else if (pacingDiff > 15) {
      // Ahead of schedule
      recommendations.push('Campaign is ahead of schedule. Consider raising daily budget or tightening targeting.');
      if (pacingType === 'asap') {
        recommendations.push('Consider switching to even pacing for smoother delivery.');
      }
    }

    // Check if budget will run out
    if (campaign.budget.total - campaign.budget.spent < dailyRemaining) {
      recommendations.push('Total campaign budget may be reached before end date.');
    }

    return {
      campaignId,
      currentPacing: Math.round(actualPacingPercent * 100) / 100,
      expectedPacing: Math.round(expectedPacingPercent * 100) / 100,
      dailyBudget: campaign.budget.daily,
      dailySpent: dailySpend,
      dailyRemaining,
      pacingType,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  /**
   * Adjust campaign pacing settings
   */
  async adjustPacing(campaignId: string, adjustment: PacingAdjustment): Promise<{ success: boolean; message: string }> {
    const campaign = await campaignService.getCampaignStats(campaignId);
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }

    switch (adjustment.type) {
      case 'pause':
        await campaignService.updateStatus(campaignId, 'paused');
        return { success: true, message: 'Campaign paused' };

      case 'resume':
        await campaignService.updateStatus(campaignId, 'active');
        return { success: true, message: 'Campaign resumed' };

      case 'increase':
        const increasePercent = adjustment.percent || 10;
        const newDailyBudget = campaign.budget.daily * (1 + increasePercent / 100);
        await campaignService.update(campaignId, {
          budget: {
            ...campaign.budget,
            daily: newDailyBudget,
          },
        });
        return { success: true, message: `Daily budget increased by ${increasePercent}%` };

      case 'decrease':
        const decreasePercent = adjustment.percent || 10;
        const newDailyBudgetDecreased = campaign.budget.daily * (1 - decreasePercent / 100);
        await campaignService.update(campaignId, {
          budget: {
            ...campaign.budget,
            daily: newDailyBudgetDecreased,
          },
        });
        return { success: true, message: `Daily budget decreased by ${decreasePercent}%` };

      default:
        return { success: false, message: 'Invalid adjustment type' };
    }
  }

  /**
   * Calculate expected daily delivery based on pacing type
   */
  calculateExpectedDelivery(pacingType: string, totalBudget: number, daysRemaining: number): number {
    switch (pacingType) {
      case 'even':
        return totalBudget / daysRemaining;
      case 'asap':
        return totalBudget; // Deliver as fast as possible
      case 'frontloaded':
        // Front-load: deliver more early, tapering off
        const frontloadFactor = 1.5;
        return (totalBudget * frontloadFactor) / Math.min(daysRemaining * 1.5, 30);
      default:
        return totalBudget / daysRemaining;
    }
  }

  /**
   * Check if campaign should be paused due to budget
   */
  async shouldPauseCampaign(campaignId: string): Promise<boolean> {
    const pacing = await this.getPacingStatus(campaignId);
    if (!pacing) {
      return false;
    }

    // Pause if daily budget is exhausted
    if (pacing.dailyRemaining <= 0) {
      return true;
    }

    // Pause if campaign is 150% ahead of pacing and has limited budget
    if (pacing.currentPacing > 150 && pacing.dailyRemaining < pacing.dailyBudget * 0.1) {
      return true;
    }

    return false;
  }

  /**
   * Get pacing analytics for a campaign
   */
  async getPacingAnalytics(campaignId: string, days: number = 7): Promise<{
    dailySpending: { date: string; spend: number; impressions: number }[];
    avgPacing: number;
    pacingTrend: 'increasing' | 'decreasing' | 'stable';
  }> {
    // For now, return mock data - in production, query historical data
    const campaign = await campaignService.getCampaignStats(campaignId);
    if (!campaign) {
      return {
        dailySpending: [],
        avgPacing: 0,
        pacingTrend: 'stable',
      };
    }

    // Calculate average pacing from current metrics
    const totalSpend = campaign.budget.spent;
    const daysRunning = Math.max(1, Math.ceil((Date.now() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailySpend = totalSpend / daysRunning;
    const avgPacing = (avgDailySpend / campaign.budget.daily) * 100;

    return {
      dailySpending: [],
      avgPacing: Math.round(avgPacing * 100) / 100,
      pacingTrend: avgPacing > 105 ? 'increasing' : avgPacing < 95 ? 'decreasing' : 'stable',
    };
  }

  /**
   * Cache pacing status for quick access
   */
  async cachePacingStatus(campaignId: string): Promise<void> {
    const pacing = await this.getPacingStatus(campaignId);
    if (pacing) {
      await redisService.cacheCampaignPacing(campaignId, pacing);
    }
  }

  /**
   * Get cached pacing status if available
   */
  async getCachedPacingStatus(campaignId: string): Promise<PacingStatus | null> {
    const cached = await redisService.getCachedPacing(campaignId);
    return cached as PacingStatus | null;
  }
}

export const pacingService = new PacingService();