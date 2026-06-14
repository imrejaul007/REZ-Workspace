import logger from './utils/logger';

/**
 * Karma Real-time Socket.IO Handler
 *
 * Features:
 * - Real-time karma updates
 * - Leaderboard updates
 * - Push notifications
 * - Social sharing events
 */

import { Server, Socket } from 'socket.io';
import axios from 'axios';

const RECOMMEND_URL = process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com';
const CDP_URL = process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com';
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-key';

interface KarmaSocket extends Socket {
  userId?: string;
}

class KarmaRealtime {
  private io: Server;
  private userSockets: Map<string, string[]> = new Map();

  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket: KarmaSocket) => {
      logger.info(`[Socket] Connected: ${socket.id}`);

      // Authenticate user
      socket.on('authenticate', async (data: { userId: string }) => {
        socket.userId = data.userId;

        // Track user's sockets
        const sockets = this.userSockets.get(data.userId) || [];
        sockets.push(socket.id);
        this.userSockets.set(data.userId, sockets);

        // Join user room
        socket.join(`user:${data.userId}`);

        logger.info(`[Socket] User authenticated: ${data.userId}`);
      });

      // Earn karma event
      socket.on('karma:earn', async (data: {
        userId: string;
        points: number;
        source: string;
      }) => {
        // Broadcast to user's followers
        this.io.to(`user:${data.userId}`).emit('karma:earned', {
          points: data.points,
          source: data.source,
          timestamp: new Date().toISOString()
        });

        // Update leaderboard
        this.broadcastLeaderboardUpdate(data.userId);
      });

      // Spend karma event
      socket.on('karma:spend', async (data: {
        userId: string;
        points: number;
        perk: string;
      }) => {
        this.io.to(`user:${data.userId}`).emit('karma:spent', {
          points: data.points,
          perk: data.perk,
          timestamp: new Date().toISOString()
        });
      });

      // Social share event
      socket.on('karma:share', async (data: {
        userId: string;
        achievement: string;
        platform: 'twitter' | 'facebook' | 'whatsapp';
      }) => {
        // Award bonus points for sharing
        const bonusPoints = 10;

        this.io.to(`user:${data.userId}`).emit('karma:share_bonus', {
          points: bonusPoints,
          achievement: data.achievement,
          platform: data.platform,
          timestamp: new Date().toISOString()
        });

        // Track social event
        this.trackSocialShare(data);
      });

      // Subscribe to leaderboard
      socket.on('leaderboard:subscribe', () => {
        socket.join('leaderboard');
      });

      // Subscribe to community
      socket.on('community:subscribe', (data: { communityId: string }) => {
        socket.join(`community:${data.communityId}`);
      });

      // Request AI recommendation
      socket.on('karma:get_recommendation', async (data: { userId: string }) => {
        const recommendation = await this.getAIRecommendation(data.userId);
        socket.emit('karma:recommendation', recommendation);
      });

      // Disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          const sockets = this.userSockets.get(socket.userId) || [];
          const index = sockets.indexOf(socket.id);
          if (index > -1) {
            sockets.splice(index, 1);
            if (sockets.length === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
        logger.info(`[Socket] Disconnected: ${socket.id}`);
      });
    });
  }

  // ==========================================
  // BROADCAST METHODS
  // ==========================================

  /**
   * Broadcast karma earned to user
   */
  broadcastKarmaEarned(userId: string, points: number, source: string) {
    this.io.to(`user:${userId}`).emit('karma:earned', {
      points,
      source,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast leaderboard update
   */
  broadcastLeaderboardUpdate(userId: string) {
    this.io.to('leaderboard').emit('leaderboard:update', {
      updatedUserId: userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast to community
   */
  broadcastToCommunity(communityId: string, event: string, data) {
    this.io.to(`community:${communityId}`).emit(event, data);
  }

  /**
   * Broadcast achievement unlocked
   */
  broadcastAchievement(userId: string, achievement: {
    id: string;
    name: string;
    points: number;
  }) {
    this.io.to(`user:${userId}`).emit('karma:achievement', achievement);

    // Also broadcast to followers if public achievement
    this.io.to('leaderboard').emit('karma:achievement_unlocked', {
      userId,
      achievement: achievement.name,
      points: achievement.points
    });
  }

  // ==========================================
  // AI RECOMMENDATIONS
  // ==========================================

  /**
   * Get AI-powered perk recommendation
   */
  async getAIRecommendation(userId: string) {
    try {
      // Get user profile from CDP
      const profileRes = await axios.get(`${CDP_URL}/api/profiles/${userId}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY },
        timeout: 2000
      }).catch(() => null);

      // Get recommendations from ML
      const recommendRes = await axios.post(`${RECOMMEND_URL}/api/recommend`, {
        user_id: userId,
        context: 'karma_perk',
        limit: 3
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY },
        timeout: 2000
      }).catch(() => null);

      const recommendations = recommendRes?.data?.recommendations || [];

      return {
        perks: recommendations.map((r) => ({
          id: r.id,
          name: r.title,
          // NOTE: Math.random() is ACCEPTABLE here for demo/fallback recommendations
          points_cost: r.points_required || Math.floor(Math.random() * 100) + 50,
          match_score: r.score || 0.8
        })),
        reason: this.generateRecommendationReason(profileRes?.data)
      };
    } catch (error) {
      // Fallback recommendations
      return {
        perks: [
          { id: 'p1', name: 'Plant a Tree', points_cost: 50, match_score: 0.9 },
          { id: 'p2', name: 'Clean Up Drive', points_cost: 75, match_score: 0.8 },
          { id: 'p3', name: 'Donate Books', points_cost: 100, match_score: 0.7 }
        ],
        reason: 'Based on your impact history'
      };
    }
  }

  private generateRecommendationReason(profile): string {
    if (!profile) return 'Personalized for you';

    const segments = profile.segments || [];
    if (segments.includes('environment')) {
      return 'You care about the environment!';
    }
    if (segments.includes('education')) {
      return 'Great for education impact!';
    }
    if (segments.includes('health')) {
      return 'Support health initiatives!';
    }
    return 'Recommended based on your history';
  }

  // ==========================================
  // SOCIAL SHARING
  // ==========================================

  /**
   * Track social share event
   */
  async trackSocialShare(data: {
    userId: string;
    achievement: string;
    platform: string;
  }) {
    try {
      // Update profile in CDP
      await axios.patch(`${CDP_URL}/api/profiles/${data.userId}`, {
        social_shares: { platform: data.platform, achievement: data.achievement }
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }
      }).catch(() => {});

      // Broadcast share bonus
      this.io.to(`user:${data.userId}`).emit('karma:share_bonus', {
        points: 10,
        reason: `Shared ${data.achievement} on ${data.platform}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('[Socket] Social share tracking failed', { error });
    }
  }

  // ==========================================
  // PUSH NOTIFICATIONS (FCM)
  // ==========================================

  /**
   * Send push notification
   */
  async sendPushNotification(userId: string, notification: {
    title: string;
    body: string;
    data?;
  }) {
    try {
      // Get FCM token from user profile
      const userSockets = this.userSockets.get(userId);

      if (userSockets && userSockets.length > 0) {
        // User is online - send socket notification
        this.io.to(`user:${userId}`).emit('notification', notification);
      } else {
        // User is offline - would send FCM push
        // In production, integrate with Firebase Cloud Messaging
        logger.info(`[Push] Would send to ${userId}: ${notification.title}`);
      }
    } catch (error) {
      logger.error('[Push] Send failed', { error });
    }
  }

  // ==========================================
  // GETTER
  // ==========================================

  getIO(): Server {
    return this.io;
  }

  getOnlineUsers(): number {
    return this.userSockets.size;
  }
}

// Singleton instance
let karmaRealtime: KarmaRealtime | null = null;

export function initKarmaRealtime(httpServer): KarmaRealtime {
  if (!karmaRealtime) {
    karmaRealtime = new KarmaRealtime(httpServer);
  }
  return karmaRealtime;
}

export function getKarmaRealtime(): KarmaRealtime | null {
  return karmaRealtime;
}

export default karmaRealtime;
