import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, eachDayOfInterval, format, parseISO, addDays, isSameDay } from 'date-fns';
import { CalendarEvent, CalendarView, CalendarSettings, ICalendarEvent, ICalendarView, ICalendarStats, CalendarEventDocument, DefaultViewType } from '../models/index.js';
import { platformColors, defaultWorkingHours } from '../config/index.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateEventInput {
  postId: string;
  platform: string;
  accountId: string;
  date: Date;
  time: string;
  content: string;
  mediaPreview?: string;
  assignee?: string;
  createdBy: string;
}

export interface UpdateEventInput {
  date?: Date;
  time?: string;
  content?: string;
  mediaPreview?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  assignee?: string;
  color?: string;
}

export interface BulkMoveInput {
  eventIds: string[];
  newDate: Date;
  newTime?: string;
}

export interface CalendarQueryParams {
  userId: string;
  startDate: Date;
  endDate: Date;
  view: 'month' | 'week' | 'day';
  platform?: string;
  status?: string;
}

export class CalendarService {
  async createEvent(input: CreateEventInput): Promise<ICalendarEvent> {
    const color = platformColors[input.platform.toLowerCase()] || platformColors.default;

    const event = new CalendarEvent({
      postId: input.postId,
      platform: input.platform,
      accountId: input.accountId,
      date: input.date,
      time: input.time,
      content: input.content,
      mediaPreview: input.mediaPreview,
      status: 'draft',
      assignee: input.assignee,
      color,
      createdBy: input.createdBy,
    });

    await event.save();
    logger.info('Event created', { eventId: event.id, postId: event.postId });

    return event.toJSON() as ICalendarEvent;
  }

  async getEvent(eventId: string): Promise<ICalendarEvent> {
    const event = await CalendarEvent.findOne({ id: eventId });
    if (!event) {
      throw new NotFoundError(`Event ${eventId} not found`);
    }
    return event.toJSON() as ICalendarEvent;
  }

  async updateEvent(eventId: string, input: UpdateEventInput): Promise<ICalendarEvent> {
    const event = await CalendarEvent.findOne({ id: eventId });
    if (!event) {
      throw new NotFoundError(`Event ${eventId} not found`);
    }

    if (input.date) event.date = input.date;
    if (input.time) event.time = input.time;
    if (input.content !== undefined) event.content = input.content;
    if (input.mediaPreview !== undefined) event.mediaPreview = input.mediaPreview;
    if (input.status) event.status = input.status;
    if (input.assignee !== undefined) event.assignee = input.assignee;
    if (input.color) event.color = input.color;

    await event.save();
    logger.info('Event updated', { eventId: event.id });

    return event.toJSON() as ICalendarEvent;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const result = await CalendarEvent.deleteOne({ id: eventId });
    if (result.deletedCount === 0) {
      throw new NotFoundError(`Event ${eventId} not found`);
    }
    logger.info('Event deleted', { eventId });
  }

  async getCalendarView(params: CalendarQueryParams): Promise<ICalendarView> {
    const query: Record<string, unknown> = {
      date: {
        $gte: params.startDate,
        $lte: params.endDate,
      },
    };

    if (params.platform) {
      query.platform = params.platform;
    }

    if (params.status) {
      query.status = params.status;
    }

    const events = await CalendarEvent.find(query).sort({ date: 1, time: 1 });
    const stats = await this.calculateStats(params.startDate, params.endDate);

    return {
      userId: params.userId,
      startDate: params.startDate,
      endDate: params.endDate,
      view: params.view,
      events: events.map(e => e.toJSON() as ICalendarEvent),
      stats,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getMonthView(userId: string, date: Date): Promise<ICalendarView> {
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);
    return this.getCalendarView({ userId, startDate, endDate, view: 'month' });
  }

  async getWeekView(userId: string, date: Date): Promise<ICalendarView> {
    const startDate = startOfWeek(date, { weekStartsOn: 0 });
    const endDate = endOfWeek(date, { weekStartsOn: 0 });
    return this.getCalendarView({ userId, startDate, endDate, view: 'week' });
  }

  async getDayView(userId: string, date: Date): Promise<ICalendarView> {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);
    return this.getCalendarView({ userId, startDate, endDate, view: 'day' });
  }

  async bulkMoveEvents(input: BulkMoveInput): Promise<ICalendarEvent[]> {
    const events = await CalendarEvent.find({ id: { $in: input.eventIds } });

    if (events.length !== input.eventIds.length) {
      throw new ValidationError('Some events were not found');
    }

    const updatedEvents: ICalendarEvent[] = [];

    for (const event of events) {
      event.date = input.newDate;
      if (input.newTime) {
        event.time = input.newTime;
      }
      await event.save();
      updatedEvents.push(event.toJSON() as ICalendarEvent);
    }

    logger.info('Bulk move completed', { count: updatedEvents.length });
    return updatedEvents;
  }

  async checkConflicts(date: Date, time: string, excludeEventId?: string): Promise<ICalendarEvent[]> {
    const query: Record<string, unknown> = {
      date,
      time,
    };

    if (excludeEventId) {
      query.id = { $ne: excludeEventId };
    }

    const conflicts = await CalendarEvent.find(query);
    return conflicts.map(e => e.toJSON() as ICalendarEvent);
  }

  async getSuggestions(userId: string, platform: string, count: number = 5): Promise<{ date: Date; time: string; score: number }[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalEvents = await CalendarEvent.find({
      createdBy: userId,
      platform,
      status: 'published',
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    const timeSlots: Record<string, number> = {};
    const daySlots: Record<string, number> = {};

    historicalEvents.forEach(event => {
      const dayName = format(event.date, 'EEEE');
      const hour = parseInt(event.time.split(':')[0], 10);

      const dayKey = dayName;
      const timeKey = `${hour}:00`;

      daySlots[dayKey] = (daySlots[dayKey] || 0) + 1;
      timeSlots[timeKey] = (timeSlots[timeKey] || 0) + 1;
    });

    const bestDay = Object.entries(daySlots).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Monday';
    const bestHour = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0]?.[0] || '10:00';

    const suggestions: { date: Date; time: string; score: number }[] = [];
    const nextWeek = new Date();

    for (let i = 1; i <= 14 && suggestions.length < count; i++) {
      const checkDate = addDays(nextWeek, i);
      if (format(checkDate, 'EEEE') === bestDay) {
        suggestions.push({
          date: checkDate,
          time: bestHour,
          score: 85 + Math.random() * 15,
        });
      }
    }

    return suggestions;
  }

  async getStats(startDate: Date, endDate: Date): Promise<ICalendarStats> {
    return this.calculateStats(startDate, endDate);
  }

  async getOverdueEvents(): Promise<ICalendarEvent[]> {
    const today = startOfDay(new Date());
    const events = await CalendarEvent.find({
      date: { $lt: today },
      status: { $in: ['draft', 'scheduled'] },
    });
    return events.map(e => e.toJSON() as ICalendarEvent);
  }

  async exportToICal(startDate: Date, endDate: Date): Promise<string> {
    const events = await CalendarEvent.find({
      date: { $gte: startDate, $lte: endDate },
    });

    let ical = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//AdBazaar//Content Calendar//EN\r\n';

    for (const event of events) {
      const startDateStr = format(event.date, 'yyyyMMdd');
      const timeStr = event.time.replace(':', '').padEnd(4, '0');

      ical += 'BEGIN:VEVENT\r\n';
      ical += `DTSTART:${startDateStr}T${timeStr}00\r\n`;
      ical += `DTEND:${startDateStr}T${timeStr}00\r\n`;
      ical += `SUMMARY:${event.content.substring(0, 75)}\r\n`;
      ical += `DESCRIPTION:${event.content}\r\n`;
      ical += `UID:${event.id}@adbazaar.com\r\n`;
      ical += 'END:VEVENT\r\n';
    }

    ical += 'END:VCALENDAR\r\n';
    return ical;
  }

  async exportToCSV(startDate: Date, endDate: Date): Promise<string> {
    const events = await CalendarEvent.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1, time: 1 });

    const headers = ['ID', 'Post ID', 'Platform', 'Date', 'Time', 'Content', 'Status', 'Assignee', 'Color'];
    const rows = events.map(e => [
      e.id,
      e.postId,
      e.platform,
      format(e.date, 'yyyy-MM-dd'),
      e.time,
      `"${e.content.replace(/"/g, '""')}"`,
      e.status,
      e.assignee || '',
      e.color,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async importFromCSV(csvData: string, createdBy: string): Promise<{ imported: number; failed: number }> {
    const lines = csvData.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    let imported = 0;
    let failed = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        await this.createEvent({
          postId: row['post id'] || row['postid'] || `import-${Date.now()}`,
          platform: row['platform'] || 'instagram',
          accountId: row['accountid'] || row['account id'] || 'default',
          date: parseISO(row['date']),
          time: row['time'] || '10:00',
          content: row['content'] || '',
          assignee: row['assignee'],
          createdBy,
        });

        imported++;
      } catch {
        failed++;
      }
    }

    logger.info('CSV import completed', { imported, failed });
    return { imported, failed };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private async calculateStats(startDate: Date, endDate: Date): Promise<ICalendarStats> {
    const events = await CalendarEvent.find({
      date: { $gte: startDate, $lte: endDate },
    });

    return {
      total: events.length,
      published: events.filter(e => e.status === 'published').length,
      scheduled: events.filter(e => e.status === 'scheduled').length,
      draft: events.filter(e => e.status === 'draft').length,
    };
  }
}

export const calendarService = new CalendarService();