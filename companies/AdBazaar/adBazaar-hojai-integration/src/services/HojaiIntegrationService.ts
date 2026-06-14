import axios, { AxiosInstance } from 'axios';
import type { AdCampaign, AdAudience, ConversionEvent, HojaiUser, CampaignInsight } from '../types.js';

export class HojaiIntegrationService {
  private client: AxiosInstance;

  constructor() {
    const baseUrl = process.env.HOJAI_UNIFIED_URL || 'http://localhost:4850';
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': 'adbazaar'
      }
    });
  }

  // ============ USER SYNC ============

  /**
   * Sync AdBazaar user to Hojai for targeted campaigns
   */
  async syncUser(user: HojaiUser): Promise<void> {
    try {
      // Create/update customer in Hojai
      await this.client.post('/api/customers', {
        externalId: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        attributes: {
          adInterests: user.interests,
          adBehaviors: user.behaviors,
          location: user.location
        }
      });
      logger.info(`[Hojai] User synced: ${user.id}`);
    } catch (error) {
      logger.error(`[Hojai] User sync failed:`, error);
    }
  }

  /**
   * Get user segments from Hojai for targeting
   */
  async getUserSegments(userId: string): Promise<string[]> {
    try {
      const response = await this.client.get(`/api/customers/${userId}/segments`);
      return response.data.segments || [];
    } catch (error) {
      logger.error(`[Hojai] Get segments failed:`, error);
      return [];
    }
  }

  // ============ CAMPAIGN AUTOMATION ============

  /**
   * Create campaign in Hojai for multi-channel reach
   */
  async createCampaignCampaign(campaign: AdCampaign): Promise<string | null> {
    try {
      const response = await this.client.post('/api/campaigns', {
        name: campaign.name,
        channel: 'whatsapp', // Primary channel
        type: campaign.type === 'awareness' ? 'marketing' : 'promotional',
        content: {
          text: `Check out our campaign: ${campaign.name}!`
        },
        targetFilters: {
          age: campaign.targeting.age,
          gender: campaign.targeting.gender,
          location: campaign.targeting.location,
          interests: campaign.targeting.interests
        }
      });
      logger.info(`[Hojai] Campaign created: ${response.data.campaignId}`);
      return response.data.campaignId;
    } catch (error) {
      logger.error(`[Hojai] Campaign creation failed:`, error);
      return null;
    }
  }

  /**
   * Send ad notification to user via WhatsApp
   */
  async sendAdNotification(
    userId: string,
    campaign: AdCampaign,
    message: string
  ): Promise<boolean> {
    try {
      await this.client.post('/api/messages/send', {
        channel: 'whatsapp',
        to: { id: userId },
        type: 'text',
        content: { text: message }
      });
      return true;
    } catch (error) {
      logger.error(`[Hojai] Send notification failed:`, error);
      return false;
    }
  }

  /**
   * Send interactive ad with CTA buttons
   */
  async sendAdWithCTA(
    userId: string,
    campaign: AdCampaign
  ): Promise<boolean> {
    try {
      await this.client.post('/api/messages/send', {
        channel: 'whatsapp',
        to: { id: userId },
        type: 'buttons',
        content: {
          text: campaign.creative.clickUrl,
          header: campaign.name,
          buttons: [
            { id: 'learn_more', title: 'Learn More' },
            { id: 'shop_now', title: 'Shop Now' },
            { id: 'dismiss', title: 'Dismiss' }
          ]
        }
      });
      return true;
    } catch (error) {
      logger.error(`[Hojai] Send CTA failed:`, error);
      return false;
    }
  }

  // ============ CONVERSION TRACKING ============

  /**
   * Track ad conversion event
   */
  async trackConversion(event: ConversionEvent): Promise<void> {
    try {
      await this.client.post('/api/events/track', {
        eventType: `ad_${event.eventType}`,
        userId: event.userId,
        properties: {
          campaignId: event.campaignId,
          adId: event.adId,
          value: event.value,
          ...event.metadata
        },
        timestamp: event.timestamp
      });
      logger.info(`[Hojai] Conversion tracked: ${event.eventType}`);
    } catch (error) {
      logger.error(`[Hojai] Track conversion failed:`, error);
    }
  }

  /**
   * Send abandoned cart recovery message
   */
  async sendCartRecovery(userId: string, items: Array<{ name: string; price: number }>): Promise<boolean> {
    try {
      const itemList = items.map(i => `• ${i.name} - ₹${i.price}`).join('\n');
      const total = items.reduce((sum, i) => sum + i.price, 0);

      await this.client.post('/api/messages/send', {
        channel: 'whatsapp',
        to: { id: userId },
        type: 'text',
        content: {
          text: `🛒 You left items in your cart!\n\n${itemList}\n\nTotal: ₹${total}\n\nComplete your purchase now!`
        }
      });
      return true;
    } catch (error) {
      logger.error(`[Hojai] Cart recovery failed:`, error);
      return false;
    }
  }

  // ============ ANALYTICS ============

  /**
   * Get campaign performance from Hojai
   */
  async getCampaignAnalytics(campaignId: string): Promise<CampaignInsight | null> {
    try {
      const response = await this.client.get(`/api/analytics/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      logger.error(`[Hojai] Get analytics failed:`, error);
      return null;
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(userId: string): Promise<{
    messagesReceived: number;
    messagesClicked: number;
    conversions: number;
    revenue: number;
  }> {
    try {
      const response = await this.client.get(`/api/analytics/users/${userId}`);
      return response.data;
    } catch (error) {
      logger.error(`[Hojai] Get engagement failed:`, error);
      return {
        messagesReceived: 0,
        messagesClicked: 0,
        conversions: 0,
        revenue: 0
      };
    }
  }

  // ============ AUDIENCE TARGETING ============

  /**
   * Get users matching ad audience criteria
   */
  async getMatchingUsers(audience: AdAudience): Promise<string[]> {
    try {
      const response = await this.client.post('/api/audiences/match', {
        segments: audience.segments,
        demographics: audience.demographics,
        interests: audience.interests,
        behaviors: audience.behaviors
      });
      return response.data.userIds || [];
    } catch (error) {
      logger.error(`[Hojai] Get matching users failed:`, error);
      return [];
    }
  }

  /**
   * Create lookalike audience
   */
  async createLookalikeAudience(
    sourceAudienceId: string,
    similarity: number = 0.8
  ): Promise<AdAudience | null> {
    try {
      const response = await this.client.post('/api/audiences/lookalike', {
        sourceAudienceId,
        similarity
      });
      return response.data;
    } catch (error) {
      logger.error(`[Hojai] Create lookalike failed:`, error);
      return null;
    }
  }

  // ============ RETARGETING ============

  /**
   * Retarget users who viewed but didn't convert
   */
  async retargetUsers(
    campaignId: string,
    excludeUserIds: string[],
    message: string
  ): Promise<{ sent: number; failed: number }> {
    try {
      const response = await this.client.post('/api/campaigns/retarget', {
        sourceCampaignId: campaignId,
        excludeUserIds,
        message
      });
      return {
        sent: response.data.sent || 0,
        failed: response.data.failed || 0
      };
    } catch (error) {
      logger.error(`[Hojai] Retarget failed:`, error);
      return { sent: 0, failed: 0 };
    }
  }
}

export const hojaiIntegration = new HojaiIntegrationService();
