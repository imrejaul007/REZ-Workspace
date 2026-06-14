import { v4 as uuidv4 } from 'uuid';
import { ProbMatch, IProbMatch, IMatchFeature, IModelConfig } from '../models';
import { logger } from '../utils/logger';
import {
  matchRequestsTotal,
  matchDuration,
  confidenceScore,
  probabilityDistribution,
  activeMatchesGauge
} from '../utils/metrics';

// Input for probabilistic matching
export interface MatchInput {
  deviceIds: string[];
  features: {
    ip?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    behavioral?: Record<string, unknown>;
    temporal?: {
      firstSeen?: Date;
      lastSeen?: Date;
      sessionTimes?: string[];
    };
    geographic?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  };
  sources?: string[];
  metadata?: Record<string, unknown>;
  modelConfig?: Partial<IModelConfig>;
}

// Output of probabilistic matching
export interface MatchResult {
  matchId: string;
  deviceIds: string[];
  probability: number;
  confidence: number;
  features: IMatchFeature[];
  status: 'pending' | 'confirmed' | 'rejected';
  firstSeen: Date;
  lastSeen: Date;
  processingTimeMs: number;
}

// Batch match result
export interface BatchMatchResult {
  total: number;
  successful: number;
  failed: number;
  results: MatchResult[];
  processingTimeMs: number;
}

// Default model configuration
const defaultModelConfig: IModelConfig = {
  algorithm: 'naive-bayes',
  thresholds: {
    highConfidence: 85,
    mediumConfidence: 60,
    lowConfidence: 40
  },
  weights: {
    ip: 0.15,
    userAgent: 0.15,
    deviceFingerprint: 0.25,
    behavioral: 0.20,
    temporal: 0.15,
    geographic: 0.10
  }
};

export class MatchingService {
  // Calculate probability based on features
  private calculateProbability(
    features: MatchInput['features'],
    weights: IModelConfig['weights']
  ): { probability: number; featureScores: IMatchFeature[] } {
    const featureScores: IMatchFeature[] = [];
    let totalWeight = 0;
    let weightedSum = 0;

    // IP matching score
    if (features.ip) {
      const ipScore = this.calculateIPSimilarity(features.ip);
      const weightedScore = ipScore * weights.ip;
      weightedSum += weightedScore;
      totalWeight += weights.ip;
      featureScores.push({
        name: 'ip',
        value: features.ip,
        weight: weights.ip,
        similarity: ipScore
      });
    }

    // User agent matching score
    if (features.userAgent) {
      const uaScore = this.calculateUserAgentSimilarity(features.userAgent);
      const weightedScore = uaScore * weights.userAgent;
      weightedSum += weightedScore;
      totalWeight += weights.userAgent;
      featureScores.push({
        name: 'userAgent',
        value: features.userAgent,
        weight: weights.userAgent,
        similarity: uaScore
      });
    }

    // Device fingerprint matching score
    if (features.deviceFingerprint) {
      const fpScore = this.calculateFingerprintSimilarity(features.deviceFingerprint);
      const weightedScore = fpScore * weights.deviceFingerprint;
      weightedSum += weightedScore;
      totalWeight += weights.deviceFingerprint;
      featureScores.push({
        name: 'deviceFingerprint',
        value: features.deviceFingerprint,
        weight: weights.deviceFingerprint,
        similarity: fpScore
      });
    }

    // Behavioral matching score
    if (features.behavioral) {
      const behaviorScore = this.calculateBehavioralSimilarity(features.behavioral);
      const weightedScore = behaviorScore * weights.behavioral;
      weightedSum += weightedScore;
      totalWeight += weights.behavioral;
      featureScores.push({
        name: 'behavioral',
        value: JSON.stringify(features.behavioral),
        weight: weights.behavioral,
        similarity: behaviorScore
      });
    }

    // Temporal matching score
    if (features.temporal) {
      const temporalScore = this.calculateTemporalSimilarity(features.temporal);
      const weightedScore = temporalScore * weights.temporal;
      weightedSum += weightedScore;
      totalWeight += weights.temporal;
      featureScores.push({
        name: 'temporal',
        value: JSON.stringify(features.temporal),
        weight: weights.temporal,
        similarity: temporalScore
      });
    }

    // Geographic matching score
    if (features.geographic) {
      const geoScore = this.calculateGeographicSimilarity(features.geographic);
      const weightedScore = geoScore * weights.geographic;
      weightedSum += weightedScore;
      totalWeight += weights.geographic;
      featureScores.push({
        name: 'geographic',
        value: JSON.stringify(features.geographic),
        weight: weights.geographic,
        similarity: geoScore
      });
    }

    // Normalize by total weight
    const probability = totalWeight > 0 ? weightedSum / totalWeight : 0;
    return { probability: Math.min(1, Math.max(0, probability)), featureScores };
  }

  // Calculate IP similarity (considering subnet masks)
  private calculateIPSimilarity(ip: string): number {
    if (!ip) return 0;

    // For single IP, simulate a match based on pattern
    // In production, this would compare with known device IPs
    const parts = ip.split('.');
    if (parts.length !== 4) return 0.5;

    // Simulate 70-90% match probability for same /24 subnet
    const subnetMatch = Math.random() * 0.2 + 0.7;
    return subnetMatch;
  }

  // Calculate user agent similarity
  private calculateUserAgentSimilarity(userAgent: string): number {
    if (!userAgent) return 0;

    // Check browser, OS, device type
    const hasChrome = userAgent.includes('Chrome');
    const hasFirefox = userAgent.includes('Firefox');
    const hasSafari = userAgent.includes('Safari');
    const hasMobile = /mobile|android|iphone/i.test(userAgent);

    // Simulate matching based on components
    // Higher score for consistent components
    let score = 0.5;
    if (hasChrome || hasFirefox || hasSafari) score += 0.2;
    if (hasMobile) score += 0.1;

    return Math.min(1, Math.max(0, score));
  }

  // Calculate fingerprint similarity using hashing
  private calculateFingerprintSimilarity(fingerprint: string): number {
    if (!fingerprint) return 0;

    // In production, this would use proper fingerprint comparison
    // For simulation, use hash-based matching
    const hashValue = this.simpleHash(fingerprint);
    const normalizedHash = hashValue / Number.MAX_SAFE_INTEGER;

    // Simulate high confidence for fingerprints
    return 0.7 + (normalizedHash * 0.3);
  }

  // Calculate behavioral similarity
  private calculateBehavioralSimilarity(behavioral: Record<string, unknown>): number {
    if (!behavioral || Object.keys(behavioral).length === 0) return 0;

    // Check for common behavioral patterns
    let score = 0.5;

    if (behavioral.pageViews) score += 0.1;
    if (behavioral.sessionDuration) score += 0.1;
    if (behavioral.clicks) score += 0.1;
    if (behavioral.conversions) score += 0.1;

    return Math.min(1, score);
  }

  // Calculate temporal similarity
  private calculateTemporalSimilarity(temporal: {
    firstSeen?: Date;
    lastSeen?: Date;
    sessionTimes?: string[];
  }): number {
    if (!temporal) return 0;

    let score = 0.5;

    // Timezone consistency
    if (temporal.firstSeen && temporal.lastSeen) {
      const timeDiff = temporal.lastSeen.getTime() - temporal.firstSeen.getTime();
      const days = timeDiff / (1000 * 60 * 60 * 24);

      // Higher score for consistent usage over time
      if (days > 30) score += 0.2;
      else if (days > 7) score += 0.1;
    }

    // Session time patterns
    if (temporal.sessionTimes && temporal.sessionTimes.length > 0) {
      score += 0.15;
    }

    return Math.min(1, score);
  }

  // Calculate geographic similarity
  private calculateGeographicSimilarity(geo: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  }): number {
    if (!geo || Object.keys(geo).length === 0) return 0;

    let score = 0.5;

    if (geo.country) score += 0.2;
    if (geo.region) score += 0.1;
    if (geo.city) score += 0.1;
    if (geo.timezone) score += 0.1;

    return Math.min(1, score);
  }

  // Simple hash function
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Calculate confidence score based on probability and feature completeness
  private calculateConfidence(probability: number, featureCount: number, thresholds: IModelConfig['thresholds']): number {
    // Base confidence from probability
    let confidence = probability * 100;

    // Bonus for more features (more evidence)
    const featureBonus = Math.min(15, featureCount * 3);
    confidence += featureBonus;

    // Apply thresholds for classification
    if (confidence >= thresholds.highConfidence) {
      confidence = Math.min(100, confidence);
    } else if (confidence >= thresholds.mediumConfidence) {
      // Already in range
    } else if (confidence >= thresholds.lowConfidence) {
      confidence = Math.max(40, confidence);
    } else {
      confidence = Math.max(10, confidence);
    }

    return Math.round(confidence);
  }

  // Main probabilistic matching method
  async performMatch(input: MatchInput): Promise<MatchResult> {
    const startTime = Date.now();

    try {
      const modelConfig = { ...defaultModelConfig, ...input.modelConfig };
      const { probability, featureScores } = this.calculateProbability(input.features, modelConfig.weights);
      const confidence = this.calculateConfidence(probability, featureScores.length, modelConfig.thresholds);

      // Create match record
      const matchId = `match_${uuidv4()}`;
      const now = new Date();

      const probMatch = new ProbMatch({
        matchId,
        deviceIds: input.deviceIds,
        probability,
        confidence,
        features: featureScores,
        model: modelConfig,
        status: confidence >= modelConfig.thresholds.highConfidence ? 'confirmed' : 'pending',
        sources: input.sources || ['probabilistic-matching'],
        firstSeen: now,
        lastSeen: now,
        metadata: {
          timestamp: now,
          ...input.metadata
        }
      });

      await probMatch.save();

      // Update metrics
      matchRequestsTotal.inc({ type: 'single', status: 'success' });
      matchDuration.observe({ type: 'single' }, (Date.now() - startTime) / 1000);
      confidenceScore.observe(confidence / 100);
      probabilityDistribution.observe(probability);

      const processingTimeMs = Date.now() - startTime;

      logger.info('Match performed successfully', {
        matchId,
        probability,
        confidence,
        processingTimeMs
      });

      return {
        matchId,
        deviceIds: input.deviceIds,
        probability,
        confidence,
        features: featureScores,
        status: probMatch.status,
        firstSeen: now,
        lastSeen: now,
        processingTimeMs
      };
    } catch (error) {
      matchRequestsTotal.inc({ type: 'single', status: 'error' });
      logger.error('Match failed', { error, input });
      throw error;
    }
  }

  // Batch matching
  async performBatchMatch(inputs: MatchInput[]): Promise<BatchMatchResult> {
    const startTime = Date.now();
    const results: MatchResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const input of inputs) {
      try {
        const result = await this.performMatch(input);
        results.push(result);
        successful++;
      } catch (error) {
        failed++;
        logger.error('Batch match item failed', { error, input });
      }
    }

    const processingTimeMs = Date.now() - startTime;

    // Update metrics
    batchMatchRequestsTotal.inc({
      batch_size: inputs.length.toString(),
      status: failed === 0 ? 'success' : 'partial'
    });

    logger.info('Batch match completed', {
      total: inputs.length,
      successful,
      failed,
      processingTimeMs
    });

    return {
      total: inputs.length,
      successful,
      failed,
      results,
      processingTimeMs
    };
  }

  // Get match by ID
  async getMatch(matchId: string): Promise<IProbMatch | null> {
    return ProbMatch.findByMatchId(matchId);
  }

  // Find matches for device ID
  async findMatchesForDevice(deviceId: string): Promise<IProbMatch[]> {
    return ProbMatch.find({ deviceIds: deviceId, status: { $ne: 'merged' } })
      .sort({ probability: -1, confidence: -1 });
  }

  // Confirm a match
  async confirmMatch(matchId: string): Promise<IProbMatch | null> {
    const match = await ProbMatch.findByMatchId(matchId);
    if (!match) return null;

    match.status = 'confirmed';
    match.lastSeen = new Date();
    await match.save();

    // Update metrics
    confirmedMatchesGauge.inc();

    return match;
  }

  // Reject a match
  async rejectMatch(matchId: string): Promise<IProbMatch | null> {
    const match = await ProbMatch.findByMatchId(matchId);
    if (!match) return null;

    match.status = 'rejected';
    match.lastSeen = new Date();
    await match.save();

    return match;
  }

  // Get match statistics
  async getMatchStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    rejected: number;
    avgProbability: number;
    avgConfidence: number;
  }> {
    const stats = await ProbMatch.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProbability: { $avg: '$probability' },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    const result = {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      avgProbability: 0,
      avgConfidence: 0
    };

    let totalProb = 0;
    let totalConf = 0;

    for (const stat of stats) {
      result.total += stat.count;
      totalProb += (stat.avgProbability || 0) * stat.count;
      totalConf += (stat.avgConfidence || 0) * stat.count;

      switch (stat._id) {
        case 'pending':
          result.pending = stat.count;
          break;
        case 'confirmed':
          result.confirmed = stat.count;
          break;
        case 'rejected':
          result.rejected = stat.count;
          break;
      }
    }

    if (result.total > 0) {
      result.avgProbability = totalProb / result.total;
      result.avgConfidence = totalConf / result.total;
    }

    // Update active matches gauge
    activeMatchesGauge.set(result.total);

    return result;
  }
}

// Export singleton instance
export const matchingService = new MatchingService();