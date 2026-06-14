import { v4 as uuidv4 } from 'uuid';
import { SportsEventModel, ISportsEventDocument } from '../models/sports-event.model.js';
import { SportsEventSchema, SportsEvent, EventQueryParams } from '../types/index.js';
import { eventGraphService } from './ecosystem.service.js';
import logger from '../config/logger.js';
import { eventsTrackedTotal, activeEventsGauge, dbQueryDuration } from '../config/metrics.js';

export class SportsEventService {
  async createEvent(data: SportsEvent): Promise<ISportsEventDocument> {
    const startTime = Date.now();

    try {
      const validatedData = SportsEventSchema.parse(data);
      const eventData = {
        ...validatedData,
        id: uuidv4()
      };

      const event = new SportsEventModel(eventData);
      await event.save();

      // Sync to event graph service
      await eventGraphService.syncEventToGraph(event._id.toString(), {
        name: event.name,
        sport: event.sport,
        venue: event.venue,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString()
      });

      eventsTrackedTotal.inc({ sport: event.sport, status: event.status });
      logger.info('Sports event created', { eventId: event._id, name: event.name });

      return event;
    } catch (error) {
      logger.error('Failed to create sports event', { error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'insert', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async getEventById(id: string): Promise<ISportsEventDocument | null> {
    const startTime = Date.now();

    try {
      const event = await SportsEventModel.findById(id).lean();
      return event as ISportsEventDocument | null;
    } catch (error) {
      logger.error('Failed to get event by ID', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'findOne', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async listEvents(params: EventQueryParams): Promise<{
    events: ISportsEventDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const startTime = Date.now();
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    try {
      const filter: Record<string, unknown> = {};

      if (params.sport) filter.sport = params.sport;
      if (params.status) filter.status = params.status;
      if (params.city) filter['venue.city'] = params.city;

      if (params.startDate || params.endDate) {
        filter.startDate = {};
        if (params.startDate) {
          (filter.startDate as Record<string, Date>).$gte = new Date(params.startDate);
        }
        if (params.endDate) {
          (filter.startDate as Record<string, Date>).$lte = new Date(params.endDate);
        }
      }

      const [events, total] = await Promise.all([
        SportsEventModel.find(filter)
          .sort({ startDate: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SportsEventModel.countDocuments(filter)
      ]);

      return { events: events as ISportsEventDocument[], total, page, limit };
    } catch (error) {
      logger.error('Failed to list events', { params, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async updateEvent(id: string, data: Partial<SportsEvent>): Promise<ISportsEventDocument | null> {
    const startTime = Date.now();

    try {
      const event = await SportsEventModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).lean();

      if (event) {
        eventsTrackedTotal.inc({ sport: event.sport, status: event.status });
        logger.info('Sports event updated', { eventId: id });
      }

      return event as ISportsEventDocument | null;
    } catch (error) {
      logger.error('Failed to update event', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'updateOne', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const result = await SportsEventModel.findByIdAndDelete(id);
      if (result) {
        logger.info('Sports event deleted', { eventId: id });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete event', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'deleteOne', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async getUpcomingEvents(days: number = 7): Promise<ISportsEventDocument[]> {
    const startTime = Date.now();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    try {
      const events = await SportsEventModel.find({
        startDate: { $gte: new Date(), $lte: futureDate },
        status: { $in: ['scheduled', 'live'] }
      })
        .sort({ startDate: 1 })
        .lean();

      // Update active events gauge
      for (const event of events) {
        activeEventsGauge.set(
          { sport: event.sport, city: event.venue.city },
          events.filter(e => e.sport === event.sport && e.venue.city === event.venue.city).length
        );
      }

      return events as ISportsEventDocument[];
    } catch (error) {
      logger.error('Failed to get upcoming events', { days, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async getEventsByTournament(tournament: string): Promise<ISportsEventDocument[]> {
    const startTime = Date.now();

    try {
      return await SportsEventModel.find({ tournament })
        .sort({ startDate: 1 })
        .lean() as ISportsEventDocument[];
    } catch (error) {
      logger.error('Failed to get events by tournament', { tournament, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async updateEventStatus(id: string, status: string): Promise<ISportsEventDocument | null> {
    return this.updateEvent(id, { status } as Partial<SportsEvent>);
  }
}

export const sportsEventService = new SportsEventService();