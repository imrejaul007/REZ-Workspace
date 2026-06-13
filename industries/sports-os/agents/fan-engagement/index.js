/**
 * Fan Engagement Agent
 * Manages fan notifications, offers, and personalized engagement
 * Part of the Sports OS Agent Architecture
 */

const EventEmitter = require('events');
const winston = require('winston');
const axios = require('axios');

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Engagement channels
const CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WHATSAPP: 'whatsapp'
};

// Offer types
const OFFER_TYPES = {
  TICKET_DISCOUNT: 'ticket_discount',
  MERCHANDISE_DISCOUNT: 'merchandise_discount',
  VIP_EXPERIENCE: 'vip_experience',
  LOYALTY_BONUS: 'loyalty_bonus',
  EARLY_ACCESS: 'early_access',
  PERSONALIZED: 'personalized'
};

class FanEngagementAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      fanServiceUrl: process.env.FAN_SERVICE_URL || 'http://localhost:3003',
      teamServiceUrl: process.env.TEAM_SERVICE_URL || 'http://localhost:3002',
      venueServiceUrl: process.env.VENUE_SERVICE_URL || 'http://localhost:3004',
      notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8080/notifications',
      aiEndpoint: process.env.AI_ENDPOINT || 'http://localhost:8080/api/ai',
      engagementThreshold: config.engagementThreshold || 50,
      churnThreshold: config.churnThreshold || 30,
      ...config
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.campaignQueue = [];
    this.activeCampaigns = new Map();
    this.isRunning = false;
  }

  /**
   * Start the fan engagement agent
   */
  async start() {
    logger.info('Starting Fan Engagement Agent...');
    this.isRunning = true;

    // Start background tasks
    this.startBackgroundTasks();

    this.emit('started');
    logger.info('Fan Engagement Agent started successfully');
    return true;
  }

  /**
   * Stop the fan engagement agent
   */
  async stop() {
    logger.info('Stopping Fan Engagement Agent...');
    this.isRunning = false;
    this.emit('stopped');
    logger.info('Fan Engagement Agent stopped');
  }

  /**
   * Send notification to fan
   * @param {string} fanId - Fan ID
   * @param {Object} notification - Notification data
   * @returns {Object} Notification result
   */
  async sendNotification(fanId, notification) {
    try {
      logger.info(`Sending notification to fan: ${fanId}`);

      // Get fan preferences
      const fan = await this.fetchFanData(fanId);
      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      // Determine best channel based on preferences
      const channel = notification.channel || this.determineBestChannel(fan.preferences);

      // Personalize content
      const personalizedContent = await this.personalizeContent(notification.content, fan);

      // Send notification
      const result = await this.dispatchNotification(fan, {
        ...notification,
        channel,
        content: personalizedContent
      });

      // Record interaction
      await this.recordInteraction(fanId, {
        type: 'notification_sent',
        targetId: notification.targetId,
        targetType: notification.targetType,
        channel
      });

      this.emit('notification:sent', { fanId, channel });

      return {
        success: true,
        fanId,
        channel,
        notificationId: result.notificationId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to send notification to ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch fan data from service
   */
  async fetchFanData(fanId) {
    try {
      const response = await this.httpClient.get(
        `${this.config.fanServiceUrl}/fan/${fanId}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Determine best notification channel
   */
  determineBestChannel(preferences) {
    const channels = preferences?.notificationChannels || [CHANNELS.EMAIL];

    // Priority order: push > email > sms > whatsapp
    if (channels.includes(CHANNELS.PUSH)) return CHANNELS.PUSH;
    if (channels.includes(CHANNELS.EMAIL)) return CHANNELS.EMAIL;
    if (channels.includes(CHANNELS.SMS)) return CHANNELS.SMS;
    if (channels.includes(CHANNELS.WHATSAPP)) return CHANNELS.WHATSAPP;

    return CHANNELS.EMAIL;
  }

  /**
   * Personalize notification content
   */
  async personalizeContent(content, fan) {
    // Replace placeholders with fan data
    let personalized = content;

    if (fan.firstName) {
      personalized = personalized.replace(/{{firstName}}/g, fan.firstName);
    }
    if (fan.lastName) {
      personalized = personalized.replace(/{{lastName}}/g, fan.lastName);
    }
    if (fan.engagement?.loyaltyTier) {
      personalized = personalized.replace(/{{loyaltyTier}}/g, fan.engagement.loyaltyTier);
    }
    if (fan.engagement?.loyaltyPoints) {
      personalized = personalized.replace(/{{loyaltyPoints}}/g, fan.engagement.loyaltyPoints);
    }

    return personalized;
  }

  /**
   * Dispatch notification to appropriate service
   */
  async dispatchNotification(fan, notification) {
    const payload = {
      recipient: {
        fanId: fan.fanId,
        email: fan.email,
        phone: fan.phone
      },
      channel: notification.channel,
      content: notification.content,
      subject: notification.subject,
      metadata: notification.metadata
    };

    try {
      const response = await this.httpClient.post(
        `${this.config.notificationServiceUrl}/send`,
        payload
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to dispatch notification:', error);
      throw error;
    }
  }

  /**
   * Create and send offer to fan
   * @param {string} fanId - Fan ID
   * @param {Object} offerData - Offer details
   * @returns {Object} Offer result
   */
  async createOffer(fanId, offerData) {
    try {
      logger.info(`Creating offer for fan: ${fanId}`);

      const fan = await this.fetchFanData(fanId);
      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      // Generate personalized offer
      const offer = await this.generatePersonalizedOffer(fan, offerData);

      // Send offer notification
      await this.sendNotification(fanId, {
        channel: this.determineBestChannel(fan.preferences),
        subject: offer.title,
        content: offer.description,
        targetId: offer.offerId,
        targetType: 'offer'
      });

      // Record interaction
      await this.recordInteraction(fanId, {
        type: 'offer_sent',
        targetId: offer.offerId,
        targetType: 'offer'
      });

      this.emit('offer:sent', { fanId, offerId: offer.offerId });

      return offer;
    } catch (error) {
      logger.error(`Failed to create offer for ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Generate personalized offer based on fan profile
   */
  async generatePersonalizedOffer(fan, offerData) {
    const offerId = `offer-${Date.now()}-${fan.fanId}`;

    // Determine offer type based on fan profile
    let offerType = offerData.type || OFFER_TYPES.PERSONALIZED;
    let discount = 0;
    let title = '';
    let description = '';

    // Calculate discount based on loyalty tier
    const tierDiscounts = {
      'bronze': 0.05,
      'silver': 0.10,
      'gold': 0.15,
      'platinum': 0.20,
      'vip': 0.25
    };

    discount = tierDiscounts[fan.engagement?.loyaltyTier] || 0.05;

    // Customize based on offer type
    switch (offerType) {
      case OFFER_TYPES.TICKET_DISCOUNT:
        title = `Exclusive ${Math.round(discount * 100)}% Off Tickets`;
        description = `As a ${fan.engagement?.loyaltyTier} member, enjoy ${Math.round(discount * 100)}% off your next ticket purchase! Use code: ${offerId.substring(0, 8).toUpperCase()}`;
        break;
      case OFFER_TYPES.VIP_EXPERIENCE:
        title = 'VIP Experience Upgrade';
        description = 'Upgrade your game day experience with VIP access, exclusive seating, and complimentary refreshments.';
        break;
      case OFFER_TYPES.LOYALTY_BONUS:
        title = 'Loyalty Points Bonus';
        description = `Earn double loyalty points on your next purchase! Valid for 7 days.`;
        break;
      default:
        title = 'Personalized Offer Just for You';
        description = `Based on your ${fan.engagement?.loyaltyTier} status, here's a special offer just for you!`;
    }

    return {
      offerId,
      type: offerType,
      title,
      description,
      discount,
      fanId: fan.fanId,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      terms: offerData.terms || 'Subject to availability. Cannot be combined with other offers.',
      metadata: {
        loyaltyTier: fan.engagement?.loyaltyTier,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Create engagement campaign
   * @param {Object} campaignData - Campaign configuration
   * @returns {Object} Campaign details
   */
  async createCampaign(campaignData) {
    try {
      logger.info(`Creating engagement campaign: ${campaignData.name}`);

      const campaignId = `campaign-${Date.now()}`;

      const campaign = {
        campaignId,
        name: campaignData.name,
        type: campaignData.type,
        targetAudience: campaignData.targetAudience,
        message: campaignData.message,
        channels: campaignData.channels || [CHANNELS.EMAIL, CHANNELS.PUSH],
        schedule: campaignData.schedule,
        status: 'draft',
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        },
        createdAt: new Date().toISOString()
      };

      this.activeCampaigns.set(campaignId, campaign);

      this.emit('campaign:created', { campaignId, name: campaignData.name });

      return campaign;
    } catch (error) {
      logger.error('Failed to create campaign:', error);
      throw error;
    }
  }

  /**
   * Launch campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Object} Launch result
   */
  async launchCampaign(campaignId) {
    try {
      const campaign = this.activeCampaigns.get(campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      logger.info(`Launching campaign: ${campaignId}`);

      // Get target audience
      const audience = await this.getCampaignAudience(campaign.targetAudience);

      // Queue notifications
      for (const fan of audience) {
        this.campaignQueue.push({
          campaignId,
          fanId: fan.fanId,
          fan,
          message: campaign.message,
          channels: campaign.channels
        });
      }

      campaign.status = 'launching';
      campaign.targetCount = audience.length;

      // Process queue
      await this.processCampaignQueue(campaignId);

      campaign.status = 'active';
      this.emit('campaign:launched', { campaignId, audienceSize: audience.length });

      return {
        campaignId,
        status: 'active',
        audienceSize: audience.length
      };
    } catch (error) {
      logger.error(`Failed to launch campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Get campaign audience based on criteria
   */
  async getCampaignAudience(targetAudience) {
    try {
      let query = {};

      if (targetAudience.teamId) {
        query['preferences.favoriteTeams'] = targetAudience.teamId;
      }

      if (targetAudience.loyaltyTier) {
        query['engagement.loyaltyTier'] = targetAudience.loyaltyTier;
      }

      if (targetAudience.location) {
        query['location.country'] = targetAudience.location;
      }

      if (targetAudience.minEngagementScore) {
        query['analytics.engagementScore'] = { $gte: targetAudience.minEngagementScore };
      }

      if (targetAudience.churnRisk) {
        query['analytics.churnRisk'] = targetAudience.churnRisk;
      }

      const response = await this.httpClient.post(
        `${this.config.fanServiceUrl}/fans/search`,
        { query, limit: targetAudience.limit || 1000 }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get campaign audience:', error);
      throw error;
    }
  }

  /**
   * Process campaign queue
   */
  async processCampaignQueue(campaignId) {
    const campaign = this.activeCampaigns.get(campaignId);
    let processed = 0;

    while (this.campaignQueue.length > 0) {
      const item = this.campaignQueue.find(i => i.campaignId === campaignId);
      if (!item) break;

      try {
        // Send to fan
        await this.sendNotification(item.fanId, {
          channel: item.channels[0],
          subject: campaign.name,
          content: item.message,
          targetId: campaignId,
          targetType: 'campaign'
        });

        campaign.metrics.sent++;
        processed++;

        // Remove from queue
        const index = this.campaignQueue.indexOf(item);
        this.campaignQueue.splice(index, 1);

        // Rate limiting
        await this.delay(100);
      } catch (error) {
        logger.error(`Failed to process campaign item:`, error);
      }
    }

    logger.info(`Campaign ${campaignId}: Processed ${processed} notifications`);
  }

  /**
   * Get fan engagement score
   * @param {string} fanId - Fan ID
   * @returns {Object} Engagement analysis
   */
  async getEngagementScore(fanId) {
    try {
      const fan = await this.fetchFanData(fanId);
      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      const analysis = {
        fanId,
        overallScore: fan.analytics?.engagementScore || 0,
        breakdown: {
          purchaseFrequency: this.calculatePurchaseFrequency(fan),
          attendanceRate: this.calculateAttendanceRate(fan),
          interactionRate: this.calculateInteractionRate(fan),
          loyaltyLevel: this.calculateLoyaltyLevel(fan)
        },
        tier: fan.engagement?.loyaltyTier,
        points: fan.engagement?.loyaltyPoints,
        churnRisk: fan.analytics?.churnRisk,
        recommendations: this.generateEngagementRecommendations(fan)
      };

      return analysis;
    } catch (error) {
      logger.error(`Failed to get engagement score for ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate purchase frequency score
   */
  calculatePurchaseFrequency(fan) {
    const ticketsPurchased = fan.engagement?.ticketsPurchased || 0;
    const totalSpent = fan.engagement?.totalSpent || 0;

    // Normalize to 0-100
    const frequencyScore = Math.min(ticketsPurchased * 10, 50);
    const valueScore = Math.min(totalSpent / 1000, 50);

    return frequencyScore + valueScore;
  }

  /**
   * Calculate attendance rate
   */
  calculateAttendanceRate(fan) {
    const ticketsPurchased = fan.engagement?.ticketsPurchased || 0;
    const gamesAttended = fan.engagement?.gamesAttended || 0;

    if (ticketsPurchased === 0) return 0;
    return (gamesAttended / ticketsPurchased) * 100;
  }

  /**
   * Calculate interaction rate
   */
  calculateInteractionRate(fan) {
    const interactions = fan.interactions?.length || 0;
    const daysSinceJoin = this.getDaysSince(fan.metadata?.createdAt);

    if (daysSinceJoin === 0) return 0;
    return (interactions / daysSinceJoin) * 30; // Interactions per month
  }

  /**
   * Calculate loyalty level
   */
  calculateLoyaltyLevel(fan) {
    const points = fan.engagement?.loyaltyPoints || 0;
    const tier = fan.engagement?.loyaltyTier || 'bronze';

    const tierPoints = {
      'bronze': 0,
      'silver': 500,
      'gold': 2000,
      'platinum': 5000,
      'vip': 10000
    };

    const currentTierPoints = tierPoints[tier];
    const nextTierPoints = Object.values(tierPoints).find(p => p > currentTierPoints) || 10000;

    const progress = ((points - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100;

    return {
      currentTier: tier,
      points,
      progressToNextTier: Math.min(Math.max(progress, 0), 100),
      pointsToNextTier: Math.max(nextTierPoints - points, 0)
    };
  }

  /**
   * Generate engagement recommendations
   */
  generateEngagementRecommendations(fan) {
    const recommendations = [];

    // Check for low engagement
    if (fan.analytics?.engagementScore < this.config.engagementThreshold) {
      recommendations.push({
        type: 're_engagement',
        priority: 'high',
        action: 'Send personalized re-engagement offer',
        reason: 'Engagement score below threshold'
      });
    }

    // Check for churn risk
    if (fan.analytics?.churnRisk === 'high') {
      recommendations.push({
        type: 'churn_prevention',
        priority: 'critical',
        action: 'Send win-back campaign with exclusive offer',
        reason: 'High churn risk detected'
      });
    }

    // Check for upcoming milestones
    const points = fan.engagement?.loyaltyPoints || 0;
    const nextMilestone = Math.ceil(points / 500) * 500;
    if (nextMilestone - points < 100) {
      recommendations.push({
        type: 'milestone',
        priority: 'medium',
        action: 'Send milestone reminder with bonus offer',
        reason: `Only ${nextMilestone - points} points until ${nextMilestone} milestone`
      });
    }

    // Check for favorite team event
    if (fan.preferences?.favoriteTeams?.length > 0) {
      recommendations.push({
        type: 'team_event',
        priority: 'low',
        action: 'Notify about upcoming matches for favorite teams',
        reason: 'Fan has favorite teams to follow'
      });
    }

    return recommendations;
  }

  /**
   * Record interaction
   */
  async recordInteraction(fanId, interactionData) {
    try {
      await this.httpClient.post(
        `${this.config.fanServiceUrl}/fan/${fanId}/interaction`,
        interactionData
      );
    } catch (error) {
      logger.error(`Failed to record interaction for ${fanId}:`, error);
    }
  }

  /**
   * Get days since date
   */
  getDaysSince(date) {
    if (!date) return 0;
    return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    // Process campaign queue every minute
    setInterval(() => {
      if (this.campaignQueue.length > 0) {
        const campaignId = this.campaignQueue[0].campaignId;
        this.processCampaignQueue(campaignId);
      }
    }, 60000);

    // Check for at-risk fans every hour
    setInterval(async () => {
      try {
        const response = await this.httpClient.get(
          `${this.config.fanServiceUrl}/fans/at-risk/high`
        );
        const atRiskFans = response.data;

        for (const fan of atRiskFans) {
          await this.createOffer(fan.fanId, {
            type: OFFER_TYPES.LOYALTY_BONUS,
            reason: 'churn_prevention'
          });
        }

        logger.info(`Processed ${atRiskFans.length} at-risk fans`);
      } catch (error) {
        logger.error('Failed to process at-risk fans:', error);
      }
    }, 3600000); // Every hour
  }

  /**
   * Get campaign metrics
   * @param {string} campaignId - Campaign ID
   * @returns {Object} Campaign metrics
   */
  async getCampaignMetrics(campaignId) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    return {
      campaignId,
      name: campaign.name,
      status: campaign.status,
      metrics: campaign.metrics,
      targetCount: campaign.targetCount || 0,
      deliveryRate: campaign.targetCount
        ? (campaign.metrics.delivered / campaign.targetCount) * 100
        : 0,
      conversionRate: campaign.metrics.sent
        ? (campaign.metrics.converted / campaign.metrics.sent) * 100
        : 0
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      agent: 'fan-engagement',
      status: this.isRunning ? 'healthy' : 'stopped',
      activeCampaigns: this.activeCampaigns.size,
      queueSize: this.campaignQueue.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Export for module usage
module.exports = FanEngagementAgent;

// Run as standalone agent
if (require.main === module) {
  const agent = new FanEngagementAgent();

  process.on('SIGTERM', async () => {
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await agent.stop();
    process.exit(0);
  });

  agent.start().catch((error) => {
    logger.error('Failed to start Fan Engagement Agent:', error);
    process.exit(1);
  });
}
