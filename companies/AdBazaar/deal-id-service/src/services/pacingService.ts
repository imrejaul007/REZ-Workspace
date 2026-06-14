import { Deal } from '../models/Deal';
import { DealTerms } from '../models/DealTerms';
import { DealAnalytics } from '../models/DealAnalytics';
import { logger } from '../utils/logger';

interface PacingStatus {
  dealId: string;
  strategy: string;
  target: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
  actual: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
  pacing: {
    daily: number;
    weekly: number;
    monthly: number;
    ratio: number;
    status: 'under_paced' | 'on_track' | 'over_paced';
  };
  remaining: {
    days: number;
    impressions: number;
    budget: number;
  };
  projected: {
    endDate: string;
    completionRate: number;
  };
}

export const pacingService = {
  async getPacingStatus(dealId: string): Promise<PacingStatus | null> {
    const deal = await Deal.findOne({ dealId });
    if (!deal) return null;

    const terms = await DealTerms.findOne({ dealId });
    const today = new Date().toISOString().split('T')[0];
    const todayAnalytics = await DealAnalytics.findOne({ dealId, date: today });

    // Calculate date ranges
    const startDate = deal.startDate || deal.createdAt;
    const endDate = deal.endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const now = new Date();
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    // Get total impressions from deal
    const totalTarget = terms?.impressions.total || deal.impressions || 0;
    const guaranteedTarget = terms?.impressions.guaranteed || 0;

    // Get current totals from analytics
    const analytics = await DealAnalytics.find({ dealId });
    const totalActual = analytics.reduce((sum, a) => sum + a.impressions.total, 0);
    const dailyActual = todayAnalytics?.impressions.total || 0;

    // Calculate weekly and monthly
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weeklyActual = analytics
      .filter((a) => a.date >= weekAgo)
      .reduce((sum, a) => sum + a.impressions.total, 0);
    const monthlyActual = analytics
      .filter((a) => a.date >= monthAgo)
      .reduce((sum, a) => sum + a.impressions.total, 0);

    // Calculate targets based on strategy
    const strategy = terms?.pacing.strategy || deal.pacing?.strategy || 'even';
    let dailyTarget = 0;
    let weeklyTarget = 0;
    let monthlyTarget = 0;

    if (terms?.pacing) {
      dailyTarget = terms.pacing.daily || 0;
      weeklyTarget = terms.pacing.weekly || 0;
      monthlyTarget = terms.pacing.monthly || 0;
    } else if (deal.pacing) {
      dailyTarget = deal.pacing.daily || 0;
      weeklyTarget = deal.pacing.weekly || 0;
      monthlyTarget = deal.pacing.monthly || 0;
    }

    // If no explicit pacing targets, calculate based on strategy
    if (!dailyTarget && !weeklyTarget && !monthlyTarget) {
      const impressionsPerDay = totalTarget / totalDays;
      dailyTarget = impressionsPerDay;
      weeklyTarget = impressionsPerDay * 7;
      monthlyTarget = impressionsPerDay * 30;

      // Adjust based on strategy
      if (strategy === 'frontload') {
        dailyTarget = impressionsPerDay * 1.5;
      } else if (strategy === 'backload') {
        dailyTarget = impressionsPerDay * 0.5;
      } else if (strategy === 'asap') {
        dailyTarget = totalTarget;
      }
    }

    // Calculate pacing ratios
    const expectedPacing = (daysElapsed / totalDays) * totalTarget;
    const pacingRatio = expectedPacing > 0 ? totalActual / expectedPacing : 0;

    let pacingStatus: 'under_paced' | 'on_track' | 'over_paced';
    if (pacingRatio < 0.9) {
      pacingStatus = 'under_paced';
    } else if (pacingRatio > 1.1) {
      pacingStatus = 'over_paced';
    } else {
      pacingStatus = 'on_track';
    }

    // Project completion
    const dailyAverage = daysElapsed > 0 ? totalActual / daysElapsed : 0;
    const projectedEndDate = dailyAverage > 0 && endDate
      ? new Date(totalTarget / dailyAverage * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : endDate.toISOString().split('T')[0];
    const completionRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

    return {
      dealId,
      strategy,
      target: {
        daily: dailyTarget,
        weekly: weeklyTarget,
        monthly: monthlyTarget,
        total: totalTarget,
      },
      actual: {
        daily: dailyActual,
        weekly: weeklyActual,
        monthly: monthlyActual,
        total: totalActual,
      },
      pacing: {
        daily: dailyTarget > 0 ? dailyActual / dailyTarget : 0,
        weekly: weeklyTarget > 0 ? weeklyActual / weeklyTarget : 0,
        monthly: monthlyTarget > 0 ? monthlyActual / monthlyTarget : 0,
        ratio: pacingRatio,
        status: pacingStatus,
      },
      remaining: {
        days: daysRemaining,
        impressions: Math.max(0, totalTarget - totalActual),
        budget: deal.budget ? deal.budget.amount - deal.budget.spent : 0,
      },
      projected: {
        endDate: projectedEndDate,
        completionRate,
      },
    };
  },

  async adjustPacing(dealId: string, newStrategy: 'asap' | 'even' | 'frontload' | 'backload'): Promise<void> {
    await Deal.findOneAndUpdate(
      { dealId },
      { $set: { 'pacing.strategy': newStrategy } }
    );

    await DealTerms.findOneAndUpdate(
      { dealId },
      { $set: { 'pacing.strategy': newStrategy } }
    );

    logger.info('Deal pacing strategy updated', { dealId, strategy: newStrategy });
  },

  async getDailyPacingRecommendation(dealId: string): Promise<{
    recommended: number;
    reason: string;
    urgency: 'low' | 'medium' | 'high';
  }> {
    const status = await this.getPacingStatus(dealId);
    if (!status) {
      return { recommended: 0, reason: 'Deal not found', urgency: 'low' };
    }

    const remainingImpressions = status.remaining.impressions;
    const remainingDays = status.remaining.days;

    if (remainingDays <= 0) {
      return {
        recommended: remainingImpressions,
        reason: 'Deal ending today - deliver remaining impressions',
        urgency: 'high',
      };
    }

    const recommendedDaily = remainingImpressions / remainingDays;
    const currentRatio = status.pacing.ratio;

    let urgency: 'low' | 'medium' | 'high';
    let reason: string;

    if (currentRatio < 0.8) {
      urgency = 'high';
      reason = `Deal is ${((1 - currentRatio) * 100).toFixed(0)}% behind schedule - increase pacing significantly`;
    } else if (currentRatio < 0.95) {
      urgency = 'medium';
      reason = `Deal is slightly behind - increase pacing moderately`;
    } else if (currentRatio > 1.2) {
      urgency = 'low';
      reason = `Deal is ahead of schedule - reduce pacing`;
    } else {
      urgency = 'low';
      reason = `Deal is on track - maintain current pacing`;
    }

    return {
      recommended: Math.round(recommendedDaily),
      reason,
      urgency,
    };
  },

  async calculatePacingForDateRange(
    dealId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{ date: string; target: number; actual: number; variance: number }>> {
    const status = await this.getPacingStatus(dealId);
    if (!status) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: Array<{ date: string; target: number; actual: number; variance: number }> = [];

    const analytics = await DealAnalytics.find({ dealId });
    const analyticsMap = new Map(analytics.map((a) => [a.date, a]));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      const dayNumber = Math.ceil((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

      const target = (status.target.total / totalDays) * dayNumber;
      const actual = analyticsMap.get(date)?.impressions.total || 0;
      const variance = actual - target;

      dates.push({ date, target: Math.round(target), actual, variance: Math.round(variance) });
    }

    return dates;
  },

  async getPacingAlerts(): Promise<Array<{
    dealId: string;
    alertType: 'under_paced' | 'over_paced' | 'budget_exhausted' | 'ending_soon';
    severity: 'warning' | 'critical';
    message: string;
  }>> {
    const activeDeals = await Deal.find({ status: 'active' });
    const alerts: Array<{
      dealId: string;
      alertType: 'under_paced' | 'over_paced' | 'budget_exhausted' | 'ending_soon';
      severity: 'warning' | 'critical';
      message: string;
    }> = [];

    for (const deal of activeDeals) {
      const status = await this.getPacingStatus(deal.dealId);
      if (!status) continue;

      if (status.pacing.status === 'under_paced' && status.pacing.ratio < 0.7) {
        alerts.push({
          dealId: deal.dealId,
          alertType: 'under_paced',
          severity: 'critical',
          message: `Deal is ${((1 - status.pacing.ratio) * 100).toFixed(0)}% behind schedule`,
        });
      } else if (status.pacing.status === 'under_paced' && status.pacing.ratio < 0.9) {
        alerts.push({
          dealId: deal.dealId,
          alertType: 'under_paced',
          severity: 'warning',
          message: `Deal is slightly behind schedule (${((1 - status.pacing.ratio) * 100).toFixed(0)}% behind)`,
        });
      }

      if (status.pacing.status === 'over_paced' && status.pacing.ratio > 1.3) {
        alerts.push({
          dealId: deal.dealId,
          alertType: 'over_paced',
          severity: 'warning',
          message: `Deal is ahead of schedule - may exhaust budget early`,
        });
      }

      if (deal.budget && deal.budget.amount > 0) {
        const budgetUsed = (deal.budget.spent / deal.budget.amount) * 100;
        if (budgetUsed >= 90) {
          alerts.push({
            dealId: deal.dealId,
            alertType: 'budget_exhausted',
            severity: 'critical',
            message: `Budget ${budgetUsed.toFixed(0)}% exhausted`,
          });
        } else if (budgetUsed >= 75) {
          alerts.push({
            dealId: deal.dealId,
            alertType: 'budget_exhausted',
            severity: 'warning',
            message: `Budget ${budgetUsed.toFixed(0)}% used`,
          });
        }
      }

      if (status.remaining.days <= 3 && status.remaining.impressions > 0) {
        alerts.push({
          dealId: deal.dealId,
          alertType: 'ending_soon',
          severity: status.remaining.days <= 1 ? 'critical' : 'warning',
          message: `Deal ending in ${status.remaining.days} day(s) with ${status.remaining.impressions.toLocaleString()} impressions remaining`,
        });
      }
    }

    return alerts;
  },
};