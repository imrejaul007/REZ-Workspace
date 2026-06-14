/**
 * ReZ Mind Integration - Share Intelligence Between All Apps
 *
 * Data Flow:
 * Do App <-> ReZ Mind <-> All Other Apps
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';

// ==================== SERVICE URLS ====================

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'https://rez-intent-graph.onrender.com';
const REZ_EVENT_URL = process.env.REZ_EVENT_URL || 'https://rez-event-platform.onrender.com';

// ==================== TYPES ====================

interface IntentEvent {
  userId: string;
  intent: string;
  entities?: Record<string, unknown>;
  context?: Record<string, unknown>;
  source: 'do-app';
  timestamp: string;
}

interface TransactionEvent {
  userId: string;
  transactionId: string;
  type: 'purchase' | 'refund' | 'bonus';
  category: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
  source: 'do-app';
  timestamp: string;
}

interface EngagementEvent {
  userId: string;
  event: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  source: 'do-app';
  timestamp: string;
}

// ==================== INTEGRATION CLIENT ====================

export class ReZMindIntegration {
  private eventQueue: (IntentEvent | TransactionEvent | EngagementEvent)[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Flush queue every 5 seconds
    this.flushInterval = setInterval(() => this.flushQueue(), 5000);
  }

  /**
   * Capture intent
   */
  async captureIntent(data: {
    userId: string;
    intent: string;
    entities?: Record<string, unknown>;
    context?: Record<string, unknown>;
  }): Promise<{ success: boolean; correlationId?: string }> {
    const event: IntentEvent = {
      userId: data.userId,
      intent: data.intent,
      entities: data.entities,
      context: data.context,
      source: 'do-app',
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await axios.post(`${REZ_MIND_URL}/api/intent/capture`, event, {
        timeout: 5000,
      });

      if (response.data?.success === false) {
        logger.warn('[ReZMind] Intent capture returned failure', { data: response.data });
        // Queue for later if offline
        this.eventQueue.push(event);
        return { success: false, error: response.data?.message || 'Capture returned failure' };
      }

      return {
        success: true,
        correlationId: response.data.correlationId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Queue for later if offline
      this.eventQueue.push(event);
      logger.warn('[ReZMind] Intent capture queued', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Record transaction
   */
  async recordTransaction(data: {
    userId: string;
    transactionId: string;
    type: 'purchase' | 'refund' | 'bonus';
    category: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean }> {
    const event: TransactionEvent = {
      userId: data.userId,
      transactionId: data.transactionId,
      type: data.type,
      category: data.category,
      amount: data.amount,
      currency: data.currency || 'INR',
      metadata: data.metadata,
      source: 'do-app',
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await axios.post(`${REZ_EVENT_URL}/api/event/transaction`, event, {
        timeout: 5000,
      });
      return { success: response.data?.success !== false, error: response.data?.message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.eventQueue.push(event);
      logger.warn('[ReZMind] Transaction event queued', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Record engagement
   */
  async recordEngagement(data: {
    userId: string;
    event: string;
    duration?: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean }> {
    const event: EngagementEvent = {
      userId: data.userId,
      event: data.event,
      duration: data.duration,
      metadata: data.metadata,
      source: 'do-app',
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await axios.post(`${REZ_EVENT_URL}/api/event/engagement`, event, {
        timeout: 5000,
      });
      return { success: response.data?.success !== false, error: response.data?.message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.eventQueue.push(event);
      logger.warn('[ReZMind] Engagement event queued', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get dormant users for nudging
   */
  async getDormantUsers(daysInactive: number = 7): Promise<{
    userId: string;
    dormantScore: number;
    lastIntent: string;
  }[]> {
    try {
      const response = await axios.get(`${REZ_MIND_URL}/api/intent/dormant`, {
        params: { days: daysInactive, limit: 100 },
        timeout: 5000,
      });
      return response.data.users || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[ReZMind] Failed to get dormant users', { error: errorMessage });
      return [];
    }
  }

  /**
   * Trigger nudge
   */
  async triggerNudge(data: {
    userId: string;
    nudgeType: 'push' | 'sms' | 'email' | 'whatsapp';
    template: string;
    channel: 'do-app';
  }): Promise<{ success: boolean; nudgeId?: string }> {
    try {
      const response = await axios.post(`${REZ_MIND_URL}/api/intent/revive`, {
        userId: data.userId,
        nudgeType: data.nudgeType,
        template: data.template,
        channel: data.channel,
        source: 'do-app',
      }, {
        timeout: 5000,
      });
      return {
        success: response.data?.success !== false,
        nudgeId: response.data?.nudgeId,
        error: response.data?.message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[ReZMind] Failed to trigger nudge', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sync user profile
   */
  async syncUserProfile(userId: string, profile: {
    totalSpent: number;
    transactionCount: number;
    karmaTier: string;
    coins: number;
    categories: string[];
  }): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(`${REZ_MIND_URL}/api/user/${userId}/profile`, {
        ...profile,
        source: 'do-app',
      }, {
        timeout: 5000,
      });
      return { success: response.data?.success !== false, error: response.data?.message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('[ReZMind] Profile sync failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get cross-app intelligence
   */
  async getUserIntelligence(userId: string): Promise<{
    intents: string[];
    preferences: string[];
    predictedNextIntent?: string;
    dormantRisk: number;
  } | null> {
    try {
      const response = await axios.get(`${REZ_MIND_URL}/api/intelligence/${userId}`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('[ReZMind] Failed to get user intelligence', { error: errorMessage });
      return null;
    }
  }

  /**
   * Flush queued events
   */
  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      try {
        if ('intent' in event) {
          await axios.post(`${REZ_MIND_URL}/api/intent/capture`, event, { timeout: 3000 });
        } else if ('transactionId' in event) {
          await axios.post(`${REZ_EVENT_URL}/api/event/transaction`, event, { timeout: 3000 });
        } else {
          await axios.post(`${REZ_EVENT_URL}/api/event/engagement`, event, { timeout: 3000 });
        }
      } catch (error) {
        // Re-queue failed events
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.eventQueue.push(event);
        logger.warn('[ReZMind] Failed to flush event', { error: errorMessage });
      }
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    // Flush remaining
    this.flushQueue();
  }
}

// Export singleton
export const rezMindIntegration = new ReZMindIntegration();
export default rezMindIntegration;
