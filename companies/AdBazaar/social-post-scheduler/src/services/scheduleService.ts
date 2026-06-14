import { Schedule, ISchedule, Post, Calendar } from '../models';
import { createChildLogger } from '../utils/logger';
import { scheduledPostsTotal, activeSchedulesGauge } from '../utils/metrics';

const logger = createChildLogger('ScheduleService');

export interface SchedulePostInput {
  userId: string;
  postId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  scheduledAt: Date;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceConfig?: {
    interval?: number;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    endDate?: Date;
  };
}

export class ScheduleService {
  async createSchedule(input: SchedulePostInput): Promise<ISchedule> {
    logger.info('Creating schedule for post', { postId: input.postId, platform: input.platform });

    // Update post status to scheduled
    await Post.findByIdAndUpdate(input.postId, {
      status: 'scheduled',
      scheduledAt: input.scheduledAt
    });

    const schedule = new Schedule({
      userId: input.userId,
      postId: input.postId,
      platform: input.platform,
      scheduledAt: input.scheduledAt,
      recurrence: input.recurrence || 'once',
      recurrenceConfig: input.recurrenceConfig,
      status: 'pending'
    });

    await schedule.save();
    scheduledPostsTotal.inc({ platform: input.platform });
    activeSchedulesGauge.inc();

    // Create calendar event
    await Calendar.create({
      userId: input.userId,
      title: 'Scheduled Post',
      startDate: input.scheduledAt,
      platform: input.platform,
      postId: input.postId,
      scheduleId: schedule._id
    });

    logger.info('Schedule created successfully', { scheduleId: schedule._id });
    return schedule;
  }

  async findById(id: string): Promise<ISchedule | null> {
    return Schedule.findById(id).populate('postId');
  }

  async findByUser(userId: string, options?: { status?: string; limit?: number }): Promise<ISchedule[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.status) {
      query.status = options.status;
    }

    return Schedule.find(query)
      .populate('postId')
      .sort({ scheduledAt: 1 })
      .limit(options?.limit || 50);
  }

  async findPendingSchedules(): Promise<ISchedule[]> {
    return Schedule.find({
      status: 'pending',
      scheduledAt: { $lte: new Date() }
    }).populate('postId');
  }

  async updateStatus(id: string, status: ISchedule['status'], error?: string): Promise<ISchedule | null> {
    const updateData: Record<string, unknown> = { status };

    if (error) {
      updateData.lastError = error;
      const schedule = await Schedule.findById(id);
      if (schedule) {
        updateData.retryCount = schedule.retryCount + 1;
      }
    }

    if (status === 'completed') {
      activeSchedulesGauge.dec();
    }

    return Schedule.findByIdAndUpdate(id, updateData, { new: true });
  }

  async cancelSchedule(id: string): Promise<ISchedule | null> {
    const schedule = await Schedule.findById(id);
    if (!schedule) return null;

    await Post.findByIdAndUpdate(schedule.postId, { status: 'draft' });
    await Calendar.deleteOne({ scheduleId: id });

    return Schedule.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
  }

  async getScheduleStats(userId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
  }> {
    const schedules = await Schedule.find({ userId });
    return {
      total: schedules.length,
      pending: schedules.filter(s => s.status === 'pending').length,
      completed: schedules.filter(s => s.status === 'completed').length,
      failed: schedules.filter(s => s.status === 'failed').length
    };
  }
}

export const scheduleService = new ScheduleService();