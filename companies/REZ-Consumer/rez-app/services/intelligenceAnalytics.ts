/**
 * Intelligence Analytics Service
 *
 * Centralized event tracking for all intelligence-related events.
 * All hooks should use this service for consistent analytics.
 *
 * Event Categories:
 * - intelligence.*: Intelligence perception events
 * - memory.*: Memory continuity events
 * - ambient.*: Ambient notification events
 * - smart_action.*: Smart action events
 * - recommendation.*: Recommendation events
 */

import apiClient from './apiClient';
import { logger } from '@/utils/logger';

const ANALYTICS_URL = process.env.EXPO_PUBLIC_ANALYTICS_URL || 'https://REZ-analytics.onrender.com';

export interface IntelligenceEvent {
  userId?: string;
  event: string;
  properties: Record<string, unknown>;
  timestamp: number;
}

// ============================================================================
// EVENT CATEGORIES
// ============================================================================

export const IntelligenceEvents = {
  // Intelligence Perception Events
  Intelligence: {
    VIEW: 'intelligence_view',
    INTERACTION: 'intelligence_interaction',
    SCORE_CALCULATED: 'intelligence_score_calculated',
    VALUE_PERCEIVED: 'intelligence_value_perceived',
  },

  // Memory Events
  Memory: {
    VIEW: 'memory_view',
    INTERACTION: 'memory_interaction',
    REFERENCE_VIEW: 'memory_reference_view',
    REFERENCE_ACTION: 'memory_reference_action',
    CREATED: 'memory_created',
    REINFORCED: 'memory_reinforced',
  },

  // Ambient Notification Events
  Ambient: {
    SENT: 'notification_sent',
    VIEWED: 'notification_viewed',
    INTERACTED: 'notification_interacted',
    DISMISSED: 'notification_dismissed',
  },

  // Smart Action Events
  SmartAction: {
    VIEW: 'smart_card_view',
    TAP: 'smart_card_tap',
    DISMISS: 'smart_card_dismiss',
    CONVERSION: 'smart_card_conversion',
  },

  // Recommendation Events
  Recommendation: {
    SHOWN: 'recommendation_shown',
    CLICKED: 'recommendation_clicked',
    CONVERTED: 'recommendation_converted',
    DISMISSED: 'recommendation_dismissed',
  },

  // Session Events
  Session: {
    START: 'intelligence_session_start',
    END: 'intelligence_session_end',
    SCORE: 'session_intelligence_score',
  },
} as const;

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class IntelligenceAnalyticsService {
  private userId: string | null = null;
  private eventQueue: IntelligenceEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_QUEUE_SIZE = 50;

  initialize(userId: string) {
    this.userId = userId;
    this.startFlushInterval();
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  reset() {
    this.userId = null;
    this.eventQueue = [];
    this.stopFlushInterval();
  }

  private startFlushInterval() {
    if (this.flushInterval) return;
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private stopFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Track an intelligence event
   */
  track(event: string, properties: Record<string, unknown> = {}) {
    if (!this.userId) {
      logger.warn('[IntelligenceAnalytics] No user ID set, event not tracked:', { event });
      return;
    }

    const fullEvent: IntelligenceEvent = {
      userId: this.userId,
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.eventQueue.push(fullEvent);

    // Flush if queue is too large
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  /**
   * Flush queued events to analytics service
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await apiClient.post(`${ANALYTICS_URL}/events/batch`, {
        events,
      });

      if (!response.success) {
        // Re-queue events on failure
        this.eventQueue.unshift(...events);
        logger.error('[IntelligenceAnalytics] Failed to flush events:', response.error);
      }
    } catch (error) {
      // Re-queue events on error
      this.eventQueue.unshift(...events);
      logger.error('[IntelligenceAnalytics] Error flushing events:', error);
    }
  }

  // Convenience methods for common events

  trackIntelligenceView(context: string, type: 'screen' | 'card' | 'notification') {
    this.track(IntelligenceEvents.Intelligence.VIEW, { context, type });
  }

  trackIntelligenceInteraction(context: string, action: string, value?: number) {
    this.track(IntelligenceEvents.Intelligence.INTERACTION, { context, action, value });
  }

  trackMemoryView(memoryId: string, memoryType: string, confidence: number) {
    this.track(IntelligenceEvents.Memory.VIEW, { memoryId, memoryType, confidence });
  }

  trackMemoryInteraction(memoryId: string, action: 'tap' | 'dismiss' | 'explore') {
    this.track(IntelligenceEvents.Memory.INTERACTION, { memoryId, action });
  }

  trackSmartActionView(cardId: string, cardType: string, priority: string) {
    this.track(IntelligenceEvents.SmartAction.VIEW, { cardId, cardType, priority });
  }

  trackSmartActionTap(cardId: string, cardType: string, timeToAction?: number) {
    this.track(IntelligenceEvents.SmartAction.TAP, { cardId, cardType, timeToAction });
  }

  trackSmartActionDismiss(cardId: string, cardType: string, reason?: string) {
    this.track(IntelligenceEvents.SmartAction.DISMISS, { cardId, cardType, reason });
  }

  trackAmbientNotificationSent(triggerType: string, category: string, priority: string) {
    this.track(IntelligenceEvents.Ambient.SENT, { triggerType, category, priority });
  }

  trackAmbientNotificationInteraction(notificationId: string, action: string) {
    this.track(IntelligenceEvents.Ambient.INTERACTED, { notificationId, action });
  }

  trackSessionScore(score: number, duration: number, metrics: Record<string, number>) {
    this.track(IntelligenceEvents.Session.SCORE, {
      score,
      duration,
      ...metrics,
    });
  }
}

// Singleton instance
export const intelligenceAnalytics = new IntelligenceAnalyticsService();

export default intelligenceAnalytics;
