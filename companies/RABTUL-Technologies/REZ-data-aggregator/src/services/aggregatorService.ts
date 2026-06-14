/**
 * Data Aggregator Service
 * Collects events from all services
 */

import { Event, DailyAggregate, CustomerTimeline } from '../models';
import { v4 as uuid } from 'uuid';

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

interface EventInput {
  source: {
    service: string;
    instance?: string;
  };
  type: {
    category: string;
    action: string;
    object: string;
  };
  customerId?: string;
  sessionId?: string;
  userId?: string;
  entity?: {
    type: string;
    id: string;
  };
  data?;
  revenue?: {
    amount: number;
    currency?: string;
  };
  location?: {
    country?: string;
    state?: string;
    city?: string;
    pincode?: string;
  };
  device?: {
    type?: string;
    os?: string;
    browser?: string;
  };
  attribution?: {
    source?: string;
    medium?: string;
    campaign?: string;
    channel?: string;
  };
  timestamp?: Date;
}

class AggregatorService {
  /**
   * Record an event
   */
  async recordEvent(input: EventInput): Promise<string> {
    const eventId = `evt_${uuid()}`;

    await Event.create({
      eventId,
      ...input,
      timestamp: input.timestamp || new Date(),
    });

    // Update customer timeline
    if (input.customerId) {
      await this.updateTimeline(input.customerId, {
        eventId,
        type: `${input.type.category}.${input.type.action}`,
        timestamp: input.timestamp || new Date(),
        data: input.data,
      });
    }

    return eventId;
  }

  /**
   * Record batch events
   */
  async recordBatch(inputs: EventInput[]): Promise<{ recorded: number }> {
    const events = inputs.map(input => ({
      eventId: `evt_${uuid()}`,
      ...input,
      timestamp: input.timestamp || new Date(),
    }));

    await Event.insertMany(events);

    // Update timelines
    for (const event of events) {
      if (event.customerId) {
        await this.updateTimeline(event.customerId, {
          eventId: event.eventId,
          type: `${event.type.category}.${event.type.action}`,
          timestamp: event.timestamp,
          data: event.data,
        });
      }
    }

    return { recorded: events.length };
  }

  /**
   * Update customer timeline
   */
  private async updateTimeline(customerId: string, event): Promise<void> {
    await CustomerTimeline.findOneAndUpdate(
      { customerId },
      {
        $push: {
          events: {
            $each: [event],
            $slice: -100, // Keep last 100 events
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
  }

  /**
   * Get customer journey
   */
  async getCustomerJourney(customerId: string): Promise<unknown[]> {
    const timeline = await CustomerTimeline.findOne({ customerId });
    return timeline?.events || [];
  }

  /**
   * Get daily aggregates
   */
  async getDailyAggregate(date: Date): Promise<unknown> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all events for the day
    const events = await Event.find({
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    });

    // Aggregate
    const aggregate = {
      date,
      customers: this.aggregateCustomers(events),
      revenue: this.aggregateRevenue(events),
      orders: this.aggregateOrders(events),
      engagement: this.aggregateEngagement(events),
      byChannel: this.aggregateByChannel(events),
      byDevice: this.aggregateByDevice(events),
    };

    return aggregate;
  }

  /**
   * Aggregate customers
   */
  private aggregateCustomers(events: unknown[]): unknown {
    const customerIds = [...new Set(events.map(e => e.customerId).filter(Boolean)];
    return {
      total: customerIds.length,
      new: 0, // Would need first-seen logic
      active: customerIds.length,
      returning: 0,
    };
  }

  /**
   * Aggregate revenue
   */
  private aggregateRevenue(events: unknown[]): unknown {
    const revenueEvents = events.filter(e => e.revenue?.amount);
    const total = revenueEvents.reduce((sum, e) => sum + e.revenue.amount, 0);
    const refundEvents = events.filter(e => e.type.action === 'refunded');
    const refunds = refundEvents.reduce((sum, e) => sum + e.revenue?.amount || 0, 0);

    return {
      gross: total + refunds,
      net: total,
      avgOrderValue: revenueEvents.length > 0 ? total / revenueEvents.length : 0,
      refunds,
    };
  }

  /**
   * Aggregate orders
   */
  private aggregateOrders(events: unknown[]): unknown {
    const orders = events.filter(e => e.type.object === 'order');
    return {
      total: orders.length,
      completed: orders.filter(e => e.type.action === 'completed').length,
      pending: orders.filter(e => e.type.action === 'created').length,
      cancelled: orders.filter(e => e.type.action === 'cancelled').length,
      cod: orders.filter(e => e.data?.paymentMethod === 'cod').length,
      prepaid: orders.filter(e => e.data?.paymentMethod !== 'cod').length,
    };
  }

  /**
   * Aggregate engagement
   */
  private aggregateEngagement(events: unknown[]): unknown {
    const sessions = events.filter(e => e.type.category === 'session');
    const pageViews = events.filter(e => e.type.category === 'pageview');
    return {
      sessions: sessions.length,
      pageViews: pageViews.length,
      avgSessionDuration: 0,
    };
  }

  /**
   * Aggregate by channel
   */
  private aggregateByChannel(events: unknown[]): unknown {
    const channels = ['organic', 'paid', 'social', 'referral', 'direct'];
    const result: unknown = {};

    for (const channel of channels) {
      result[channel] = events.filter(
        e => e.attribution?.channel === channel
      ).length;
    }

    return result;
  }

  /**
   * Aggregate by device
   */
  private aggregateByDevice(events: unknown[]): unknown {
    return {
      mobile: events.filter(e => e.device?.type === 'mobile').length,
      desktop: events.filter(e => e.device?.type === 'desktop').length,
      tablet: events.filter(e => e.device?.type === 'tablet').length,
    };
  }

  /**
   * Query events
   */
  async queryEvents(filters: {
    customerId?: string;
    type?: { category?: string; action?: string };
    entity?: { type?: string };
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<unknown[]> {
    const query: unknown = {};

    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.type?.category) query['type.category'] = filters.type.category;
    if (filters.type?.action) query['type.action'] = filters.type.action;
    if (filters.entity?.type) query['entity.type'] = filters.entity.type;
    if (filters.from || filters.to) {
      query.timestamp = {};
      if (filters.from) query.timestamp.$gte = filters.from;
      if (filters.to) query.timestamp.$lte = filters.to;
    }

    return Event.find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100);
  }
}

export const aggregatorService = new AggregatorService();
