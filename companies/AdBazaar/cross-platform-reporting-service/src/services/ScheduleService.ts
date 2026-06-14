import { Schedule, ISchedule } from '../models/Schedule.js';
import { Report } from '../models/Report.js';
import { addHours, addDays, addWeeks, addMonths } from 'date-fns';
import logger from '../utils/logger.js';

export class ScheduleService {
  async createSchedule(data: Partial<ISchedule>): Promise<ISchedule> {
    try {
      const nextRun = this.calculateNextRun(data.frequency, data.time, data.dayOfWeek, data.dayOfMonth);

      const schedule = new Schedule({
        ...data,
        nextRun,
        status: 'pending'
      });

      await schedule.save();
      logger.info(`Created schedule: ${schedule.name}`);
      return schedule;
    } catch (error) {
      logger.error('Error creating schedule:', error);
      throw error;
    }
  }

  async getSchedules(organizationId: string, activeOnly = true): Promise<ISchedule[]> {
    try {
      const query: any = { organizationId };
      if (activeOnly) query.isActive = true;
      return await Schedule.find(query).sort({ nextRun: 1 });
    } catch (error) {
      logger.error('Error getting schedules:', error);
      throw error;
    }
  }

  async getScheduleById(scheduleId: string, organizationId: string): Promise<ISchedule | null> {
    try {
      return await Schedule.findOne({ _id: scheduleId, organizationId });
    } catch (error) {
      logger.error(`Error getting schedule ${scheduleId}:`, error);
      throw error;
    }
  }

  async updateSchedule(scheduleId: string, data: Partial<ISchedule>, organizationId: string): Promise<ISchedule | null> {
    try {
      if (data.frequency || data.time || data.dayOfWeek || data.dayOfMonth) {
        data.nextRun = this.calculateNextRun(
          data.frequency || 'daily',
          data.time,
          data.dayOfWeek,
          data.dayOfMonth
        );
      }

      const schedule = await Schedule.findOneAndUpdate(
        { _id: scheduleId, organizationId },
        { $set: data },
        { new: true }
      );

      if (schedule) {
        logger.info(`Updated schedule: ${schedule.name}`);
      }
      return schedule;
    } catch (error) {
      logger.error(`Error updating schedule ${scheduleId}:`, error);
      throw error;
    }
  }

  async deleteSchedule(scheduleId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Schedule.deleteOne({ _id: scheduleId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting schedule ${scheduleId}:`, error);
      throw error;
    }
  }

  async getDueSchedules(): Promise<ISchedule[]> {
    try {
      const now = new Date();
      return await Schedule.find({
        isActive: true,
        status: 'pending',
        nextRun: { $lte: now }
      }).sort({ nextRun: 1 });
    } catch (error) {
      logger.error('Error getting due schedules:', error);
      throw error;
    }
  }

  async executeSchedule(scheduleId: string): Promise<any> {
    try {
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      schedule.status = 'running';
      await schedule.save();

      const report = await Report.findById(schedule.reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      const result = {
        scheduleId: schedule._id,
        reportId: report._id,
        executedAt: new Date(),
        status: 'success',
        recipients: schedule.recipients
      };

      schedule.lastRun = new Date();
      schedule.nextRun = this.calculateNextRun(
        schedule.frequency,
        schedule.time,
        schedule.dayOfWeek,
        schedule.dayOfMonth
      );
      schedule.status = 'completed';
      await schedule.save();

      logger.info(`Executed schedule: ${schedule.name}`);
      return result;
    } catch (error: any) {
      logger.error(`Error executing schedule ${scheduleId}:`, error);

      await Schedule.findByIdAndUpdate(scheduleId, {
        status: 'failed',
        error: error.message
      });

      throw error;
    }
  }

  private calculateNextRun(
    frequency: string,
    time?: string,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    const now = new Date();
    let next = new Date();

    switch (frequency) {
      case 'hourly':
        next = addHours(now, 1);
        next.setMinutes(0, 0, 0);
        break;
      case 'daily':
        if (time) {
          const [hours, minutes] = time.split(':').map(Number);
          next = new Date(now);
          next.setHours(hours, minutes, 0, 0);
          if (next <= now) {
            next = addDays(next, 1);
          }
        } else {
          next = addDays(now, 1);
        }
        break;
      case 'weekly':
        next = addWeeks(now, 1);
        if (dayOfWeek !== undefined) {
          const currentDay = now.getDay();
          const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
          next = addDays(now, daysUntilTarget || 7);
        }
        break;
      case 'monthly':
        next = addMonths(now, 1);
        if (dayOfMonth !== undefined) {
          next.setDate(dayOfMonth);
        }
        break;
    }

    return next;
  }
}

export default new ScheduleService();