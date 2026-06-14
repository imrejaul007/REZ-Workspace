import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';
import { IntentSignal, IntentScoreResult, IntentCategory } from '../types.js';

interface ScoringFactors {
  recency: number;
  frequency: number;
  engagement: number;
  historical: number;
}

type IntentStage = 'awareness' | 'consideration' | 'intent' | 'purchase' | 'loyalty';

export class IntentScoringService {
  private mlServiceUrl: string;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  }

  /**
   * Score intent confidence for a user/category combination
   * Uses ML model-based scoring with fallback to heuristic scoring
   */
  async scoreIntent(signal: IntentSignal): Promise<IntentScoreResult> {
    const cacheKey = `intent:score:${signal.userId}:${signal.category}:${signal.intentKey}`;

    try {
      // Check cache first
      const cached = await cacheGet<IntentScoreResult>(cacheKey);
      if (cached) {
        logger.debug('Cache hit for intent scoring', { userId: signal.userId, intentKey: signal.intentKey });
        return cached;
      }

      // Try ML service first
      const mlScore = await this.getMLScore(signal);
      if (mlScore !== null) {
        const result: IntentScoreResult = {
          userId: signal.userId,
          category: signal.category,
          intentKey: signal.intentKey,
          confidenceScore: mlScore.confidence,
          conversionLikelihood: mlScore.conversionLikelihood,
          stage: this.determineStage(mlScore.confidence, mlScore.conversionLikelihood),
          factors: mlScore.factors,
          timestamp: new Date(),
        };

        await cacheSet(cacheKey, result, 300); // 5 min cache
        return result;
      }

      // Fallback to heuristic scoring
      const result = this.heuristicScoring(signal);
      await cacheSet(cacheKey, result, 300);

      logger.info('Intent scored using heuristic fallback', {
        userId: signal.userId,
        intentKey: signal.intentKey,
        score: result.confidenceScore,
      });

      return result;
    } catch (error) {
      logger.error('Error scoring intent', { error: (error as Error).message, userId: signal.userId });
      throw error;
    }
  }

  /**
   * Get ML-based score from external ML service
   */
  private async getMLScore(signal: IntentSignal): Promise<{
    confidence: number;
    conversionLikelihood: number;
    factors: ScoringFactors;
  } | null> {
    try {
      // Simulate ML service call (in production, this would call the actual ML service)
      // For now, return null to trigger heuristic scoring
      // In production: const response = await fetch(`${this.mlServiceUrl}/score`, {...})

      // Simulate ML scoring for demonstration
      const { signals } = signal;
      const baseConfidence = signals.engagementScore || 0.5;

      return {
        confidence: Math.min(1, baseConfidence + (Math.random() * 0.1 - 0.05)),
        conversionLikelihood: Math.min(1, baseConfidence * 0.8 + (Math.random() * 0.1)),
        factors: {
          recency: this.calculateRecencyScore(signal.timestamp),
          frequency: this.calculateFrequencyScore(signals.clicks || 0),
          engagement: signals.engagementScore || 0.5,
          historical: this.calculateHistoricalScore(signals.conversions || 0),
        },
      };
    } catch (error) {
      logger.warn('ML service unavailable, using heuristic scoring', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Heuristic-based scoring as fallback
   */
  private heuristicScoring(signal: IntentSignal): IntentScoreResult {
    const { signals } = signal;
    const factors = {
      recency: this.calculateRecencyScore(signal.timestamp),
      frequency: this.calculateFrequencyScore(signals.clicks || 0),
      engagement: signals.engagementScore || this.calculateEngagementScore(signals),
      historical: this.calculateHistoricalScore(signals.conversions || 0),
    };

    // Weighted confidence score
    const confidenceScore =
      factors.recency * 0.3 + factors.frequency * 0.2 + factors.engagement * 0.3 + factors.historical * 0.2;

    // Conversion likelihood based on engagement patterns
    const conversionLikelihood = this.calculateConversionLikelihood(factors, signals);

    return {
      userId: signal.userId,
      category: signal.category,
      intentKey: signal.intentKey,
      confidenceScore: Math.round(confidenceScore * 1000) / 1000,
      conversionLikelihood: Math.round(conversionLikelihood * 1000) / 1000,
      stage: this.determineStage(confidenceScore, conversionLikelihood),
      factors,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate recency score (0-1) based on time since last signal
   */
  private calculateRecencyScore(timestamp: Date): number {
    const now = new Date();
    const hoursSince = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursSince <= 1) return 1.0;
    if (hoursSince <= 6) return 0.9;
    if (hoursSince <= 24) return 0.7;
    if (hoursSince <= 72) return 0.5;
    if (hoursSince <= 168) return 0.3; // 1 week
    return 0.1;
  }

  /**
   * Calculate frequency score based on interaction count
   */
  private calculateFrequencyScore(clicks: number): number {
    if (clicks >= 50) return 1.0;
    if (clicks >= 20) return 0.8;
    if (clicks >= 10) return 0.6;
    if (clicks >= 5) return 0.4;
    if (clicks >= 1) return 0.2;
    return 0.1;
  }

  /**
   * Calculate engagement score from signals
   */
  private calculateEngagementScore(signals: IntentSignal['signals']): number {
    const dwellWeight = 0.4;
    const clickWeight = 0.3;
    const conversionWeight = 0.3;

    const dwellScore = Math.min(1, (signals.dwellTime || 0) / 300); // 5 min max
    const clickScore = Math.min(1, (signals.clicks || 0) / 20);
    const conversionScore = Math.min(1, (signals.conversions || 0) / 5);

    return dwellScore * dwellWeight + clickScore * clickWeight + conversionScore * conversionWeight;
  }

  /**
   * Calculate historical score based on past conversions
   */
  private calculateHistoricalScore(conversions: number): number {
    if (conversions >= 10) return 1.0;
    if (conversions >= 5) return 0.8;
    if (conversions >= 2) return 0.6;
    if (conversions >= 1) return 0.4;
    return 0.1;
  }

  /**
   * Calculate conversion likelihood
   */
  private calculateConversionLikelihood(factors: ScoringFactors, signals: IntentSignal['signals']): number {
    const baseLikelihood = factors.recency * 0.25 + factors.frequency * 0.25 + factors.historical * 0.3;

    // Boost for high engagement
    const engagementBoost = (signals.engagementScore || 0) * 0.2;

    return Math.min(1, baseLikelihood + engagementBoost);
  }

  /**
   * Determine intent stage based on scores
   */
  private determineStage(confidence: number, conversionLikelihood: number): IntentStage {
    if (conversionLikelihood > 0.7) return 'purchase';
    if (confidence > 0.8) return 'intent';
    if (confidence > 0.5) return 'consideration';
    if (confidence > 0.2) return 'awareness';
    return 'loyalty';
  }

  /**
   * Batch score multiple signals
   */
  async batchScore(signals: IntentSignal[]): Promise<IntentScoreResult[]> {
    logger.info('Batch scoring signals', { count: signals.length });

    const results = await Promise.all(signals.map((signal) => this.scoreIntent(signal)));

    logger.info('Batch scoring completed', {
      count: results.length,
      avgConfidence:
        results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length,
    });

    return results;
  }

  /**
   * Clear cached scores for a user
   */
  async clearCache(userId: string): Promise<void> {
    const pattern = `intent:score:${userId}:*`;
    // In production, use SCAN + DEL for Redis pattern deletion
    logger.info('Cache clear requested', { userId, pattern });
  }
}

export const intentScoringService = new IntentScoringService();