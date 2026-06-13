import { v4 as uuidv4 } from 'uuid';
import { EventTwinModel, IEventTwin } from '../models/index.js';
import {
  CreateEventTwinRequest,
  UpdateEventTwinRequest,
  UpdateTicketingRequest,
  UpdateAttendanceRequest,
  UpdateEngagementRequest,
} from '../schemas/index.js';
import { logger } from '../utils/index.js';

export interface EventTwinQuery {
  page?: number;
  limit?: number;
  event_type?: string;
  status?: string;
  venue_id?: string;
  start_date?: Date;
  end_date?: Date;
}

export interface EventTwinListResult {
  twins: IEventTwin[];
  total: number;
  page: number;
  limit: number;
}

export interface EventTwinStats {
  total_events: number;
  total_attendance: number;
  total_revenue: number;
  by_event_type: Record<string, { count: number; attendance: number }>;
  upcoming: number;
  on_sale: number;
}

export class EventTwinService {
  async create(data: CreateEventTwinRequest): Promise<IEventTwin> {
    const eventId = `event.${Date.now()}.${uuidv4().substring(0, 8)}`;
    const twinId = `twin.entertainment.event.${uuidv4()}`;

    const twin = new EventTwinModel({
      event_id: eventId,
      twin_id: twinId,
      name: data.name,
      description: data.description,
      event_type: data.event_type,
      attributes: data.attributes || {
        genre: [],
        is_private: false,
        is_virtual: false,
        is_hybrid: false,
      },
      schedule: {
        start_date_time: new Date(data.schedule.start_date_time),
        end_date_time: new Date(data.schedule.end_date_time),
        timezone: data.schedule.timezone,
        doors_open: data.schedule.doors_open,
        recurrence: data.schedule.recurrence,
      },
      venue: data.venue || {},
      ticketing: {
        total_capacity: data.ticketing?.total_capacity || 0,
        tickets_sold: 0,
        tickets_reserved: 0,
        tickets_available: data.ticketing?.total_capacity || 0,
        pricing: data.ticketing?.pricing || [],
        sales_status: 'not_started',
        waitlist_enabled: false,
        transfer_enabled: false,
      },
      attendance_metrics: {
        expected_attendance: 0,
        actual_attendance: 0,
        virtual_attendees: 0,
        no_show_rate: 0,
        avg_dwell_time: 0,
        peak_attendance: 0,
        avg_check_in_time: 0,
      },
      engagement_metrics: {
        social_mentions: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        qr_scans: 0,
        content_views: 0,
        ticket_resales: 0,
      },
      sponsorships: [],
      relationships: data.relationships || {
        venues: [],
        creators: [],
        content: [],
        audiences: [],
      },
    });

    await twin.save();
    logger.info('Event twin created', { event_id: eventId, twin_id: twinId });
    return twin;
  }

  async getById(id: string): Promise<IEventTwin | null> {
    return EventTwinModel.findOne({
      $or: [{ event_id: id }, { twin_id: id }, { _id: id }],
    });
  }

  async list(query: EventTwinQuery): Promise<EventTwinListResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (query.event_type) filter.event_type = query.event_type;
    if (query.status) filter['ticketing.sales_status'] = query.status;
    if (query.venue_id) filter['relationships.venues.venue_id'] = query.venue_id;
    if (query.start_date) filter['schedule.start_date_time'] = { $gte: query.start_date };
    if (query.end_date) filter['schedule.end_date_time'] = { $lte: query.end_date };

    const [twins, total] = await Promise.all([
      EventTwinModel.find(filter).skip(skip).limit(limit).sort({ 'schedule.start_date_time': 1 }),
      EventTwinModel.countDocuments(filter),
    ]);

    return { twins, total, page, limit };
  }

  async update(id: string, data: UpdateEventTwinRequest): Promise<IEventTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.name) twin.name = data.name;
    if (data.description !== undefined) twin.description = data.description;
    if (data.attributes) {
      if (data.attributes.category !== undefined) twin.attributes.category = data.attributes.category;
      if (data.attributes.genre) twin.attributes.genre = data.attributes.genre;
      if (data.attributes.age_restriction !== undefined) twin.attributes.age_restriction = data.attributes.age_restriction;
      if (data.attributes.dress_code !== undefined) twin.attributes.dress_code = data.attributes.dress_code;
    }
    if (data.schedule) {
      if (data.schedule.start_date_time) twin.schedule.start_date_time = new Date(data.schedule.start_date_time);
      if (data.schedule.end_date_time) twin.schedule.end_date_time = new Date(data.schedule.end_date_time);
      if (data.schedule.timezone !== undefined) twin.schedule.timezone = data.schedule.timezone;
      if (data.schedule.doors_open !== undefined) twin.schedule.doors_open = data.schedule.doors_open;
    }

    twin.version += 1;
    await twin.save();
    logger.info('Event twin updated', { event_id: twin.event_id });
    return twin;
  }

  async updateTicketing(id: string, data: UpdateTicketingRequest): Promise<IEventTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.tickets_sold !== undefined) twin.ticketing.tickets_sold = data.tickets_sold;
    if (data.tickets_reserved !== undefined) twin.ticketing.tickets_reserved = data.tickets_reserved;
    if (data.tickets_available !== undefined) twin.ticketing.tickets_available = data.tickets_available;
    if (data.sales_status) twin.ticketing.sales_status = data.sales_status;
    if (data.pricing) twin.ticketing.pricing = data.pricing;

    twin.version += 1;
    await twin.save();
    logger.info('Event ticketing updated', { event_id: twin.event_id });
    return twin;
  }

  async updateAttendance(id: string, data: UpdateAttendanceRequest): Promise<IEventTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.actual_attendance !== undefined) twin.attendance_metrics.actual_attendance = data.actual_attendance;
    if (data.virtual_attendees !== undefined) twin.attendance_metrics.virtual_attendees = data.virtual_attendees;
    if (data.no_show_rate !== undefined) twin.attendance_metrics.no_show_rate = data.no_show_rate;
    if (data.avg_dwell_time !== undefined) twin.attendance_metrics.avg_dwell_time = data.avg_dwell_time;
    if (data.peak_attendance !== undefined) twin.attendance_metrics.peak_attendance = data.peak_attendance;

    twin.version += 1;
    await twin.save();
    logger.info('Event attendance updated', { event_id: twin.event_id });
    return twin;
  }

  async updateEngagement(id: string, data: UpdateEngagementRequest): Promise<IEventTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.social_mentions !== undefined) twin.engagement_metrics.social_mentions = data.social_mentions;
    if (data.sentiment) {
      if (data.sentiment.positive !== undefined) twin.engagement_metrics.sentiment.positive = data.sentiment.positive;
      if (data.sentiment.neutral !== undefined) twin.engagement_metrics.sentiment.neutral = data.sentiment.neutral;
      if (data.sentiment.negative !== undefined) twin.engagement_metrics.sentiment.negative = data.sentiment.negative;
    }
    if (data.qr_scans !== undefined) twin.engagement_metrics.qr_scans = data.qr_scans;
    if (data.content_views !== undefined) twin.engagement_metrics.content_views = data.content_views;
    if (data.ticket_resales !== undefined) twin.engagement_metrics.ticket_resales = data.ticket_resales;

    twin.version += 1;
    await twin.save();
    logger.info('Event engagement updated', { event_id: twin.event_id });
    return twin;
  }

  async delete(id: string): Promise<boolean> {
    const result = await EventTwinModel.deleteOne({
      $or: [{ event_id: id }, { twin_id: id }, { _id: id }],
    });
    return result.deletedCount > 0;
  }

  async getStats(): Promise<EventTwinStats> {
    const now = new Date();
    const pipeline = [
      { $group: { _id: '$event_type', count: { $sum: 1 }, attendance: { $sum: '$attendance_metrics.actual_attendance' } } },
    ];
    const results = await EventTwinModel.aggregate(pipeline);

    const byEventType: Record<string, { count: number; attendance: number }> = {};
    let totalEvents = 0;
    let totalAttendance = 0;
    for (const r of results) {
      byEventType[r._id] = { count: r.count, attendance: r.attendance };
      totalEvents += r.count;
      totalAttendance += r.attendance;
    }

    const [upcoming, onSale] = await Promise.all([
      EventTwinModel.countDocuments({ 'schedule.start_date_time': { $gte: now } }),
      EventTwinModel.countDocuments({ 'ticketing.sales_status': 'on_sale' }),
    ]);

    return {
      total_events: totalEvents,
      total_attendance: totalAttendance,
      total_revenue: 0,
      by_event_type: byEventType,
      upcoming,
      on_sale: onSale,
    };
  }
}

export const eventTwinService = new EventTwinService();