import { AuthenticityCheck, InfluencerProfile, CheckHistory } from '../models';
import { logger } from 'utils/logger.js';

export interface AnalyticsSummary {
  totalProfiles: number;
  totalChecks: number;
  averageScore: number;
  riskDistribution: Record<string, number>;
  platformDistribution: Record<string, number>;
  topFlags: Record<string, number>;
  recentActivity: {
    checksLast24h: number;
    checksLast7d: number;
    newProfilesLast7d: number;
  };
  alertStats: {
    total: number;
    critical: number;
    warning: number;
  };
  scoreTrend: {
    direction: 'improving' | 'declining' | 'stable';
    change: number;
  };
}

export class AnalyticsService {
  /**
   * Get overall analytics summary
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const loggerCtx = logger.child({ context: 'analytics' });

    try {
      // Parallel queries for efficiency
      const [
        profileStats,
        checkStats,
        recentChecks,
        recentProfiles,
        alertStats,
        scoreDistribution,
      ] = await Promise.all([
        this.getProfileStats(),
        this.getCheckStats(),
        this.getRecentChecks(),
        this.getRecentProfiles(),
        this.getAlertStats(),
        this.getScoreDistribution(),
      ]);

      // Calculate score trend
      const scoreTrend = this.calculateScoreTrend(scoreDistribution);

      const summary: AnalyticsSummary = {
        totalProfiles: profileStats.total,
        totalChecks: checkStats.total,
        averageScore: checkStats.average,
        riskDistribution: profileStats.riskDistribution,
        platformDistribution: profileStats.platformDistribution,
        topFlags: profileStats.topFlags,
        recentActivity: {
          checksLast24h: recentChecks.last24h,
          checksLast7d: recentChecks.last7d,
          newProfilesLast7d: recentProfiles,
        },
        alertStats: alertStats,
        scoreTrend,
      };

      loggerCtx.info('Analytics summary generated', {
        totalProfiles: summary.totalProfiles,
        totalChecks: summary.totalChecks,
        averageScore: summary.averageScore,
      });

      return summary;
    } catch (error) {
      loggerCtx.error('Failed to generate analytics', { error });
      throw error;
    }
  }

  /**
   * Get profile statistics
   */
  private async getProfileStats(): Promise<{
    total: number;
    riskDistribution: Record<string, number>;
    platformDistribution: Record<string, number>;
    topFlags: Record<string, number>;
  }> {
    const profiles = await InfluencerProfile.find().lean();

    const riskDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const platformDistribution: Record<string, number> = {};
    const topFlags: Record<string, number> = {};

    for (const profile of profiles) {
      riskDistribution[profile.riskLevel] = (riskDistribution[profile.riskLevel] || 0) + 1;
      platformDistribution[profile.platform] = (platformDistribution[profile.platform] || 0) + 1;

      for (const flag of profile.flags) {
        topFlags[flag] = (topFlags[flag] || 0) + 1;
      }
    }

    // Sort top flags by count
    const sortedFlags = Object.entries(topFlags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    const topFlagsSorted: Record<string, number> = {};
    for (const [flag, count] of sortedFlags) {
      topFlagsSorted[flag] = count;
    }

    return {
      total: profiles.length,
      riskDistribution,
      platformDistribution,
      topFlags: topFlagsSorted,
    };
  }

  /**
   * Get check statistics
   */
  private async getCheckStats(): Promise<{ total: number; average: number }> {
    const result = await AuthenticityCheck.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
        },
      },
    ]);

    if (result.length === 0) {
      return { total: 0, average: 0 };
    }

    return {
      total: result[0].total,
      average: Math.round(result[0].averageScore * 100) / 100,
    };
  }

  /**
   * Get recent check counts
   */
  private async getRecentChecks(): Promise<{ last24h: number; last7d: number }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [last24hCount, last7dCount] = await Promise.all([
      AuthenticityCheck.countDocuments({ createdAt: { $gte: last24h } }),
      AuthenticityCheck.countDocuments({ createdAt: { $gte: last7d } }),
    ]);

    return { last24h: last24hCount, last7d: last7dCount };
  }

  /**
   * Get new profiles in last 7 days
   */
  private async getRecentProfiles(): Promise<number> {
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return InfluencerProfile.countDocuments({ createdAt: { $gte: last7d } });
  }

  /**
   * Get alert statistics
   */
  private async getAlertStats(): Promise<{ total: number; critical: number; warning: number }> {
    const histories = await CheckHistory.find({
      'alerts.acknowledged': false,
    }).select('alerts');

    let total = 0;
    let critical = 0;
    let warning = 0;

    for (const history of histories) {
      for (const alert of history.alerts) {
        if (alert.acknowledged) continue;
        total++;
        if (alert.severity === 'critical') critical++;
        if (alert.severity === 'warning') warning++;
      }
    }

    return { total, critical, warning };
  }

  /**
   * Get score distribution for trend calculation
   */
  private async getScoreDistribution(): Promise<number[]> {
    const checks = await AuthenticityCheck.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select('overallScore')
      .lean();

    return checks.map((c) => c.overallScore);
  }

  /**
   * Calculate score trend based on recent checks
   */
  private calculateScoreTrend(scores: number[]): {
    direction: 'improving' | 'declining' | 'stable';
    change: number;
  } {
    if (scores.length < 2) {
      return { direction: 'stable', change: 0 };
    }

    // Compare recent 10 vs previous 10
    const recent = scores.slice(0, 10);
    const previous = scores.slice(10, 20);

    if (previous.length === 0) {
      return { direction: 'stable', change: 0 };
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    const change = recentAvg - previousAvg;

    let direction: 'improving' | 'declining' | 'stable';
    if (change > 5) {
      direction = 'improving';
    } else if (change < -5) {
      direction = 'declining';
    } else {
      direction = 'stable';
    }

    return {
      direction,
      change: Math.round(change * 100) / 100,
    };
  }

  /**
   * Get platform-specific analytics
   */
  async getPlatformAnalytics(platform: string): Promise<{
    totalProfiles: number;
    averageScore: number;
    riskDistribution: Record<string, number>;
    recentChecks: number;
  }> {
    const profiles = await InfluencerProfile.find({ platform });

    const riskDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let totalScore = 0;
    for (const profile of profiles) {
      riskDistribution[profile.riskLevel]++;
      totalScore += profile.authenticityScore;
    }

    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentChecks = await AuthenticityCheck.countDocuments({
      platform,
      createdAt: { $gte: last7d },
    });

    return {
      totalProfiles: profiles.length,
      averageScore: profiles.length > 0 ? Math.round((totalScore / profiles.length) * 100) / 100 : 0,
      riskDistribution,
      recentChecks,
    };
  }
}

export const analyticsService = new AnalyticsService();