import { Conference, IConferenceDocument } from '../models';
import { CreateConferenceRequest, UpdateConferenceRequest, ConferenceFilters } from '../types';
import { logger, cacheGet, cacheSet, cacheDelete, cacheInvalidateConference, CACHE_TTL, dbOperationDuration } from '../utils';
import { conferencesCreated, activeConferences, upcomingConferences } from '../utils/metrics';

export class ConferenceService {
  /**
   * Create a new conference
   */
  async create(data: CreateConferenceRequest): Promise<IConferenceDocument> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'insert', collection: 'conferences' });

    try {
      const conference = new Conference({
        ...data,
        date: {
          start: new Date(data.date.start),
          end: new Date(data.date.end)
        },
        status: 'draft'
      });

      await conference.save();

      conferencesCreated.inc({ industry: data.industry });
      logger.info('Conference created', { conferenceId: conference._id, name: conference.name });

      return conference;
    } catch (error) {
      logger.error('Error creating conference', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      startTimer();
    }
  }

  /**
   * Get conference by ID
   */
  async getById(id: string): Promise<IConferenceDocument | null> {
    const cacheKey = `conference:${id}`;

    try {
      const cached = await cacheGet(cacheKey, 'conference');
      if (cached) {
        return JSON.parse(cached);
      }

      const startTimer = dbOperationDuration.startTimer({ operation: 'findOne', collection: 'conferences' });
      const conference = await Conference.findById(id).lean();
      startTimer();

      if (conference) {
        await cacheSet(cacheKey, JSON.stringify(conference), CACHE_TTL.CONFERENCE);
      }

      return conference as IConferenceDocument | null;
    } catch (error) {
      logger.error('Error getting conference', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * List conferences with filters
   */
  async list(filters: ConferenceFilters): Promise<{ conferences: IConferenceDocument[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `conferences:list:${JSON.stringify({ ...filters, page, limit })}`;

    try {
      const cached = await cacheGet(cacheKey, 'conferences_list');
      if (cached) {
        return JSON.parse(cached);
      }

      const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'conferences' });

      const query: Record<string, unknown> = {};

      if (filters.industry) query.industry = filters.industry;
      if (filters.status) query.status = filters.status;
      if (filters.city) query['venue.city'] = filters.city;
      if (filters.country) query['venue.country'] = filters.country;
      if (filters.minAttendance) query.expectedAttendance = { $gte: filters.minAttendance };
      if (filters.maxAttendance) {
        query.expectedAttendance = {
          ...(query.expectedAttendance as Record<string, number>),
          $lte: filters.maxAttendance
        };
      }
      if (filters.startDate) query['date.start'] = { $gte: new Date(filters.startDate) };
      if (filters.endDate) query['date.end'] = { $lte: new Date(filters.endDate) };
      if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags };

      const [conferences, total] = await Promise.all([
        Conference.find(query).sort({ 'date.start': 1 }).skip(skip).limit(limit).lean(),
        Conference.countDocuments(query)
      ]);

      startTimer();

      const result = { conferences: conferences as IConferenceDocument[], total };

      await cacheSet(cacheKey, JSON.stringify(result), CACHE_TTL.CONFERENCE);

      return result;
    } catch (error) {
      logger.error('Error listing conferences', { filters, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update conference
   */
  async update(id: string, data: UpdateConferenceRequest): Promise<IConferenceDocument | null> {
    try {
      const updateData: Record<string, unknown> = { ...data };

      if (data.date) {
        updateData.date = {
          start: new Date(data.date.start),
          end: new Date(data.date.end)
        };
      }

      const startTimer = dbOperationDuration.startTimer({ operation: 'updateOne', collection: 'conferences' });
      const conference = await Conference.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
      startTimer();

      if (conference) {
        await cacheInvalidateConference(id);
        logger.info('Conference updated', { conferenceId: id });
      }

      return conference as IConferenceDocument | null;
    } catch (error) {
      logger.error('Error updating conference', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Delete conference
   */
  async delete(id: string): Promise<boolean> {
    try {
      const startTimer = dbOperationDuration.startTimer({ operation: 'deleteOne', collection: 'conferences' });
      const result = await Conference.findByIdAndDelete(id);
      startTimer();

      if (result) {
        await cacheInvalidateConference(id);
        logger.info('Conference deleted', { conferenceId: id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting conference', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get upcoming conferences
   */
  async getUpcoming(limit: number = 10): Promise<IConferenceDocument[]> {
    const cacheKey = `conferences:upcoming:${limit}`;

    try {
      const cached = await cacheGet(cacheKey, 'conferences_upcoming');
      if (cached) {
        return JSON.parse(cached);
      }

      const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'conferences' });
      const conferences = await Conference.find({
        'date.start': { $gte: new Date() },
        status: { $in: ['published', 'ongoing'] }
      })
        .sort({ 'date.start': 1 })
        .limit(limit)
        .lean();
      startTimer();

      await cacheSet(cacheKey, JSON.stringify(conferences), CACHE_TTL.CONFERENCE);

      // Update gauge
      upcomingConferences.set(conferences.length);

      return conferences as IConferenceDocument[];
    } catch (error) {
      logger.error('Error getting upcoming conferences', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get conferences by industry
   */
  async getByIndustry(industry: string, limit: number = 20): Promise<IConferenceDocument[]> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'conferences' });
    const conferences = await Conference.find({ industry })
      .sort({ 'date.start': -1 })
      .limit(limit)
      .lean();
    startTimer();

    return conferences as IConferenceDocument[];
  }

  /**
   * Update conference status
   */
  async updateStatus(id: string, status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'): Promise<IConferenceDocument | null> {
    try {
      const startTimer = dbOperationDuration.startTimer({ operation: 'updateOne', collection: 'conferences' });
      const conference = await Conference.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      ).lean();
      startTimer();

      if (conference) {
        await cacheInvalidateConference(id);
        this.updateActiveGauges();
        logger.info('Conference status updated', { conferenceId: id, status });
      }

      return conference as IConferenceDocument | null;
    } catch (error) {
      logger.error('Error updating conference status', { id, status, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update active conference gauges
   */
  private async updateActiveGauges(): Promise<void> {
    try {
      const statuses = ['draft', 'published', 'ongoing', 'completed', 'cancelled'];

      for (const status of statuses) {
        const count = await Conference.countDocuments({ status });
        activeConferences.set({ status }, count);
      }
    } catch (error) {
      logger.error('Error updating active conference gauges', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

export const conferenceService = new ConferenceService();
