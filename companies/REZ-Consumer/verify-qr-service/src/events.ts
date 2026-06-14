/**
 * REZ Verify QR Service - Event Integration
 *
 * Publishes events to REZ Event Bus
 *
 * Events:
 * - qr.scanned
 * - qr.created
 * - warranty.activated
 * - warranty.expired
 * - claim.filed
 * - claim.resolved
 * - booking.created
 * - booking.completed
 * - express.replacement.requested
 * - express.replacement.shipped
 */

import axios from 'axios';

const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'https://REZ-event-bus.onrender.com';
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || process.env.INTERNAL_KEY || 'your-internal-token';

// Event types
export const EVENTS = {
  QR_SCANNED: 'qr.scanned',
  QR_CREATED: 'qr.created',
  WARRANTY_ACTIVATED: 'warranty.activated',
  WARRANTY_EXPIRED: 'warranty.expired',
  CLAIM_FILED: 'claim.filed',
  CLAIM_RESOLVED: 'claim.resolved',
  BOOKING_CREATED: 'booking.created',
  BOOKING_COMPLETED: 'booking.completed',
  BOOKING_CANCELLED: 'booking.cancelled',
  EXPRESS_REPLACEMENT_REQUESTED: 'express.replacement.requested',
  EXPRESS_REPLACEMENT_SHIPPED: 'express.replacement.shipped',
  EXPRESS_REPLACEMENT_DELIVERED: 'express.replacement.delivered',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_RENEWED: 'subscription.renewed'
};

// Publish event to event bus
export async function publishEvent(eventType: string, data): Promise<string | null> {
  try {
    const response = await axios.post(`${EVENT_BUS_URL}/events`, {
      event_type: eventType,
      source: 'verify-qr',
      data
    }, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    return response.data.event_id;
  } catch (error) {
    console.error(`Failed to publish event ${eventType}:`, error);
    return null;
  }
}

// Helper functions for common events
export const events = {
  // QR Events
  async qrScanned(data: {
    serial_number: string;
    user_id?: string;
    location?: { lat: number; lng: number };
    device_id?: string;
    result: 'authentic' | 'invalid' | 'flagged';
  }) {
    return publishEvent(EVENTS.QR_SCANNED, data);
  },

  async qrCreated(data: {
    serial_number: string;
    merchant_id: string;
    brand: string;
    model: string;
  }) {
    return publishEvent(EVENTS.QR_CREATED, data);
  },

  // Warranty Events
  async warrantyActivated(data: {
    warranty_id: string;
    serial_number: string;
    user_id: string;
    plan_id?: string;
    duration_months: number;
    cashback_earned?: number;
  }) {
    return publishEvent(EVENTS.WARRANTY_ACTIVATED, data);
  },

  async warrantyExpired(data: {
    warranty_id: string;
    serial_number: string;
    user_id: string;
    expired_at: string;
  }) {
    return publishEvent(EVENTS.WARRANTY_EXPIRED, data);
  },

  // Claim Events
  async claimFiled(data: {
    claim_id: string;
    warranty_id: string;
    serial_number: string;
    user_id: string;
    issue_type: string;
    service_center_id?: string;
  }) {
    return publishEvent(EVENTS.CLAIM_FILED, data);
  },

  async claimResolved(data: {
    claim_id: string;
    warranty_id: string;
    resolution: string;
    cost?: number;
    outcome: 'approved' | 'rejected' | 'repaired';
  }) {
    return publishEvent(EVENTS.CLAIM_RESOLVED, data);
  },

  // Booking Events
  async bookingCreated(data: {
    booking_id: string;
    serial_number: string;
    user_id: string;
    service_type: string;
    service_center_id: string;
    scheduled_date: string;
    estimated_cost?: number;
  }) {
    return publishEvent(EVENTS.BOOKING_CREATED, data);
  },

  async bookingCompleted(data: {
    booking_id: string;
    actual_cost?: number;
    rating?: number;
    review?: string;
  }) {
    return publishEvent(EVENTS.BOOKING_COMPLETED, data);
  },

  async bookingCancelled(data: {
    booking_id: string;
    cancelled_by: string;
    reason?: string;
  }) {
    return publishEvent(EVENTS.BOOKING_CANCELLED, data);
  },

  // Express Replacement Events
  async expressReplacementRequested(data: {
    replacement_id: string;
    claim_id: string;
    serial_number: string;
    user_id: string;
    customer_address;
    estimated_delivery: string;
  }) {
    return publishEvent(EVENTS.EXPRESS_REPLACEMENT_REQUESTED, data);
  },

  async expressReplacementShipped(data: {
    replacement_id: string;
    tracking_id: string;
    courier: string;
    estimated_delivery: string;
  }) {
    return publishEvent(EVENTS.EXPRESS_REPLACEMENT_SHIPPED, data);
  },

  async expressReplacementDelivered(data: {
    replacement_id: string;
    delivered_at: string;
    signature?: string;
  }) {
    return publishEvent(EVENTS.EXPRESS_REPLACEMENT_DELIVERED, data);
  },

  // Subscription Events
  async subscriptionCreated(data: {
    subscription_id: string;
    user_id: string;
    plan_id: string;
    plan_name: string;
    duration_months: number;
    price: number;
    auto_renew: boolean;
  }) {
    return publishEvent(EVENTS.SUBSCRIPTION_CREATED, data);
  },

  async subscriptionRenewed(data: {
    subscription_id: string;
    renewed_until: string;
    amount_charged: number;
  }) {
    return publishEvent(EVENTS.SUBSCRIPTION_RENEWED, data);
  }
};

export default events;
