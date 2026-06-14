/**
 * REZ Mind Client - Do App Integration
 *
 * Connects Do App to:
 * - REZ Intent Graph (intent capture, dormant detection, ML scoring)
 * - REZ Communications Platform (push, SMS, WhatsApp, email)
 * - REZ Gamification (karma, challenges, achievements)
 *
 * Usage:
 *   import { rezMind } from './services/rezMindService';
 *
 *   // Capture intent
 *   await rezMind.captureIntent({
 *     userId: 'user_123',
 *     eventType: 'chat_message',
 *     category: 'discovery',
 *     metadata: { message: 'Book a table' }
 *   });
 *
 *   // Get recommendations
 *   const recs = await rezMind.getRecommendations(userId, { types: ['restaurants'] });
 *
 *   // Check dormancy
 *   const dormant = await rezMind.getDormantStatus(userId);
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// Configuration
// ============================================

const INTENT_GRAPH_URL = process.env.EXPO_PUBLIC_REZ_INTENT_URL || 'https://rez-intent-graph.onrender.com';
const USER_INTELLIGENCE_URL = process.env.EXPO_PUBLIC_REZ_USER_INTELLIGENCE_URL || 'https://REZ-user-intelligence.onrender.com';
const CAMPAIGN_URL = process.env.EXPO_PUBLIC_REZ_CAMPAIGN_URL || 'https://rez-campaign-service.onrender.com';

const API_KEY = process.env.REZ_API_KEY || '';
const INTERNAL_TOKEN = process.env.REZ_INTERNAL_TOKEN || '';

// ============================================
// Types
// ============================================

export interface IntentCapture {
  userId: string;
  appType: string;
  intentKey: string;
  eventType: string;
  category: string;
  intentQuery?: string;
  metadata?: Record<string, unknown>;
  merchantId?: string;
}

export interface DormantStatus {
  isDormant: boolean;
  daysSinceActive?: number;
  reason?: string;
  lastIntent?: string;
}

export interface IntentScore {
  category: string;
  score: number;
  reasons: string[];
}

export interface Recommendation {
  itemId: string;
  name: string;
  type: string;
  score: number;
  reason: string;
  imageUrl?: string;
}

export interface BehavioralProfile {
  personality: 'explorer' | 'loyalist' | 'bargain_hunter' | 'impulse_buyer';
  engagement: 'low' | 'medium' | 'high';
  lifetimeValue: 'standard' | 'premium' | 'vip';
  riskLevel: 'low' | 'medium' | 'high';
  preferredChannels: ('push' | 'sms' | 'email' | 'whatsapp')[];
  stylePreferences?: {
    vibes?: string[];
    occasions?: string[];
    cuisines?: string[];
  };
}

// ============================================
// HTTP Client Factory
// ============================================

const createClient = (baseURL: string): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Internal-Token': INTERNAL_TOKEN,
    },
  });
};

// ============================================
// REZ Mind Service
// ============================================

class ReZMindService {
  private intentClient: AxiosInstance;
  private userIntelligenceClient: AxiosInstance;
  private campaignClient: AxiosInstance;

  constructor() {
    this.intentClient = createClient(INTENT_GRAPH_URL);
    this.userIntelligenceClient = createClient(USER_INTELLIGENCE_URL);
    this.campaignClient = createClient(CAMPAIGN_URL);
  }

  // ============================================
  // INTENT CAPTURE
  // ============================================

  /**
   * Capture user intent
   */
  async captureIntent(data: IntentCapture): Promise<{ success: boolean; intentId?: string }> {
    try {
      const response = await this.intentClient.post('/api/intent/capture', {
        appType: 'do-app',
        ...data,
      });
      return response.data;
    } catch (error) {
      logger.warn('Intent capture failed:', error.message);
      return { success: false };
    }
  }

  /**
   * Capture chat message intent
   */
  async captureChatIntent(
    userId: string,
    message: string,
    sessionId: string,
    detectedIntent?: string
  ): Promise<void> {
    await this.captureIntent({
      userId,
      appType: 'do-app',
      intentKey: detectedIntent || 'chat_query',
      eventType: 'chat_message',
      category: 'discovery',
      intentQuery: message,
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Capture booking completed intent
   */
  async captureBookingCompleted(
    userId: string,
    bookingId: string,
    entityType: string,
    entityName: string,
    amount: number,
    karmaEarned: number
  ): Promise<void> {
    await this.captureIntent({
      userId,
      appType: 'do-app',
      intentKey: 'booking_complete',
      eventType: 'conversion',
      category: entityType,
      intentQuery: entityName,
      metadata: {
        bookingId,
        amount,
        karmaEarned,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Capture entity view intent
   */
  async captureEntityView(
    userId: string,
    entityId: string,
    entityType: string,
    entityName: string,
    distance?: number
  ): Promise<void> {
    await this.captureIntent({
      userId,
      appType: 'do-app',
      intentKey: 'entity_view',
      eventType: 'browse',
      category: entityType,
      intentQuery: entityName,
      metadata: {
        entityId,
        distance,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Capture search intent
   */
  async captureSearch(
    userId: string,
    query: string,
    resultsCount: number,
    category?: string
  ): Promise<void> {
    await this.captureIntent({
      userId,
      appType: 'do-app',
      intentKey: 'search',
      eventType: 'search',
      category: category || 'general',
      intentQuery: query,
      metadata: {
        resultsCount,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ============================================
  // DORMANT DETECTION
  // ============================================

  /**
   * Get dormant status for user
   */
  async getDormantStatus(userId: string): Promise<DormantStatus> {
    try {
      const response = await this.intentClient.get(`/api/intent/dormant/${userId}`);
      const data = response.data?.data;

      return {
        isDormant: data?.isDormant || false,
        daysSinceActive: data?.daysSinceActive,
        reason: data?.reason,
        lastIntent: data?.lastIntent?.intentKey,
      };
    } catch (error) {
      logger.warn('Dormant check failed:', error.message);
      return { isDormant: false };
    }
  }

  /**
   * Trigger revival for dormant user
   */
  async triggerRevival(
    userId: string,
    options: {
      channel?: 'push' | 'sms' | 'email' | 'whatsapp';
      offer?: { coins?: number; discountPercent?: number };
    } = {}
  ): Promise<{ success: boolean; campaignId?: string }> {
    try {
      const response = await this.intentClient.post('/api/intent/revive', {
        userId,
        appType: 'do-app',
        channel: options.channel || 'push',
        offer: options.offer,
      });
      return response.data;
    } catch (error) {
      logger.warn('Revival trigger failed:', error.message);
      return { success: false };
    }
  }

  // ============================================
  // INTENT SCORING
  // ============================================

  /**
   * Get intent scores for recommendations
   */
  async getIntentScores(
    userId: string,
    categories: string[]
  ): Promise<IntentScore[]> {
    try {
      const response = await this.intentClient.get(`/api/intent/score/${userId}`, {
        params: { categories: categories.join(',') },
      });
      return response.data?.scores || [];
    } catch (error) {
      logger.warn('Intent scoring failed:', error.message);
      return [];
    }
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(
    userId: string,
    options: {
      types?: string[];
      limit?: number;
      location?: { lat: number; lng: number };
    } = {}
  ): Promise<Recommendation[]> {
    try {
      const response = await this.intentClient.post('/api/intent/recommendations', {
        userId,
        appType: 'do-app',
        types: options.types || ['restaurants', 'spa', 'events'],
        limit: options.limit || 10,
        location: options.location,
      });
      return response.data?.recommendations || [];
    } catch (error) {
      logger.warn('Recommendations failed:', error.message);
      return [];
    }
  }

  // ============================================
  // USER INTELLIGENCE
  // ============================================

  /**
   * Get behavioral profile
   */
  async getBehavioralProfile(userId: string): Promise<BehavioralProfile | null> {
    try {
      const response = await this.userIntelligenceClient.get(`/api/user/${userId}`);
      const data = response.data;

      return {
        personality: data.personality || 'explorer',
        engagement: data.engagement || 'medium',
        lifetimeValue: data.lifetimeValue || 'standard',
        riskLevel: data.riskLevel || 'low',
        preferredChannels: data.preferredChannels || ['push'],
        stylePreferences: data.stylePreferences,
      };
    } catch (error) {
      logger.warn('Behavioral profile failed:', error.message);
      return null;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await this.userIntelligenceClient.get(`/api/user/${userId}/preferences`);
      return response.data;
    } catch (error) {
      logger.warn('User preferences failed:', error.message);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Record<string, unknown>,
    token: string
  ): Promise<boolean> {
    try {
      await this.userIntelligenceClient.patch(
        `/api/user/${userId}/preferences`,
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch (error) {
      logger.warn('Update preferences failed:', error.message);
      return false;
    }
  }

  // ============================================
  // CAMPAIGNS & COMMUNICATIONS
  // ============================================

  /**
   * Send push notification via campaign service
   */
  async sendPushNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; notificationId?: string }> {
    try {
      const response = await this.campaignClient.post('/api/notifications/send', {
        userId,
        channel: 'push',
        notification,
      });
      return response.data;
    } catch (error) {
      logger.warn('Push notification failed:', error.message);
      return { success: false };
    }
  }

  /**
   * Trigger win-back campaign
   */
  async triggerWinBack(
    userId: string,
    offer?: { coins?: number; discountPercent?: number }
  ): Promise<{ success: boolean; campaignId?: string }> {
    try {
      const response = await this.campaignClient.post('/api/campaigns/win-back', {
        userId,
        appType: 'do-app',
        offer,
      });
      return response.data;
    } catch (error) {
      logger.warn('Win-back campaign failed:', error.message);
      return { success: false };
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Track conversion from nudge
   */
  async trackConversion(nudgeId: string, orderId: string, orderAmount: number): Promise<void> {
    try {
      await this.intentClient.post('/api/intent/convert', {
        nudgeId,
        orderId,
        orderAmount,
        appType: 'do-app',
      });
    } catch (error) {
      logger.warn('Conversion tracking failed:', error.message);
    }
  }

  /**
   * Get user journey/funnel
   */
  async getUserJourney(userId: string, days: number = 30): Promise<unknown[]> {
    try {
      const response = await this.intentClient.get(`/api/intent/journey/${userId}`, {
        params: { days },
      });
      return response.data?.journey || [];
    } catch (error) {
      logger.warn('Journey fetch failed:', error.message);
      return [];
    }
  }
}

// ============================================
// Export Singleton
// ============================================

export const rezMind = new ReZMindService();
export default rezMind;
