import { ProbMatch, Fingerprint, MatchStats } from '../models';
import { logger } from '../utils/logger';
import { confidenceScore } from '../utils/metrics';

// Confidence score result
export interface ConfidenceResult {
  matchId: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  breakdown: {
    baseScore: number;
    featureBonus: number;
    temporalBonus: number;
    consistencyBonus: number;
  };
  factors: {
    featureCount: number;
    averageSimilarity: number;
    temporalConsistency: number;
    crossDeviceMatches: number;
  };
  recommendations: string[];
  processingTimeMs: number;
}

// Confidence threshold configuration
export interface ConfidenceThresholds {
  high: number;
  medium: number;
  low: number;
}

const defaultThresholds: ConfidenceThresholds = {
  high: 85,
  medium: 60,
  low: 40
};

export class ConfidenceService {
  // Calculate confidence score for a match
  async calculateConfidence(matchId: string, thresholds?: ConfidenceThresholds): Promise<ConfidenceResult | null> {
    const startTime = Date.now();
    const config = { ...defaultThresholds, ...thresholds };

    const match = await ProbMatch.findByMatchId(matchId);
    if (!match) {
      logger.warn('Match not found for confidence calculation', { matchId });
      return null;
    }

    // Base score from probability
    const baseScore = match.probability * 100;

    // Feature bonus - more features = higher confidence
    const featureCount = match.features.length;
    const featureBonus = Math.min(20, featureCount * 4);

    // Calculate average feature similarity
    const featureSimilarities = match.features
      .filter(f => f.similarity !== undefined)
      .map(f => f.similarity as number);

    const avgSimilarity = featureSimilarities.length > 0
      ? featureSimilarities.reduce((a, b) => a + b, 0) / featureSimilarities.length
      : 0;

    // Temporal bonus - consistency over time
    const timeDiff = match.lastSeen.getTime() - match.firstSeen.getTime();
    const days = timeDiff / (1000 * 60 * 60 * 24);
    const temporalBonus = Math.min(15, days * 0.5);

    // Consistency bonus - stable features
    const stableFeatures = match.features.filter(f => f.weight > 0.5).length;
    const consistencyBonus = Math.min(10, stableFeatures * 2);

    // Calculate final confidence
    let confidence = baseScore + featureBonus + temporalBonus + consistencyBonus;

    // Normalize to 0-100
    confidence = Math.min(100, Math.max(0, Math.round(confidence)));

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low';
    if (confidence >= config.high) {
      confidenceLevel = 'high';
    } else if (confidence >= config.medium) {
      confidenceLevel = 'medium';
    } else {
      confidenceLevel = 'low';
    }

    // Get additional factors
    const crossDeviceMatches = await this.getCrossDeviceMatchCount(match.deviceIds);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      confidence,
      featureCount,
      avgSimilarity,
      days,
      crossDeviceMatches
    });

    const processingTimeMs = Date.now() - startTime;

    // Update metrics
    confidenceScore.observe(confidence / 100);

    logger.info('Confidence calculated', {
      matchId,
      confidence,
      confidenceLevel,
      processingTimeMs
    });

    return {
      matchId,
      confidence,
      confidenceLevel,
      breakdown: {
        baseScore: Math.round(baseScore),
        featureBonus: Math.round(featureBonus),
        temporalBonus: Math.round(temporalBonus),
        consistencyBonus: Math.round(consistencyBonus)
      },
      factors: {
        featureCount,
        averageSimilarity: Math.round(avgSimilarity * 100) / 100,
        temporalConsistency: Math.round((days / 30) * 100) / 100, // Normalized to months
        crossDeviceMatches
      },
      recommendations,
      processingTimeMs
    };
  }

  // Get cross-device match count
  private async getCrossDeviceMatchCount(deviceIds: string[]): Promise<number> {
    if (deviceIds.length < 2) return 0;

    const matchCount = await ProbMatch.countDocuments({
      deviceIds: { $all: deviceIds },
      status: { $ne: 'rejected' }
    });

    return matchCount;
  }

  // Generate recommendations based on confidence factors
  private generateRecommendations(factors: {
    confidence: number;
    featureCount: number;
    avgSimilarity: number;
    days: number;
    crossDeviceMatches: number;
  }): string[] {
    const recommendations: string[] = [];

    if (factors.featureCount < 3) {
      recommendations.push('Collect more device features to improve confidence');
    }

    if (factors.avgSimilarity < 0.6) {
      recommendations.push('Feature similarity is low - verify device relationship');
    }

    if (factors.days < 7) {
      recommendations.push('Match is recent - monitor for temporal consistency');
    }

    if (factors.crossDeviceMatches === 0 && factors.confidence < 85) {
      recommendations.push('Consider additional verification methods');
    }

    if (factors.confidence >= 85) {
      recommendations.push('High confidence - match can be confirmed automatically');
    } else if (factors.confidence >= 60) {
      recommendations.push('Medium confidence - manual review recommended');
    } else {
      recommendations.push('Low confidence - requires additional verification');
    }

    return recommendations;
  }

  // Update match confidence
  async updateMatchConfidence(matchId: string, confidence: number): Promise<boolean> {
    const match = await ProbMatch.findByMatchId(matchId);
    if (!match) return false;

    match.confidence = confidence;
    match.lastSeen = new Date();
    await match.save();

    logger.info('Match confidence updated', { matchId, confidence });

    return true;
  }

  // Get confidence distribution
  async getConfidenceDistribution(): Promise<{
    high: number;
    medium: number;
    low: number;
    avgConfidence: number;
  }> {
    const distribution = await ProbMatch.aggregate([
      {
        $bucket: {
          groupBy: '$confidence',
          boundaries: [0, 40, 60, 85, 101],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const result = {
      high: 0,
      medium: 0,
      low: 0,
      avgConfidence: 0
    };

    for (const bucket of distribution) {
      if (bucket._id === 0) result.low = bucket.count;
      else if (bucket._id === 40) result.low += bucket.count;
      else if (bucket._id === 60) result.medium = bucket.count;
      else if (bucket._id === 85) result.high = bucket.count;
    }

    // Calculate average
    const avgResult = await ProbMatch.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    result.avgConfidence = Math.round(avgResult[0]?.avgConfidence || 0);

    return result;
  }

  // Recalculate all match confidences (batch operation)
  async recalculateAllConfidences(): Promise<{
    total: number;
    updated: number;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    let updated = 0;

    const matches = await ProbMatch.find({ status: 'pending' });

    for (const match of matches) {
      const result = await this.calculateConfidence(match.matchId);
      if (result) {
        match.confidence = result.confidence;
        await match.save();
        updated++;
      }
    }

    const processingTimeMs = Date.now() - startTime;

    logger.info('Batch confidence recalculation completed', {
      total: matches.length,
      updated,
      processingTimeMs
    });

    return {
      total: matches.length,
      updated,
      processingTimeMs
    };
  }

  // Get confidence statistics over time
  async getConfidenceTrend(days: number = 30): Promise<Array<{
    date: string;
    avgConfidence: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await MatchStats.getStatsRange(startDate, new Date());

    return stats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      avgConfidence: Math.round(stat.avgConfidence),
      highCount: stat.highConfidenceMatches,
      mediumCount: stat.mediumConfidenceMatches,
      lowCount: stat.lowConfidenceMatches
    }));
  }

  // Get confidence score for fingerprint
  async getFingerprintConfidence(fingerprintId: string): Promise<number | null> {
    const fingerprint = await Fingerprint.findByFingerprintId(fingerprintId);
    return fingerprint?.confidence || null;
  }
}

// Export singleton instance
export const confidenceService = new ConfidenceService();