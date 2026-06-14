import { AuthenticityCheck, InfluencerProfile, CheckHistory } from '../models';
import { CheckProfileRequest, Platform } from '../utils/validators';
import { analysisService, AnalysisResult } from './analysisService';
import { logger } from 'utils/logger.js';
import { authenticityChecksTotal, authenticityCheckDuration, batchChecksSize } from '../config/metrics';
import mongoose from 'mongoose';

export interface CheckResult {
  checkId: string;
  influencerId: string;
  status: 'completed' | 'failed';
  score?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  error?: string;
}

export class CheckService {
  /**
   * Check a single influencer profile
   */
  async checkProfile(request: CheckProfileRequest): Promise<AuthenticityCheck> {
    const startTime = Date.now();
    const loggerCtx = logger.child({ username: request.username, platform: request.platform });

    try {
      loggerCtx.info('Starting authenticity check', { request });

      // Get or create influencer profile
      const influencerId = await this.getOrCreateInfluencerProfile(request);

      // Create new check record
      const check = new AuthenticityCheck({
        influencerId,
        platform: request.platform,
        username: request.username,
        status: 'in_progress',
      });
      await check.save();

      // Perform analysis
      const analysis = analysisService.analyze(request);

      // Update check with results
      check.scores = analysis.scores;
      check.overallScore = analysis.overallScore;
      check.riskLevel = analysis.riskLevel;
      check.breakdown = analysis.breakdown;
      check.recommendations = analysis.recommendations;
      check.flags = analysis.flags;
      check.status = 'completed';
      check.processingTime = Date.now() - startTime;
      check.rawData = request as Record<string, unknown>;

      await check.save();

      // Update influencer profile
      await this.updateInfluencerProfile(influencerId, analysis);

      // Update check history
      await this.updateCheckHistory(influencerId, request.platform, request.username, check, analysis);

      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      authenticityChecksTotal.inc({ platform: request.platform, risk_level: analysis.riskLevel });
      authenticityCheckDuration.observe({ platform: request.platform }, duration);

      loggerCtx.info('Check completed successfully', {
        overallScore: analysis.overallScore,
        riskLevel: analysis.riskLevel,
        processingTime: check.processingTime,
      });

      return check;
    } catch (error) {
      loggerCtx.error('Check failed', { error });
      throw error;
    }
  }

  /**
   * Get check by ID
   */
  async getCheck(checkId: string): Promise<AuthenticityCheck | null> {
    return AuthenticityCheck.findById(checkId);
  }

  /**
   * Batch check multiple influencers
   */
  async batchCheck(requests: CheckProfileRequest[]): Promise<CheckResult[]> {
    const loggerCtx = logger.child({ count: requests.length });
    loggerCtx.info('Starting batch check');

    batchChecksSize.observe(requests.length);

    const results: CheckResult[] = [];

    // Process in parallel with concurrency limit
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (request) => {
          try {
            const check = await this.checkProfile(request);
            return {
              checkId: check._id.toString(),
              influencerId: check.influencerId,
              status: 'completed' as const,
              score: check.overallScore,
              riskLevel: check.riskLevel,
            };
          } catch (error) {
            return {
              checkId: '',
              influencerId: '',
              status: 'failed' as const,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            checkId: '',
            influencerId: '',
            status: 'failed',
            error: result.reason?.message || 'Unknown error',
          });
        }
      });
    }

    loggerCtx.info('Batch check completed', {
      total: results.length,
      successful: results.filter((r) => r.status === 'completed').length,
      failed: results.filter((r) => r.status === 'failed').length,
    });

    return results;
  }

  /**
   * Get influencer profile by platform and username
   */
  async getInfluencerProfile(platform: Platform, username: string): Promise<InfluencerProfile | null> {
    return InfluencerProfile.findOne({ platform, username });
  }

  /**
   * Get influencer profile by ID
   */
  async getInfluencerProfileById(influencerId: string): Promise<InfluencerProfile | null> {
    return InfluencerProfile.findById(influencerId);
  }

  /**
   * Get or create influencer profile
   */
  private async getOrCreateInfluencerProfile(request: CheckProfileRequest): Promise<string> {
    let profile = await InfluencerProfile.findOne({
      platform: request.platform,
      username: request.username,
    });

    if (!profile) {
      profile = new InfluencerProfile({
        platform: request.platform,
        username: request.username,
        followers: request.followers || 0,
        following: request.following || 0,
        posts: request.posts || 0,
      });
      await profile.save();
    }

    return profile._id.toString();
  }

  /**
   * Update influencer profile with analysis results
   */
  private async updateInfluencerProfile(influencerId: string, analysis: AnalysisResult): Promise<void> {
    await InfluencerProfile.findByIdAndUpdate(influencerId, {
      authenticityScore: analysis.overallScore,
      riskLevel: analysis.riskLevel,
      flags: analysis.flags,
      lastChecked: new Date(),
    });
  }

  /**
   * Update check history for influencer
   */
  private async updateCheckHistory(
    influencerId: string,
    platform: Platform,
    username: string,
    check: AuthenticityCheck,
    analysis: AnalysisResult
  ): Promise<void> {
    let history = await CheckHistory.findOne({ influencerId });

    const checkResult = {
      checkId: check._id.toString(),
      date: check.date,
      overallScore: check.overallScore,
      riskLevel: check.riskLevel,
      keyFlags: check.flags,
    };

    if (!history) {
      history = new CheckHistory({
        influencerId,
        platform,
        username,
        checks: [checkResult],
        trend: {
          scoreChange: 0,
          direction: 'stable',
          previousScore: check.overallScore,
          currentScore: check.overallScore,
        },
        totalChecks: 1,
        firstCheckDate: check.date,
        lastCheckDate: check.date,
        averageScore: check.overallScore,
      });
    } else {
      await history.addCheck(checkResult);

      // Check for alerts
      await this.checkAndCreateAlerts(history, check, analysis);
    }

    await history.save();
  }

  /**
   * Check for conditions that should trigger alerts
   */
  private async checkAndCreateAlerts(
    history: InstanceType<typeof CheckHistory>,
    check: AuthenticityCheck,
    analysis: AnalysisResult
  ): Promise<void> {
    const alerts: Array<{
      type: 'sudden_spike' | 'score_drop' | 'flag_added' | 'risk_increase';
      severity: 'info' | 'warning' | 'critical';
      message: string;
    }> = [];

    // Check for score drop
    if (history.trend.direction === 'declining' && history.trend.scoreChange < -20) {
      alerts.push({
        type: 'score_drop',
        severity: 'warning',
        message: `Authenticity score dropped by ${Math.abs(history.trend.scoreChange)} points`,
      });
    }

    // Check for sudden spike in followers (potential fake followers)
    if (analysis.flags.includes('suspicious_growth')) {
      alerts.push({
        type: 'sudden_spike',
        severity: 'warning',
        message: 'Suspicious follower growth pattern detected',
      });
    }

    // Check for new flags
    if (analysis.flags.length > 0 && history.checks.length > 1) {
      const previousCheck = history.checks[history.checks.length - 2];
      const previousFlags = previousCheck?.keyFlags || [];

      const newFlags = analysis.flags.filter((f) => !previousFlags.includes(f));
      if (newFlags.length > 0) {
        alerts.push({
          type: 'flag_added',
          severity: newFlags.includes('purchased_followers') || newFlags.includes('bot_engagement')
            ? 'critical'
            : 'warning',
          message: `New authenticity flags detected: ${newFlags.join(', ')}`,
        });
      }
    }

    // Check for risk level increase
    if (history.checks.length >= 2) {
      const previousCheck = history.checks[history.checks.length - 2];
      if (
        previousCheck &&
        this.isRiskLevelHigher(check.riskLevel, previousCheck.riskLevel)
      ) {
        alerts.push({
          type: 'risk_increase',
          severity: 'critical',
          message: `Risk level increased from ${previousCheck.riskLevel} to ${check.riskLevel}`,
        });
      }
    }

    // Add alerts to history
    for (const alert of alerts) {
      await history.addAlert(alert);
    }
  }

  /**
   * Check if new risk level is higher than previous
   */
  private isRiskLevelHigher(
    newLevel: 'low' | 'medium' | 'high' | 'critical',
    oldLevel: 'low' | 'medium' | 'high' | 'critical'
  ): boolean {
    const order = { low: 1, medium: 2, high: 3, critical: 4 };
    return order[newLevel] > order[oldLevel];
  }

  /**
   * Get check history for an influencer
   */
  async getCheckHistory(influencerId: string): Promise<CheckHistory | null> {
    return CheckHistory.findOne({ influencerId }).populate('checks.checkId');
  }

  /**
   * Get authenticity trend for an influencer
   */
  async getTrend(influencerId: string): Promise<{
    trend: { scoreChange: number; direction: string; previousScore: number; currentScore: number };
    history: Array<{ date: Date; score: number; riskLevel: string }>;
  } | null> {
    const history = await CheckHistory.findOne({ influencerId });

    if (!history) {
      return null;
    }

    return {
      trend: history.trend,
      history: history.checks.map((c) => ({
        date: c.date,
        score: c.overallScore,
        riskLevel: c.riskLevel,
      })),
    };
  }
}

export const checkService = new CheckService();