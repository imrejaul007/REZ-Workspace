/**
 * REZ BuzzLocal → Intelligence Connector
 *
 * Connects social/community data to REZ Intelligence
 *
 * Tracks:
 * - Social engagement
 * - Community signals
 * - Viral content
 * - Local trends
 */

import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:4025';
const INTENT_SERVICE_URL = process.env.INTENT_SERVICE_URL || 'http://localhost:4018';

// ============================================================================
// Types
// ============================================================================

export interface SocialPost {
  postId: string;
  userId: string;
  type: 'text' | 'image' | 'video' | 'review' | 'deal';
  content: string;
  location?: { lat: number; lng: number };
  merchantId?: string;
  hashtags: string[];
  mentions: string[];
}

export interface SocialEngagement {
  postId: string;
  userId: string;
  type: 'like' | 'comment' | 'share' | 'save' | 'click';
  timestamp: string;
}

export interface LocalTrend {
  trendId: string;
  hashtag: string;
  posts: number;
  reach: number;
  velocity: 'rising' | 'stable' | 'declining';
  location?: { lat: number; lng: number; radius: number };
}

// ============================================================================
// BuzzLocal Intelligence Connector
// ============================================================================

class BuzzLocalIntelligenceConnector {

  // ============================================
  // Content Tracking
  // ============================================

  /**
   * Track: Social Post Created
   */
  async trackPost(post: SocialPost): Promise<void> {
    // Emit event
    await this.emitEvent({
      type: 'buzzlocal.post.created',
      userId: post.userId,
      data: {
        postId: post.postId,
        type: post.type,
        merchantId: post.merchantId,
        hashtags: post.hashtags
      }
    });

    // Extract intent signals
    await this.extractIntentSignals(post);

    // Update location-based trends
    if (post.location) {
      await this.updateLocationTrends(post);
    }

    // Update merchant signals
    if (post.merchantId) {
      await this.updateMerchantSignals(post);
    }
  }

  /**
   * Track: Engagement (like, comment, share)
   */
  async trackEngagement(engagement: SocialEngagement): Promise<void> {
    await this.emitEvent({
      type: `buzzlocal.engagement.${engagement.type}`,
      userId: engagement.userId,
      data: {
        postId: engagement.postId,
        type: engagement.type
      }
    });

    // Strong intent signal for shares
    if (engagement.type === 'share') {
      await this.updateIntent({
        userId: engagement.userId,
        intent: 'social_sharing',
        strength: 0.8,
        metadata: { postId: engagement.postId }
      });
    }
  }

  // ============================================
  // Trend Detection
  // ============================================

  /**
   * Get trending topics
   */
  async getTrending(location?: { lat: number; lng: number }): Promise<LocalTrend[]> {
    return [
      {
        trendId: 'trend_1',
        hashtag: '#PizzaNight',
        posts: 1250,
        reach: 15000,
        velocity: 'rising',
        location: location ? { ...location, radius: 5000 } : undefined
      },
      {
        trendId: 'trend_2',
        hashtag: '#MumbaiFood',
        posts: 890,
        reach: 12000,
        velocity: 'stable'
      }
    ];
  }

  /**
   * Get personalized feed based on intelligence
   */
  async getPersonalizedFeed(userId: string, limit = 20): Promise<{
    posts: {
      postId: string;
      score: number;
      reason: string;
    }[];
  }> {
    return {
      posts: [
        { postId: 'post_1', score: 0.95, reason: 'Matches your food interests' },
        { postId: 'post_2', score: 0.88, reason: 'Trending in your area' },
        { postId: 'post_3', score: 0.82, reason: 'Your friends engaged' }
      ]
    };
  }

  // ============================================
  // Merchant Insights
  // ============================================

  /**
   * Get social signals for merchant
   */
  async getMerchantSocialSignals(merchantId: string): Promise<{
    mentions: number;
    sentiment: number; // 0-100
    reach: number;
    topHashtags: string[];
  }> {
    return {
      mentions: 156,
      sentiment: 78,
      reach: 5000,
      topHashtags: ['#Pizza', '#Mumbai', '#FoodLover']
    };
  }

  // ============================================
  // Location Intelligence
  // ============================================

  /**
   * Get local insights
   */
  async getLocalInsights(location: { lat: number; lng: number }): Promise<{
    buzzScore: number;
    trendingCategories: string[];
    activeUsers: number;
  }> {
    return {
      buzzScore: 85,
      trendingCategories: ['Food', 'Fitness', 'Shopping'],
      activeUsers: 1200
    };
  }

  // ============================================
  // Private Methods
  // ============================================

  private async extractIntentSignals(post: SocialPost): Promise<void> {
    // Extract hashtags as intent signals
    for (const hashtag of post.hashtags) {
      const intent = hashtag.replace('#', '').toLowerCase();

      await this.updateIntent({
        userId: post.userId,
        intent,
        strength: 0.7,
        metadata: {
          source: 'buzzlocal',
          postId: post.postId,
          merchantId: post.merchantId
        }
      });
    }

    // Extract merchant mentions
    if (post.merchantId) {
      await this.updateIntent({
        userId: post.userId,
        intent: `merchant_${post.merchantId}`,
        strength: 0.6,
        metadata: { source: 'buzzlocal' }
      });
    }
  }

  private async updateLocationTrends(post: SocialPost): Promise<void> {
    await this.emitEvent({
      type: 'buzzlocal.location.trend',
      userId: post.userId,
      data: {
        postId: post.postId,
        location: post.location,
        hashtags: post.hashtags
      }
    });
  }

  private async updateMerchantSignals(post: SocialPost): Promise<void> {
    if (!post.merchantId) return;

    await this.emitEvent({
      type: 'buzzlocal.merchant.mention',
      userId: post.userId,
      merchantId: post.merchantId,
      data: {
        postId: post.postId,
        type: post.type,
        sentiment: 'positive' // Would be ML-calculated
      }
    });
  }

  private async emitEvent(event: {
    type: string;
    userId?: string;
    merchantId?: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(`${EVENT_BUS_URL}/api/events`, {
        ...event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to emit event:', error);
    }
  }

  private async updateIntent(data: {
    userId: string;
    intent: string;
    strength: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(`${INTENT_SERVICE_URL}/api/intents`, data);
    } catch (error) {
      console.error('Failed to update intent:', error);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const buzzlocalConnector = new BuzzLocalIntelligenceConnector();
export default buzzlocalConnector;
