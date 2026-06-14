import { SeatUsage, ISeatUsage, UsagePeriod } from '../models/seat-usage.model';
import { Seat } from '../models/seat.model';
import mongoose from 'mongoose';
import { logger } from 'utils/logger.js';

export interface UsageRecordInput {
  seatId: string;
  apiCalls?: number;
  dataProcessed?: number;
  feature?: string;
  sessionDuration?: number;
}

export interface UsageAnalytics {
  period: UsagePeriod;
  periodStart: Date;
  periodEnd: Date;
  apiCalls: number;
  apiCallsLimit: number;
  apiCallsPercentage: number;
  dataProcessed: number;
  dataProcessedLimit: number;
  dataProcessedPercentage: number;
  features: Array<{
    feature: string;
    count: number;
    lastUsedAt: Date;
  }>;
  activeDays: number;
  totalSessions: number;
  avgSessionDuration: number;
  lastActivityAt: Date | null;
  isOverLimit: boolean;
}

export interface OrganizationUsageSummary {
  period: UsagePeriod;
  totalApiCalls: number;
  totalDataProcessed: number;
  totalActiveDays: number;
  totalSessions: number;
  avgSessionDuration: number;
  uniqueSeats: number;
  topFeatures: Array<{
    feature: string;
    totalCount: number;
  }>;
}

class UsageService {
  /**
   * Record usage for a seat
   */
  async recordUsage(input: UsageRecordInput): Promise<ISeatUsage> {
    try {
      const now = new Date();
      const periodStart = this.getPeriodStart(now, UsagePeriod.DAILY);
      const periodEnd = this.getPeriodEnd(now, UsagePeriod.DAILY);

      // Find or create usage record for current period
      let usage = await SeatUsage.findOne({
        seatId: new mongoose.Types.ObjectId(input.seatId),
        period: UsagePeriod.DAILY,
        periodStart,
        periodEnd
      });

      if (!usage) {
        const seat = await Seat.findById(input.seatId);
        if (!seat) {
          throw new Error('Seat not found');
        }

        usage = new SeatUsage({
          seatId: new mongoose.Types.ObjectId(input.seatId),
          organizationId: seat.organizationId,
          period: UsagePeriod.DAILY,
          periodStart,
          periodEnd,
          apiCalls: 0,
          dataProcessed: 0,
          features: [],
          activeDays: 0,
          totalSessions: 0,
          avgSessionDuration: 0
        });
      }

      // Increment usage
      usage.incrementUsage(
        input.apiCalls || 0,
        input.dataProcessed || 0,
        input.feature
      );

      // Update session stats
      if (input.sessionDuration) {
        const totalSessions = usage.totalSessions + 1;
        const currentAvg = usage.avgSessionDuration;
        usage.avgSessionDuration = ((currentAvg * usage.totalSessions) + input.sessionDuration) / totalSessions;
        usage.totalSessions = totalSessions;
      }

      // Update last activity
      usage.lastActivityAt = now;

      // Check if this is a new active day
      const lastActivity = usage.lastActivityAt;
      if (lastActivity) {
        const lastActivityDate = new Date(lastActivity.getTime() - (lastActivity.getTime() % (24 * 60 * 60 * 1000)));
        const todayDate = new Date(now.getTime() - (now.getTime() % (24 * 60 * 60 * 1000)));
        if (lastActivityDate.getTime() !== todayDate.getTime()) {
          usage.activeDays += 1;
        }
      }

      await usage.save();

      logger.debug(`Usage recorded for seat ${input.seatId}: ${input.apiCalls || 0} API calls`);

      return usage;
    } catch (error) {
      logger.error('Error recording usage:', error);
      throw error;
    }
  }

  /**
   * Get usage analytics for a seat
   */
  async getUsageAnalytics(
    seatId: string,
    period: UsagePeriod = UsagePeriod.DAILY
  ): Promise<UsageAnalytics | null> {
    try {
      const now = new Date();
      const periodStart = this.getPeriodStart(now, period);
      const periodEnd = this.getPeriodEnd(now, period);

      const usage = await SeatUsage.findOne({
        seatId: new mongoose.Types.ObjectId(seatId),
        period,
        periodStart,
        periodEnd
      });

      if (!usage) {
        // Return empty analytics
        return {
          period,
          periodStart,
          periodEnd,
          apiCalls: 0,
          apiCallsLimit: 10000,
          apiCallsPercentage: 0,
          dataProcessed: 0,
          dataProcessedLimit: 1073741824,
          dataProcessedPercentage: 0,
          features: [],
          activeDays: 0,
          totalSessions: 0,
          avgSessionDuration: 0,
          lastActivityAt: null,
          isOverLimit: false
        };
      }

      return {
        period: usage.period,
        periodStart: usage.periodStart,
        periodEnd: usage.periodEnd,
        apiCalls: usage.apiCalls,
        apiCallsLimit: usage.apiCallsLimit,
        apiCallsPercentage: usage.getApiCallsPercentage(),
        dataProcessed: usage.dataProcessed,
        dataProcessedLimit: usage.dataProcessedLimit,
        dataProcessedPercentage: usage.getDataProcessedPercentage(),
        features: usage.features.map(f => ({
          feature: f.feature,
          count: f.count,
          lastUsedAt: f.lastUsedAt
        })),
        activeDays: usage.activeDays,
        totalSessions: usage.totalSessions,
        avgSessionDuration: usage.avgSessionDuration,
        lastActivityAt: usage.lastActivityAt,
        isOverLimit: usage.isOverLimit()
      };
    } catch (error) {
      logger.error(`Error getting usage analytics for seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Get usage history for a seat
   */
  async getUsageHistory(
    seatId: string,
    period: UsagePeriod = UsagePeriod.DAILY,
    limit: number = 30
  ): Promise<ISeatUsage[]> {
    try {
      return await SeatUsage.find({ seatId: new mongoose.Types.ObjectId(seatId), period })
        .sort({ periodStart: -1 })
        .limit(limit);
    } catch (error) {
      logger.error(`Error getting usage history for seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Get organization-wide usage summary
   */
  async getOrganizationUsageSummary(
    organizationId: string,
    period: UsagePeriod = UsagePeriod.DAILY
  ): Promise<OrganizationUsageSummary> {
    try {
      const now = new Date();
      const periodStart = this.getPeriodStart(now, period);
      const periodEnd = this.getPeriodEnd(now, period);

      const result = await SeatUsage.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            period,
            periodStart,
            periodEnd
          }
        },
        {
          $group: {
            _id: null,
            totalApiCalls: { $sum: '$apiCalls' },
            totalDataProcessed: { $sum: '$dataProcessed' },
            totalActiveDays: { $sum: '$activeDays' },
            totalSessions: { $sum: '$totalSessions' },
            avgSessionDuration: { $avg: '$avgSessionDuration' },
            seatCount: { $addToSet: '$seatId' }
          }
        },
        {
          $project: {
            _id: 0,
            totalApiCalls: 1,
            totalDataProcessed: 1,
            totalActiveDays: 1,
            totalSessions: 1,
            avgSessionDuration: 1,
            uniqueSeats: { $size: '$seatCount' }
          }
        }
      ]);

      // Get top features
      const topFeatures = await SeatUsage.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            period,
            periodStart,
            periodEnd
          }
        },
        { $unwind: '$features' },
        {
          $group: {
            _id: '$features.feature',
            totalCount: { $sum: '$features.count' }
          }
        },
        { $sort: { totalCount: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            feature: '$_id',
            totalCount: 1
          }
        }
      ]);

      const summary = result[0] || {
        totalApiCalls: 0,
        totalDataProcessed: 0,
        totalActiveDays: 0,
        totalSessions: 0,
        avgSessionDuration: 0,
        uniqueSeats: 0
      };

      return {
        period,
        totalApiCalls: summary.totalApiCalls,
        totalDataProcessed: summary.totalDataProcessed,
        totalActiveDays: summary.totalActiveDays,
        totalSessions: summary.totalSessions,
        avgSessionDuration: summary.avgSessionDuration,
        uniqueSeats: summary.uniqueSeats,
        topFeatures
      };
    } catch (error) {
      logger.error(`Error getting organization usage summary for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Get per-seat usage breakdown for organization
   */
  async getOrganizationSeatUsage(
    organizationId: string,
    period: UsagePeriod = UsagePeriod.DAILY,
    limit: number = 20
  ): Promise<Array<ISeatUsage & { seatInfo: { firstName: string; lastName: string; email: string } }>> {
    try {
      const now = new Date();
      const periodStart = this.getPeriodStart(now, period);
      const periodEnd = this.getPeriodEnd(now, period);

      return await SeatUsage.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            period,
            periodStart,
            periodEnd
          }
        },
        {
          $lookup: {
            from: 'seats',
            localField: 'seatId',
            foreignField: '_id',
            as: 'seatInfo'
          }
        },
        { $unwind: '$seatInfo' },
        {
          $project: {
            _id: 1,
            apiCalls: 1,
            dataProcessed: 1,
            features: 1,
            activeDays: 1,
            totalSessions: 1,
            avgSessionDuration: 1,
            lastActivityAt: 1,
            'seatInfo.firstName': 1,
            'seatInfo.lastName': 1,
            'seatInfo.email': 1
          }
        },
        { $sort: { apiCalls: -1 } },
        { $limit: limit }
      ]) as Array<ISeatUsage & { seatInfo: { firstName: string; lastName: string; email: string } }>;
    } catch (error) {
      logger.error(`Error getting organization seat usage for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Check if seat has exceeded usage limits
   */
  async checkUsageLimits(seatId: string): Promise<{ exceeded: boolean; apiCallsExceeded: boolean; dataExceeded: boolean }> {
    try {
      const usage = await this.getUsageAnalytics(seatId, UsagePeriod.DAILY);
      if (!usage) {
        return { exceeded: false, apiCallsExceeded: false, dataExceeded: false };
      }

      return {
        exceeded: usage.isOverLimit,
        apiCallsExceeded: usage.apiCallsPercentage >= 100,
        dataExceeded: usage.dataProcessedPercentage >= 100
      };
    } catch (error) {
      logger.error(`Error checking usage limits for seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Reset usage for a period (admin function)
   */
  async resetUsage(seatId: string, period: UsagePeriod): Promise<void> {
    try {
      const now = new Date();
      const periodStart = this.getPeriodStart(now, period);
      const periodEnd = this.getPeriodEnd(now, period);

      await SeatUsage.findOneAndUpdate(
        { seatId: new mongoose.Types.ObjectId(seatId), period, periodStart, periodEnd },
        {
          $set: {
            apiCalls: 0,
            dataProcessed: 0,
            features: [],
            activeDays: 0,
            totalSessions: 0,
            avgSessionDuration: 0
          }
        }
      );

      logger.info(`Usage reset for seat ${seatId} for period ${period}`);
    } catch (error) {
      logger.error(`Error resetting usage for seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Get period start date
   */
  private getPeriodStart(date: Date, period: UsagePeriod): Date {
    switch (period) {
      case UsagePeriod.DAILY:
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      case UsagePeriod.WEEKLY:
        const dayOfWeek = date.getDay();
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOfWeek);
      case UsagePeriod.MONTHLY:
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }
  }

  /**
   * Get period end date
   */
  private getPeriodEnd(date: Date, period: UsagePeriod): Date {
    switch (period) {
      case UsagePeriod.DAILY:
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      case UsagePeriod.WEEKLY:
        const dayOfWeek = date.getDay();
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (7 - dayOfWeek));
      case UsagePeriod.MONTHLY:
        return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }
  }
}

export const usageService = new UsageService();