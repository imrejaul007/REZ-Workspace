import { Event, IEvent } from '../models/index.js';
import { CreateEventRequest, UpdateEventRequest, NearbyEventsQuery, EventType, EventStatus } from '../types/index.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

const eventLogger = logger.child({ component: 'EventService' });

export class EventService {
  /**
   * Create a new event
   */
  async createEvent(data: CreateEventRequest): Promise<IEvent> {
    try {
      const eventData = {
        ...data,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        location: {
          ...data.location,
          type: 'Point' as const,
          coordinates: data.location.coordinates
        },
        status: 'planned' as EventStatus
      };

      const event = new Event(eventData);
      await event.save();

      eventLogger.info('Event created', { eventId: event._id, name: event.name, type: event.type });
      return event;
    } catch (error) {
      eventLogger.error('Failed to create event', { error, data });
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<IEvent | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      return await Event.findById(id).lean();
    } catch (error) {
      eventLogger.error('Failed to get event by ID', { error, id });
      throw error;
    }
  }

  /**
   * Update an event
   */
  async updateEvent(id: string, data: UpdateEventRequest): Promise<IEvent | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const updateData: Record<string, unknown> = { ...data };

      // Handle date conversion
      if (data.date) {
        updateData.date = new Date(data.date);
      }
      if (data.endDate) {
        updateData.endDate = new Date(data.endDate);
      }

      const event = await Event.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (event) {
        eventLogger.info('Event updated', { eventId: id, changes: Object.keys(data) });
      }

      return event;
    } catch (error) {
      eventLogger.error('Failed to update event', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Event.findByIdAndDelete(id);
      if (result) {
        eventLogger.info('Event deleted', { eventId: id });
        return true;
      }
      return false;
    } catch (error) {
      eventLogger.error('Failed to delete event', { error, id });
      throw error;
    }
  }

  /**
   * Find events near a location
   */
  async findNearbyEvents(query: NearbyEventsQuery) {
    try {
      const { lat, lng, radius, type, startDate, endDate, status, limit, offset } = query;

      const pipeline: mongoose.PipelineStage[] = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            distanceField: 'distance',
            maxDistance: radius,
            spherical: true
          }
        }
      ];

      const matchStage: Record<string, unknown> = {};
      if (type) matchStage.type = type;
      if (status) matchStage.status = status;
      if (startDate || endDate) {
        matchStage.date = {};
        if (startDate) (matchStage.date as Record<string, Date>).$gte = new Date(startDate);
        if (endDate) (matchStage.date as Record<string, Date>).$lte = new Date(endDate);
      }

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Event.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      // Get paginated results
      pipeline.push(
        { $sort: { distance: 1 } },
        { $skip: offset },
        { $limit: limit },
        {
          $addFields: {
            distance: { $round: [{ $divide: ['$distance', 1000] }, 2] } // Convert to km
          }
        }
      );

      const events = await Event.aggregate(pipeline);

      eventLogger.info('Found nearby events', { count: events.length, total, lat, lng, radius });

      return {
        events,
        total,
        limit,
        offset,
        hasMore: offset + events.length < total
      };
    } catch (error) {
      eventLogger.error('Failed to find nearby events', { error, query });
      throw error;
    }
  }

  /**
   * Find events by type (Event Graph)
   */
  async findEventsByType(
    type: EventType,
    options: {
      startDate?: string;
      endDate?: string;
      city?: string;
      limit?: number;
    } = {}
  ) {
    try {
      const matchStage: Record<string, unknown> = { type };

      if (options.startDate || options.endDate) {
        matchStage.date = {};
        if (options.startDate) (matchStage.date as Record<string, Date>).$gte = new Date(options.startDate);
        if (options.endDate) (matchStage.date as Record<string, Date>).$lte = new Date(options.endDate);
      }
      if (options.city) matchStage['location.city'] = options.city;

      const pipeline: mongoose.PipelineStage[] = [
        { $match: matchStage },
        { $sort: { date: 1 } },
        { $limit: options.limit || 50 },
        {
          $group: {
            _id: '$type',
            events: { $push: '$$ROOT' },
            count: { $sum: 1 },
            totalFootfall: { $sum: { $ifNull: ['$expectedFootfall', 0] } },
            averageFootfall: { $avg: { $ifNull: ['$expectedFootfall', 0] } }
          }
        }
      ];

      const result = await Event.aggregate(pipeline);

      eventLogger.info('Event graph query', { type, eventCount: result[0]?.count || 0 });

      return result[0] || { _id: type, events: [], count: 0, totalFootfall: 0, averageFootfall: 0 };
    } catch (error) {
      eventLogger.error('Failed to query event graph', { error, type, options });
      throw error;
    }
  }

  /**
   * Get events statistics
   */
  async getStatistics() {
    try {
      const now = new Date();

      const pipeline: mongoose.PipelineStage[] = [
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            byType: [
              { $group: { _id: '$type', count: { $sum: 1 }, footfall: { $sum: { $ifNull: ['$expectedFootfall', 0] } } } },
              { $sort: { count: -1 } }
            ],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            upcoming: [
              { $match: { date: { $gte: now }, status: { $ne: 'cancelled' } } },
              { $count: 'count' }
            ],
            active: [
              { $match: { status: 'active' } },
              { $count: 'count' }
            ]
          }
        }
      ];

      const result = await Event.aggregate(pipeline);
      const stats = result[0];

      const eventsByType: Record<string, number> = {};
      const eventsByStatus: Record<string, number> = {};
      let totalFootfall = 0;

      stats.byType.forEach((item: { _id: string; count: number; footfall: number }) => {
        eventsByType[item._id] = item.count;
        totalFootfall += item.footfall;
      });

      stats.byStatus.forEach((item: { _id: string; count: number }) => {
        eventsByStatus[item._id] = item.count;
      });

      const totalEvents = stats.totalCount[0]?.count || 0;

      return {
        totalEvents,
        eventsByType,
        eventsByStatus,
        totalExpectedFootfall: totalFootfall,
        averageFootfall: totalEvents > 0 ? Math.round(totalFootfall / totalEvents) : 0,
        upcomingEvents: stats.upcoming[0]?.count || 0,
        activeEvents: stats.active[0]?.count || 0
      };
    } catch (error) {
      eventLogger.error('Failed to get statistics', { error });
      throw error;
    }
  }

  /**
   * Bulk create events
   */
  async bulkCreateEvents(events: CreateEventRequest[]): Promise<IEvent[]> {
    try {
      const eventsData = events.map(e => ({
        ...e,
        date: new Date(e.date),
        endDate: e.endDate ? new Date(e.endDate) : undefined,
        location: {
          ...e.location,
          type: 'Point' as const,
          coordinates: e.location.coordinates
        },
        status: 'planned' as EventStatus
      }));

      const created = await Event.insertMany(eventsData, { ordered: false });
      eventLogger.info('Bulk events created', { count: created.length });
      return created;
    } catch (error) {
      eventLogger.error('Failed to bulk create events', { error, count: events.length });
      throw error;
    }
  }

  /**
   * Update event status
   */
  async updateStatus(id: string, status: EventStatus): Promise<IEvent | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const event = await Event.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      ).lean();

      if (event) {
        eventLogger.info('Event status updated', { eventId: id, status });
      }

      return event;
    } catch (error) {
      eventLogger.error('Failed to update event status', { error, id, status });
      throw error;
    }
  }

  /**
   * Update actual footfall
   */
  async updateActualFootfall(id: string, footfall: number): Promise<IEvent | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const event = await Event.findByIdAndUpdate(
        id,
        { $set: { actualFootfall: footfall } },
        { new: true, runValidators: true }
      ).lean();

      if (event) {
        eventLogger.info('Event footfall updated', { eventId: id, footfall });
      }

      return event;
    } catch (error) {
      eventLogger.error('Failed to update footfall', { error, id, footfall });
      throw error;
    }
  }
}

export const eventService = new EventService();
