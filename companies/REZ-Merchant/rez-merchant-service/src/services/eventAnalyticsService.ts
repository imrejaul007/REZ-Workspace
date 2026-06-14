import mongoose, { Types } from 'mongoose';
import { EventAnalytics, IEventAnalytics } from '../models/EventAnalytics';
import { Event } from '../models/Event';

/**
 * EventReport - Aggregated analytics report for an event.
 */
export interface EventReport {
  eventId: string;
  eventTitle: string;
  totalTicketsSold: number;
  totalTicketsAvailable: number;
  totalRevenue: number;
  totalCheckins: number;
  totalNoShows: number;
  totalRefunds: number;
  totalRefundAmount: number;
  avgTicketPrice: number;
  occupancyRate: number;
  conversionRate: number;
  refundRate: number;
  dailyBreakdown: Array<{
    date: Date;
    ticketsSold: number;
    revenue: number;
    checkins: number;
  }>;
}

export class EventAnalyticsService {
  /**
   * Get the start of day for a given date (UTC).
   */
  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get or create analytics record for an event on a specific date.
   */
  private async getOrCreateAnalytics(eventId: Types.ObjectId, storeId: Types.ObjectId, date: Date): Promise<IEventAnalytics> {
    const startOfDay = this.getStartOfDay(date);

    let analytics = await EventAnalytics.findOne({ eventId, date: startOfDay });

    if (!analytics) {
      const event = await Event.findById(eventId);
      const ticketsAvailable = event?.maxTickets || 0;

      analytics = new EventAnalytics({
        eventId,
        storeId,
        date: startOfDay,
        ticketsAvailable,
        ticketsSold: 0,
        revenue: 0,
        checkins: 0,
        noShows: 0,
        refunds: 0,
        refundAmount: 0,
        avgTicketPrice: 0,
        occupancyRate: 0,
      });
    }

    return analytics;
  }

  /**
   * Recalculate derived metrics after data changes.
   */
  private async recalculateMetrics(analytics: IEventAnalytics): Promise<void> {
    const { ticketsSold, revenue, ticketsAvailable, checkins } = analytics;

    // Calculate average ticket price
    analytics.avgTicketPrice = ticketsSold > 0 ? revenue / ticketsSold : 0;

    // Calculate occupancy rate (based on tickets sold vs available)
    analytics.occupancyRate = ticketsAvailable > 0
      ? (ticketsSold / ticketsAvailable) * 100
      : 0;

    // Checkin rate (checkins vs tickets sold)
    // This could be stored as a separate field if needed
  }

  /**
   * Track a ticket sale for an event.
   */
  async trackSale(eventId: string, amount: number): Promise<void> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const storeId = new Types.ObjectId(event.storeId as string);
    const now = new Date();
    const analytics = await this.getOrCreateAnalytics(
      new Types.ObjectId(eventId),
      storeId,
      now
    );

    analytics.ticketsSold += 1;
    analytics.revenue += amount;

    await this.recalculateMetrics(analytics);
    await analytics.save();
  }

  /**
   * Track a checkin for an event.
   */
  async trackCheckin(eventId: string): Promise<void> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const storeId = new Types.ObjectId(event.storeId as string);
    const now = new Date();
    const analytics = await this.getOrCreateAnalytics(
      new Types.ObjectId(eventId),
      storeId,
      now
    );

    analytics.checkins += 1;
    await analytics.save();
  }

  /**
   * Track a no-show for an event.
   */
  async trackNoShow(eventId: string): Promise<void> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const storeId = new Types.ObjectId(event.storeId as string);
    const now = new Date();
    const analytics = await this.getOrCreateAnalytics(
      new Types.ObjectId(eventId),
      storeId,
      now
    );

    analytics.noShows += 1;
    await analytics.save();
  }

  /**
   * Track a refund for an event.
   */
  async trackRefund(eventId: string, amount: number): Promise<void> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const storeId = new Types.ObjectId(event.storeId as string);
    const now = new Date();
    const analytics = await this.getOrCreateAnalytics(
      new Types.ObjectId(eventId),
      storeId,
      now
    );

    analytics.refunds += 1;
    analytics.refundAmount += amount;
    analytics.revenue -= amount;
    analytics.ticketsSold = Math.max(0, analytics.ticketsSold - 1);

    await this.recalculateMetrics(analytics);
    await analytics.save();
  }

  /**
   * Get aggregated analytics for an event across all dates.
   */
  async getEventAnalytics(eventId: string): Promise<IEventAnalytics | null> {
    const analytics = await EventAnalytics.find({ eventId: new Types.ObjectId(eventId) });

    if (!analytics || analytics.length === 0) {
      return null;
    }

    // Aggregate all daily records into a single summary
    const summary = analytics.reduce(
      (acc, day) => ({
        eventId: day.eventId,
        storeId: day.storeId,
        date: day.date,
        ticketsSold: acc.ticketsSold + day.ticketsSold,
        ticketsAvailable: Math.max(acc.ticketsAvailable, day.ticketsAvailable),
        revenue: acc.revenue + day.revenue,
        checkins: acc.checkins + day.checkins,
        noShows: acc.noShows + day.noShows,
        refunds: acc.refunds + day.refunds,
        refundAmount: acc.refundAmount + day.refundAmount,
        avgTicketPrice: 0,
        occupancyRate: 0,
        createdAt: day.createdAt,
        updatedAt: day.updatedAt,
      }),
      {
        eventId: new Types.ObjectId(eventId),
        storeId: new Types.ObjectId(),
        date: new Date(),
        ticketsSold: 0,
        ticketsAvailable: 0,
        revenue: 0,
        checkins: 0,
        noShows: 0,
        refunds: 0,
        refundAmount: 0,
        avgTicketPrice: 0,
        occupancyRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IEventAnalytics
    );

    // Calculate final metrics
    summary.avgTicketPrice = summary.ticketsSold > 0
      ? summary.revenue / summary.ticketsSold
      : 0;
    summary.occupancyRate = summary.ticketsAvailable > 0
      ? (summary.ticketsSold / summary.ticketsAvailable) * 100
      : 0;

    return summary;
  }

  /**
   * Get analytics for a specific event on a specific date.
   */
  async getDailyAnalytics(eventId: string, date: Date): Promise<IEventAnalytics | null> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    return EventAnalytics.findOne({
      eventId: new Types.ObjectId(eventId),
      date: startOfDay,
    });
  }

  /**
   * Get a comprehensive report for an event.
   */
  async getEventReport(eventId: string): Promise<EventReport> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const analytics = await EventAnalytics.find({ eventId: new Types.ObjectId(eventId) })
      .sort({ date: 1 });

    const totals = analytics.reduce(
      (acc, day) => ({
        ticketsSold: acc.ticketsSold + day.ticketsSold,
        ticketsAvailable: Math.max(acc.ticketsAvailable, day.ticketsAvailable),
        revenue: acc.revenue + day.revenue,
        checkins: acc.checkins + day.checkins,
        noShows: acc.noShows + day.noShows,
        refunds: acc.refunds + day.refunds,
        refundAmount: acc.refundAmount + day.refundAmount,
      }),
      {
        ticketsSold: 0,
        ticketsAvailable: event.maxTickets || 0,
        revenue: 0,
        checkins: 0,
        noShows: 0,
        refunds: 0,
        refundAmount: 0,
      }
    );

    const avgTicketPrice = totals.ticketsSold > 0
      ? totals.revenue / totals.ticketsSold
      : 0;
    const occupancyRate = totals.ticketsAvailable > 0
      ? (totals.ticketsSold / totals.ticketsAvailable) * 100
      : 0;
    const conversionRate = totals.ticketsAvailable > 0
      ? (totals.ticketsSold / totals.ticketsAvailable) * 100
      : 0;
    const refundRate = totals.ticketsSold > 0
      ? (totals.refunds / totals.ticketsSold) * 100
      : 0;

    const dailyBreakdown = analytics.map((day) => ({
      date: day.date,
      ticketsSold: day.ticketsSold,
      revenue: day.revenue,
      checkins: day.checkins,
    }));

    return {
      eventId,
      eventTitle: event.title || 'Untitled Event',
      totalTicketsSold: totals.ticketsSold,
      totalTicketsAvailable: totals.ticketsAvailable,
      totalRevenue: totals.revenue,
      totalCheckins: totals.checkins,
      totalNoShows: totals.noShows,
      totalRefunds: totals.refunds,
      totalRefundAmount: totals.refundAmount,
      avgTicketPrice,
      occupancyRate,
      conversionRate,
      refundRate,
      dailyBreakdown,
    };
  }
}

// Singleton instance
let instance: EventAnalyticsService | null = null;

export function getEventAnalyticsService(): EventAnalyticsService {
  if (!instance) {
    instance = new EventAnalyticsService();
  }
  return instance;
}

export const eventAnalyticsService = getEventAnalyticsService();
