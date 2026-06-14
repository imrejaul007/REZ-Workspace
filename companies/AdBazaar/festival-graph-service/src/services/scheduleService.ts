import { Schedule, ISchedule, IScheduleEvent } from '../models/index.js';
import { logger } from '../config/logger.js';
import { AddScheduleInput, UpdateScheduleInput } from './schemas.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleListResult {
  schedules: ISchedule[];
  total: number;
}

export class ScheduleService {
  async addSchedule(festivalId: string, input: AddScheduleInput): Promise<ISchedule> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      // Check if schedule for this day already exists
      const existingSchedule = await Schedule.findOne({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        day: input.day,
      });

      if (existingSchedule) {
        throw new Error(`Schedule for day ${input.day} already exists. Use update instead.`);
      }

      // Process events - add IDs if not provided
      const processedEvents = input.events.map((event) => ({
        ...event,
        id: event.id || uuidv4(),
        startTime: new Date(event.startTime as string),
        endTime: event.endTime ? new Date(event.endTime as string) : undefined,
      }));

      const scheduleData = {
        festivalId: new mongoose.Types.ObjectId(festivalId),
        day: input.day,
        date: new Date(input.date as string),
        events: processedEvents,
        totalEvents: processedEvents.length,
      };

      const schedule = new Schedule(scheduleData);
      await schedule.save();

      logger.info('Schedule added to festival', {
        scheduleId: schedule._id,
        festivalId,
        day: input.day,
        eventCount: processedEvents.length,
      });

      return schedule;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to add schedule', { error: errorMessage, festivalId, input });
      throw error;
    }
  }

  async getByFestival(festivalId: string): Promise<ISchedule[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const schedules = await Schedule.find({
        festivalId: new mongoose.Types.ObjectId(festivalId),
      })
        .sort({ day: 1 })
        .lean();

      return schedules as ISchedule[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get schedules by festival', { error: errorMessage, festivalId });
      throw error;
    }
  }

  async getById(id: string): Promise<ISchedule | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const schedule = await Schedule.findById(id).lean();
      return schedule as ISchedule | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get schedule', { error: errorMessage, scheduleId: id });
      throw error;
    }
  }

  async getByDay(festivalId: string, day: number): Promise<ISchedule | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const schedule = await Schedule.findOne({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        day,
      }).lean();

      return schedule as ISchedule | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get schedule by day', { error: errorMessage, festivalId, day });
      throw error;
    }
  }

  async updateSchedule(festivalId: string, day: number, input: UpdateScheduleInput): Promise<ISchedule | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      // Process events - add IDs if not provided
      const processedEvents = input.events.map((event) => ({
        ...event,
        id: event.id || uuidv4(),
        startTime: new Date(event.startTime as string),
        endTime: event.endTime ? new Date(event.endTime as string) : undefined,
      }));

      const schedule = await Schedule.findOneAndUpdate(
        {
          festivalId: new mongoose.Types.ObjectId(festivalId),
          day,
        },
        {
          $set: {
            events: processedEvents,
            totalEvents: processedEvents.length,
          },
        },
        { new: true, runValidators: true }
      ).lean();

      if (schedule) {
        logger.info('Schedule updated', { festivalId, day, eventCount: processedEvents.length });
      }

      return schedule as ISchedule | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update schedule', { error: errorMessage, festivalId, day, input });
      throw error;
    }
  }

  async addEvents(festivalId: string, day: number, events: IScheduleEvent[]): Promise<ISchedule | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      // Process events
      const processedEvents = events.map((event) => ({
        ...event,
        id: event.id || uuidv4(),
        startTime: new Date(event.startTime),
        endTime: event.endTime ? new Date(event.endTime) : undefined,
      }));

      const schedule = await Schedule.findOneAndUpdate(
        {
          festivalId: new mongoose.Types.ObjectId(festivalId),
          day,
        },
        {
          $push: {
            events: { $each: processedEvents },
          },
          $inc: { totalEvents: processedEvents.length },
        },
        { new: true, runValidators: true }
      ).lean();

      if (schedule) {
        logger.info('Events added to schedule', { festivalId, day, eventCount: processedEvents.length });
      }

      return schedule as ISchedule | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to add events to schedule', { error: errorMessage, festivalId, day });
      throw error;
    }
  }

  async deleteEvent(festivalId: string, day: number, eventId: string): Promise<ISchedule | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const schedule = await Schedule.findOneAndUpdate(
        {
          festivalId: new mongoose.Types.ObjectId(festivalId),
          day,
        },
        {
          $pull: { events: { id: eventId } },
          $inc: { totalEvents: -1 },
        },
        { new: true, runValidators: true }
      ).lean();

      if (schedule) {
        logger.info('Event removed from schedule', { festivalId, day, eventId });
      }

      return schedule as ISchedule | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete event from schedule', { error: errorMessage, festivalId, day, eventId });
      throw error;
    }
  }

  async deleteSchedule(festivalId: string, day: number): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const result = await Schedule.findOneAndDelete({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        day,
      });

      if (result) {
        logger.info('Schedule deleted', { festivalId, day });
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete schedule', { error: errorMessage, festivalId, day });
      throw error;
    }
  }

  async getFeaturedEvents(festivalId: string): Promise<IScheduleEvent[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const schedules = await Schedule.find({
        festivalId: new mongoose.Types.ObjectId(festivalId),
      })
        .sort({ day: 1 })
        .lean();

      const featuredEvents: IScheduleEvent[] = [];
      for (const schedule of schedules as ISchedule[]) {
        featuredEvents.push(...schedule.events.filter((event) => event.featured));
      }

      return featuredEvents;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get featured events', { error: errorMessage, festivalId });
      throw error;
    }
  }
}

export const scheduleService = new ScheduleService();