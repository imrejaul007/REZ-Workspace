import { Subscription, Plan, Invoice } from '../models/index.js';
import {
  SubscriptionStatus,
  SubscriptionStats,
  BillingCycle,
  ApiResponse
} from '../types/index.js';
import logger from 'utils/logger.js';
import {
  monthlyRecurringRevenue,
  annualRecurringRevenue
} from '../utils/metrics.js';

export class AnalyticsService {
  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(): Promise<ApiResponse<SubscriptionStats>> {
    try {
      // Get counts by status
      const statusCounts = await Subscription.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusMap = statusCounts.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {} as Record<string, number>);

      // Get counts by plan
      const planCounts = await Subscription.aggregate([
        { $match: { status: SubscriptionStatus.ACTIVE } },
        {
          $group: {
            _id: '$planId',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get plans for plan names
      const plans = await Plan.find({ isActive: true }).lean();
      const planMap = plans.reduce((acc, p) => {
        acc[p._id.toString()] = p;
        return acc;
      }, {} as Record<string, any>);

      // Calculate MRR and ARR
      const revenueData = await this.calculateRecurringRevenue();

      // Calculate churn rate (last 30 days)
      const churnRate = await this.calculateChurnRate(30);

      // Calculate growth rate
      const growthRate = await this.calculateGrowthRate();

      // Build stats object
      const stats: SubscriptionStats = {
        totalSubscriptions: Object.values(statusMap).reduce((a, b) => a + b, 0),
        activeSubscriptions: statusMap[SubscriptionStatus.ACTIVE] || 0,
        trialSubscriptions: statusMap[SubscriptionStatus.TRIAL] || 0,
        cancelledSubscriptions: statusMap[SubscriptionStatus.CANCELLED] || 0,
        expiredSubscriptions: statusMap[SubscriptionStatus.EXPIRED] || 0,
        monthlyRecurringRevenue: revenueData.mrr,
        annualRecurringRevenue: revenueData.arr,
        churnRate,
        growthRate,
        byPlan: planCounts.map((pc) => ({
          planId: pc._id,
          planName: planMap[pc._id]?.name || 'Unknown',
          count: pc.count,
          revenue: planMap[pc._id]
            ? this.getPlanPriceByBillingCycle(planMap[pc._id], BillingCycle.MONTHLY) * pc.count
            : 0
        })),
        byStatus: Object.entries(statusMap).map(([status, count]) => ({
          status: status as SubscriptionStatus,
          count
        }))
      };

      // Update Prometheus metrics
      monthlyRecurringRevenue.set(revenueData.mrr);
      annualRecurringRevenue.set(revenueData.arr);

      return { success: true, data: stats };
    } catch (error) {
      logger.error('Failed to get subscription stats', { error });
      return { success: false, error: 'Failed to get statistics' };
    }
  }

  /**
   * Get MRR breakdown by plan
   */
  async getMrrBreakdown(): Promise<ApiResponse<{
    byPlan: { planId: string; planName: string; mrr: number }[];
    byBillingCycle: { cycle: string; count: number; mrr: number }[];
    totalMrr: number;
  }>> {
    try {
      const activeSubscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE
      }).populate('planId');

      // Group by plan
      const byPlanMap = new Map<string, { planId: string; planName: string; mrr: number }>();
      const byCycleMap = new Map<string, { cycle: string; count: number; mrr: number }>();

      for (const sub of activeSubscriptions) {
        const plan = sub.planId as any;
        const price = this.getPlanPriceByBillingCycle(plan, sub.billingCycle);

        // By plan
        const existingPlan = byPlanMap.get(plan._id.toString());
        if (existingPlan) {
          existingPlan.mrr += price;
        } else {
          byPlanMap.set(plan._id.toString(), {
            planId: plan._id.toString(),
            planName: plan.name,
            mrr: price
          });
        }

        // By billing cycle
        const existingCycle = byCycleMap.get(sub.billingCycle);
        if (existingCycle) {
          existingCycle.count += 1;
          existingCycle.mrr += price;
        } else {
          byCycleMap.set(sub.billingCycle, {
            cycle: sub.billingCycle,
            count: 1,
            mrr: price
          });
        }
      }

      const totalMrr = Array.from(byPlanMap.values()).reduce((sum, p) => sum + p.mrr, 0);

      return {
        success: true,
        data: {
          byPlan: Array.from(byPlanMap.values()),
          byBillingCycle: Array.from(byCycleMap.values()),
          totalMrr
        }
      };
    } catch (error) {
      logger.error('Failed to get MRR breakdown', { error });
      return { success: false, error: 'Failed to get MRR breakdown' };
    }
  }

  /**
   * Get subscription trends
   */
  async getSubscriptionTrends(
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<ApiResponse<{
    subscriptions: { date: string; active: number; new: number; churned: number }[];
    cumulative: { date: string; total: number }[];
  }>> {
    try {
      const intervalMs = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      };

      const subscriptions: any[] = [];
      const cumulative: any[] = [];
      let currentDate = new Date(startDate);
      let cumulativeTotal = 0;

      while (currentDate <= endDate) {
        const nextDate = new Date(currentDate.getTime() + intervalMs[interval]);

        // Count new subscriptions in this period
        const newCount = await Subscription.countDocuments({
          createdAt: { $gte: currentDate, $lt: nextDate }
        });

        // Count churned (cancelled or expired) in this period
        const churnedCount = await Subscription.countDocuments({
          updatedAt: { $gte: currentDate, $lt: nextDate },
          status: { $in: [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED] }
        });

        // Count active at end of period
        const activeCount = await Subscription.countDocuments({
          startDate: { $lte: nextDate },
          $or: [
            { endDate: { $gte: nextDate } },
            { status: SubscriptionStatus.ACTIVE }
          ]
        });

        cumulativeTotal += newCount - churnedCount;

        subscriptions.push({
          date: currentDate.toISOString().split('T')[0],
          active: activeCount,
          new: newCount,
          churned: churnedCount
        });

        cumulative.push({
          date: currentDate.toISOString().split('T')[0],
          total: cumulativeTotal
        });

        currentDate = nextDate;
      }

      return { success: true, data: { subscriptions, cumulative } };
    } catch (error) {
      logger.error('Failed to get subscription trends', { error });
      return { success: false, error: 'Failed to get trends' };
    }
  }

  /**
   * Get revenue forecasts
   */
  async getRevenueForecast(months: number = 12): Promise<ApiResponse<{
    mrr: number;
    arr: number;
    projected: { month: string; mrr: number; arr: number }[];
    confidence: number;
  }>> {
    try {
      const currentStats = await this.getSubscriptionStats();

      if (!currentStats.success || !currentStats.data) {
        return { success: false, error: 'Failed to get current stats' };
      }

      const currentMrr = currentStats.data.monthlyRecurringRevenue;
      const growthRate = currentStats.data.growthRate || 0.05; // Default 5% monthly growth

      const projected: any[] = [];
      let projectedMrr = currentMrr;
      const now = new Date();

      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        projectedMrr *= 1 + growthRate;

        projected.push({
          month: futureDate.toISOString().substring(0, 7),
          mrr: Math.round(projectedMrr * 100) / 100,
          arr: Math.round(projectedMrr * 12 * 100) / 100
        });
      }

      return {
        success: true,
        data: {
          mrr: currentMrr,
          arr: currentMrr * 12,
          projected,
          confidence: 0.7 // Conservative confidence level
        }
      };
    } catch (error) {
      logger.error('Failed to get revenue forecast', { error });
      return { success: false, error: 'Failed to get forecast' };
    }
  }

  /**
   * Calculate churn rate
   */
  private async calculateChurnRate(days: number): Promise<number> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [startTotal, churned] = await Promise.all([
        Subscription.countDocuments({
          createdAt: { $lte: startDate },
          status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
        }),
        Subscription.countDocuments({
          updatedAt: { $gte: startDate },
          status: { $in: [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED] }
        })
      ]);

      if (startTotal === 0) return 0;
      return Math.round((churned / startTotal) * 10000) / 100; // Percentage with 2 decimals
    } catch (error) {
      logger.error('Failed to calculate churn rate', { error });
      return 0;
    }
  }

  /**
   * Calculate growth rate
   */
  private async calculateGrowthRate(): Promise<number> {
    try {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [thisMonthTotal, lastMonthTotal] = await Promise.all([
        Subscription.countDocuments({
          createdAt: { $lte: thisMonth },
          status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
        }),
        Subscription.countDocuments({
          createdAt: { $lte: lastMonth },
          status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
        })
      ]);

      if (lastMonthTotal === 0) return thisMonthTotal > 0 ? 100 : 0;
      return Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 10000) / 100;
    } catch (error) {
      logger.error('Failed to calculate growth rate', { error });
      return 0;
    }
  }

  /**
   * Calculate recurring revenue
   */
  private async calculateRecurringRevenue(): Promise<{ mrr: number; arr: number }> {
    try {
      const activeSubscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE
      }).populate('planId');

      let mrr = 0;

      for (const sub of activeSubscriptions) {
        const plan = sub.planId as any;
        mrr += this.getPlanPriceByBillingCycle(plan, sub.billingCycle);
      }

      return {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100
      };
    } catch (error) {
      logger.error('Failed to calculate recurring revenue', { error });
      return { mrr: 0, arr: 0 };
    }
  }

  /**
   * Get plan price based on billing cycle
   */
  private getPlanPriceByBillingCycle(plan: any, billingCycle: BillingCycle): number {
    let price = plan.price;
    switch (billingCycle) {
      case BillingCycle.QUARTERLY:
        price = plan.price * 3 * 0.95;
        break;
      case BillingCycle.YEARLY:
        price = plan.price * 12 * 0.80;
        break;
    }
    return Math.round(price * 100) / 100;
  }
}

export const analyticsService = new AnalyticsService();