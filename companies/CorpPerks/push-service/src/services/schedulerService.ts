import cron from 'node-cron';
import { ScheduledNotification, IScheduledNotification } from '../models';
import { notificationService } from './notificationService';
import { templateService } from './templateService';

// ==================== TYPES ====================

export interface CreateScheduledNotificationInput {
  companyId: string;
  createdBy: string;
  name: string;
  description?: string;
  templateId?: string;
  title: string;
  body: string;
  type: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  deepLink?: string;
  imageUrl?: string;
  targetAudience: {
    type: 'all' | 'department' | 'role' | 'users' | 'segment';
    departmentIds?: string[];
    roleIds?: string[];
    userIds?: string[];
    segmentId?: string;
  };
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
    cronExpression?: string;
    scheduledAt: Date;
    timezone?: string;
    endDate?: Date;
  };
  maxRuns?: number;
}

export interface UpdateScheduledNotificationInput {
  name?: string;
  description?: string;
  title?: string;
  body?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  deepLink?: string;
  imageUrl?: string;
  targetAudience?: {
    type: 'all' | 'department' | 'role' | 'users' | 'segment';
    departmentIds?: string[];
    roleIds?: string[];
    userIds?: string[];
    segmentId?: string;
  };
  schedule?: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
    cronExpression?: string;
    scheduledAt: Date;
    timezone?: string;
    endDate?: Date;
  };
  status?: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled' | 'paused';
  maxRuns?: number;
}

/**
 * Scheduler Service - Manage scheduled notifications
 */
export class SchedulerService {
  private scheduler: cron.ScheduledTask | null = null;
  private isRunning = false;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) return;

    // Run every minute to check for scheduled notifications
    this.scheduler = cron.schedule('* * * * *', async () => {
      await this.processScheduledNotifications();
    });

    this.isRunning = true;
    logger.info('Notification scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.scheduler) {
      this.scheduler.stop();
      this.scheduler = null;
    }
    this.isRunning = false;
    logger.info('Notification scheduler stopped');
  }

  /**
   * Process scheduled notifications
   */
  private async processScheduledNotifications(): Promise<void> {
    const now = new Date();

    // Find notifications ready to send
    const scheduled = await ScheduledNotification.find({
      status: 'scheduled',
      nextRunAt: { $lte: now },
      $or: [
        { 'schedule.endDate': { $exists: false } },
        { 'schedule.endDate': { $gte: now } },
      ],
    }).limit(50);

    for (const schedule of scheduled) {
      try {
        await this.executeScheduledNotification(schedule);
      } catch (error) {
        logger.error(`Failed to execute scheduled notification ${schedule.scheduleId}:`, error);
      }
    }
  }

  /**
   * Execute a scheduled notification
   */
  private async executeScheduledNotification(schedule: IScheduledNotification): Promise<void> {
    // Mark as running
    await ScheduledNotification.updateOne(
      { scheduleId: schedule.scheduleId },
      { status: 'running' }
    );

    // Get recipients based on target audience
    const recipients = await this.getRecipients(schedule);

    // Send to each recipient
    let sent = 0;
    let failed = 0;

    for (const userId of recipients) {
      try {
        if (schedule.templateId) {
          await notificationService.sendFromTemplate(
            userId,
            schedule.companyId,
            schedule.templateId,
            schedule.data as Record<string, string> || {}
          );
        } else {
          await notificationService.send({
            userId,
            companyId: schedule.companyId,
            title: schedule.title,
            body: schedule.body,
            type: schedule.type as Parameters<typeof notificationService.send>[0]['type'],
            priority: schedule.priority,
            data: schedule.data,
            deepLink: schedule.deepLink,
            imageUrl: schedule.imageUrl,
          });
        }
        sent++;
      } catch (error) {
        logger.error(`Failed to send to ${userId}:`, error);
        failed++;
      }
    }

    // Update statistics
    const updateData: Record<string, unknown> = {
      'statistics.sent': sent,
      'statistics.failed': failed,
      lastRunAt: new Date(),
      runCount: schedule.runCount + 1,
    };

    // Determine next run or complete
    const nextRun = this.calculateNextRun(schedule);
    if (nextRun && (!schedule.maxRuns || schedule.runCount + 1 < schedule.maxRuns)) {
      updateData.status = 'scheduled';
      updateData.nextRunAt = nextRun;
    } else {
      updateData.status = 'completed';
      updateData.nextRunAt = null;
    }

    await ScheduledNotification.updateOne(
      { scheduleId: schedule.scheduleId },
      { $set: updateData }
    );
  }

  /**
   * Get recipients based on target audience
   */
  private async getRecipients(schedule: IScheduledNotification): Promise<string[]> {
    const { targetAudience } = schedule;

    switch (targetAudience.type) {
      case 'users':
        return targetAudience.userIds || [];

      case 'department':
      case 'role':
      case 'segment':
      case 'all':
        // In a real implementation, this would query the user service
        // For now, return empty array - implement based on CorpPerks user service
        logger.info(`Target audience type '${targetAudience.type}' requires user service integration`);
        return [];

      default:
        return [];
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(schedule: IScheduledNotification): Date | null {
    const { type, cronExpression } = schedule.schedule;

    switch (type) {
      case 'once':
        return null;

      case 'daily': {
        const next = new Date(schedule.nextRunAt || schedule.schedule.scheduledAt);
        next.setDate(next.getDate() + 1);
        return next;
      }

      case 'weekly': {
        const next = new Date(schedule.nextRunAt || schedule.schedule.scheduledAt);
        next.setDate(next.getDate() + 7);
        return next;
      }

      case 'monthly': {
        const next = new Date(schedule.nextRunAt || schedule.schedule.scheduledAt);
        next.setMonth(next.getMonth() + 1);
        return next;
      }

      case 'cron':
        // Would need a cron library to calculate next run
        // For now, use the scheduledAt + 1 day as fallback
        if (cronExpression) {
          // TODO: Implement cron expression parsing
          logger.info('Cron expression:', cronExpression);
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Create a scheduled notification
   */
  async createScheduledNotification(
    input: CreateScheduledNotificationInput
  ): Promise<IScheduledNotification> {
    const { v4: uuidv4 } = await import('uuid');

    // Validate cron expression if provided
    if (input.schedule.type === 'cron' && input.schedule.cronExpression) {
      if (!cron.validate(input.schedule.cronExpression)) {
        throw new Error('Invalid cron expression');
      }
    }

    const schedule = new ScheduledNotification({
      scheduleId: `sched_${uuidv4()}`,
      ...input,
      status: 'draft',
      statistics: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
      },
      nextRunAt: input.schedule.scheduledAt,
      runCount: 0,
    });

    await schedule.save();
    return schedule;
  }

  /**
   * Update a scheduled notification
   */
  async updateScheduledNotification(
    scheduleId: string,
    input: UpdateScheduledNotificationInput
  ): Promise<IScheduledNotification | null> {
    const updateData: Record<string, unknown> = { ...input };

    // Recalculate next run if schedule changed
    if (input.schedule) {
      updateData.nextRunAt = input.schedule.scheduledAt;
    }

    const updated = await ScheduledNotification.findOneAndUpdate(
      { scheduleId },
      { $set: updateData },
      { new: true }
    );

    return updated as IScheduledNotification | null;
  }

  /**
   * Get scheduled notification by ID
   */
  async getScheduledNotification(scheduleId: string): Promise<IScheduledNotification | null> {
    return ScheduledNotification.findOne({ scheduleId }).lean() as Promise<IScheduledNotification | null>;
  }

  /**
   * Get scheduled notifications for a company
   */
  async getScheduledNotifications(
    companyId: string,
    options?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    schedules: IScheduledNotification[];
    total: number;
  }> {
    const { status, page = 1, limit = 20 } = options || {};

    const query: Record<string, unknown> = { companyId };
    if (status) query.status = status;

    const [schedules, total] = await Promise.all([
      ScheduledNotification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .then(docs => docs as unknown as IScheduledNotification[]),
      ScheduledNotification.countDocuments(query),
    ]);

    return {
      schedules,
      total,
    };
  }

  /**
   * Activate a scheduled notification
   */
  async activate(scheduleId: string): Promise<IScheduledNotification | null> {
    const schedule = await this.getScheduledNotification(scheduleId);
    if (!schedule) return null;

    // Validate schedule
    if (!schedule.title || !schedule.body || !schedule.schedule.scheduledAt) {
      throw new Error('Cannot activate incomplete schedule');
    }

    return this.updateScheduledNotification(scheduleId, { status: 'scheduled' });
  }

  /**
   * Pause a scheduled notification
   */
  async pause(scheduleId: string): Promise<IScheduledNotification | null> {
    return this.updateScheduledNotification(scheduleId, { status: 'paused' });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancel(scheduleId: string): Promise<IScheduledNotification | null> {
    return this.updateScheduledNotification(scheduleId, { status: 'cancelled' });
  }

  /**
   * Delete a scheduled notification
   */
  async deleteScheduledNotification(scheduleId: string): Promise<boolean> {
    const result = await ScheduledNotification.deleteOne({ scheduleId });
    return result.deletedCount > 0;
  }

  /**
   * Preview recipients for a scheduled notification
   */
  async previewRecipients(
    targetAudience: IScheduledNotification['targetAudience']
  ): Promise<{ count: number; userIds: string[] }> {
    const userIds = await this.getRecipients({
      targetAudience,
    } as IScheduledNotification);

    return {
      count: userIds.length,
      userIds: userIds.slice(0, 100), // Limit preview
    };
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
