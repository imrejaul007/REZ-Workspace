import { v4 as uuidv4 } from 'uuid';
import { AIMarketingManager, Campaign, ScheduleEvent, Review } from '../models';
import { AIMarketingManagerDocument, CampaignDocument, ScheduleEventDocument, ReviewDocument } from '../types';
import { BusinessProfile, Capabilities, CampaignType, CampaignStatus } from '../types';
import logger from 'utils/logger.js';

export class AIMarketingManagerService {
  /**
   * Initialize AI Marketing Manager for a merchant
   */
  async initialize(
    merchantId: string,
    businessProfile: BusinessProfile,
    capabilities?: Partial<Capabilities>
  ): Promise<AIMarketingManagerDocument> {
    logger.info(`Initializing AI Marketing Manager for merchant: ${merchantId}`);

    // Check if manager already exists
    const existing = await AIMarketingManager.findOne({ merchantId });
    if (existing) {
      logger.warn(`AI Marketing Manager already exists for merchant: ${merchantId}`);
      // Update existing manager
      existing.businessProfile = businessProfile;
      if (capabilities) {
        existing.capabilities = { ...existing.capabilities, ...capabilities };
      }
      await existing.save();
      return existing;
    }

    // Create new manager
    const managerId = `AIMM-${uuidv4().substring(0, 8).toUpperCase()}`;
    const now = new Date();

    const manager = new AIMarketingManager({
      managerId,
      merchantId,
      businessProfile,
      capabilities: {
        adCreation: capabilities?.adCreation ?? true,
        reviewManagement: capabilities?.reviewManagement ?? true,
        socialPosting: capabilities?.socialPosting ?? true,
        whatsappCampaigns: capabilities?.whatsappCampaigns ?? true,
        localSEO: capabilities?.localSEO ?? true,
        emailMarketing: capabilities?.emailMarketing ?? false,
        smsMarketing: capabilities?.smsMarketing ?? false,
        loyaltyPrograms: capabilities?.loyaltyPrograms ?? false,
      },
      activeCampaigns: [],
      schedule: {
        recurringPosts: [],
        adSchedules: [],
        reviewRequests: [],
      },
      recommendations: [],
      performance: {
        totalReach: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalSpend: 0,
        totalRevenue: 0,
        roas: 0,
        averageCTR: 0,
        averageCPC: 0,
        periodStart: now.toISOString(),
        periodEnd: now.toISOString(),
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    await manager.save();
    logger.info(`AI Marketing Manager created: ${managerId} for merchant: ${merchantId}`);

    // Generate initial recommendations
    await this.generateInitialRecommendations(manager);

    return manager;
  }

  /**
   * Get manager by merchant ID
   */
  async getByMerchantId(merchantId: string): Promise<AIMarketingManagerDocument | null> {
    return AIMarketingManager.findOne({ merchantId });
  }

  /**
   * Get manager by manager ID
   */
  async getByManagerId(managerId: string): Promise<AIMarketingManagerDocument | null> {
    return AIMarketingManager.findOne({ managerId });
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(
    merchantId: string,
    businessProfile: Partial<BusinessProfile>
  ): Promise<AIMarketingManagerDocument | null> {
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (!manager) {
      return null;
    }

    manager.businessProfile = { ...manager.businessProfile, ...businessProfile };
    await manager.save();
    return manager;
  }

  /**
   * Update capabilities
   */
  async updateCapabilities(
    merchantId: string,
    capabilities: Partial<Capabilities>
  ): Promise<AIMarketingManagerDocument | null> {
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (!manager) {
      return null;
    }

    manager.capabilities = { ...manager.capabilities, ...capabilities };
    await manager.save();
    return manager;
  }

  /**
   * Create a new campaign
   */
  async createCampaign(
    merchantId: string,
    managerId: string,
    type: CampaignType,
    name: string,
    content: {
      headline: string;
      body: string;
      imageUrl?: string;
      callToAction?: string;
    },
    budget?: number,
    schedule?: {
      startDate?: string;
      endDate?: string;
      frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<CampaignDocument> {
    const campaignId = `CAMP-${uuidv4().substring(0, 8).toUpperCase()}`;

    const campaign = new Campaign({
      campaignId,
      merchantId,
      managerId,
      type,
      status: 'draft',
      name,
      content,
      budget,
      schedule,
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
        reach: 0,
        engagement: 0,
        ctr: 0,
        cpc: 0,
        roas: 0,
      },
    });

    await campaign.save();

    // Add to manager's active campaigns
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (manager) {
      manager.activeCampaigns.push({
        campaignId,
        type,
        status: 'draft',
        name,
        startDate: schedule?.startDate,
        endDate: schedule?.endDate,
        budget,
        performance: campaign.performance,
        content: {
          headline: content.headline,
          body: content.body,
          imageUrl: content.imageUrl,
          callToAction: content.callToAction,
        },
      });
      await manager.save();
    }

    logger.info(`Campaign created: ${campaignId} for merchant: ${merchantId}`);
    return campaign;
  }

  /**
   * Get campaigns for a merchant
   */
  async getCampaigns(
    merchantId: string,
    options?: {
      status?: CampaignStatus;
      type?: CampaignType;
      limit?: number;
      page?: number;
    }
  ): Promise<{ campaigns: CampaignDocument[]; total: number }> {
    const query: any = { merchantId };

    if (options?.status) {
      query.status = options.status;
    }
    if (options?.type) {
      query.type = options.type;
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      Campaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Campaign.countDocuments(query),
    ]);

    return { campaigns, total };
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: CampaignStatus
  ): Promise<CampaignDocument | null> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    campaign.status = status;
    await campaign.save();

    // Update manager's active campaigns
    const manager = await AIMarketingManager.findOne({ merchantId: campaign.merchantId });
    if (manager) {
      const idx = manager.activeCampaigns.findIndex(c => c.campaignId === campaignId);
      if (idx !== -1) {
        manager.activeCampaigns[idx].status = status;
        await manager.save();
      }
    }

    return campaign;
  }

  /**
   * Update campaign performance
   */
  async updateCampaignPerformance(
    campaignId: string,
    performance: Partial<{
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      revenue: number;
      reach: number;
      engagement: number;
    }>
  ): Promise<CampaignDocument | null> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    // Update performance metrics
    Object.keys(performance).forEach(key => {
      const k = key as keyof typeof performance;
      if (campaign.performance[k] !== undefined) {
        (campaign.performance as any)[k] = performance[k];
      }
    });

    // Calculate derived metrics
    if (campaign.performance.impressions > 0) {
      campaign.performance.ctr = (campaign.performance.clicks / campaign.performance.impressions) * 100;
    }
    if (campaign.performance.clicks > 0) {
      campaign.performance.cpc = campaign.performance.spend / campaign.performance.clicks;
    }
    if (campaign.performance.spend > 0) {
      campaign.performance.roas = campaign.performance.revenue / campaign.performance.spend;
    }

    await campaign.save();

    // Update manager's aggregate performance
    await this.updateManagerPerformance(campaign.merchantId);

    return campaign;
  }

  /**
   * Update manager's aggregate performance
   */
  private async updateManagerPerformance(merchantId: string): Promise<void> {
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (!manager) {
      return;
    }

    const campaigns = await Campaign.find({
      merchantId,
      status: 'active',
    });

    const aggregated = campaigns.reduce(
      (acc, camp) => ({
        totalReach: acc.totalReach + (camp.performance.reach || 0),
        totalImpressions: acc.totalImpressions + (camp.performance.impressions || 0),
        totalEngagement: acc.totalEngagement + (camp.performance.engagement || 0),
        totalClicks: acc.totalClicks + (camp.performance.clicks || 0),
        totalConversions: acc.totalConversions + (camp.performance.conversions || 0),
        totalSpend: acc.totalSpend + (camp.performance.spend || 0),
        totalRevenue: acc.totalRevenue + (camp.performance.revenue || 0),
      }),
      {
        totalReach: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalSpend: 0,
        totalRevenue: 0,
      }
    );

    manager.performance = {
      ...aggregated,
      roas: aggregated.totalSpend > 0 ? aggregated.totalRevenue / aggregated.totalSpend : 0,
      averageCTR: aggregated.totalImpressions > 0
        ? (aggregated.totalClicks / aggregated.totalImpressions) * 100
        : 0,
      averageCPC: aggregated.totalClicks > 0
        ? aggregated.totalSpend / aggregated.totalClicks
        : 0,
      periodStart: manager.performance.periodStart,
      periodEnd: new Date().toISOString(),
    };

    await manager.save();
  }

  /**
   * Generate initial recommendations for new manager
   */
  private async generateInitialRecommendations(manager: AIMarketingManagerDocument): Promise<void> {
    const recommendations: any[] = [];
    const { businessProfile, capabilities } = manager;

    // Category-specific recommendations
    const categoryRecommendations: Record<string, any[]> = {
      restaurant: [
        {
          id: uuidv4(),
          priority: 'high',
          category: 'social_media',
          action: 'Create Instagram Reels showcasing signature dishes',
          description: 'Visual content drives 2x engagement for restaurants',
          expectedImpact: 'High engagement increase',
          estimatedCost: 0,
          status: 'pending',
        },
        {
          id: uuidv4(),
          priority: 'high',
          category: 'review_management',
          action: 'Enable automated review requests after dining',
          description: 'Restaurants with 50+ reviews see 25% more bookings',
          expectedImpact: '25% increase in reviews',
          estimatedCost: 0,
          status: 'pending',
        },
      ],
      retail: [
        {
          id: uuidv4(),
          priority: 'high',
          category: 'local_seo',
          action: 'Complete Google Business Profile optimization',
          description: 'Complete profiles get 50% more direction requests',
          expectedImpact: '50% more store visits',
          estimatedCost: 0,
          status: 'pending',
        },
      ],
      default: [
        {
          id: uuidv4(),
          priority: 'high',
          category: 'brand_awareness',
          action: 'Run Facebook/Instagram awareness campaign',
          description: 'Social media ads reach local customers effectively',
          expectedImpact: 'Increase in brand awareness',
          estimatedCost: 1000,
          status: 'pending',
        },
      ],
    };

    // Get category-specific recommendations or use default
    const categoryKey = businessProfile.category.toLowerCase();
    const specificRecs = categoryRecommendations[categoryKey] || categoryRecommendations.default;

    // Add capability-specific recommendations
    if (capabilities.whatsappCampaigns) {
      specificRecs.push({
        id: uuidv4(),
        priority: 'medium',
        category: 'whatsapp',
        action: 'Set up WhatsApp business catalog',
        description: 'WhatsApp catalogs increase conversion by 30%',
        expectedImpact: '30% conversion increase',
        estimatedCost: 0,
        status: 'pending',
      });
    }

    if (capabilities.localSEO) {
      specificRecs.push({
        id: uuidv4(),
        priority: 'medium',
        category: 'local_seo',
        action: 'Optimize for local search keywords',
        description: 'Local SEO drives 5x more visits than traditional ads',
        expectedImpact: '5x more organic visits',
        estimatedCost: 0,
        status: 'pending',
      });
    }

    manager.recommendations = specificRecs;
    await manager.save();
  }

  /**
   * Add recommendation
   */
  async addRecommendation(
    merchantId: string,
    recommendation: {
      priority: 'high' | 'medium' | 'low';
      category: string;
      action: string;
      description: string;
      expectedImpact: string;
      estimatedCost?: number;
      estimatedRevenue?: number;
      timeline?: string;
    }
  ): Promise<AIMarketingManagerDocument | null> {
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (!manager) {
      return null;
    }

    manager.recommendations.push({
      id: uuidv4(),
      ...recommendation,
      status: 'pending',
    });

    await manager.save();
    return manager;
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    merchantId: string,
    recommendationId: string,
    status: 'pending' | 'approved' | 'rejected' | 'executed'
  ): Promise<AIMarketingManagerDocument | null> {
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (!manager) {
      return null;
    }

    const idx = manager.recommendations.findIndex(r => r.id === recommendationId);
    if (idx === -1) {
      return null;
    }

    manager.recommendations[idx].status = status;
    await manager.save();
    return manager;
  }

  /**
   * Schedule a post
   */
  async schedulePost(
    merchantId: string,
    managerId: string,
    type: 'post' | 'ad' | 'review_request' | 'email' | 'sms',
    content: string,
    scheduledFor: Date,
    platform?: string,
    campaignId?: string
  ): Promise<ScheduleEventDocument> {
    const eventId = `EVT-${uuidv4().substring(0, 8).toUpperCase()}`;

    const event = new ScheduleEvent({
      eventId,
      merchantId,
      managerId,
      campaignId,
      type,
      content,
      scheduledFor,
      platform,
      status: 'pending',
    });

    await event.save();

    // Add to manager's schedule
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (manager) {
      const scheduleType = type === 'review_request' ? 'reviewRequests'
        : type === 'ad' ? 'adSchedules'
        : 'recurringPosts';

      (manager.schedule as any)[scheduleType].push({
        id: eventId,
        type,
        content,
        scheduledFor: scheduledFor.toISOString(),
        status: 'pending',
        platform,
      });

      await manager.save();
    }

    return event;
  }

  /**
   * Get calendar events
   */
  async getCalendarEvents(
    merchantId: string,
    startDate?: Date,
    endDate?: Date,
    type?: string
  ): Promise<ScheduleEventDocument[]> {
    const query: any = { merchantId };

    if (startDate || endDate) {
      query.scheduledFor = {};
      if (startDate) {
        query.scheduledFor.$gte = startDate;
      }
      if (endDate) {
        query.scheduledFor.$lte = endDate;
      }
    }

    if (type) {
      query.type = type;
    }

    return ScheduleEvent.find(query).sort({ scheduledFor: 1 });
  }

  /**
   * Record a review
   */
  async recordReview(
    merchantId: string,
    managerId: string,
    reviewData: {
      platform: 'google' | 'facebook' | 'yelp' | 'tripadvisor' | 'other';
      rating: number;
      content: string;
      author: string;
      date: Date;
    }
  ): Promise<ReviewDocument> {
    const reviewId = `REV-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Simple sentiment analysis
    const positiveWords = ['great', 'amazing', 'excellent', 'good', 'love', 'best', 'wonderful', 'fantastic', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointed', 'hate'];

    const lowerContent = reviewData.content.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerContent.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerContent.includes(w)).length;

    const sentiment = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral';
    const sentimentScore = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);

    const review = new Review({
      reviewId,
      merchantId,
      managerId,
      ...reviewData,
      sentiment,
      sentimentScore,
    });

    await review.save();
    return review;
  }

  /**
   * Get reviews
   */
  async getReviews(
    merchantId: string,
    options?: {
      platform?: string;
      sentiment?: string;
      limit?: number;
      page?: number;
    }
  ): Promise<{ reviews: ReviewDocument[]; total: number }> {
    const query: any = { merchantId };

    if (options?.platform) {
      query.platform = options.platform;
    }
    if (options?.sentiment) {
      query.sentiment = options.sentiment;
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(query).sort({ date: -1 }).skip(skip).limit(limit),
      Review.countDocuments(query),
    ]);

    return { reviews, total };
  }

  /**
   * Respond to a review
   */
  async respondToReview(
    reviewId: string,
    response: {
      content: string;
      tone: 'professional' | 'friendly' | 'apologetic' | 'grateful';
    }
  ): Promise<ReviewDocument | null> {
    const review = await Review.findOne({ reviewId });
    if (!review) {
      return null;
    }

    review.response = {
      ...response,
      respondedAt: new Date(),
    };

    await review.save();

    // Update manager recommendations
    const manager = await AIMarketingManager.findOne({ merchantId: review.merchantId });
    if (manager) {
      // Mark related recommendation as executed if exists
      const idx = manager.recommendations.findIndex(r =>
        r.category === 'review_management' && r.status === 'pending'
      );
      if (idx !== -1) {
        manager.recommendations[idx].status = 'executed';
        await manager.save();
      }
    }

    return review;
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(
    merchantId: string,
    startDate?: Date,
    endDate?: Date,
    campaignId?: string
  ): Promise<any> {
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (!manager) {
      return null;
    }

    const campaignQuery: any = { merchantId };
    if (campaignId) {
      campaignQuery.campaignId = campaignId;
    }

    const campaigns = await Campaign.find(campaignQuery);

    // Aggregate performance from campaigns
    const aggregated = campaigns.reduce(
      (acc, camp) => ({
        totalReach: acc.totalReach + (camp.performance.reach || 0),
        totalImpressions: acc.totalImpressions + (camp.performance.impressions || 0),
        totalEngagement: acc.totalEngagement + (camp.performance.engagement || 0),
        totalClicks: acc.totalClicks + (camp.performance.clicks || 0),
        totalConversions: acc.totalConversions + (camp.performance.conversions || 0),
        totalSpend: acc.totalSpend + (camp.performance.spend || 0),
        totalRevenue: acc.totalRevenue + (camp.performance.revenue || 0),
      }),
      {
        totalReach: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalSpend: 0,
        totalRevenue: 0,
      }
    );

    return {
      ...aggregated,
      roas: aggregated.totalSpend > 0 ? aggregated.totalRevenue / aggregated.totalSpend : 0,
      averageCTR: aggregated.totalImpressions > 0
        ? (aggregated.totalClicks / aggregated.totalImpressions) * 100
        : 0,
      averageCPC: aggregated.totalClicks > 0
        ? aggregated.totalSpend / aggregated.totalClicks
        : 0,
      campaignCount: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      periodStart: startDate?.toISOString() || manager.performance.periodStart,
      periodEnd: endDate?.toISOString() || new Date().toISOString(),
      campaignBreakdown: campaigns.map(c => ({
        campaignId: c.campaignId,
        name: c.name,
        type: c.type,
        status: c.status,
        performance: c.performance,
      })),
    };
  }

  /**
   * Delete manager
   */
  async delete(merchantId: string): Promise<boolean> {
    const result = await AIMarketingManager.deleteOne({ merchantId });
    if (result.deletedCount > 0) {
      // Clean up related data
      await Campaign.deleteMany({ merchantId });
      await ScheduleEvent.deleteMany({ merchantId });
      await Review.deleteMany({ merchantId });
      return true;
    }
    return false;
  }
}

export const aiMarketingManagerService = new AIMarketingManagerService();
export default aiMarketingManagerService;