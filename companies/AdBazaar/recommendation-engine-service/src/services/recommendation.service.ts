import { Recommendation, IRecommendation } from '../models/recommendation.model';
import { Feedback } from '../models/feedback.model';
import { History } from '../models/history.model';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import { recommendationsGenerated, recommendationClicks, recommendationConversions, modelLatency } from '../utils/metrics';

export interface RecommendationItem {
  itemId: string;
  itemType: string;
  score: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateRecommendationsInput {
  userId: string;
  type: 'product' | 'content' | 'ad' | 'personalized' | 'trending';
  limit?: number;
  context?: {
    page?: string;
    category?: string;
    searchQuery?: string;
    device?: string;
  };
  excludeItems?: string[];
}

export class RecommendationService {
  async generate(input: GenerateRecommendationsInput): Promise<IRecommendation> {
    const startTime = Date.now();
    const limit = input.limit || 10;

    // Get user history for personalization
    const userHistory = await History.findOne({ userId: input.userId });

    // Generate recommendations based on type
    let items: RecommendationItem[] = [];

    switch (input.type) {
      case 'personalized':
        items = await this.generatePersonalizedRecommendations(input, userHistory);
        break;
      case 'trending':
        items = await this.generateTrendingRecommendations(input);
        break;
      case 'collaborative':
        items = await this.generateCollaborativeRecommendations(input);
        break;
      case 'content-based':
        items = await this.generateContentBasedRecommendations(input, userHistory);
        break;
      default:
        items = await this.generatePopularityRecommendations(input);
    }

    // Apply exclusions
    if (input.excludeItems?.length) {
      items = items.filter(item => !input.excludeItems!.includes(item.itemId));
    }

    // Limit results
    items = items.slice(0, limit);

    const recommendation = new Recommendation({
      recommendationId: `rec-${uuidv4().slice(0, 8)}`,
      userId: input.userId,
      type: input.type,
      source: this.determineSource(input.type, userHistory),
      items,
      context: input.context,
      expiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await recommendation.save();

    const duration = (Date.now() - startTime) / 1000;
    modelLatency.observe({ model: 'recommendation-engine' }, duration);
    recommendationsGenerated.inc({ type: input.type, source: recommendation.source });

    logger.info(`Generated ${items.length} recommendations for user ${input.userId}`);
    return recommendation;
  }

  private async generatePersonalizedRecommendations(input: GenerateRecommendationsInput, userHistory: IHistory | null): Promise<RecommendationItem[]> {
    // Hybrid approach: combine collaborative + content-based
    const collaborativeItems = await this.generateCollaborativeRecommendations(input);
    const contentItems = userHistory ? await this.generateContentBasedRecommendations(input, userHistory) : [];

    // Merge and score
    const scoreMap = new Map<string, { item: RecommendationItem; sources: number }>();

    for (const item of collaborativeItems) {
      scoreMap.set(item.itemId, { item, sources: 1 });
    }

    for (const item of contentItems) {
      const existing = scoreMap.get(item.itemId);
      if (existing) {
        existing.item.score = (existing.item.score + item.score) / 2;
        existing.sources++;
      } else {
        scoreMap.set(item.itemId, { item, sources: 1 });
      }
    }

    return Array.from(scoreMap.values())
      .filter(s => s.sources >= 1)
      .map(s => ({
        ...s.item,
        reason: `Matched from ${s.sources} recommendation sources`
      }))
      .sort((a, b) => b.score - a.score);
  }

  private async generateTrendingRecommendations(input: GenerateRecommendationsInput): Promise<RecommendationItem[]> {
    // Get popular items from feedback (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trendingItems = await Feedback.aggregate([
      { $match: { type: { $in: ['click', 'purchase'] }, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$itemId', score: { $sum: 1 }, clicks: { $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] } } } },
      { $sort: { score: -1 } },
      { $limit: input.limit || 10 }
    ]);

    return trendingItems.map((item, index) => ({
      itemId: item._id,
      itemType: 'product',
      score: 1 - (index * 0.05), // Decreasing scores
      reason: 'Trending based on recent activity'
    }));
  }

  private async generateCollaborativeRecommendations(input: GenerateRecommendationsInput): Promise<RecommendationItem[]> {
    // Find similar users based on history
    const userHistory = await History.findOne({ userId: input.userId });
    if (!userHistory?.interactions.length) {
      return this.generatePopularityRecommendations(input);
    }

    const userItems = new Set(userHistory.interactions.map(i => i.itemId));

    // Find users who liked similar items
    const similarUsers = await History.aggregate([
      { $match: { userId: { $ne: input.userId } } },
      {
        $addFields: {
          commonItems: {
            $size: {
              $setIntersection: [
                '$interactions.itemId',
                Array.from(userItems)
              ]
            }
          }
        }
      },
      { $match: { commonItems: { $gt: 0 } } },
      { $sort: { commonItems: -1 } },
      { $limit: 50 }
    ]);

    // Get items from similar users
    const itemScores = new Map<string, number>();
    for (const user of similarUsers) {
      const commonCount = user.commonItems;
      for (const interaction of user.interactions) {
        if (!userItems.has(interaction.itemId) && interaction.action !== 'dismiss') {
          const score = itemScores.get(interaction.itemId) || 0;
          itemScores.set(interaction.itemId, score + commonCount);
        }
      }
    }

    return Array.from(itemScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, input.limit || 10)
      .map(([itemId, score]) => ({
        itemId,
        itemType: 'product',
        score: Math.min(score / 10, 1), // Normalize
        reason: 'Based on similar user preferences'
      }));
  }

  private async generateContentBasedRecommendations(input: GenerateRecommendationsInput, userHistory: IHistory | null): Promise<RecommendationItem[]> {
    if (!userHistory?.preferences) {
      return [];
    }

    const { categories, brands } = userHistory.preferences;

    // Simple content-based filtering
    // In production, would use embeddings and cosine similarity
    const recommendations: RecommendationItem[] = [];

    if (categories?.length) {
      for (const category of categories.slice(0, 3)) {
        recommendations.push({
          itemId: `cat-${category}`,
          itemType: 'category',
          score: 0.8,
          reason: `Matches your interest in ${category}`
        });
      }
    }

    if (brands?.length) {
      for (const brand of brands.slice(0, 3)) {
        recommendations.push({
          itemId: `brand-${brand}`,
          itemType: 'brand',
          score: 0.7,
          reason: `You previously liked ${brand}`
        });
      }
    }

    return recommendations;
  }

  private async generatePopularityRecommendations(input: GenerateRecommendationsInput): Promise<RecommendationItem[]> {
    const popularItems = await Feedback.aggregate([
      { $match: { type: 'purchase' } },
      { $group: { _id: '$itemId', score: { $sum: 1 } } },
      { $sort: { score: -1 } },
      { $limit: input.limit || 10 }
    ]);

    return popularItems.map((item, index) => ({
      itemId: item._id,
      itemType: 'product',
      score: 1 - (index * 0.1),
      reason: 'Popular choice'
    }));
  }

  private determineSource(type: string, userHistory: IHistory | null): string {
    if (type === 'personalized' && userHistory) return 'hybrid';
    if (type === 'trending') return 'popularity';
    return type === 'collaborative' ? 'collaborative' : 'content-based';
  }

  async recordFeedback(
    recommendationId: string,
    userId: string,
    itemId: string,
    type: 'click' | 'view' | 'add_to_cart' | 'purchase' | 'dismiss' | 'rating',
    rating?: number
  ): Promise<IFeedback> {
    const feedback = new Feedback({
      feedbackId: `fb-${uuidv4().slice(0, 8)}`,
      recommendationId,
      userId,
      itemId,
      type,
      rating
    });

    await feedback.save();

    if (type === 'click') {
      recommendationClicks.inc();
    } else if (type === 'purchase') {
      recommendationConversions.inc();
    }

    // Update user history
    await this.updateUserHistory(userId, itemId, type);

    logger.info(`Recorded ${type} feedback for item ${itemId}`);
    return feedback;
  }

  private async updateUserHistory(userId: string, itemId: string, action: string): Promise<void> {
    await History.findOneAndUpdate(
      { userId },
      {
        $push: {
          interactions: {
            itemId,
            itemType: 'product',
            action,
            timestamp: new Date()
          }
        },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true }
    );
  }

  async getHistory(userId: string, limit = 50): Promise<{ interactions: unknown[]; preferences: unknown }> {
    const history = await History.findOne({ userId });

    return {
      interactions: history?.interactions.slice(-limit) || [],
      preferences: history?.preferences || {}
    };
  }

  async getRecommendationById(recommendationId: string): Promise<IRecommendation | null> {
    return Recommendation.findOne({ recommendationId });
  }
}

export const recommendationService = new RecommendationService();