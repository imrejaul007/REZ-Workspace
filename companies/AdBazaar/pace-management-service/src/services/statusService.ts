import { PacingStatus, CampaignPacing, IPacingStatusDocument } from '../models';
import { PacingStatusEnum, IHourlyData } from '../types';
import { statusLogger } from '../utils/logger';
import { pacingStatusDistribution, pacePercentage, pacingBudgetSpent } from '../utils/metrics';
import { redisClient } from './redisClient';
import { REDIS_KEYS } from '../types';

export interface UpdateStatusInput {
  spent: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  hourlyData?: IHourlyData[];
}

export interface PacingStatusResult {
  campaignId: string;
  date: Date;
  spent: number;
  remaining: number;
  pacePercentage: number;
  projectedSpend: number;
  status: PacingStatusEnum;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
  };
  hourlyData: IHourlyData[];
}

export class StatusService {
  /**
   * Get current pacing status for a campaign
   */
  async getStatus(campaignId: string): Promise<PacingStatusResult | null> {
    statusLogger.debug('Getting pacing status', { campaignId });

    // Try cache first
    const cacheKey = REDIS_KEYS.PACING_STATUS(campaignId);
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      statusLogger.debug('Returning cached status', { campaignId });
      return JSON.parse(cached);
    }

    // Get from database
    const pacing = await CampaignPacing.findOne({ campaignId });
    if (!pacing) {
      statusLogger.warn('Campaign pacing not found', { campaignId });
      return null;
    }

    const latestStatus = await PacingStatus.getLatestStatus(campaignId);
    if (!latestStatus) {
      // Return initial status
      return this.createInitialStatus(pacing);
    }

    const result = this.formatStatusResult(latestStatus, pacing);

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  /**
   * Update pacing status for a campaign
   */
  async updateStatus(campaignId: string, input: UpdateStatusInput): Promise<IPacingStatusDocument> {
    statusLogger.info('Updating pacing status', { campaignId, spent: input.spent });

    const pacing = await CampaignPacing.findOne({ campaignId });
    if (!pacing) {
      throw new Error(`Campaign pacing not found for ${campaignId}`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate metrics
    const remaining = Math.max(0, pacing.totalBudget - input.spent);
    const elapsedDays = this.calculateElapsedDays(pacing.startDate, today);
    const totalDays = this.calculateElapsedDays(pacing.startDate, pacing.endDate);
    const expectedSpend = (elapsedDays / totalDays) * pacing.totalBudget;
    const pacePercentage = expectedSpend > 0 ? (input.spent / expectedSpend) * 100 : 0;

    // Calculate performance metrics
    const impressions = input.impressions || 0;
    const clicks = input.clicks || 0;
    const conversions = input.conversions || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? input.spent / clicks : 0;
    const cpm = impressions > 0 ? (input.spent / impressions) * 1000 : 0;

    // Determine status
    const status = this.determineStatus(pacePercentage);

    // Projected spend for full campaign
    const daysRemaining = Math.max(1, totalDays - elapsedDays);
    const projectedSpend = input.spent + (input.spent / elapsedDays) * daysRemaining;

    // Update or create status record
    const statusRecord = await PacingStatus.findOneAndUpdate(
      { campaignId, date: today },
      {
        $set: {
          spent: input.spent,
          remaining,
          pacePercentage,
          projectedSpend,
          impressions,
          clicks,
          conversions,
          ctr,
          cpc,
          cpm,
          status,
          hourlyData: input.hourlyData || []
        }
      },
      { new: true, upsert: true }
    );

    // Update metrics
    pacePercentage.set({ campaign_id: campaignId }, pacePercentage);
    pacingStatusDistribution.set({ campaign_status: status }, 1);
    pacingBudgetSpent.set(input.spent);

    // Invalidate cache
    const cacheKey = REDIS_KEYS.PACING_STATUS(campaignId);
    await redisClient.del(cacheKey);

    statusLogger.info('Pacing status updated', {
      campaignId,
      pacePercentage,
      status
    });

    return statusRecord;
  }

  /**
   * Get status history for a campaign
   */
  async getStatusHistory(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IPacingStatusDocument[]> {
    statusLogger.debug('Getting status history', { campaignId, startDate, endDate });
    return PacingStatus.getStatusHistory(campaignId, startDate, endDate);
  }

  /**
   * Get hourly breakdown for a campaign on a specific date
   */
  async getHourlyBreakdown(campaignId: string, date: Date): Promise<IHourlyData[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const status = await PacingStatus.findOne({
      campaignId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    return status?.hourlyData || [];
  }

  /**
   * Get aggregate stats across all campaigns
   */
  async getAggregateStats(): Promise<{
    totalSpent: number;
    totalRemaining: number;
    averagePace: number;
    onTrack: number;
    ahead: number;
    behind: number;
    exhausted: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats, statusCounts] = await Promise.all([
      PacingStatus.aggregate([
        { $match: { date: today } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$spent' },
            totalRemaining: { $sum: '$remaining' },
            avgPace: { $avg: '$pacePercentage' }
          }
        }
      ]),
      PacingStatus.aggregate([
        { $match: { date: today } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const counts: Record<string, number> = {};
    statusCounts.forEach((s) => {
      counts[s._id] = s.count;
    });

    return {
      totalSpent: stats[0]?.totalSpent || 0,
      totalRemaining: stats[0]?.totalRemaining || 0,
      averagePace: stats[0]?.avgPace || 0,
      onTrack: counts[PacingStatusEnum.ON_TRACK] || 0,
      ahead: counts[PacingStatusEnum.AHEAD] || 0,
      behind: counts[PacingStatusEnum.BEHIND] || 0,
      exhausted: counts[PacingStatusEnum.EXHAUSTED] || 0
    };
  }

  /**
   * Create initial status for a new campaign
   */
  private createInitialStatus(pacing: any): PacingStatusResult {
    return {
      campaignId: pacing.campaignId,
      date: new Date(),
      spent: 0,
      remaining: pacing.totalBudget,
      pacePercentage: 0,
      projectedSpend: 0,
      status: PacingStatusEnum.ON_TRACK,
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0
      },
      hourlyData: []
    };
  }

  /**
   * Format status document to result object
   */
  private formatStatusResult(status: IPacingStatusDocument, pacing: any): PacingStatusResult {
    return {
      campaignId: status.campaignId,
      date: status.date,
      spent: status.spent,
      remaining: status.remaining,
      pacePercentage: status.pacePercentage,
      projectedSpend: status.projectedSpend,
      status: status.status,
      performance: {
        impressions: status.impressions,
        clicks: status.clicks,
        conversions: status.conversions,
        ctr: status.ctr,
        cpc: status.cpc,
        cpm: status.cpm
      },
      hourlyData: status.hourlyData
    };
  }

  /**
   * Calculate elapsed days between two dates
   */
  private calculateElapsedDays(startDate: Date, currentDate: Date): number {
    const start = new Date(startDate);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * Determine pacing status based on percentage
   */
  private determineStatus(pacePercentage: number): PacingStatusEnum {
    if (pacePercentage >= 100) {
      return PacingStatusEnum.EXHAUSTED;
    }
    if (pacePercentage >= 95) {
      return PacingStatusEnum.AHEAD;
    }
    if (pacePercentage >= 85 && pacePercentage <= 105) {
      return PacingStatusEnum.ON_TRACK;
    }
    if (pacePercentage < 85) {
      return PacingStatusEnum.BEHIND;
    }
    return PacingStatusEnum.ON_TRACK;
  }
}

export const statusService = new StatusService();