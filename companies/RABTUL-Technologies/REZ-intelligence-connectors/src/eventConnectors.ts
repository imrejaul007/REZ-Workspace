import logger from './utils/logger';

/**
 * REZ Intelligence Event Connectors
 *
 * Connect existing services to the Event Bus
 *
 * This ensures:
 * - No data loss during migration
 * - Gradual rollout
 * - Backwards compatibility
 */

import axios from 'axios';

// ============================================
// Service URLs
// ============================================

const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:4025';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';

// ============================================
// Event Connector
// ============================================

export class EventConnector {
  private queue: unknown[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private retryCount = 3;
  private retryDelay = 1000;

  constructor() {
    // Start background flush
    this.startFlush();
  }

  private startFlush(): void {
    // Flush queue every second
    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error);
    }, 1000);
  }

  /**
   * Emit event (queues for batch processing)
   */
  async emit(type: string, data, context?: {
    userId?: string;
    merchantId?: string;
    correlationId?: string;
  }): Promise<void> {
    const event = {
      type,
      category: this.inferCategory(type),
      version: '1.0.0',
      source: 'event-connector',
      timestamp: new Date().toISOString(),
      data,
      ...context
    };

    this.queue.push(event);

    // Flush immediately if queue is large
    if (this.queue.length >= 100) {
      await this.flush();
    }
  }

  /**
   * Emit event immediately (synchronous)
   */
  async emitSync(type: string, data, context?: {
    userId?: string;
    merchantId?: string;
    correlationId?: string;
  }): Promise<string> {
    return this.publish(type, data, context);
  }

  private async publish(type: string, data, context?): Promise<string> {
    const event = {
      type,
      category: this.inferCategory(type),
      version: '1.0.0',
      source: 'event-connector',
      timestamp: new Date().toISOString(),
      data,
      ...context
    };

    for (let i = 0; i < this.retryCount; i++) {
      try {
        const response = await axios.post(`${EVENT_BUS_URL}/api/events`, event, {
          headers: {
            'X-Internal-Token': INTERNAL_TOKEN,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        return response.data.eventId;
      } catch (error) {
        if (i === this.retryCount - 1) {
          console.error(`[EventConnector] Failed to publish event: ${type}`, error);
          throw error;
        }
        await new Promise(r => setTimeout(r, this.retryDelay * Math.pow(2, i)));
      }
    }

    throw new Error('Failed to publish event');
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.queue.length);

    // Batch publish
    try {
      await Promise.allSettled(events.map(event => this.publish(event.type, event.data, event)));
    } catch (error) {
      // Re-queue failed events
      this.queue.unshift(...events);
      logger.error('[EventConnector] Batch publish failed, events re-queued');
    }
  }

  private inferCategory(type: string): string {
    const prefix = type.split('.')[0];
    const categoryMap: Record<string, string> = {
      'commerce': 'commerce',
      'identity': 'identity',
      'intelligence': 'intelligence',
      'notification': 'notification',
      'payment': 'payment',
      'loyalty': 'loyalty',
      'engagement': 'engagement',
      'support': 'support',
      'media': 'media'
    };
    return categoryMap[prefix] || 'system';
  }

  /**
   * Stop the connector
   */
  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    // Final flush
    await this.flush();
  }
}

// ============================================
// Commerce Event Helpers
// ============================================

export const commerceEvents = {
  orderCreated: (data, context?) =>
    eventConnector.emit('commerce.order.created', data, context),

  orderCompleted: (data, context?) =>
    eventConnector.emit('commerce.order.completed', data, context),

  orderCancelled: (data, context?) =>
    eventConnector.emit('commerce.order.cancelled', data, context),

  orderRefunded: (data, context?) =>
    eventConnector.emit('commerce.order.refunded', data, context),

  paymentCompleted: (data, context?) =>
    eventConnector.emit('commerce.payment.completed', data, context),

  paymentFailed: (data, context?) =>
    eventConnector.emit('commerce.payment.failed', data, context),

  cartUpdated: (data, context?) =>
    eventConnector.emit('commerce.cart.updated', data, context),

  cartAbandoned: (data, context?) =>
    eventConnector.emit('commerce.cart.abandoned', data, context),
};

// ============================================
// Identity Event Helpers
// ============================================

export const identityEvents = {
  userRegistered: (data, context?) =>
    eventConnector.emit('identity.user.registered', data, context),

  userLoggedIn: (data, context?) =>
    eventConnector.emit('identity.user.logged_in', data, context),

  userLoggedOut: (data, context?) =>
    eventConnector.emit('identity.user.logged_out', data, context),

  profileUpdated: (data, context?) =>
    eventConnector.emit('identity.profile.updated', data, context),

  deviceLinked: (data, context?) =>
    eventConnector.emit('identity.device.linked', data, context),

  identitiesLinked: (data, context?) =>
    eventConnector.emit('identity.identities.linked', data, context),
};

// ============================================
// Loyalty Event Helpers
// ============================================

export const loyaltyEvents = {
  pointsEarned: (data, context?) =>
    eventConnector.emit('loyalty.points.earned', data, context),

  pointsRedeemed: (data, context?) =>
    eventConnector.emit('loyalty.points.redeemed', data, context),

  tierUpgraded: (data, context?) =>
    eventConnector.emit('loyalty.tier.upgraded', data, context),

  tierDowngraded: (data, context?) =>
    eventConnector.emit('loyalty.tier.downgraded', data, context),

  referralCompleted: (data, context?) =>
    eventConnector.emit('loyalty.referral.completed', data, context),
};

// ============================================
// Engagement Event Helpers
// ============================================

export const engagementEvents = {
  pageViewed: (data, context?) =>
    eventConnector.emit('engagement.page.viewed', data, context),

  searchPerformed: (data, context?) =>
    eventConnector.emit('engagement.search.performed', data, context),

  productViewed: (data, context?) =>
    eventConnector.emit('engagement.product.viewed', data, context),

  productAddedToCart: (data, context?) =>
    eventConnector.emit('engagement.product.added_to_cart', data, context),

  productRemovedFromCart: (data, context?) =>
    eventConnector.emit('engagement.product.removed_from_cart', data, context),

  qrScanned: (data, context?) =>
    eventConnector.emit('engagement.qr.scanned', data, context),

  deeplinkOpened: (data, context?) =>
    eventConnector.emit('engagement.deeplink.opened', data, context),

  shareClicked: (data, context?) =>
    eventConnector.emit('engagement.share.clicked', data, context),
};

// ============================================
// Support Event Helpers
// ============================================

export const supportEvents = {
  ticketCreated: (data, context?) =>
    eventConnector.emit('support.ticket.created', data, context),

  ticketResolved: (data, context?) =>
    eventConnector.emit('support.ticket.resolved', data, context),

  csatSubmitted: (data, context?) =>
    eventConnector.emit('support.csat.submitted', data, context),

  escalationCreated: (data, context?) =>
    eventConnector.emit('support.escalation.created', data, context),
};

// ============================================
// Media Event Helpers
// ============================================

export const mediaEvents = {
  adImpression: (data, context?) =>
    eventConnector.emit('media.ad.impression', data, context),

  adClicked: (data, context?) =>
    eventConnector.emit('media.ad.clicked', data, context),

  adConversion: (data, context?) =>
    eventConnector.emit('media.ad.conversion', data, context),

  doohScreenViewed: (data, context?) =>
    eventConnector.emit('media.dooh.screen.viewed', data, context),
};

// ============================================
// Notification Event Helpers
// ============================================

export const notificationEvents = {
  sent: (data, context?) =>
    eventConnector.emit('notification.sent', data, context),

  delivered: (data, context?) =>
    eventConnector.emit('notification.delivered', data, context),

  opened: (data, context?) =>
    eventConnector.emit('notification.opened', data, context),

  clicked: (data, context?) =>
    eventConnector.emit('notification.clicked', data, context),
};

// ============================================
// Singleton Export
// ============================================

export const eventConnector = new EventConnector();
export default eventConnector;
