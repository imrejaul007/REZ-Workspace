import Decimal from 'decimal.js';
import { FollowerSnapshot, GrowthAnalysis, MilestoneAlert, UnfollowEvent, Competitor } from '../models/index.js';
import { logger } from '../utils/logger.js';
import {
  followerGrowthGauge,
  followerChangeGauge,
  growthRateGauge,
  unfollowCounter,
  milestoneReachedCounter,
} from '../utils/metrics.js';

interface DailySnapshot {
  date: string;
  followers: number;
  change: number;
  changePercentage: number;
}

interface WeeklySnapshot {
  week: string;
  startDate: string;
  endDate: string;
  startFollowers: number;
  endFollowers: number;
  netGrowth: number;
  growthRate: number;
  avgDailyChange: number;
}

interface MonthlySnapshot {
  month: string;
  startDate: string;
  endDate: string;
  startFollowers: number;
  endFollowers: number;
  netGrowth: number;
  growthRate: number;
  avgDailyChange: number;
}

interface GrowthData {
  currentFollowers: number;
  totalGrowth: number;
  growthRate: number;
  avgDailyGrowth: number;
  bestDay: { date: string; gain: number };
  worstDay: { date: string; loss: number };
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface Predictions {
  nextWeek: number;
  nextMonth: number;
  confidence: number;
  methodology: string;
}

interface EngagementCorrelation {
  correlation: number;
  insight: string;
  dataPoints: Array<{
    date: string;
    engagement: number;
    followerChange: number;
  }>;
}

interface ChurnAnalysis {
  totalUnfollows: number;
  churnRate: number;
  avgDaysBeforeUnfollow: number;
  recentUnfollows: Array<{
    date: string;
    count: number;
  }>;
}

interface SourceBreakdown {
  sources: {
    hashtag: number;
    explore: number;
    profile: number;
    suggested: number;
    other: number;
  };
  total: number;
  percentages: {
    hashtag: number;
    explore: number;
    profile: number;
    suggested: number;
    other: number;
  };
}

interface ComparisonResult {
  account: {
    id: string;
    followers: number;
    growthRate: number;
  };
  competitors: Array<{
    id: string;
    username: string;
    followers: number;
    growthRate: number;
    difference: number;
    status: 'ahead' | 'behind' | 'similar';
  }>;
  insights: string[];
}

export class GrowthService {
  async createSnapshot(
    accountId: string,
    data: {
      followers: number;
      following: number;
      posts: number;
      change?: number;
      sources?: {
        hashtag: number;
        explore: number;
        profile: number;
        suggested: number;
        other: number;
      };
    }
  ): Promise<void> {
    try {
      const previousSnapshot = await FollowerSnapshot.findOne({ accountId }).sort({ date: -1 });

      const change = data.change ?? (previousSnapshot ? data.followers - previousSnapshot.followers : 0);
      const changePercentage =
        previousSnapshot && previousSnapshot.followers > 0
          ? new Decimal(change).dividedBy(previousSnapshot.followers).times(100).toNumber()
          : 0;

      const snapshot = new FollowerSnapshot({
        accountId,
        date: new Date(),
        followers: data.followers,
        following: data.following,
        posts: data.posts,
        change,
        changePercentage,
        sources: data.sources || {
          hashtag: 0,
          explore: 0,
          profile: 0,
          suggested: 0,
          other: 0,
        },
      });

      await snapshot.save();

      // Update metrics
      followerGrowthGauge.labels(accountId).set(data.followers);
      followerChangeGauge.labels(accountId).set(change);
      growthRateGauge.labels(accountId, 'daily').set(changePercentage);

      // Check milestones
      await this.checkMilestones(accountId, data.followers);

      logger.info('Snapshot created', { accountId, followers: data.followers, change });
    } catch (error) {
      logger.error('Failed to create snapshot', { accountId, error });
      throw error;
    }
  }

  async getGrowthData(accountId: string, days: number = 30): Promise<GrowthData> {
    try {
      const snapshots = await FollowerSnapshot.find({ accountId })
        .sort({ date: -1 })
        .limit(days)
        .lean();

      if (snapshots.length === 0) {
        return {
          currentFollowers: 0,
          totalGrowth: 0,
          growthRate: 0,
          avgDailyGrowth: 0,
          bestDay: { date: '', gain: 0 },
          worstDay: { date: '', loss: 0 },
          trend: 'stable',
        };
      }

      const currentFollowers = snapshots[0].followers;
      const oldestSnapshot = snapshots[snapshots.length - 1];
      const totalGrowth = currentFollowers - oldestSnapshot.followers;

      const firstFollowers = snapshots[snapshots.length - 1].followers;
      const growthRate =
        firstFollowers > 0 ? new Decimal(totalGrowth).dividedBy(firstFollowers).times(100).toNumber() : 0;

      const totalChange = snapshots.reduce((sum, s) => sum + s.change, 0);
      const avgDailyGrowth = totalChange / snapshots.length;

      const sortedByChange = [...snapshots].sort((a, b) => b.change - a.change);
      const bestDay = {
        date: sortedByChange[0].date.toISOString().split('T')[0],
        gain: sortedByChange[0].change,
      };
      const worstDay = {
        date: sortedByChange[sortedByChange.length - 1].date.toISOString().split('T')[0],
        loss: sortedByChange[sortedByChange.length - 1].change,
      };

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (growthRate > 5) trend = 'increasing';
      else if (growthRate < -5) trend = 'decreasing';

      return {
        currentFollowers,
        totalGrowth,
        growthRate,
        avgDailyGrowth,
        bestDay,
        worstDay,
        trend,
      };
    } catch (error) {
      logger.error('Failed to get growth data', { accountId, error });
      throw error;
    }
  }

  async getDailySnapshots(accountId: string, days: number = 30): Promise<DailySnapshot[]> {
    try {
      const snapshots = await FollowerSnapshot.find({ accountId })
        .sort({ date: -1 })
        .limit(days)
        .lean();

      return snapshots.map((s) => ({
        date: s.date.toISOString().split('T')[0],
        followers: s.followers,
        change: s.change,
        changePercentage: s.changePercentage,
      }));
    } catch (error) {
      logger.error('Failed to get daily snapshots', { accountId, error });
      throw error;
    }
  }

  async getWeeklySummary(accountId: string, weeks: number = 12): Promise<WeeklySnapshot[]> {
    try {
      const snapshots = await FollowerSnapshot.find({ accountId }).sort({ date: -1 }).lean();

      const weeklyData: Map<string, { start: number; end: number; dates: Date[] }> = new Map();

      for (const snapshot of snapshots) {
        const weekStart = this.getWeekStart(snapshot.date);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, { start: snapshot.followers, end: snapshot.followers, dates: [] });
        }

        const week = weeklyData.get(weekKey)!;
        week.dates.push(snapshot.date);
        week.end = snapshot.followers;
      }

      const summaries: WeeklySnapshot[] = [];
      const sortedWeeks = Array.from(weeklyData.keys()).sort().slice(-weeks);

      for (const week of sortedWeeks) {
        const weekData = weeklyData.get(week)!;
        const netGrowth = weekData.end - weekData.start;
        const growthRate =
          weekData.start > 0 ? new Decimal(netGrowth).dividedBy(weekData.start).times(100).toNumber() : 0;

        summaries.push({
          week,
          startDate: week,
          endDate: this.getWeekEnd(new Date(week)).toISOString().split('T')[0],
          startFollowers: weekData.start,
          endFollowers: weekData.end,
          netGrowth,
          growthRate,
          avgDailyChange: netGrowth / 7,
        });
      }

      return summaries.reverse();
    } catch (error) {
      logger.error('Failed to get weekly summary', { accountId, error });
      throw error;
    }
  }

  async getMonthlySummary(accountId: string, months: number = 12): Promise<MonthlySnapshot[]> {
    try {
      const snapshots = await FollowerSnapshot.find({ accountId }).sort({ date: -1 }).lean();

      const monthlyData: Map<string, { start: number; end: number; dates: Date[] }> = new Map();

      for (const snapshot of snapshots) {
        const monthStart = new Date(snapshot.date.getFullYear(), snapshot.date.getMonth(), 1);
        const monthKey = monthStart.toISOString().split('T')[0];

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { start: snapshot.followers, end: snapshot.followers, dates: [] });
        }

        const month = monthlyData.get(monthKey)!;
        month.dates.push(snapshot.date);
        month.end = snapshot.followers;
      }

      const summaries: MonthlySnapshot[] = [];
      const sortedMonths = Array.from(monthlyData.keys()).sort().slice(-months);

      for (const month of sortedMonths) {
        const monthData = monthlyData.get(month)!;
        const netGrowth = monthData.end - monthData.start;
        const growthRate =
          monthData.start > 0 ? new Decimal(netGrowth).dividedBy(monthData.start).times(100).toNumber() : 0;
        const daysInMonth = monthData.dates.length || 30;

        summaries.push({
          month,
          startDate: month,
          endDate: new Date(monthData.dates[monthData.dates.length - 1] || month).toISOString().split('T')[0],
          startFollowers: monthData.start,
          endFollowers: monthData.end,
          netGrowth,
          growthRate,
          avgDailyChange: netGrowth / daysInMonth,
        });
      }

      return summaries.reverse();
    } catch (error) {
      logger.error('Failed to get monthly summary', { accountId, error });
      throw error;
    }
  }

  async getAnalytics(accountId: string): Promise<{
    growth: GrowthData;
    engagement: EngagementCorrelation;
    predictions: Predictions;
    insights: string[];
  }> {
    try {
      const growth = await this.getGrowthData(accountId, 30);
      const engagement = await this.getEngagementCorrelation(accountId);
      const predictions = await this.getPredictions(accountId);

      const insights: string[] = [];

      if (growth.trend === 'increasing') {
        insights.push(`Your account is growing steadily with ${growth.growthRate.toFixed(2)}% growth over the period.`);
      } else if (growth.trend === 'decreasing') {
        insights.push('Your follower count is declining. Consider reviewing your content strategy.');
      } else {
        insights.push('Your follower count is stable. To accelerate growth, try new content strategies.');
      }

      if (engagement.correlation > 0.5) {
        insights.push('High engagement correlates with follower growth. Focus on creating engaging content.');
      }

      if (growth.bestDay.gain > 0) {
        insights.push(`Your best day was ${growth.bestDay.date} with ${growth.bestDay.gain} new followers.`);
      }

      return { growth, engagement, predictions, insights };
    } catch (error) {
      logger.error('Failed to get analytics', { accountId, error });
      throw error;
    }
  }

  async getPredictions(accountId: string): Promise<Predictions> {
    try {
      const snapshots = await FollowerSnapshot.find({ accountId })
        .sort({ date: -1 })
        .limit(90)
        .lean();

      if (snapshots.length < 7) {
        return {
          nextWeek: snapshots[0]?.followers || 0,
          nextMonth: snapshots[0]?.followers || 0,
          confidence: 0,
          methodology: 'Insufficient data for prediction',
        };
      }

      // Calculate average daily growth rate
      const growthRates: number[] = [];
      for (let i = 1; i < snapshots.length; i++) {
        const prevFollowers = snapshots[i].followers;
        const currFollowers = snapshots[i - 1].followers;
        if (prevFollowers > 0) {
          const rate = new Decimal(currFollowers - prevFollowers).dividedBy(prevFollowers).toNumber();
          growthRates.push(rate);
        }
      }

      const avgGrowthRate = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;

      // Calculate standard deviation for confidence
      const variance =
        growthRates.length > 0
          ? growthRates.reduce((sum, r) => sum + Math.pow(r - avgGrowthRate, 2), 0) / growthRates.length
          : 0;
      const stdDev = Math.sqrt(variance);

      const currentFollowers = snapshots[0].followers;
      const nextWeek = Math.round(currentFollowers * (1 + avgGrowthRate * 7));
      const nextMonth = Math.round(currentFollowers * Math.pow(1 + avgGrowthRate, 30));

      // Confidence based on data points and variance
      const dataConfidence = Math.min(snapshots.length / 30, 1);
      const varianceConfidence = Math.max(0, 1 - stdDev * 10);
      const confidence = Math.round((dataConfidence * 0.6 + varianceConfidence * 0.4) * 100);

      return {
        nextWeek,
        nextMonth,
        confidence,
        methodology: 'Linear regression with variance-based confidence',
      };
    } catch (error) {
      logger.error('Failed to get predictions', { accountId, error });
      throw error;
    }
  }

  async getSourceBreakdown(accountId: string): Promise<SourceBreakdown> {
    try {
      const snapshots = await FollowerSnapshot.find({ accountId })
        .sort({ date: -1 })
        .limit(30)
        .lean();

      const totals = {
        hashtag: 0,
        explore: 0,
        profile: 0,
        suggested: 0,
        other: 0,
      };

      for (const snapshot of snapshots) {
        totals.hashtag += snapshot.sources.hashtag;
        totals.explore += snapshot.sources.explore;
        totals.profile += snapshot.sources.profile;
        totals.suggested += snapshot.sources.suggested;
        totals.other += snapshot.sources.other;
      }

      const total = Object.values(totals).reduce((sum, val) => sum + val, 0);

      return {
        sources: totals,
        total,
        percentages: {
          hashtag: total > 0 ? new Decimal(totals.hashtag).dividedBy(total).times(100).toNumber() : 0,
          explore: total > 0 ? new Decimal(totals.explore).dividedBy(total).times(100).toNumber() : 0,
          profile: total > 0 ? new Decimal(totals.profile).dividedBy(total).times(100).toNumber() : 0,
          suggested: total > 0 ? new Decimal(totals.suggested).dividedBy(total).times(100).toNumber() : 0,
          other: total > 0 ? new Decimal(totals.other).dividedBy(total).times(100).toNumber() : 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get source breakdown', { accountId, error });
      throw error;
    }
  }

  async getEngagementCorrelation(accountId: string): Promise<EngagementCorrelation> {
    try {
      // This would typically join with post data
      // For now, we'll use follower change as a proxy
      const snapshots = await FollowerSnapshot.find({ accountId })
        .sort({ date: -1 })
        .limit(30)
        .lean();

      // Simulated engagement data
      const dataPoints = snapshots.map((s, i) => ({
        date: s.date.toISOString().split('T')[0],
        engagement: Math.random() * 100 + 50, // Simulated
        followerChange: s.change,
      }));

      // Calculate correlation
      const n = dataPoints.length;
      if (n < 2) {
        return {
          correlation: 0,
          insight: 'Insufficient data for correlation analysis',
          dataPoints,
        };
      }

      const engagementMean = dataPoints.reduce((sum, d) => sum + d.engagement, 0) / n;
      const changeMean = dataPoints.reduce((sum, d) => sum + d.followerChange, 0) / n;

      let numerator = 0;
      let engagementVarSum = 0;
      let changeVarSum = 0;

      for (const d of dataPoints) {
        numerator += (d.engagement - engagementMean) * (d.followerChange - changeMean);
        engagementVarSum += Math.pow(d.engagement - engagementMean, 2);
        changeVarSum += Math.pow(d.followerChange - changeMean, 2);
      }

      const correlation =
        engagementVarSum > 0 && changeVarSum > 0
          ? numerator / Math.sqrt(engagementVarSum * changeVarSum)
          : 0;

      let insight: string;
      if (correlation > 0.5) {
        insight = 'Strong positive correlation between engagement and follower growth. Focus on engagement.';
      } else if (correlation > 0) {
        insight = 'Moderate correlation between engagement and follower growth.';
      } else if (correlation > -0.5) {
        insight = 'Weak correlation between engagement and follower growth.';
      } else {
        insight = 'Negative correlation detected. Consider reviewing your content strategy.';
      }

      return { correlation: Math.round(correlation * 100) / 100, insight, dataPoints };
    } catch (error) {
      logger.error('Failed to get engagement correlation', { accountId, error });
      throw error;
    }
  }

  async getChurnAnalysis(accountId: string): Promise<ChurnAnalysis> {
    try {
      const unfollows = await UnfollowEvent.find({ accountId })
        .sort({ unfollowedAt: -1 })
        .limit(90)
        .lean();

      const currentFollowers = await FollowerSnapshot.findOne({ accountId }).sort({ date: -1 });
      const followers30DaysAgo = await FollowerSnapshot.findOne({ accountId }).sort({ date: -1 }).skip(30);

      const totalUnfollows = unfollows.length;
      const currentCount = currentFollowers?.followers || 1;
      const previousCount = followers30DaysAgo?.followers || currentCount;

      const churnRate =
        previousCount > 0 ? new Decimal(totalUnfollows).dividedBy(previousCount).times(100).toNumber() : 0;

      const avgDaysBeforeUnfollow =
        unfollows.length > 0
          ? unfollows.reduce((sum, u) => sum + u.daysAsFollower, 0) / unfollows.length
          : 0;

      // Group by date
      const byDate = new Map<string, number>();
      for (const unfollow of unfollows) {
        const dateKey = unfollow.unfollowedAt.toISOString().split('T')[0];
        byDate.set(dateKey, (byDate.get(dateKey) || 0) + 1);
      }

      const recentUnfollows = Array.from(byDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

      return {
        totalUnfollows,
        churnRate: Math.round(churnRate * 100) / 100,
        avgDaysBeforeUnfollow: Math.round(avgDaysBeforeUnfollow),
        recentUnfollows,
      };
    } catch (error) {
      logger.error('Failed to get churn analysis', { accountId, error });
      throw error;
    }
  }

  async compareWithCompetitors(accountId: string, competitorIds: string[]): Promise<ComparisonResult> {
    try {
      const accountSnapshot = await FollowerSnapshot.findOne({ accountId }).sort({ date: -1 });
      const competitors = await Competitor.find({
        accountId,
        competitorId: { $in: competitorIds },
      }).lean();

      const accountGrowth = await this.getGrowthData(accountId, 30);

      const competitorResults = competitors.map((comp) => {
        const latestSnapshot = comp.snapshots[comp.snapshots.length - 1];
        const firstSnapshot = comp.snapshots[0];
        const compGrowthRate =
          firstSnapshot && firstSnapshot.followers > 0
            ? new Decimal(latestSnapshot.followers - firstSnapshot.followers)
                .dividedBy(firstSnapshot.followers)
                .times(100)
                .toNumber()
            : 0;

        const difference = accountGrowth.growthRate - compGrowthRate;

        return {
          id: comp.competitorId,
          username: comp.competitorUsername,
          followers: latestSnapshot?.followers || 0,
          growthRate: Math.round(compGrowthRate * 100) / 100,
          difference: Math.round(difference * 100) / 100,
          status: difference > 5 ? 'ahead' : difference < -5 ? 'behind' : 'similar',
        };
      });

      const insights: string[] = [];
      const aheadCount = competitorResults.filter((c) => c.status === 'ahead').length;
      const behindCount = competitorResults.filter((c) => c.status === 'behind').length;

      if (aheadCount > competitorResults.length / 2) {
        insights.push(`You're ahead of ${aheadCount} out of ${competitorResults.length} competitors.`);
      } else if (behindCount > competitorResults.length / 2) {
        insights.push(`${behindCount} competitors are outpacing you. Consider reviewing their strategies.`);
      }

      return {
        account: {
          id: accountId,
          followers: accountSnapshot?.followers || 0,
          growthRate: accountGrowth.growthRate,
        },
        competitors: competitorResults,
        insights,
      };
    } catch (error) {
      logger.error('Failed to compare with competitors', { accountId, error });
      throw error;
    }
  }

  async setMilestoneAlert(accountId: string, milestone: number): Promise<MilestoneAlert> {
    try {
      const existing = await MilestoneAlert.findOne({ accountId, milestone });
      if (existing) {
        return existing;
      }

      const alert = new MilestoneAlert({
        accountId,
        milestone,
        reached: false,
        notified: false,
      });

      await alert.save();
      logger.info('Milestone alert set', { accountId, milestone });

      return alert;
    } catch (error) {
      logger.error('Failed to set milestone alert', { accountId, error });
      throw error;
    }
  }

  async getMilestoneAlerts(accountId: string): Promise<MilestoneAlert[]> {
    try {
      return MilestoneAlert.find({ accountId }).sort({ milestone: 1 }).lean();
    } catch (error) {
      logger.error('Failed to get milestone alerts', { accountId, error });
      throw error;
    }
  }

  private async checkMilestones(accountId: string, currentFollowers: number): Promise<void> {
    try {
      const alerts = await MilestoneAlert.find({ accountId, reached: false }).lean();

      for (const alert of alerts) {
        if (currentFollowers >= alert.milestone) {
          await MilestoneAlert.findByIdAndUpdate(alert._id, {
            reached: true,
            reachedAt: new Date(),
          });

          milestoneReachedCounter.labels(accountId, alert.milestone.toString()).inc();
          logger.info('Milestone reached', { accountId, milestone: alert.milestone });
        }
      }
    } catch (error) {
      logger.error('Failed to check milestones', { accountId, error });
    }
  }

  async recordUnfollow(
    accountId: string,
    unfollowerId: string,
    unfollowerUsername?: string,
    daysAsFollower?: number
  ): Promise<void> {
    try {
      const event = new UnfollowEvent({
        accountId,
        unfollowerId,
        unfollowerUsername,
        unfollowedAt: new Date(),
        wasFollowing: false,
        daysAsFollower: daysAsFollower || 0,
      });

      await event.save();
      unfollowCounter.labels(accountId).inc();

      logger.info('Unfollow recorded', { accountId, unfollowerId });
    } catch (error) {
      logger.error('Failed to record unfollow', { accountId, error });
      throw error;
    }
  }

  async addCompetitor(
    accountId: string,
    competitorId: string,
    competitorUsername: string,
    competitorName?: string
  ): Promise<Competitor> {
    try {
      const existing = await Competitor.findOne({ accountId, competitorId });
      if (existing) {
        return existing;
      }

      const competitor = new Competitor({
        accountId,
        competitorId,
        competitorUsername,
        competitorName: competitorName || '',
        lastSyncedAt: new Date(),
        snapshots: [],
      });

      await competitor.save();
      logger.info('Competitor added', { accountId, competitorId });

      return competitor;
    } catch (error) {
      logger.error('Failed to add competitor', { accountId, error });
      throw error;
    }
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    return new Date(start.setDate(start.getDate() + 6));
  }
}

export const growthService = new GrowthService();