import logger from './utils/logger';

/**
 * REZ Mind Hotel Event Calendar Service
 *
 * Manages local events that impact hotel pricing:
 * - Festival, conference, concert, sports, exhibition, holiday events
 * - Event impact calculation for dynamic pricing
 * - Auto-trigger price updates when events are detected
 */

import { LocalEvent, ILocalEvent } from '../models/event-schemas';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LocalEventInput {
  id: string;
  name: string;
  venue: string;
  city: string;
  startDate: Date;
  endDate: Date;
  type: 'festival' | 'conference' | 'concert' | 'sports' | 'exhibition' | 'holiday';
  expectedAttendance: number;
  impact: 'low' | 'medium' | 'high';
  hotelIds: string[];
}

export interface EventImpact {
  multiplier: number;
  impact: 'low' | 'medium' | 'high';
  reason: string;
  eventId: string;
  eventName: string;
  daysUntilEvent: number;
}

// ─── Impact Multipliers ────────────────────────────────────────────────────────

const IMPACT_MULTIPLIERS: Record<string, number> = {
  low: 1.1,
  medium: 1.25,
  high: 1.5,
};

const EVENT_TYPE_MULTIPLIERS: Record<string, number> = {
  festival: 1.2,
  conference: 1.3,
  concert: 1.4,
  sports: 1.5,
  exhibition: 1.15,
  holiday: 1.35,
};

// ─── Event Calendar Service ────────────────────────────────────────────────────

export const eventCalendarService = {
  /**
   * Add a local event manually
   */
  async addEvent(event: LocalEventInput): Promise<ILocalEvent> {
    const localEvent = new LocalEvent({
      ...event,
      lastUpdated: new Date(),
    });

    await localEvent.save();
    logger.info(`[Calendar] Event added: ${event.name} in ${event.city} (${event.startDate.toISOString()} - ${event.endDate.toISOString()})`);

    return localEvent;
  },

  /**
   * Crawl for events in a city (placeholder for web scraping)
   * In production, this would integrate with:
   * - Eventbrite API
   * - Ticketmaster API
   * - Local tourism websites
   * - Web scraping services
   */
  async crawlEvents(city: string): Promise<ILocalEvent[]> {
    logger.info(`[Calendar] Crawling events for city: ${city}`);

    // Placeholder implementation - in production this would:
    // 1. Query external event APIs
    // 2. Scrape local event websites
    // 3. Aggregate and deduplicate events
    // 4. Calculate expected attendance and impact

    const crawledEvents: LocalEventInput[] = [];

    // Simulated event discovery (replace with actual API calls)
    // Example: const ticketmasterEvents = await ticketmasterApi.getEvents(city);
    // Example: const eventbriteEvents = await eventbriteApi.getEvents(city);

    if (crawledEvents.length > 0) {
      const savedEvents = await Promise.all(
        crawledEvents.map((event) => eventCalendarService.addEvent(event))
      );

      logger.info(`[Calendar] Crawled and saved ${savedEvents.length} events for ${city}`);
      return savedEvents;
    }

    logger.info(`[Calendar] No new events found for ${city}`);
    return [];
  },

  /**
   * Get events for a hotel within a date range
   */
  async getEvents(hotelId: string, startDate: Date, endDate: Date): Promise<ILocalEvent[]> {
    const events = await LocalEvent.find({
      hotelIds: hotelId,
      $or: [
        // Event overlaps with the date range
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    })
      .sort({ startDate: 1 })
      .lean();

    return events as ILocalEvent[];
  },

  /**
   * Get event impact on pricing for a specific hotel and date
   * Returns multiplier: 1.0 = no impact, 1.5 = high impact
   */
  async getEventImpact(hotelId: string, date: Date): Promise<EventImpact | null> {
    // Find events that affect this hotel on this date
    const events = await LocalEvent.find({
      hotelIds: hotelId,
      startDate: { $lte: date },
      endDate: { $gte: date },
    })
      .sort({ impact: -1, expectedAttendance: -1 }) // Highest impact first
      .limit(1)
      .lean();

    if (events.length === 0) {
      return null;
    }

    const event = events[0] as ILocalEvent;
    const baseMultiplier = IMPACT_MULTIPLIERS[event.impact];
    const typeMultiplier = EVENT_TYPE_MULTIPLIERS[event.type] || 1.0;
    const combinedMultiplier = Math.min(baseMultiplier * typeMultiplier, 2.0); // Cap at 2x

    const daysUntilEvent = Math.max(
      0,
      Math.ceil((event.startDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      multiplier: Math.round(combinedMultiplier * 100) / 100,
      impact: event.impact,
      reason: generateImpactReason(event, daysUntilEvent),
      eventId: event.id,
      eventName: event.name,
      daysUntilEvent,
    };
  },

  /**
   * Get aggregated impact for a date range
   */
  async getRangeImpact(hotelId: string, startDate: Date, endDate: Date): Promise<{
    highestImpact: EventImpact | null;
    totalEvents: number;
    peakDate: Date | null;
    peakMultiplier: number;
  }> {
    const events = await LocalEvent.find({
      hotelIds: hotelId,
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    })
      .sort({ impact: -1, expectedAttendance: -1 })
      .lean();

    if (events.length === 0) {
      return {
        highestImpact: null,
        totalEvents: 0,
        peakDate: null,
        peakMultiplier: 1.0,
      };
    }

    const impacts: Array<{ date: Date; multiplier: number }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const eventImpact = await this.getEventImpact(hotelId, currentDate);
      if (eventImpact) {
        impacts.push({
          date: new Date(currentDate),
          multiplier: eventImpact.multiplier,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const highestImpact = impacts.length > 0 ? impacts.reduce((max, curr) =>
      curr.multiplier > max.multiplier ? curr : max
    ) : null;

    return {
      highestImpact: highestImpact ? await this.getEventImpact(hotelId, highestImpact.date) : null,
      totalEvents: events.length,
      peakDate: highestImpact?.date || null,
      peakMultiplier: highestImpact?.multiplier || 1.0,
    };
  },

  /**
   * Auto-update pricing when events detected
   * Notifies pricing engine to recalculate
   */
  async triggerPriceUpdate(hotelId: string): Promise<{
    triggered: boolean;
    eventsFound: number;
    timestamp: Date;
  }> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find upcoming events in next 30 days
    const upcomingEvents = await LocalEvent.find({
      hotelIds: hotelId,
      startDate: { $gte: now, $lte: thirtyDaysFromNow },
    })
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    if (upcomingEvents.length > 0) {
      // In production, this would:
      // 1. Call the pricing service API
      // 2. Publish event to message queue (RabbitMQ, Kafka)
      // 3. Trigger batch price recalculation

      logger.info(`[Calendar] Price update triggered for hotel ${hotelId}: ${upcomingEvents.length} events detected`);

      // Example: Publish to message queue
      // await messageQueue.publish('pricing.recalculate', { hotelId, reason: 'event_calendar' });

      return {
        triggered: true,
        eventsFound: upcomingEvents.length,
        timestamp: now,
      };
    }

    return {
      triggered: false,
      eventsFound: 0,
      timestamp: now,
    };
  },

  /**
   * Get all events by city
   */
  async getEventsByCity(city: string, startDate: Date, endDate: Date): Promise<ILocalEvent[]> {
    const events = await LocalEvent.find({
      city: new RegExp(city, 'i'),
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    })
      .sort({ startDate: 1 })
      .lean();

    return events as ILocalEvent[];
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    const result = await LocalEvent.deleteOne({ id: eventId });
    return result.deletedCount > 0;
  },

  /**
   * Update an event
   */
  async updateEvent(eventId: string, updates: Partial<LocalEventInput>): Promise<ILocalEvent | null> {
    const event = await LocalEvent.findOneAndUpdate(
      { id: eventId },
      { ...updates, lastUpdated: new Date() },
      { new: true }
    );

    return event;
  },

  /**
   * Get hotels affected by a specific event
   */
  async getAffectedHotels(eventId: string): Promise<string[]> {
    const event = await LocalEvent.findOne({ id: eventId }).lean();
    return event?.hotelIds || [];
  },

  /**
   * Add a hotel to an event's affected hotels list
   */
  async addHotelToEvent(eventId: string, hotelId: string): Promise<boolean> {
    const result = await LocalEvent.updateOne(
      { id: eventId },
      {
        $addToSet: { hotelIds: hotelId },
        $set: { lastUpdated: new Date() },
      }
    );
    return result.modifiedCount > 0;
  },

  /**
   * Bulk add events (for importing from external sources)
   */
  async bulkAddEvents(events: LocalEventInput[]): Promise<{
    added: number;
    skipped: number;
    errors: string[];
  }> {
    const results = { added: 0, skipped: 0, errors: [] as string[] };

    for (const event of events) {
      try {
        // Check if event already exists
        const existing = await LocalEvent.findOne({ id: event.id });
        if (existing) {
          results.skipped++;
          continue;
        }

        await this.addEvent(event);
        results.added++;
      } catch (error) {
        results.errors.push(`Failed to add event ${event.id}: ${error.message}`);
      }
    }

    logger.info(`[Calendar] Bulk add complete: ${results.added} added, ${results.skipped} skipped, ${results.errors.length} errors`);
    return results;
  },
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

function generateImpactReason(event: ILocalEvent, daysUntilEvent: number): string {
  const reasons: string[] = [];

  // Event type impact
  switch (event.type) {
    case 'festival':
      reasons.push('local festival');
      break;
    case 'conference':
      reasons.push('business conference');
      break;
    case 'concert':
      reasons.push('concert event');
      break;
    case 'sports':
      reasons.push('sports event');
      break;
    case 'exhibition':
      reasons.push('exhibition/trade show');
      break;
    case 'holiday':
      reasons.push('public holiday');
      break;
  }

  // Attendance impact
  if (event.expectedAttendance > 50000) {
    reasons.push('major event (50k+ attendees)');
  } else if (event.expectedAttendance > 10000) {
    reasons.push('large event (10k+ attendees)');
  } else if (event.expectedAttendance > 1000) {
    reasons.push('medium event (1k+ attendees)');
  }

  // Timing impact
  if (daysUntilEvent === 0) {
    reasons.push('event happening today');
  } else if (daysUntilEvent <= 7) {
    reasons.push('event in less than a week');
  } else if (daysUntilEvent <= 30) {
    reasons.push('event within 30 days');
  }

  return reasons.join(', ');
}

// Export singleton instance for easy access
export default eventCalendarService;
