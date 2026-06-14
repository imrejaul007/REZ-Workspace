import { Calendar, ICalendarEvent } from '../models';
import { createChildLogger } from '../utils/logger';
import { calendarEventsGauge } from '../utils/metrics';

const logger = createChildLogger('CalendarService');

export interface CalendarEventInput {
  userId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'all';
  color?: string;
  tags?: string[];
  reminders?: Date[];
}

export class CalendarService {
  async createEvent(input: CalendarEventInput): Promise<ICalendarEvent> {
    logger.info('Creating calendar event', { userId: input.userId, title: input.title });

    const event = new Calendar({
      userId: input.userId,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      allDay: input.allDay ?? true,
      platform: input.platform || 'all',
      color: input.color || '#3B82F6',
      tags: input.tags || [],
      reminders: input.reminders || []
    });

    await event.save();
    calendarEventsGauge.inc({ platform: input.platform || 'all' });

    logger.info('Calendar event created', { eventId: event._id });
    return event;
  }

  async findById(id: string): Promise<ICalendarEvent | null> {
    return Calendar.findById(id);
  }

  async getEventsForDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    platform?: string
  ): Promise<ICalendarEvent[]> {
    const query: Record<string, unknown> = {
      userId,
      startDate: { $gte: startDate },
      endDate: { $lte: endDate }
    };

    if (platform && platform !== 'all') {
      query.platform = { $in: [platform, 'all'] };
    }

    return Calendar.find(query).sort({ startDate: 1 });
  }

  async getEventsForMonth(
    userId: string,
    year: number,
    month: number,
    platform?: string
  ): Promise<ICalendarEvent[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    return this.getEventsForDateRange(userId, startDate, endDate, platform);
  }

  async getEventsForWeek(
    userId: string,
    startOfWeek: Date,
    platform?: string
  ): Promise<ICalendarEvent[]> {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return this.getEventsForDateRange(userId, startOfWeek, endOfWeek, platform);
  }

  async updateEvent(id: string, input: Partial<CalendarEventInput>): Promise<ICalendarEvent | null> {
    return Calendar.findByIdAndUpdate(id, input, { new: true });
  }

  async deleteEvent(id: string): Promise<boolean> {
    const event = await Calendar.findById(id);
    if (event) {
      calendarEventsGauge.dec({ platform: event.platform });
 }
    const result = await Calendar.findByIdAndDelete(id);
    return !!result;
  }

  async getUpcomingEvents(userId: string, limit: number = 10): Promise<ICalendarEvent[]> {
    return Calendar.find({
      userId,
      startDate: { $gte: new Date() }
    })
      .sort({ startDate: 1 })
      .limit(limit);
  }

  async getCalendarStats(userId: string): Promise<{
    totalEvents: number;
    byPlatform: Record<string, number>;
 }> {
    const events = await Calendar.find({ userId });
    const byPlatform: Record<string, number> = {};

    events.forEach(event => {
      const platform = event.platform;
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      byPlatform
    };
  }
}

export const calendarService = new CalendarService();