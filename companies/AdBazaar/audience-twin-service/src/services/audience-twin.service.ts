import { v4 as uuidv4 } from 'uuid';
import { AudienceTwinModel, AudienceTwinDocument } from '../models';
import { hojaiTwinService } from './hojai-twin.service';
import {
  AudienceTwin,
  CreateAudienceTwinRequest,
  PredictBehaviorRequest,
  PredictionResult,
  SegmentAssignment,
  ChannelPreference,
} from '../types';
import logger from '../config/logger';
import config from '../config';

class AudienceTwinService {
  async createAudienceTwin(
    request: CreateAudienceTwinRequest,
    ownerId: string
  ): Promise<AudienceTwin> {
    logger.info(`Creating audience twin: ${request.name}`);

    // Search for matching users in HOJAI twin platform
    const users = await hojaiTwinService.searchUsersByCriteria(request.criteria);

    if (users.length === 0) {
      logger.warn('No users found matching criteria');
    }

    // Get audience insights from HOJAI
    const insights = users.length > 0
      ? await hojaiTwinService.getAudienceInsights(users.map((u) => u.userId))
      : null;

    // Calculate advertising-specific attributes
    const attributes = this.calculateAttributes(users, insights);

    // Build behavioral model
    const behavioralModel = this.buildBehavioralModel(users);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(users, attributes, behavioralModel);

    // Create and save the audience twin
    const audienceTwin = new AudienceTwinModel({
      twinId: uuidv4(),
      name: request.name,
      description: request.description,
      category: request.category,
      size: users.length,
      memberUserIds: users.map((u) => u.userId),
      attributes,
      behavioralModel,
      qualityScore,
      ownerId,
      criteria: request.criteria,
    });

    await audienceTwin.save();
    logger.info(`Created audience twin ${audienceTwin.twinId} with ${users.length} members`);

    return audienceTwin.toAudienceTwin();
  }

  async getAudienceTwin(twinId: string, ownerId: string): Promise<AudienceTwin | null> {
    const twin = await AudienceTwinModel.findOne({ twinId, ownerId });
    if (!twin) {
      return null;
    }
    return twin.toAudienceTwin();
  }

  async getAudienceTwinById(twinId: string): Promise<AudienceTwin | null> {
    const twin = await AudienceTwinModel.findOne({ twinId });
    if (!twin) {
      return null;
    }
    return twin.toAudienceTwin();
  }

  async listAudienceTwins(
    ownerId: string,
    options: { page?: number; limit?: number; category?: string } = {}
  ): Promise<{ twins: AudienceTwin[]; total: number }> {
    const { page = 1, limit = 20, category } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { ownerId };
    if (category) {
      query.category = category;
    }

    const [twins, total] = await Promise.all([
      AudienceTwinModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AudienceTwinModel.countDocuments(query),
    ]);

    return {
      twins: twins.map((t) => ({
        twinId: t.twinId,
        name: t.name,
        description: t.description,
        category: t.category,
        size: t.size,
        memberUserIds: t.memberUserIds,
        attributes: {
          ...t.attributes,
          brandAffinities: t.attributes.brandAffinities instanceof Map
            ? Object.fromEntries(t.attributes.brandAffinities)
            : t.attributes.brandAffinities || {},
        },
        behavioralModel: t.behavioralModel,
        qualityScore: t.qualityScore,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total,
    };
  }

  async predictBehavior(
    twinId: string,
    request: PredictBehaviorRequest
  ): Promise<PredictionResult> {
    const twin = await AudienceTwinModel.findOne({ twinId });
    if (!twin) {
      throw new Error('Audience twin not found');
    }

    const { action } = request;

    // Calculate base probability based on attributes
    let probability = twin.attributes.intentLikelihood;

    // Adjust based on behavioral model
    if (action === 'purchase') {
      probability *= (1 - twin.behavioralModel.churnRisk);
      probability *= Math.min(twin.behavioralModel.avgPurchaseFrequency / 10, 1);
    } else if (action === 'churn') {
      probability = twin.behavioralModel.churnRisk;
    } else if (action === 'engage') {
      probability = Math.min(twin.behavioralModel.avgSessionDuration / 600, 1);
    } else if (action === 'click') {
      probability = Math.max(0.3, probability * 1.5);
    } else if (action === 'convert') {
      probability = probability * (1 - twin.behavioralModel.churnRisk);
    }

    // Context adjustments
    if (request.context?.campaignId) {
      probability *= 1.1; // Campaign boost
    }
    if (request.context?.offerType === 'discount') {
      probability *= 1.2; // Discount incentive
    }

    probability = Math.min(Math.max(probability, 0), 1);

    // Calculate confidence based on data quality
    const confidence = twin.qualityScore / 10;

    // Identify key factors
    const factors = this.identifyFactors(twin, action);

    // Recommend channel and timing
    const recommendedChannel = twin.attributes.channelPreference;
    const recommendedTiming = twin.attributes.timingPreference;

    return {
      action,
      probability,
      confidence,
      factors,
      recommendedChannel,
      recommendedTiming,
    };
  }

  async getSegments(twinId: string): Promise<SegmentAssignment[]> {
    const twin = await AudienceTwinModel.findOne({ twinId });
    if (!twin) {
      throw new Error('Audience twin not found');
    }

    // Auto-assign segments based on twin characteristics
    const segments = this.assignSegments(twin);

    // Update segments in database
    twin.segments = segments;
    await twin.save();

    return segments;
  }

  async refreshAudienceTwin(twinId: string, ownerId: string): Promise<AudienceTwin> {
    const twin = await AudienceTwinModel.findOne({ twinId, ownerId });
    if (!twin) {
      throw new Error('Audience twin not found');
    }

    logger.info(`Refreshing audience twin: ${twinId}`);

    // Re-fetch data from HOJAI
    const users = await hojaiTwinService.searchUsersByCriteria(twin.criteria as object || {});
    const insights = users.length > 0
      ? await hojaiTwinService.getAudienceInsights(users.map((u) => u.userId))
      : null;

    // Update attributes
    const attributes = this.calculateAttributes(users, insights);
    twin.attributes = attributes;

    // Update behavioral model
    const behavioralModel = this.buildBehavioralModel(users);
    twin.behavioralModel = behavioralModel;

    // Update size and members
    twin.size = users.length;
    twin.memberUserIds = users.map((u) => u.userId);

    // Recalculate quality score
    twin.qualityScore = this.calculateQualityScore(users, attributes, behavioralModel);

    await twin.save();
    logger.info(`Refreshed audience twin ${twinId}`);

    return twin.toAudienceTwin();
  }

  async deleteAudienceTwin(twinId: string, ownerId: string): Promise<boolean> {
    const result = await AudienceTwinModel.deleteOne({ twinId, ownerId });
    return result.deletedCount > 0;
  }

  private calculateAttributes(
    users: Array<{ profile: { interests: string[] }; preferences: { channels: string[]; bestTimes: string[] }; riskFactors: { churnRisk: number } }>,
    insights: { avgLifetimeValue: number; avgIntentLikelihood: number; topInterests: string[]; channelPreferences: Record<ChannelPreference, number> } | null
  ): {
    interests: string[];
    intentLikelihood: number;
    channelPreference: ChannelPreference;
    timingPreference: string;
    lifetimeValue: number;
    brandAffinities: Record<string, number>;
  } {
    // Extract top interests from users
    const allInterests = users.flatMap((u) => u.profile?.interests || []);
    const interestCounts = allInterests.reduce((acc, interest) => {
      acc[interest] = (acc[interest] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topInterests = Object.entries(interestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([interest]) => interest);

    // Determine best channel
    const channelPreference = this.determineBestChannel(users, insights);

    // Determine timing preference
    const timingPreference = this.determineTimingPreference(users);

    return {
      interests: topInterests,
      intentLikelihood: insights?.avgIntentLikelihood ?? 0.5,
      channelPreference,
      timingPreference,
      lifetimeValue: insights?.avgLifetimeValue ?? 0,
      brandAffinities: {},
    };
  }

  private determineBestChannel(
    users: Array<{ preferences?: { channels?: string[] } }>,
    insights: { channelPreferences?: Record<string, number> } | null
  ): ChannelPreference {
    // Priority: explicit user preferences > aggregate insights > default
    const channelCounts = users.reduce((acc, user) => {
      const channels = user.preferences?.channels || [];
      channels.forEach((ch) => {
        acc[ch] = (acc[ch] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(channelCounts).length > 0) {
      const best = Object.entries(channelCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      if (['whatsapp', 'email', 'push', 'sms'].includes(best)) {
        return best as ChannelPreference;
      }
    }

    if (insights?.channelPreferences) {
      const prefs = insights.channelPreferences;
      if (prefs.whatsapp) return 'whatsapp';
      if (prefs.email) return 'email';
      if (prefs.push) return 'push';
      if (prefs.sms) return 'sms';
    }

    return 'push'; // Default
  }

  private determineTimingPreference(
    users: Array<{ preferences?: { bestTimes?: string[] } }>
  ): string {
    const allTimes = users.flatMap((u) => u.preferences?.bestTimes || []);
    if (allTimes.length === 0) {
      return '10:00-14:00'; // Default
    }

    // Find most common time window
    const timeCounts = allTimes.reduce((acc, time) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(timeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '10:00-14:00';
  }

  private buildBehavioralModel(
    users: Array<{ profile?: { behaviors?: { sessions?: number; purchases?: number; avgOrderValue?: number } }; riskFactors?: { churnRisk?: number; engagementScore?: number } }>
  ): {
    avgSessionDuration: number;
    avgPurchaseFrequency: number;
    avgOrderValue: number;
    preferredCategories: string[];
    churnRisk: number;
  } {
    if (users.length === 0) {
      return {
        avgSessionDuration: 0,
        avgPurchaseFrequency: 0,
        avgOrderValue: 0,
        preferredCategories: [],
        churnRisk: 0.5,
      };
    }

    const behaviors = users.map((u) => u.profile?.behaviors || {});
    const avgSessions = this.avg(behaviors.map((b) => b.sessions || 0));
    const avgPurchases = this.avg(behaviors.map((b) => b.purchases || 0));
    const avgOrderValue = this.avg(behaviors.map((b) => b.avgOrderValue || 0));
    const avgChurnRisk = this.avg(users.map((u) => u.riskFactors?.churnRisk || 0.5));

    return {
      avgSessionDuration: avgSessions * 5 * 60, // Estimate 5 min per session
      avgPurchaseFrequency: avgPurchases,
      avgOrderValue,
      preferredCategories: [],
      churnRisk: Math.min(Math.max(avgChurnRisk, 0), 1),
    };
  }

  private calculateQualityScore(
    users: unknown[],
    attributes: { intentLikelihood: number },
    behavioralModel: { churnRisk: number; avgOrderValue: number }
  ): number {
    if (users.length === 0) return 3; // Low quality for empty

    // Score factors
    const sizeScore = Math.min(users.length / 1000, 1) * 3; // Max 3 points
    const intentScore = attributes.intentLikelihood * 3; // Max 3 points
    const valueScore = Math.min(behavioralModel.avgOrderValue / 1000, 1) * 2; // Max 2 points
    const churnScore = (1 - behavioralModel.churnRisk) * 2; // Max 2 points

    return Math.min(sizeScore + intentScore + valueScore + churnScore, 10);
  }

  private identifyFactors(
    twin: AudienceTwinDocument,
    action: string
  ): Array<{ factor: string; impact: number }> {
    const factors: Array<{ factor: string; impact: number }> = [];

    factors.push({
      factor: 'intent_likelihood',
      impact: twin.attributes.intentLikelihood * (action === 'purchase' ? 1 : 0.5),
    });

    factors.push({
      factor: 'lifetime_value',
      impact: Math.min(twin.attributes.lifetimeValue / 10000, 1),
    });

    factors.push({
      factor: 'churn_risk',
      impact: twin.behavioralModel.churnRisk * -0.5,
    });

    if (twin.attributes.channelPreference) {
      factors.push({
        factor: 'channel_preference',
        impact: 0.3,
      });
    }

    return factors;
  }

  private assignSegments(twin: AudienceTwinDocument): SegmentAssignment[] {
    const segments: SegmentAssignment[] = [];

    // High-value segment
    if (twin.attributes.lifetimeValue > 5000) {
      segments.push({
        segmentId: 'seg-high-value',
        segmentName: 'High Value Customers',
        confidence: 0.9,
        assignedAt: new Date(),
      });
    }

    // Engagement segment
    if (twin.behavioralModel.avgPurchaseFrequency > 5) {
      segments.push({
        segmentId: 'seg-engaged',
        segmentName: 'Engaged Shoppers',
        confidence: 0.85,
        assignedAt: new Date(),
      });
    }

    // At-risk segment
    if (twin.behavioralModel.churnRisk > 0.6) {
      segments.push({
        segmentId: 'seg-at-risk',
        segmentName: 'At-Risk Customers',
        confidence: 0.8,
        assignedAt: new Date(),
      });
    }

    // Interest-based segments
    const primaryInterest = twin.attributes.interests[0];
    if (primaryInterest) {
      segments.push({
        segmentId: `seg-${primaryInterest.toLowerCase().replace(/\s+/g, '-')}`,
        segmentName: `${primaryInterest} Enthusiasts`,
        confidence: twin.size > 100 ? 0.85 : 0.6,
        assignedAt: new Date(),
      });
    }

    return segments;
  }

  private avg(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

export const audienceTwinService = new AudienceTwinService();
export default AudienceTwinService;