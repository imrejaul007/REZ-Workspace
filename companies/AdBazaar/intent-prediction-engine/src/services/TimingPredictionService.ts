import { logger } from '../config/logger.js';
import { cacheGet, cacheSet } from '../config/redis.js';

interface TimingPrediction {
  userId: string;
  predictedOptimalTime: Date;
  confidence: number;
  factors: {
    historicalEngagement: number;
    categoryPatterns: number;
    recencyDecay: number;
    dayOfWeek: number;
    timeOfDay: number;
  };
  recommendedContactWindows: {
    start: string;
    end: string;
    score: number;
  }[];
}

interface UserEngagementHistory {
  userId: string;
  category: string;
  engagementTimes: {
    timestamp: Date;
    engagementScore: number;
  }[];
}

export class TimingPredictionService {
  /**
   * Predict optimal timing for user engagement
   */
  async predictOptimalTiming(
    userId: string,
    category: string,
    intentKey: string
  ): Promise<TimingPrediction> {
    const cacheKey = `timing:${userId}:${category}:${intentKey}`;

    try {
      // Check cache
      const cached = await cacheGet<TimingPrediction>(cacheKey);
      if (cached) {
        logger.debug('Cache hit for timing prediction', { userId, category });
        return cached;
      }

      // Get historical engagement data
      const history = await this.getEngagementHistory(userId, category);

      // Calculate timing factors
      const factors = this.calculateTimingFactors(history, category);

      // Predict optimal time
      const predictedOptimalTime = this.calculateOptimalTime(factors);

      // Generate contact windows
      const recommendedContactWindows = this.generateContactWindows(factors);

      const prediction: TimingPrediction = {
        userId,
        predictedOptimalTime,
        confidence: this.calculateConfidence(factors),
        factors,
        recommendedContactWindows,
      };

      // Cache for 1 hour
      await cacheSet(cacheKey, prediction, 3600);

      logger.info('Timing prediction generated', { userId, category, confidence: prediction.confidence });

      return prediction;
    } catch (error) {
      logger.error('Error predicting optimal timing', { userId, category, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get engagement history for a user/category
   */
  private async getEngagementHistory(userId: string, category: string): Promise<UserEngagementHistory> {
    // In production, query historical engagement data
    // For now, simulate historical data
    return {
      userId,
      category,
      engagementTimes: Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        engagementScore: 0.3 + Math.random() * 0.6,
      })),
    };
  }

  /**
   * Calculate timing factors from historical data
   */
  private calculateTimingFactors(
    history: UserEngagementHistory,
    category: string
  ): TimingPrediction['factors'] {
    // Analyze time patterns
    const dayScores: number[] = Array(7).fill(0);
    const hourScores: number[] = Array(24).fill(0);

    for (const engagement of history.engagementTimes) {
      const dayOfWeek = engagement.timestamp.getDay();
      const hour = engagement.timestamp.getHours();

      dayScores[dayOfWeek] += engagement.engagementScore;
      hourScores[hour] += engagement.engagementScore;
    }

    // Normalize scores
    const maxDayScore = Math.max(...dayScores, 1);
    const maxHourScore = Math.max(...hourScores, 1);

    // Calculate factors
    const historicalEngagement = this.calculateHistoricalEngagement(history.engagementTimes);
    const categoryPatterns = this.getCategoryPatternScore(category);
    const recencyDecay = this.calculateRecencyDecay(history.engagementTimes);

    return {
      historicalEngagement: Math.round(historicalEngagement * 1000) / 1000,
      categoryPatterns: Math.round(categoryPatterns * 1000) / 1000,
      recencyDecay: Math.round(recencyDecay * 1000) / 1000,
      dayOfWeek: Math.round((dayScores.indexOf(Math.max(...dayScores)) / 6) * 1000) / 1000,
      timeOfDay: Math.round((hourScores.indexOf(Math.max(...hourScores)) / 23) * 1000) / 1000,
    };
  }

  /**
   * Calculate historical engagement score
   */
  private calculateHistoricalEngagement(engagements: { timestamp: Date; engagementScore: number }[]): number {
    if (engagements.length === 0) return 0.5;

    const recentEngagements = engagements.slice(0, 7);
    const avgScore = recentEngagements.reduce((sum, e) => sum + e.engagementScore, 0) / recentEngagements.length;

    return Math.min(1, avgScore);
  }

  /**
   * Get category-specific pattern score
   */
  private getCategoryPatternScore(category: string): number {
    // Category-specific timing patterns
    const categoryPatterns: Record<string, { bestDay: number; bestHour: number; decay: number }> = {
      DINING: { bestDay: 5, bestHour: 18, decay: 0.8 }, // Friday evenings
      TRAVEL: { bestDay: 1, bestHour: 10, decay: 0.7 }, // Monday mornings
      RETAIL: { bestDay: 6, bestHour: 14, decay: 0.9 }, // Saturday afternoons
      HEALTHCARE: { bestDay: 3, bestHour: 9, decay: 0.95 }, // Wednesday mornings
      GENERAL: { bestDay: 4, bestHour: 12, decay: 0.75 }, // Thursday midday
    };

    const pattern = categoryPatterns[category] || categoryPatterns.GENERAL;
    return pattern.decay;
  }

  /**
   * Calculate recency decay factor
   */
  private calculateRecencyDecay(engagements: { timestamp: Date; engagementScore: number }[]): number {
    if (engagements.length === 0) return 0.3;

    const mostRecent = engagements[0];
    const hoursSinceLastEngagement = (Date.now() - mostRecent.timestamp.getTime()) / (1000 * 60 * 60);

    // Exponential decay
    const decayRate = 0.1;
    const decay = Math.exp(-decayRate * hoursSinceLastEngagement);

    return Math.min(1, Math.max(0.1, decay));
  }

  /**
   * Calculate optimal time based on factors
   */
  private calculateOptimalTime(factors: TimingPrediction['factors']): Date {
    const now = new Date();
    const predictedDay = Math.round(factors.dayOfWeek * 6);
    const predictedHour = Math.round(factors.timeOfDay * 23);

    // Create predicted time
    const optimalTime = new Date(now);
    optimalTime.setDate(now.getDate() + ((predictedDay - now.getDay() + 7) % 7));
    optimalTime.setHours(predictedHour, 0, 0, 0);

    return optimalTime;
  }

  /**
   * Generate recommended contact windows
   */
  private generateContactWindows(factors: TimingPrediction['factors']): TimingPrediction['recommendedContactWindows'] {
    const baseHour = Math.round(factors.timeOfDay * 23);
    const windows: TimingPrediction['recommendedContactWindows'] = [];

    // Primary window
    windows.push({
      start: `${String(baseHour).padStart(2, '0')}:00`,
      end: `${String(baseHour + 2).padStart(2, '0')}:00`,
      score: 0.9,
    });

    // Secondary window
    const secondaryHour = (baseHour + 4) % 24;
    windows.push({
      start: `${String(secondaryHour).padStart(2, '0')}:00`,
      end: `${String(secondaryHour + 2).padStart(2, '0')}:00`,
      score: 0.7,
    });

    // Tertiary window
    const tertiaryHour = (baseHour + 8) % 24;
    windows.push({
      start: `${String(tertiaryHour).padStart(2, '0')}:00`,
      end: `${String(tertiaryHour + 2).padStart(2, '0')}:00`,
      score: 0.5,
    });

    return windows;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(factors: TimingPrediction['factors']): number {
    // Weighted average of factors
    const weights = {
      historicalEngagement: 0.35,
      categoryPatterns: 0.25,
      recencyDecay: 0.2,
      dayOfWeek: 0.1,
      timeOfDay: 0.1,
    };

    const confidence =
      factors.historicalEngagement * weights.historicalEngagement +
      factors.categoryPatterns * weights.categoryPatterns +
      factors.recencyDecay * weights.recencyDecay +
      factors.dayOfWeek * weights.dayOfWeek +
      factors.timeOfDay * weights.timeOfDay;

    return Math.round(confidence * 1000) / 1000;
  }

  /**
   * Batch predict timing for multiple users
   */
  async batchPredictTiming(
    requests: { userId: string; category: string; intentKey: string }[]
  ): Promise<TimingPrediction[]> {
    logger.info('Batch timing prediction', { count: requests.length });

    const predictions = await Promise.all(
      requests.map((req) => this.predictOptimalTiming(req.userId, req.category, req.intentKey))
    );

    return predictions;
  }

  /**
   * Get next best contact time for a user
   */
  async getNextBestContactTime(
    userId: string,
    category: string
  ): Promise<{ time: Date; reason: string; priority: number }> {
    const prediction = await this.predictOptimalTiming(userId, category, 'general');

    const now = new Date();
    let nextTime = prediction.predictedOptimalTime;
    let reason = 'Optimal time based on historical engagement patterns';
    let priority = prediction.confidence;

    // If predicted time is in the past, find next occurrence
    if (nextTime <= now) {
      nextTime = new Date(nextTime);
      nextTime.setDate(nextTime.getDate() + 7);
      reason = 'Next weekly optimal window';
      priority *= 0.8;
    }

    return { time: nextTime, reason, priority };
  }
}

export const timingPredictionService = new TimingPredictionService();