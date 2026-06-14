import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';
import { LookalikeRequest, LookalikeResult } from '../types.js';
import { IntentSegment } from '../models/IntentSegment.js';

interface UserProfile {
  userId: string;
  demographics: {
    age?: number;
    location?: string;
    income?: string;
  };
  behaviors: {
    categories: string[];
    intents: string[];
    avgSessionDuration: number;
    purchaseFrequency: number;
  };
  affinities: Record<string, number>;
}

export class LookalikeGenerationService {
  private mlServiceUrl: string;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  }

  /**
   * Generate lookalike audience based on source segment
   */
  async generateLookalike(request: LookalikeRequest): Promise<LookalikeResult> {
    const { sourceSegmentId, targetSize, similarityThreshold } = request;

    try {
      logger.info('Generating lookalike audience', { sourceSegmentId, targetSize });

      // Get source segment
      const sourceSegment = await IntentSegment.findOne({ segmentId: sourceSegmentId });
      if (!sourceSegment) {
        throw new Error(`Source segment not found: ${sourceSegmentId}`);
      }

      // Extract source characteristics
      const sourceCharacteristics = await this.extractCharacteristics(sourceSegment);

      // Generate lookalike users
      const matchedUsers = await this.findLookalikeUsers(sourceCharacteristics, targetSize, similarityThreshold);

      // Calculate lookalike characteristics
      const lookalikeCharacteristics = this.calculateLookalikeCharacteristics(matchedUsers, sourceCharacteristics);

      const result: LookalikeResult = {
        lookalikeSegmentId: uuidv4(),
        sourceSegmentId,
        targetSize,
        matchedUsers,
        characteristics: lookalikeCharacteristics,
        timestamp: new Date(),
      };

      logger.info('Lookalike audience generated', {
        lookalikeSegmentId: result.lookalikeSegmentId,
        matchedUsers: matchedUsers.length,
        avgSimilarity: this.calculateAverageSimilarity(matchedUsers),
      });

      return result;
    } catch (error) {
      logger.error('Error generating lookalike audience', {
        sourceSegmentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Extract characteristics from source segment
   */
  private async extractCharacteristics(segment: {
    category: string;
    criteria: { minConfidence: number; maxDaysDormant?: number; geoFilters?: string[] };
    avgConfidence: number;
 }): Promise<{
    category: string;
    minConfidence: number;
    geoFilters: string[];
    avgConfidence: number;
  }> {
    return {
      category: segment.category,
      minConfidence: segment.criteria.minConfidence,
      geoFilters: segment.criteria.geoFilters || [],
      avgConfidence: segment.avgConfidence,
    };
  }

  /**
   * Find lookalike users based on source characteristics
   */
  private async findLookalikeUsers(
    sourceCharacteristics: {
      category: string;
      minConfidence: number;
      geoFilters: string[];
      avgConfidence: number;
    },
    targetSize: number,
    similarityThreshold: number
  ): Promise<{ userId: string; similarityScore: number }[]> {
    // In production, this would:
    // 1. Query user data store for potential lookalikes
    // 2. Use ML model to calculate similarity scores
    // 3. Filter by similarity threshold
    // 4. Return top N users

    // Simulate lookalike generation
    const matchedUsers: { userId: string; similarityScore: number }[] = [];

    // Simulate finding users
    for (let i = 0; i < Math.min(targetSize, 100); i++) {
      const similarityScore = Math.random() * (1 - similarityThreshold) + similarityThreshold;

      if (similarityScore >= similarityThreshold) {
        matchedUsers.push({
          userId: `lookalike_user_${uuidv4().slice(0, 8)}`,
          similarityScore: Math.round(similarityScore * 1000) / 1000,
        });
      }
    }

    // Sort by similarity score
    matchedUsers.sort((a, b) => b.similarityScore - a.similarityScore);

    return matchedUsers.slice(0, targetSize);
  }

  /**
   * Calculate lookalike characteristics based on matched users
   */
  private calculateLookalikeCharacteristics(
    matchedUsers: { userId: string; similarityScore: number }[],
    sourceCharacteristics: {
      category: string;
      minConfidence: number;
      geoFilters: string[];
      avgConfidence: number;
    }
  ): LookalikeResult['characteristics'] {
    // In production, analyze matched user profiles
    // For now, derive from source characteristics

    return {
      avgAge: 30 + Math.floor(Math.random() * 20), // Simulated
      topCategories: [sourceCharacteristics.category],
      commonIntents: this.getCommonIntents(sourceCharacteristics.category),
    };
  }

  /**
   * Get common intents for a category
   */
  private getCommonIntents(category: string): string[] {
    const categoryIntents: Record<string, string[]> = {
      DINING: ['restaurant_search', 'food_delivery', 'table_reservation', 'menu_browse'],
      TRAVEL: ['flight_search', 'hotel_search', 'package_booking', 'destination_research'],
      RETAIL: ['product_search', 'price_comparison', 'review_read', 'wishlist_add'],
      HEALTHCARE: ['doctor_search', 'appointment_booking', 'medicine_search', 'lab_booking'],
      GENERAL: ['search', 'browse', 'compare', 'inquiry'],
    };

    return categoryIntents[category] || categoryIntents.GENERAL;
  }

  /**
   * Calculate average similarity score
   */
  private calculateAverageSimilarity(users: { userId: string; similarityScore: number }[]): number {
    if (users.length === 0) return 0;
    const sum = users.reduce((acc, user) => acc + user.similarityScore, 0);
    return Math.round((sum / users.length) * 1000) / 1000;
  }

  /**
   * Expand lookalike audience with similar users
   */
  async expandLookalike(
    lookalikeSegmentId: string,
    expansionFactor: number = 1.5
  ): Promise<{ userId: string; similarityScore: number }[]> {
    try {
      logger.info('Expanding lookalike audience', { lookalikeSegmentId, expansionFactor });

      // In production, find additional users similar to current lookalikes
      // For now, simulate expansion
      const currentSize = Math.floor(Math.random() * 100);
      const newSize = Math.floor(currentSize * expansionFactor);

      const expandedUsers: { userId: string; similarityScore: number }[] = [];
      for (let i = 0; i < newSize; i++) {
        expandedUsers.push({
          userId: `expanded_user_${uuidv4().slice(0, 8)}`,
          similarityScore: Math.round((0.6 + Math.random() * 0.3) * 1000) / 1000,
        });
      }

      return expandedUsers.sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (error) {
      logger.error('Error expanding lookalike audience', {
        lookalikeSegmentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Validate lookalike audience quality
   */
  async validateLookalikeQuality(
    lookalikeUsers: { userId: string; similarityScore: number }[]
  ): Promise<{
    isValid: boolean;
    qualityScore: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check minimum size
    if (lookalikeUsers.length < 10) {
      issues.push('Insufficient lookalike users');
 recommendations.push('Consider expanding the lookalike pool');
    }

    // Check similarity distribution
    const avgSimilarity = this.calculateAverageSimilarity(lookalikeUsers);
    if (avgSimilarity < 0.6) {
      issues.push('Low average similarity score');
      recommendations.push('Increase similarity threshold for better quality');
    }

    // Check variance
    const variance = this.calculateVariance(lookalikeUsers);
    if (variance > 0.1) {
      issues.push('High variance in similarity scores');
      recommendations.push('Consider removing outliers');
    }

    const qualityScore = Math.round((avgSimilarity * 0.7 + (1 - variance) * 0.3) * 10);

    return {
      isValid: issues.length === 0,
      qualityScore,
      issues,
      recommendations,
    };
  }

  /**
   * Calculate variance in similarity scores
   */
  private calculateVariance(users: { userId: string; similarityScore: number }[]): number {
    if (users.length === 0) return 0;

    const mean = this.calculateAverageSimilarity(users);
    const squaredDiffs = users.map((u) => Math.pow(u.similarityScore - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / users.length;

    return avgSquaredDiff;
  }
}

export const lookalikeGenerationService = new LookalikeGenerationService();