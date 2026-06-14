/**
 * Attribution Tracking Service
 * Tracks conversion attribution across the funnel
 */

import { useUserStore } from '@/stores';

export type AttributionChannel =
  | 'push'
  | 'sms'
  | 'whatsapp'
  | 'email'
  | 'in_app'
  | 'chat'
  | 'organic';

export interface AttributionEvent {
  event: 'nudge_shown' | 'nudge_clicked' | 'nudge_dismissed' | 'conversion' | 'impression';
  channel: AttributionChannel;
  campaignId?: string;
  nudgeId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ConversionAttribution {
  userId: string;
  bookingId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  nudgeId?: string;
  channel: AttributionChannel;
  campaignId?: string;
  attributionWindow: {
    start: string;
    end: string;
  };
  touchpoints: Array<{
    channel: AttributionChannel;
    timestamp: string;
    campaignId?: string;
    nudgeId?: string;
  }>;
}

class AttributionService {
  private touchpoints: Map<string, AttributionEvent[]> = new Map();
  private userId: string | null = null;
  private sessionId: string | null = null;

  /**
   * Initialize with user
   */
  init(userId: string, sessionId?: string): void {
    this.userId = userId;
    this.sessionId = sessionId || this.generateSessionId();
  }

  /**
   * Generate session ID using secure random
   */
  private generateSessionId(): string {
    // Use timestamp + random hex for unique session IDs
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 11);
    return `session_${timestamp}-${randomPart}`;
  }

  /**
   * Track event
   */
  track(event: AttributionEvent): void {
    if (!this.userId) return;

    const key = this.userId;
    const events = this.touchpoints.get(key) || [];
    events.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
    this.touchpoints.set(key, events);

    // Send to REZ Mind
    this.sendToReZMind(event);
  }

  /**
   * Track nudge shown
   */
  trackNudgeShown(
    nudgeId: string,
    channel: AttributionChannel,
    campaignId?: string
  ): void {
    this.track({
      event: 'nudge_shown',
      channel,
      nudgeId,
      campaignId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track nudge clicked
   */
  trackNudgeClicked(
    nudgeId: string,
    channel: AttributionChannel,
    campaignId?: string
  ): void {
    this.track({
      event: 'nudge_clicked',
      channel,
      nudgeId,
      campaignId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track nudge dismissed
   */
  trackNudgeDismissed(nudgeId: string, channel: AttributionChannel): void {
    this.track({
      event: 'nudge_dismissed',
      channel,
      nudgeId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track conversion
   */
  async trackConversion(
    bookingId: string,
    amount: number,
    currency: string = 'INR'
  ): Promise<void> {
    if (!this.userId) return;

    const userId = this.userId;
    const events = this.touchpoints.get(userId) || [];

    // Find last click before conversion (within attribution window)
    const attributionWindowMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();
    const clicks = events.filter(
      (e) =>
        e.event === 'nudge_clicked' &&
        now - new Date(e.timestamp).getTime() < attributionWindowMs
    );

    const lastClick = clicks[clicks.length - 1];

    // Create conversion attribution
    const attribution: ConversionAttribution = {
      userId,
      bookingId,
      amount,
      currency,
      channel: lastClick?.channel || 'organic',
      campaignId: lastClick?.campaignId,
      nudgeId: lastClick?.nudgeId,
      attributionWindow: {
        start: new Date(now - attributionWindowMs).toISOString(),
        end: new Date(now).toISOString(),
      },
      touchpoints: events
        .filter(
          (e) =>
            now - new Date(e.timestamp).getTime() < attributionWindowMs
        )
        .map((e) => ({
          channel: e.channel,
          timestamp: e.timestamp,
          campaignId: e.campaignId,
          nudgeId: e.nudgeId,
        })),
    };

    // Track conversion with REZ Mind
    if (lastClick?.campaignId) {
      // Get nudges module
      const { rezMind } = await import('./rezMindService');
      await rezMind.trackConversion(lastClick.nudgeId || '', bookingId, amount);
    }

    this.track({
      event: 'conversion',
      channel: lastClick?.channel || 'organic',
      campaignId: lastClick?.campaignId,
      nudgeId: lastClick?.nudgeId,
      timestamp: new Date().toISOString(),
      metadata: { bookingId, amount, currency },
    });

    console.log('[Attribution] Conversion tracked:', attribution);
  }

  /**
   * Get touchpoints for user
   */
  getTouchpoints(): AttributionEvent[] {
    if (!this.userId) return [];
    return this.touchpoints.get(this.userId) || [];
  }

  /**
   * Get last click attribution
   */
  getLastClick(): AttributionEvent | null {
    const touchpoints = this.getTouchpoints();
    const clicks = touchpoints.filter((e) => e.event === 'nudge_clicked');
    return clicks[clicks.length - 1] || null;
  }

  /**
   * Get attribution summary
   */
  getAttributionSummary(): {
    totalImpressions: number;
    totalClicks: number;
    clickThroughRate: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    topChannel: AttributionChannel | null;
  } {
    const touchpoints = this.getTouchpoints();
    const impressions = touchpoints.filter((e) => e.event === 'nudge_shown').length;
    const clicks = touchpoints.filter((e) => e.event === 'nudge_clicked').length;
    const conversions = touchpoints.filter((e) => e.event === 'conversion').length;

    // Calculate revenue from conversion events
    const revenue = touchpoints
      .filter((e) => e.event === 'conversion')
      .reduce((sum, e) => sum + ((e.metadata?.amount as number) || 0), 0);

    // Find top channel
    const channelCounts = new Map<AttributionChannel, number>();
    touchpoints
      .filter((e) => e.event === 'nudge_clicked')
      .forEach((e) => {
        channelCounts.set(e.channel, (channelCounts.get(e.channel) || 0) + 1);
      });

    let topChannel: AttributionChannel | null = null;
    let maxCount = 0;
    channelCounts.forEach((count, channel) => {
      if (count > maxCount) {
        maxCount = count;
        topChannel = channel;
      }
    });

    return {
      totalImpressions: impressions,
      totalClicks: clicks,
      clickThroughRate: impressions > 0 ? clicks / impressions : 0,
      conversions,
      conversionRate: clicks > 0 ? conversions / clicks : 0,
      revenue,
      topChannel,
    };
  }

  /**
   * Send to REZ Mind
   */
  private async sendToReZMind(event: AttributionEvent): Promise<void> {
    try {
      const { rezMind } = await import('./rezMindService');

      if (event.event === 'conversion' && event.metadata?.bookingId) {
        // Conversion tracking
        await rezMind.trackConversion(
          event.nudgeId || '',
          event.metadata.bookingId as string,
          (event.metadata.amount as number) || 0
        );
      }
    } catch (error) {
      logger.warn('[Attribution] Send to REZ Mind failed:', error);
    }
  }

  /**
   * Clear touchpoints
   */
  clear(): void {
    if (this.userId) {
      this.touchpoints.delete(this.userId);
    }
  }
}

// ============================================
// Export
// ============================================

export const attributionService = new AttributionService();
export default attributionService;
