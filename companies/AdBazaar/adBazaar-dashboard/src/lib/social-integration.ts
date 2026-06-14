/**
 * Social Media Integration
 *
 * Connects AdBazaar Dashboard to social media services:
 *   - REZ-instagram-bridge (port 4090) - Instagram DMs, comments, mentions
 *
 * Features:
 *   - Instagram conversation management
 *   - Comment handling and replies
 *   - Message sending
 *   - User linking (Instagram <-> App)
 *   - Analytics and sentiment tracking
 *   - Platform-agnostic interface for Twitter/LinkedIn expansion
 */

// Service configuration
const INSTAGRAM_BRIDGE_URL = process.env.NEXT_PUBLIC_INSTAGRAM_BRIDGE_URL || 'http://localhost:4090';
const TIMEOUT = 15000; // 15 seconds

// Types
export interface InstagramUser {
  id: string;
  instagramId: string;
  username: string;
  displayName?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followingCount?: number;
  biography?: string;
  website?: string;
  isBusiness?: boolean;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstagramConversation {
  id: string;
  threadId: string;
  instagramUserId: string;
  instagramUser?: InstagramUser;
  status: 'active' | 'archived' | 'blocked';
  lastMessageAt: Date;
  lastMessagePreview?: string;
  unreadCount: number;
  messages?: InstagramMessage[];
}

export interface InstagramMessage {
  id: string;
  mid: string;
  senderId: string;
  recipientId: string;
  text?: string;
  attachments?: InstagramAttachment[];
  quickReplies?: string[];
  isFromBusiness: boolean;
  timestamp: Date;
  readAt?: Date;
}

export interface InstagramAttachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'story' | 'location';
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  title?: string;
  provider?: string;
}

export interface InstagramComment {
  id: string;
  commentId: string;
  mediaId: string;
  text: string;
  username: string;
  from: {
    id: string;
    username: string;
  };
  intent?: 'purchase' | 'inquiry' | 'support' | 'feedback' | 'spam' | 'other';
  sentiment?: 'positive' | 'negative' | 'neutral';
  status: 'pending' | 'replied' | 'hidden' | 'escalated';
  replyText?: string;
  repliedBy?: string;
  repliedAt?: Date;
  createdAt: Date;
}

export interface LinkSession {
  id: string;
  sessionId: string;
  instagramUserId: string;
  username: string;
  status: 'pending' | 'verified' | 'expired' | 'failed';
  verificationCode?: string;
  expiresAt: Date;
  verifiedAt?: Date;
}

export interface CommentAnalytics {
  total: number;
  pending: number;
  replied: number;
  hidden: number;
  escalated: number;
  byIntent: Record<string, number>;
  bySentiment: Record<string, number>;
  avgResponseTime?: number;
}

// Generic social platform interface for expansion
export interface SocialPlatform {
  name: string;
  sendMessage(recipientId: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
  getUser(userId: string): Promise<{ success: boolean; user?: unknown; error?: string }>;
  getMetrics(): Promise<{ success: boolean; metrics?: SocialMetrics; error?: string }>;
}

export interface SocialMetrics {
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  impressions: number;
  reach: number;
  clicks: number;
}

// Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

// Instagram Bridge Client
export class InstagramBridgeClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = INSTAGRAM_BRIDGE_URL, timeout: number = TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  // ============================================
  // Conversation Management
  // ============================================

  /**
   * Get list of conversations
   */
  async getConversations(options?: {
    status?: 'active' | 'archived' | 'blocked';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ conversations: InstagramConversation[]; pagination?: { total: number; limit: number; offset: number } }>> {
    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await this.fetch(`/api/dm/conversations${params.toString() ? `?${params}` : ''}`);
      return response as ApiResponse<{ conversations: InstagramConversation[]; pagination?: { total: number; limit: number; offset: number } }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get conversation by thread ID
   */
  async getConversation(threadId: string): Promise<ApiResponse<InstagramConversation>> {
    try {
      const response = await this.fetch(`/api/dm/conversations/${threadId}`);
      return response as ApiResponse<InstagramConversation>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(threadId: string, limit: number = 50): Promise<ApiResponse<{ messages: InstagramMessage[] }>> {
    try {
      const response = await this.fetch(`/api/dm/conversations/${threadId}/messages?limit=${limit}`);
      return response as ApiResponse<{ messages: InstagramMessage[] }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send message to Instagram user
   */
  async sendMessage(
    recipientId: string,
    message: string,
    conversationId?: string
  ): Promise<ApiResponse<{ messageId: string }>> {
    try {
      const response = await this.fetch('/api/dm/send', {
        method: 'POST',
        body: { recipientId, message, conversationId },
      });
      return response as ApiResponse<{ messageId: string }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send quick reply message
   */
  async sendQuickReply(
    recipientId: string,
    message: string,
    quickReplies: string[]
  ): Promise<ApiResponse<{ messageId: string }>> {
    try {
      const response = await this.fetch('/api/dm/quick-reply', {
        method: 'POST',
        body: { recipientId, message, quickReplies },
      });
      return response as ApiResponse<{ messageId: string }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(threadId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetch(`/api/dm/conversations/${threadId}/read`, { method: 'POST' });
      return response as ApiResponse<void>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Transfer conversation to WhatsApp
   */
  async transferToWhatsApp(
    instagramUserId: string,
    instagramUsername?: string,
    conversationHistory?: InstagramMessage[]
  ): Promise<ApiResponse<{ whatsappThreadId: string }>> {
    try {
      const response = await this.fetch(`/api/dm/transfer/whatsapp/${instagramUserId}`, {
        method: 'POST',
        body: { instagramUsername, conversationHistory },
      });
      return response as ApiResponse<{ whatsappThreadId: string }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ============================================
  // User Management
  // ============================================

  /**
   * Get Instagram user by ID
   */
  async getUser(instagramId: string): Promise<ApiResponse<InstagramUser>> {
    try {
      const response = await this.fetch(`/api/dm/users/${instagramId}`);
      return response as ApiResponse<InstagramUser>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create link session for user linking
   */
  async createLinkSession(data: {
    instagramUserId: string;
    username: string;
    email?: string;
    phone?: string;
    source?: string;
  }): Promise<ApiResponse<{ sessionId: string; verificationCode: string; expiresAt: string }>> {
    try {
      const response = await this.fetch('/api/dm/link-session', {
        method: 'POST',
        body: data,
      });
      return response as ApiResponse<{ sessionId: string; verificationCode: string; expiresAt: string }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Verify link with code
   */
  async verifyLink(verificationCode: string): Promise<ApiResponse<{ rezUserId: string; instagramUserId: string }>> {
    try {
      const response = await this.fetch('/api/dm/verify-link', {
        method: 'POST',
        body: { verificationCode },
      });
      return response as ApiResponse<{ rezUserId: string; instagramUserId: string }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get link session status
   */
  async getLinkSessionStatus(sessionId: string): Promise<ApiResponse<LinkSession>> {
    try {
      const response = await this.fetch(`/api/dm/link-session/${sessionId}/status`);
      return response as ApiResponse<LinkSession>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(sessionId: string): Promise<ApiResponse<{ verificationCode: string }>> {
    try {
      const response = await this.fetch(`/api/dm/link-session/${sessionId}/resend`, { method: 'POST' });
      return response as ApiResponse<{ verificationCode: string }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ============================================
  // Comment Management
  // ============================================

  /**
   * Get comments for a media
   */
  async getComments(mediaId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ comments: InstagramComment[]; pagination?: { total: number; limit: number; offset: number } }>> {
    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await this.fetch(`/api/comment/media/${mediaId}${params.toString() ? `?${params}` : ''}`);
      return response as ApiResponse<{ comments: InstagramComment[]; pagination?: { total: number; limit: number; offset: number } }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get pending comments for review
   */
  async getPendingComments(mediaId: string): Promise<ApiResponse<{ comments: InstagramComment[] }>> {
    try {
      const response = await this.fetch(`/api/comment/pending/${mediaId}`);
      return response as ApiResponse<{ comments: InstagramComment[] }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get comment by ID
   */
  async getComment(commentId: string): Promise<ApiResponse<InstagramComment>> {
    try {
      const response = await this.fetch(`/api/comment/${commentId}`);
      return response as ApiResponse<InstagramComment>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Reply to comment
   */
  async replyToComment(commentId: string, message: string): Promise<ApiResponse<{ replyId: string }>> {
    try {
      const response = await this.fetch('/api/comment/reply', {
        method: 'POST',
        body: { commentId, message },
      });
      return response as ApiResponse<{ replyId: string }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Hide a comment
   */
  async hideComment(commentId: string, reason?: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetch('/api/comment/hide', {
        method: 'POST',
        body: { commentId, reason },
      });
      return response as ApiResponse<void>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Escalate a comment to human agent
   */
  async escalateComment(commentId: string, reason?: string, escalateTo?: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetch(`/api/comment/escalate/${commentId}`, {
        method: 'POST',
        body: { reason, escalateTo },
      });
      return response as ApiResponse<void>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get comments by intent
   */
  async getCommentsByIntent(intent: string, limit?: number, offset?: number): Promise<PaginatedResponse<InstagramComment>> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      const response = await this.fetch(`/api/comment/by-intent/${intent}${params.toString() ? `?${params}` : ''}`);
      return response as PaginatedResponse<InstagramComment>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get comments by sentiment
   */
  async getCommentsBySentiment(sentiment: string, limit?: number, offset?: number): Promise<PaginatedResponse<InstagramComment>> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      const response = await this.fetch(`/api/comment/by-sentiment/${sentiment}${params.toString() ? `?${params}` : ''}`);
      return response as PaginatedResponse<InstagramComment>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get comment analytics
   */
  async getCommentAnalytics(mediaId?: string): Promise<ApiResponse<CommentAnalytics>> {
    try {
      const params = mediaId ? `?mediaId=${encodeURIComponent(mediaId)}` : '';
      const response = await this.fetch(`/api/comment/analytics${params}`);
      return response as ApiResponse<CommentAnalytics>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ============================================
  // Webhook Testing (Development Only)
  // ============================================

  /**
   * Test webhook (development only)
   */
  async testWebhook(testType: 'dm' | 'comment', payload?: object): Promise<ApiResponse<void>> {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Not available in production' };
    }

    try {
      const response = await this.fetch('/webhook/instagram/test', {
        method: 'POST',
        body: { testType, payload },
      });
      return response as ApiResponse<void>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ============================================
  // Health Check
  // ============================================

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetch('/health');
      return response.success;
    } catch {
      return false;
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private async fetch(endpoint: string, options?: { method?: string; body?: object }): Promise<ApiResponse<unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: options?.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: (errorData as { error?: string }).error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Singleton instance
export const instagramBridge = new InstagramBridgeClient();

// ============================================
// Gamification Integration (for reward metrics)
export interface GamificationMetrics {
  totalCoins: number;
  totalXp: number;
  achievements: number;
  challengeCompletions: number;
  currentStreak: number;
  longestStreak: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface GamificationSummary {
  userId: string;
  profile: {
    xp: number;
    rezScore: number;
    currentTier: string;
    streakDays: number;
    lastCheckIn?: string;
  };
  totals: {
    coins: number;
    xp: number;
    rewards: number;
  };
  nextMilestones: Array<{
    type: string;
    description: string;
    progress: number;
    target: number;
    percentComplete: number;
    reward: { coins: number; xp: number };
  }>;
}

// Gamification client for ads-service integration
export class GamificationClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_GAMIFICATION_SERVICE_URL || 'http://localhost:3004', timeout: number = TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Get user achievements
   */
  async getAchievements(userId: string): Promise<ApiResponse<{ earned: unknown[]; locked: unknown[] }>> {
    try {
      const response = await this.fetch(`/achievements/${userId}`);
      return response as ApiResponse<{ earned: unknown[]; locked: unknown[] }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get user streak
   */
  async getStreak(userId: string): Promise<ApiResponse<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    streakActive: boolean;
  }>> {
    try {
      const response = await this.fetch(`/streak/${userId}`);
      return response as ApiResponse<{
        currentStreak: number;
        longestStreak: number;
        lastActivityDate: string | null;
        streakActive: boolean;
      }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(): Promise<ApiResponse<{ entries: unknown[] }>> {
    try {
      const response = await this.fetch('/leaderboard');
      return response as ApiResponse<{ entries: unknown[] }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get user rewards summary
   */
  async getRewardsSummary(userId: string): Promise<ApiResponse<GamificationSummary>> {
    try {
      const response = await this.fetch(`/rewards/summary/${userId}`);
      return response as ApiResponse<GamificationSummary>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get rewards history
   */
  async getRewardsHistory(userId: string, limit?: number, offset?: number): Promise<ApiResponse<{
    history: unknown[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      const response = await this.fetch(`/rewards/history/${userId}${params.toString() ? `?${params}` : ''}`);
      return response as ApiResponse<{
        history: unknown[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get available challenges for user
   */
  async getAvailableRewards(userId: string): Promise<ApiResponse<{ challenges: unknown[] }>> {
    try {
      const response = await this.fetch(`/rewards/available/${userId}`);
      return response as ApiResponse<{ challenges: unknown[] }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetch('/health');
      return response.success;
    } catch {
      return false;
    }
  }

  private async fetch(endpoint: string): Promise<ApiResponse<unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: (errorData as { error?: string }).error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const gamification = new GamificationClient();

// ============================================
// React Hook
// ============================================

export function useSocialIntegration() {
  return {
    // Instagram Bridge
    instagram: {
      // Conversations
      getConversations: (options?: { status?: 'active' | 'archived' | 'blocked'; limit?: number; offset?: number }) =>
        instagramBridge.getConversations(options),
      getConversation: (threadId: string) => instagramBridge.getConversation(threadId),
      getConversationHistory: (threadId: string, limit?: number) =>
        instagramBridge.getConversationHistory(threadId, limit),
      sendMessage: (recipientId: string, message: string, conversationId?: string) =>
        instagramBridge.sendMessage(recipientId, message, conversationId),
      sendQuickReply: (recipientId: string, message: string, quickReplies: string[]) =>
        instagramBridge.sendQuickReply(recipientId, message, quickReplies),
      markAsRead: (threadId: string) => instagramBridge.markAsRead(threadId),
      transferToWhatsApp: (instagramUserId: string, username?: string, history?: InstagramMessage[]) =>
        instagramBridge.transferToWhatsApp(instagramUserId, username, history),

      // Users
      getUser: (instagramId: string) => instagramBridge.getUser(instagramId),
      createLinkSession: (data: { instagramUserId: string; username: string; email?: string; phone?: string; source?: string }) =>
        instagramBridge.createLinkSession(data),
      verifyLink: (code: string) => instagramBridge.verifyLink(code),
      getLinkSessionStatus: (sessionId: string) => instagramBridge.getLinkSessionStatus(sessionId),
      resendVerificationCode: (sessionId: string) => instagramBridge.resendVerificationCode(sessionId),

      // Comments
      getComments: (mediaId: string, options?: { status?: string; limit?: number; offset?: number }) =>
        instagramBridge.getComments(mediaId, options),
      getPendingComments: (mediaId: string) => instagramBridge.getPendingComments(mediaId),
      getComment: (commentId: string) => instagramBridge.getComment(commentId),
      replyToComment: (commentId: string, message: string) => instagramBridge.replyToComment(commentId, message),
      hideComment: (commentId: string, reason?: string) => instagramBridge.hideComment(commentId, reason),
      escalateComment: (commentId: string, reason?: string, escalateTo?: string) =>
        instagramBridge.escalateComment(commentId, reason, escalateTo),
      getCommentsByIntent: (intent: string, limit?: number, offset?: number) =>
        instagramBridge.getCommentsByIntent(intent, limit, offset),
      getCommentsBySentiment: (sentiment: string, limit?: number, offset?: number) =>
        instagramBridge.getCommentsBySentiment(sentiment, limit, offset),
      getCommentAnalytics: (mediaId?: string) => instagramBridge.getCommentAnalytics(mediaId),

      // Testing
      testWebhook: (testType: 'dm' | 'comment', payload?: object) =>
        instagramBridge.testWebhook(testType, payload),
    },

    // Gamification
    gamification: {
      getAchievements: (userId: string) => gamification.getAchievements(userId),
      getStreak: (userId: string) => gamification.getStreak(userId),
      getLeaderboard: () => gamification.getLeaderboard(),
      getRewardsSummary: (userId: string) => gamification.getRewardsSummary(userId),
      getRewardsHistory: (userId: string, limit?: number, offset?: number) =>
        gamification.getRewardsHistory(userId, limit, offset),
      getAvailableRewards: (userId: string) => gamification.getAvailableRewards(userId),
    },

    // Health checks
    healthCheck: async () => ({
      instagram: await instagramBridge.healthCheck(),
      gamification: await gamification.healthCheck(),
    }),
  };
}
