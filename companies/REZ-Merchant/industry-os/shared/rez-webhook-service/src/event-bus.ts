/**
 * REZ Ecosystem Event Bus
 * Publish/Subscribe system for cross-company events
 *
 * Usage:
 * ```typescript
 * import { createEventBus, EventTypes } from './event-bus';
 *
 * const eventBus = createEventBus('rez-spa-service');
 *
 * // Subscribe to events
 * eventBus.subscribe(EventTypes.PAYMENT_COMPLETED, async (event) => {
 *   console.log('Payment completed:', event.data);
 *   // Update booking status
 * });
 *
 * // Publish events
 * await eventBus.publish(EventTypes.BOOKING_CREATED, {
 *   bookingId: 'BK-123',
 *   customerId: 'CU-456',
 *   amount: 999
 * });
 * ```
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

export enum EventTypes {
  // Auth Events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Auth Token Events
  TOKEN_CREATED = 'auth.token.created',
  TOKEN_REFRESHED = 'auth.token.refreshed',
  TOKEN_REVOKED = 'auth.token.revoked',

  // Wallet Events
  WALLET_CREATED = 'wallet.created',
  WALLET_CREDITED = 'wallet.credited',
  WALLET_DEBITED = 'wallet.debited',
  WALLET_LOW_BALANCE = 'wallet.low_balance',

  // Payment Events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Order Events (Restaurant/Retail)
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_COMPLETED = 'order.completed',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_READY = 'order.ready',

  // Booking Events
  BOOKING_CREATED = 'booking.created',
  BOOKING_UPDATED = 'booking.updated',
  BOOKING_CONFIRMED = 'booking.confirmed',
  BOOKING_CANCELLED = 'booking.cancelled',
  BOOKING_COMPLETED = 'booking.completed',
  BOOKING_NO_SHOW = 'booking.no_show',

  // Customer Events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',
  CHURN_RISK_DETECTED = 'customer.churn_risk',
  HIGH_VALUE_CUSTOMER = 'customer.high_value',

  // Inventory Events
  STOCK_LOW = 'inventory.stock_low',
  STOCK_OUT = 'inventory.stock_out',
  STOCK_RECEIVED = 'inventory.received',
  STOCK_ADJUSTED = 'inventory.adjusted',

  // Service Events
  SERVICE_CREATED = 'service.created',
  SERVICE_UPDATED = 'service.updated',
  SERVICE_BOOKED = 'service.booked',

  // Staff Events
  STAFF_CHECKIN = 'staff.checkin',
  STAFF_CHECKOUT = 'staff.checkout',
  STAFF_SCHEDULE_UPDATED = 'staff.schedule.updated',

  // Review Events
  REVIEW_CREATED = 'review.created',
  REVIEW_UPDATED = 'review.updated',
  REVIEW_DELETED = 'review.deleted',

  // Notification Events
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_FAILED = 'notification.failed',

  // AI Events
  INTENT_DETECTED = 'ai.intent_detected',
  RECOMMENDATION_GENERATED = 'ai.recommendation',
  ANALYTICS_COMPUTED = 'ai.analytics.computed',

  // Industry-Specific Events
  GUEST_CHECKIN = 'hotel.guest.checkin',
  GUEST_CHECKOUT = 'hotel.guest.checkout',
  ROOM_CLEANED = 'hotel.room.cleaned',
  VEHICLE_REGISTERED = 'automotive.vehicle.registered',
  MEMBERSHIP_ACTIVATED = 'gym.membership.activated',
  PRESCRIPTION_CREATED = 'pharmacy.prescription.created',

  // Mobility Events (KHAIRMOVE)
  RIDE_REQUESTED = 'mobility.ride.requested',
  RIDE_ACCEPTED = 'mobility.ride.accepted',
  RIDE_STARTED = 'mobility.ride.started',
  RIDE_IN_PROGRESS = 'mobility.ride.in_progress',
  RIDE_COMPLETED = 'mobility.ride.completed',
  RIDE_CANCELLED = 'mobility.ride.cancelled',
  RIDE_ARRIVED = 'mobility.ride.arrived',
  DELIVERY_REQUESTED = 'mobility.delivery.requested',
  DELIVERY_PICKED_UP = 'mobility.delivery.picked_up',
  DELIVERY_IN_TRANSIT = 'mobility.delivery.in_transit',
  DELIVERY_COMPLETED = 'mobility.delivery.completed',

  // Social Events (AXOM - BuzzLocal, Rendez)
  POST_CREATED = 'social.post.created',
  POST_LIKED = 'social.post.liked',
  POST_COMMENTED = 'social.post.commented',
  POST_SHARED = 'social.post.shared',
  USER_FOLLOWED = 'social.user.followed',
  COMMUNITY_CREATED = 'social.community.created',
  COMMUNITY_JOINED = 'social.community.joined',
  SOS_TRIGGERED = 'social.sos.triggered',
  SOS_RESOLVED = 'social.sos.resolved',
  EVENT_CREATED = 'social.event.created',
  EVENT_RSVP = 'social.event.rsvp',
  MEETUP_SCHEDULED = 'social.meetup.scheduled',
  GROUP_CREATED = 'social.group.created',
  GROUP_MEMBER_JOINED = 'social.group.member_joined',

  // AdBazaar Events (Marketing, DOOH, Creator)
  CAMPAIGN_CREATED = 'marketing.campaign.created',
  CAMPAIGN_LAUNCHED = 'marketing.campaign.launched',
  CAMPAIGN_PAUSED = 'marketing.campaign.paused',
  CAMPAIGN_COMPLETED = 'marketing.campaign.completed',
  IMPRESSION_RECORDED = 'marketing.impression.recorded',
  CLICK_RECORDED = 'marketing.click.recorded',
  CONVERSION_RECORDED = 'marketing.conversion.recorded',
  CREATOR_REGISTERED = 'marketing.creator.registered',
  CONTENT_SUBMITTED = 'marketing.content.submitted',
  CONTENT_APPROVED = 'marketing.content.approved',
  CONTENT_REJECTED = 'marketing.content.rejected',
  PAYMENT_RELEASED = 'marketing.payment.released',
  DOOH_SCREEN_REGISTERED = 'dooh.screen.registered',
  DOOH_AD_DISPLAYED = 'dooh.ad.displayed',
  DOOH_AD_CLICKED = 'dooh.ad.clicked',

  // Airzy Events (Airport)
  FLIGHT_BOOKED = 'airzy.flight.booked',
  FLIGHT_CHECKIN = 'airzy.flight.checkin',
  LOUNGE_ACCESSED = 'airzy.lounge.accessed',
  HOTEL_BOOKED = 'airzy.hotel.booked',
  TRANSFER_BOOKED = 'airzy.transfer.booked',

  // HR Events (REZ HR OS)
  EMPLOYEE_CREATED = 'hr.employee.created',
  EMPLOYEE_CHECKIN = 'hr.employee.checkin',
  EMPLOYEE_CHECKOUT = 'hr.employee.checkout',
  LEAVE_APPLIED = 'hr.leave.applied',
  LEAVE_APPROVED = 'hr.leave.approved',
  LEAVE_REJECTED = 'hr.leave.rejected',
  PAYROLL_PROCESSED = 'hr.payroll.processed',

  // Real Estate Events
  PROPERTY_LISTED = 'realestate.property.listed',
  LEAD_QUALIFIED = 'realestate.lead.qualified',
  SITE_VISIT_SCHEDULED = 'realestate.site_visit.scheduled',
  DEAL_CLOSED = 'realestate.deal.closed',

  // Manufacturing Events
  BOM_CREATED = 'manufacturing.bom.created',
  WORK_ORDER_CREATED = 'manufacturing.work_order.created',
  PRODUCTION_STARTED = 'manufacturing.production.started',
  PRODUCTION_COMPLETED = 'manufacturing.production.completed',
  QC_PASSED = 'manufacturing.qc.passed',
  QC_FAILED = 'manufacturing.qc.failed',
  MACHINE_ALERT = 'manufacturing.machine.alert',

  // REZ-Mart Events (Quick Commerce)
  MART_ORDER_CREATED = 'mart.order.created',
  MART_ORDER_CONFIRMED = 'mart.order.confirmed',
  MART_ORDER_PREPARING = 'mart.order.preparing',
  MART_ORDER_READY = 'mart.order.ready',
  MART_ORDER_PICKED_UP = 'mart.order.picked_up',
  MART_ORDER_DELIVERED = 'mart.order.delivered',
  MART_ORDER_CANCELLED = 'mart.order.cancelled',
  MART_DELIVERY_ASSIGNED = 'mart.delivery.assigned',
  MART_DELIVERY_PICKED_UP = 'mart.delivery.picked_up',
  MART_DELIVERY_IN_TRANSIT = 'mart.delivery.in_transit',
  MART_DELIVERY_ARRIVING = 'mart.delivery.arriving',
  MART_DELIVERY_COMPLETED = 'mart.delivery.completed',
  MART_DRIVER_LOCATION_UPDATED = 'mart.driver.location.updated',
  MART_OFFER_APPLIED = 'mart.offer.applied',
  MART_OFFER_EXPIRED = 'mart.offer.expired',
  MART_SUBSCRIPTION_CREATED = 'mart.subscription.created',
  MART_SUBSCRIPTION_RENEWED = 'mart.subscription.renewed',
  MART_SUBSCRIPTION_CANCELLED = 'mart.subscription.cancelled',
  MART_CART_ABANDONED = 'mart.cart.abandoned',
  MART_CART_CONVERTED = 'mart.cart.converted',

  // AdBazaar SSP Events (Supply Side Platform)
  SSP_SCREEN_REGISTERED = 'ssp.screen.registered',
  SSP_SCREEN_UPDATED = 'ssp.screen.updated',
  SSP_INVENTORY_CREATED = 'ssp.inventory.created',
  SSP_INVENTORY_BOOKED = 'ssp.inventory.booked',
  SSP_INVENTORY_RELEASED = 'ssp.inventory.released',
  SSP_BID_RECEIVED = 'ssp.bid.received',
  SSP_BID_WON = 'ssp.bid.won',
  SSP_BID_LOST = 'ssp.bid.lost',
  SSP_AUCTION_STARTED = 'ssp.auction.started',
  SSP_AUCTION_ENDED = 'ssp.auction.ended',
  SSP_REVENUE_RECORDED = 'ssp.revenue.recorded',
  SSP_PAYOUT_INITIATED = 'ssp.payout.initiated',
  SSP_PAYOUT_COMPLETED = 'ssp.payout.completed',
  SSP_ANALYTICS_IMPRESSION = 'ssp.analytics.impression',
  SSP_ANALYTICS_ENGAGEMENT = 'ssp.analytics.engagement',

  // AssetMind Events (Financial Intelligence)
  ASSET_PRICE_UPDATED = 'asset.price.updated',
  PORTFOLIO_REBALANCED = 'asset.portfolio.rebalanced',
  ALERT_TRIGGERED = 'asset.alert.triggered',
  WATCHLIST_UPDATED = 'asset.watchlist.updated',
}

export interface EcosystemEvent<T = any> {
  id: string;
  type: EventTypes;
  source: string;
  timestamp: string;
  version: string;
  data: T;
  metadata?: Record<string, any>;
}

export interface EventSubscription {
  id: string;
  eventType: EventTypes;
  callback: (event: EcosystemEvent) => Promise<void>;
  filter?: (event: EcosystemEvent) => boolean;
}

export interface EventBusConfig {
  serviceName: string;
  webhookUrl: string;
  redisUrl?: string;
  internalToken: string;
}

// ============================================
// EVENT BUS IMPLEMENTATION
// ============================================

class EventBus {
  private serviceName: string;
  private http: AxiosInstance;
  private subscriptions: Map<EventTypes, EventSubscription[]> = new Map();
  private subscriptionCounter = 0;

  constructor(config: EventBusConfig) {
    this.serviceName = config.serviceName;
    this.http = axios.create({
      baseURL: config.webhookUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalToken,
        'X-Service-Name': config.serviceName,
      },
    });
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T = any>(
    eventType: EventTypes,
    callback: (event: EcosystemEvent<T>) => Promise<void>,
    filter?: (event: EcosystemEvent<T>) => boolean
  ): string {
    const id = `sub-${++this.subscriptionCounter}-${Date.now()}`;

    const subscription: EventSubscription = {
      id,
      eventType,
      callback: callback as any,
      filter: filter as any,
    };

    const existing = this.subscriptions.get(eventType) || [];
    this.subscriptions.set(eventType, [...existing, subscription]);

    console.log(`[${this.serviceName}] Subscribed to ${eventType} (${id})`);
    return id;
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((s) => s.id !== subscriptionId);
      if (filtered.length !== subs.length) {
        this.subscriptions.set(eventType, filtered);
        console.log(`[${this.serviceName}] Unsubscribed ${subscriptionId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Publish an event
   */
  async publish<T = any>(eventType: EventTypes, data: T, metadata?: Record<string, any>): Promise<string> {
    const event: EcosystemEvent<T> = {
      id: `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      source: this.serviceName,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data,
      metadata,
    };

    try {
      // Send to central webhook service
      await this.http.post('/api/events', event);
      console.log(`[${this.serviceName}] Published ${eventType} (${event.id})`);
      return event.id;
    } catch (error: any) {
      console.error(`[${this.serviceName}] Failed to publish ${eventType}:`, error.message);
      // Still trigger local subscribers even if remote fails
      this.triggerLocalSubscribers(event);
      throw error;
    }
  }

  /**
   * Handle incoming webhook event
   */
  async handleWebhook(event: EcosystemEvent): Promise<void> {
    const subs = this.subscriptions.get(event.type) || [];

    for (const sub of subs) {
      try {
        if (sub.filter && !sub.filter(event)) {
          continue;
        }
        await sub.callback(event);
      } catch (error: any) {
        console.error(`[${this.serviceName}] Handler error for ${event.type}:`, error.message);
      }
    }
  }

  /**
   * Trigger local subscribers (for when remote fails)
   */
  private triggerLocalSubscribers(event: EcosystemEvent): void {
    const subs = this.subscriptions.get(event.type) || [];
    for (const sub of subs) {
      sub.callback(event).catch((error) => {
        console.error(`[${this.serviceName}] Local handler error:`, error.message);
      });
    }
  }

  /**
   * Get subscription stats
   */
  getStats(): { eventType: string; count: number }[] {
    return Array.from(this.subscriptions.entries()).map(([type, subs]) => ({
      eventType: type,
      count: subs.length,
    }));
  }
}

// Factory function
let eventBusInstance: EventBus | null = null;

export function createEventBus(config: EventBusConfig): EventBus {
  eventBusInstance = new EventBus(config);
  return eventBusInstance;
}

export function getEventBus(): EventBus | null {
  return eventBusInstance;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createPaymentEvent(
  orderId: string,
  amount: number,
  status: 'initiated' | 'completed' | 'failed',
  metadata?: Record<string, any>
) {
  const eventType = status === 'completed'
    ? EventTypes.PAYMENT_COMPLETED
    : status === 'failed'
      ? EventTypes.PAYMENT_FAILED
      : EventTypes.PAYMENT_INITIATED;

  return {
    orderId,
    amount,
    status,
    currency: 'INR',
    ...metadata,
  };
}

export function createBookingEvent(
  bookingId: string,
  customerId: string,
  merchantId: string,
  serviceId: string,
  status: 'created' | 'confirmed' | 'completed' | 'cancelled',
  amount?: number
) {
  const eventType = status === 'created'
    ? EventTypes.BOOKING_CREATED
    : status === 'confirmed'
      ? EventTypes.BOOKING_CONFIRMED
      : status === 'completed'
        ? EventTypes.BOOKING_COMPLETED
        : EventTypes.BOOKING_CANCELLED;

  return {
    bookingId,
    customerId,
    merchantId,
    serviceId,
    status,
    amount,
  };
}

export function createCustomerEvent(
  customerId: string,
  event: 'created' | 'updated' | 'churn_risk' | 'high_value',
  data?: Record<string, any>
) {
  const eventType = event === 'created'
    ? EventTypes.CUSTOMER_CREATED
    : event === 'updated'
      ? EventTypes.CUSTOMER_UPDATED
      : event === 'churn_risk'
        ? EventTypes.CHURN_RISK_DETECTED
        : EventTypes.HIGH_VALUE_CUSTOMER;

  return {
    customerId,
    ...data,
  };
}

export default {
  createEventBus,
  getEventBus,
  EventTypes,
};
