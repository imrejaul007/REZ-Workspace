import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { UserTwin, UserTwinDocument } from '../models';
import {
  IUserTwin,
  CreateTwinRequest,
  UpdateTwinRequest,
  PredictionResponse,
  AffinityResponse,
  RefreshResponse,
} from '../types';
import config from '../config';

export class TwinService {
  private redis: Redis;
  private cachePrefix = 'twin:';
  private cacheTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
    });
  }

  /**
   * Create a new user twin
   */
  async createTwin(request: CreateTwinRequest): Promise<UserTwinDocument> {
    const twinId = uuidv4();

    // Initialize behavioral data
    const behavioral = {
      interests: [],
      purchaseHistory: [],
      browsingPatterns: { patterns: [], frequency: 0.5 },
      engagementScore: 0.5,
      lastActive: new Date(),
    };

    // Initialize predictive data
    const predictive = {
      churnRisk: 0.5,
      lifetimeValue: 0,
      nextPurchaseLikely: new Date(),
      preferredChannels: ['email', 'push'],
      optimalContactTime: '10:00',
    };

    // Initialize advertising data
    const advertising = {
      adResponsiveness: 0.5,
      clickThroughHistory: 0,
      conversionRate: 0,
      preferredAdFormats: ['banner', 'video'],
      brandAffinities: {},
    };

    const twin = new UserTwin({
      userId: request.userId,
      twinId,
      profile: request.profile,
      behavioral,
      predictive,
      advertising,
      status: 'active',
    });

    await twin.save();
    await this.cacheTwin(twinId, twin);

    return twin;
  }

  /**
   * Get user twin by userId
   */
  async getTwinByUserId(userId: string): Promise<UserTwinDocument | null> {
    // Check cache first
    const cached = await this.getCachedTwin(userId);
    if (cached) return cached;

    const twin = await UserTwin.findOne({ userId, status: { $ne: 'archived' } });
    if (twin) {
      await this.cacheTwin(twin.twinId, twin);
    }

    return twin;
  }

  /**
   * Get twin by twinId
   */
  async getTwinById(twinId: string): Promise<UserTwinDocument | null> {
    const cached = await this.getCachedTwinByTwinId(twinId);
    if (cached) return cached;

    const twin = await UserTwin.findOne({ twinId });
    if (twin) {
      await this.cacheTwin(twinId, twin);
    }

    return twin;
  }

  /**
   * Update user twin
   */
  async updateTwin(userId: string, updates: UpdateTwinRequest): Promise<UserTwinDocument | null> {
    const twin = await UserTwin.findOne({ userId, status: { $ne: 'archived' } });
    if (!twin) return null;

    // Update profile if provided
    if (updates.profile) {
      twin.profile = { ...twin.profile, ...updates.profile };
    }

    // Update behavioral if provided
    if (updates.behavioral) {
      twin.behavioral = { ...twin.behavioral, ...updates.behavioral };
    }

    // Update advertising if provided
    if (updates.advertising) {
      twin.advertising = { ...twin.advertising, ...updates.advertising };
    }

    twin.behavioral.lastActive = new Date();
    await twin.save();
    await this.cacheTwin(twin.twinId, twin);
    await this.invalidateUserCache(userId);

    return twin;
  }

  /**
   * Predict behavior for user
   */
  async predictBehavior(userId: string, scenario?: string): Promise<PredictionResponse> {
    const twin = await this.getTwinByUserId(userId);
    if (!twin) {
      throw new Error('Twin not found');
    }

    // Calculate purchase probability based on engagement and history
    const purchaseProbability = this.calculatePurchaseProbability(twin);

    // Generate recommended actions based on twin data
    const recommendedActions = this.generateRecommendedActions(twin, scenario);

    // Determine optimal time based on historical engagement
    const optimalTime = twin.predictive.optimalContactTime || this.determineOptimalTime(twin);

    // Determine suggested channels based on preferences
    const suggestedChannels = twin.predictive.preferredChannels.length > 0
      ? twin.predictive.preferredChannels
      : this.suggestChannels(twin);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(twin);

    return {
      twinId: twin.twinId,
      predictions: {
        purchaseProbability,
        recommendedActions,
        optimalTime,
        suggestedChannels,
        confidence,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get brand affinities for user
   */
  async getAffinities(userId: string): Promise<AffinityResponse> {
    const twin = await this.getTwinByUserId(userId);
    if (!twin) {
      throw new Error('Twin not found');
    }

    // Get brand affinities from advertising data
    const brandAffinities: Record<string, number> = {};
    twin.advertising.brandAffinities.forEach((value, key) => {
      brandAffinities[key] = value;
    });

    // Calculate top categories from interests and purchase history
    const topCategories = this.calculateTopCategories(twin);

    return {
      twinId: twin.twinId,
      brandAffinities,
      topCategories,
      lastUpdated: twin.updatedAt,
    };
  }

  /**
   * Refresh twin data
   */
  async refreshTwin(userId: string): Promise<RefreshResponse> {
    const twin = await this.getTwinByUserId(userId);
    if (!twin) {
      throw new Error('Twin not found');
    }

    const updatedFields: string[] = [];

    // Recalculate engagement score based on activity
    const newEngagementScore = this.calculateEngagementScore(twin);
    if (Math.abs(newEngagementScore - twin.behavioral.engagementScore) > 0.01) {
      twin.behavioral.engagementScore = newEngagementScore;
      updatedFields.push('engagementScore');
    }

    // Recalculate churn risk
    const newChurnRisk = this.calculateChurnRisk(twin);
    if (Math.abs(newChurnRisk - twin.predictive.churnRisk) > 0.01) {
      twin.predictive.churnRisk = newChurnRisk;
      updatedFields.push('churnRisk');
    }

    // Recalculate ad responsiveness
    const newAdResponsiveness = this.calculateAdResponsiveness(twin);
    if (Math.abs(newAdResponsiveness - twin.advertising.adResponsiveness) > 0.01) {
      twin.advertising.adResponsiveness = newAdResponsiveness;
      updatedFields.push('adResponsiveness');
    }

    // Update optimal contact time
    const newOptimalTime = this.determineOptimalTime(twin);
    if (newOptimalTime !== twin.predictive.optimalContactTime) {
      twin.predictive.optimalContactTime = newOptimalTime;
      updatedFields.push('optimalContactTime');
    }

    // Update last active
    twin.behavioral.lastActive = new Date();

    await twin.save();
    await this.cacheTwin(twin.twinId, twin);

    return {
      twinId: twin.twinId,
      refreshTimestamp: new Date(),
      updatedFields,
      status: updatedFields.length > 0 ? 'success' : 'partial',
    };
  }

  /**
   * Calculate purchase probability based on twin data
   */
  private calculatePurchaseProbability(twin: UserTwinDocument): number {
    const engagementWeight = 0.4;
    const recencyWeight = 0.3;
    const historyWeight = 0.3;

    // Engagement score contribution
    const engagementScore = twin.behavioral.engagementScore;

    // Recency contribution (more recent = higher probability)
    const daysSinceActive = (Date.now() - twin.behavioral.lastActive.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceActive / 30));

    // Purchase history contribution
    const totalPurchases = twin.behavioral.purchaseHistory.reduce((sum, p) => sum + p.count, 0);
    const historyScore = Math.min(1, totalPurchases / 10);

    return Math.min(1, (engagementScore * engagementWeight) +
      (recencyScore * recencyWeight) +
      (historyScore * historyWeight));
  }

  /**
   * Generate recommended actions based on twin data
   */
  private generateRecommendedActions(twin: UserTwinDocument, scenario?: string): string[] {
    const actions: string[] = [];

    // High churn risk recommendations
    if (twin.predictive.churnRisk > 0.7) {
      actions.push('Send retention offer');
      actions.push('Increase engagement touchpoints');
    }

    // Low engagement recommendations
    if (twin.behavioral.engagementScore < 0.3) {
      actions.push('Re-engagement campaign');
      actions.push('Simplify user experience');
    }

    // High-value user recommendations
    if (twin.predictive.lifetimeValue > 10000) {
      actions.push('VIP treatment');
      actions.push('Premium offers');
    }

    // Ad responsiveness recommendations
    if (twin.advertising.adResponsiveness > 0.6) {
      actions.push('Increase ad frequency');
      actions.push('Test new ad formats');
    }

    // Scenario-specific actions
    if (scenario === 'purchase') {
      actions.push('Send product recommendations');
      actions.push('Offer limited-time discount');
    } else if (scenario === 'retention') {
      actions.push('Send loyalty reward');
      actions.push('Personal outreach');
    }

    return actions.slice(0, 5); // Limit to top 5 actions
  }

  /**
   * Determine optimal contact time
   */
  private determineOptimalTime(twin: UserTwinDocument): string {
    // Default times based on location
    const country = twin.profile.demographics.location.country.toLowerCase();

    if (country === 'india') {
      // Indian peak hours
      return twin.behavioral.engagementScore > 0.6 ? '19:00' : '12:00';
    }

    // Default international times
    return twin.behavioral.engagementScore > 0.6 ? '18:00' : '09:00';
  }

  /**
   * Suggest channels based on twin preferences
   */
  private suggestChannels(twin: UserTwinDocument): string[] {
    const channels: string[] = [];

    // Email is always a good channel
    if (twin.advertising.clickThroughHistory > 0.1) {
      channels.push('email');
    }

    // Push notifications for high engagement
    if (twin.behavioral.engagementScore > 0.5) {
      channels.push('push');
    }

    // SMS for high-value users
    if (twin.predictive.lifetimeValue > 5000) {
      channels.push('sms');
    }

    // Social for younger demographics
    if (twin.profile.demographics.age && twin.profile.demographics.age < 35) {
      channels.push('social');
    }

    // Default fallback
    if (channels.length === 0) {
      channels.push('email');
      channels.push('push');
    }

    return channels;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(twin: UserTwinDocument): number {
    const factors = [
      twin.behavioral.interests.length > 0 ? 0.25 : 0,
      twin.behavioral.purchaseHistory.length > 0 ? 0.25 : 0,
      twin.behavioral.engagementScore > 0 ? 0.2 : 0,
      twin.advertising.clickThroughHistory > 0 ? 0.15 : 0,
      twin.predictive.lifetimeValue > 0 ? 0.15 : 0,
    ];

    return factors.reduce((sum, f) => sum + f, 0);
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(twin: UserTwinDocument): number {
    const daysSinceActive = (Date.now() - twin.behavioral.lastActive.getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0, 1 - (daysSinceActive / 30));

    const frequencyFactor = twin.behavioral.browsingPatterns.frequency;
    const interactionFactor = twin.advertising.clickThroughHistory;

    return Math.min(1, (recencyFactor * 0.4) + (frequencyFactor * 0.3) + (interactionFactor * 0.3));
  }

  /**
   * Calculate churn risk
   */
  private calculateChurnRisk(twin: UserTwinDocument): number {
    const recencyFactor = Math.max(0, (30 - (Date.now() - twin.behavioral.lastActive.getTime()) / (1000 * 60 * 60 * 24))) / 30;
    const engagementFactor = 1 - twin.behavioral.engagementScore;
    const purchaseDeclineFactor = twin.behavioral.purchaseHistory.length > 0
      ? Math.max(0, 1 - (twin.behavioral.purchaseHistory[twin.behavioral.purchaseHistory.length - 1]?.count || 0) / 5)
      : 0.5;

    return Math.min(1, (recencyFactor * 0.4) + (engagementFactor * 0.35) + (purchaseDeclineFactor * 0.25));
  }

  /**
   * Calculate ad responsiveness
   */
  private calculateAdResponsiveness(twin: UserTwinDocument): number {
    const ctrWeight = 0.5;
    const conversionWeight = 0.3;
    const formatPreferenceWeight = 0.2;

    const ctrScore = twin.advertising.clickThroughHistory;
    const conversionScore = twin.advertising.conversionRate;
    const formatScore = twin.advertising.preferredAdFormats.length > 0 ? 0.5 : 0;

    return Math.min(1, (ctrScore * ctrWeight) + (conversionScore * conversionWeight) + (formatScore * formatPreferenceWeight));
  }

  /**
   * Calculate top categories from interests and purchase history
   */
  private calculateTopCategories(twin: UserTwinDocument): { category: string; affinity: number }[] {
    const categoryScores: Record<string, number> = {};

    // From interests
    twin.behavioral.interests.forEach(interest => {
      categoryScores[interest.category] = (categoryScores[interest.category] || 0) + interest.score * 0.6;
    });

    // From purchase history
    twin.behavioral.purchaseHistory.forEach(purchase => {
      categoryScores[purchase.category] = (categoryScores[purchase.category] || 0) + Math.min(1, purchase.count / 10) * 0.4;
    });

    // Sort and return top 10
    return Object.entries(categoryScores)
      .map(([category, score]) => ({ category, affinity: Math.min(1, score) }))
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 10);
  }

  /**
   * Cache twin data in Redis
   */
  private async cacheTwin(twinId: string, twin: UserTwinDocument): Promise<void> {
    try {
      await this.redis.setex(
        `${this.cachePrefix}${twinId}`,
        this.cacheTTL,
        JSON.stringify(twin.toObject())
      );
      await this.redis.setex(
        `${this.cachePrefix}user:${twin.userId}`,
        this.cacheTTL,
        twinId
      );
    } catch (error) {
      logger.error('Failed to cache twin:', error);
    }
  }

  /**
   * Get cached twin by userId
   */
  private async getCachedTwin(userId: string): Promise<UserTwinDocument | null> {
    try {
      const twinId = await this.redis.get(`${this.cachePrefix}user:${userId}`);
      if (twinId) {
        const cached = await this.redis.get(`${this.cachePrefix}${twinId}`);
        if (cached) {
          return JSON.parse(cached) as UserTwinDocument;
        }
      }
    } catch (error) {
      logger.error('Failed to get cached twin:', error);
    }
    return null;
  }

  /**
   * Get cached twin by twinId
   */
  private async getCachedTwinByTwinId(twinId: string): Promise<UserTwinDocument | null> {
    try {
      const cached = await this.redis.get(`${this.cachePrefix}${twinId}`);
      if (cached) {
        return JSON.parse(cached) as UserTwinDocument;
      }
    } catch (error) {
      logger.error('Failed to get cached twin:', error);
    }
    return null;
  }

  /**
   * Invalidate user cache
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      const twinId = await this.redis.get(`${this.cachePrefix}user:${userId}`);
      if (twinId) {
        await this.redis.del(`${this.cachePrefix}${twinId}`);
      }
      await this.redis.del(`${this.cachePrefix}user:${userId}`);
    } catch (error) {
      logger.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const twinService = new TwinService();
export default twinService;