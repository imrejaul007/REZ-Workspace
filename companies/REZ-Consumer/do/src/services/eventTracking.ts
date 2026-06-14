/**
 * Complete Event Tracking Service
 * Tracks ALL user events to REZ Intelligence
 */

import { useUserStore } from '@/stores';
import { useChatStore } from '@/stores';
import { rezMind } from './rezMindService';

export type EventCategory =
  | 'chat'
  | 'discovery'
  | 'booking'
  | 'wallet'
  | 'profile'
  | 'engagement';

export interface EventData {
  [key: string]: unknown;
}

class EventTrackingService {
  private queue: Array<{ event: string; data: EventData }> = [];
  private isProcessing = false;
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    // Start flush interval
    setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Track an event
   */
  async track(event: string, data: EventData = {}): Promise<void> {
    const userId = useUserStore.getState().profile?.id;
    if (!userId) return;

    this.queue.push({ event, data });

    // Process immediately for important events
    if (this.isHighPriority(event)) {
      await this.flush();
    }
  }

  /**
   * Check if event is high priority
   */
  private isHighPriority(event: string): boolean {
    const highPriorityEvents = [
      'booking_completed',
      'booking_cancelled',
      'payment_success',
      'profile_updated',
      'style_preferences_set',
    ];
    return highPriorityEvents.includes(event);
  }

  /**
   * Flush queue to REZ Mind
   */
  async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    await Promise.all(
      batch.map(async ({ event, data }) => {
        try {
          await this.sendEvent(event, data);
        } catch (error) {
          logger.warn('Event tracking failed:', error);
        }
      })
    );

    this.isProcessing = false;
  }

  /**
   * Send single event to REZ Mind
   */
  private async sendEvent(event: string, data: EventData): Promise<void> {
    const userId = useUserStore.getState().profile?.id;
    if (!userId) return;

    const category = this.getCategory(event);
    const intentKey = this.getIntentKey(event);

    await rezMind.captureIntent({
      userId,
      appType: 'do-app',
      intentKey,
      eventType: category,
      category,
      metadata: data,
    });
  }

  /**
   * Get event category
   */
  private getCategory(event: string): string {
    if (event.startsWith('chat_')) return 'chat';
    if (event.startsWith('discovery_')) return 'discovery';
    if (event.startsWith('booking_')) return 'booking';
    if (event.startsWith('wallet_')) return 'wallet';
    if (event.startsWith('profile_')) return 'profile';
    return 'engagement';
  }

  /**
   * Get intent key
   */
  private getIntentKey(event: string): string {
    const mapping: Record<string, string> = {
      chat_message: 'chat_query',
      chat_typing_start: 'user_typing',
      chat_typing_end: 'user_stopped_typing',
      discovery_search: 'search',
      discovery_view_entity: 'entity_view',
      discovery_save_entity: 'entity_save',
      discovery_share_entity: 'entity_share',
      booking_view: 'booking_view',
      booking_start: 'booking_intent',
      booking_completed: 'booking_complete',
      booking_cancelled: 'booking_cancelled',
      payment_success: 'payment_complete',
      wallet_view: 'wallet_view',
      wallet_transaction: 'wallet_transaction',
      profile_view: 'profile_view',
      profile_update: 'profile_update',
      style_preferences_set: 'style_preference',
      onboarding_complete: 'onboarding_complete',
      app_open: 'app_open',
      app_close: 'app_close',
    };
    return mapping[event] || event;
  }

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Track chat message
   */
  async trackChatMessage(message: string, intent?: string): Promise<void> {
    await this.track('chat_message', { message, detectedIntent: intent });
  }

  /**
   * Track entity discovery
   */
  async trackEntityView(
    entityId: string,
    entityType: string,
    entityName: string,
    position: number,
    distance?: number
  ): Promise<void> {
    await this.track('discovery_view_entity', {
      entityId,
      entityType,
      entityName,
      position,
      distance,
    });
  }

  /**
   * Track entity save/bookmark
   */
  async trackEntitySave(
    entityId: string,
    entityType: string,
    entityName: string
  ): Promise<void> {
    await this.track('discovery_save_entity', {
      entityId,
      entityType,
      entityName,
    });
  }

  /**
   * Track search
   */
  async trackSearch(
    query: string,
    resultsCount: number,
    category?: string
  ): Promise<void> {
    await this.track('discovery_search', {
      query,
      resultsCount,
      category,
    });
  }

  /**
   * Track booking start
   */
  async trackBookingStart(
    entityId: string,
    entityType: string,
    entityName: string
  ): Promise<void> {
    await this.track('booking_start', {
      entityId,
      entityType,
      entityName,
    });
  }

  /**
   * Track booking completed
   */
  async trackBookingCompleted(
    bookingId: string,
    entityId: string,
    entityType: string,
    entityName: string,
    amount: number,
    karmaEarned: number
  ): Promise<void> {
    await this.track('booking_completed', {
      bookingId,
      entityId,
      entityType,
      entityName,
      amount,
      karmaEarned,
    });

    // Also send to rezMind directly for conversion tracking
    const userId = useUserStore.getState().profile?.id;
    if (userId) {
      await rezMind.captureBookingCompleted(
        userId,
        bookingId,
        entityType,
        entityName,
        amount,
        karmaEarned
      );
    }
  }

  /**
   * Track booking cancellation
   */
  async trackBookingCancelled(
    bookingId: string,
    reason?: string
  ): Promise<void> {
    await this.track('booking_cancelled', {
      bookingId,
      reason,
    });
  }

  /**
   * Track payment success
   */
  async trackPaymentSuccess(
    transactionId: string,
    amount: number,
    method: string
  ): Promise<void> {
    await this.track('payment_success', {
      transactionId,
      amount,
      method,
    });
  }

  /**
   * Track wallet transaction
   */
  async trackWalletTransaction(
    type: 'credit' | 'debit',
    amount: number,
    reason: string,
    transactionId: string
  ): Promise<void> {
    await this.track('wallet_transaction', {
      type,
      amount,
      reason,
      transactionId,
    });
  }

  /**
   * Track profile view
   */
  async trackProfileView(): Promise<void> {
    await this.track('profile_view', {});
  }

  /**
   * Track profile update
   */
  async trackProfileUpdate(fields: string[]): Promise<void> {
    await this.track('profile_update', { updatedFields: fields });
  }

  /**
   * Track style preferences set
   */
  async trackStylePreferencesSet(preferences: {
    vibes?: string[];
    occasions?: string[];
    cuisines?: string[];
  }): Promise<void> {
    await this.track('style_preferences_set', preferences);
  }

  /**
   * Track onboarding complete
   */
  async trackOnboardingComplete(): Promise<void> {
    await this.track('onboarding_complete', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track app open
   */
  async trackAppOpen(): Promise<void> {
    const sessionId = useChatStore.getState().sessionId;
    await this.track('app_open', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track app close
   */
  async trackAppClose(): Promise<void> {
    const sessionId = useChatStore.getState().sessionId;
    await this.track('app_close', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track time spent
   */
  async trackTimeSpent(screen: string, duration: number): Promise<void> {
    await this.track('engagement_time_spent', {
      screen,
      durationSeconds: duration,
    });
  }
}

export const eventTracking = new EventTrackingService();
export default eventTracking;
