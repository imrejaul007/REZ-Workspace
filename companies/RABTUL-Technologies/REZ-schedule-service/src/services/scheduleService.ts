// ReZ Schedule - Schedule Service
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface ScheduleDayInput {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface ScheduleWithAvailability {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  availability: {
    id: string;
    dayOfWeek: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
  }[];
}

export class ScheduleService {
  /**
   * Create a new schedule
   */
  async createSchedule(
    userId: string,
    name: string,
    days: ScheduleDayInput[],
    isDefault: boolean = false
  ): Promise<ScheduleWithAvailability> {
    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.schedule.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        name,
        isDefault,
        availability: {
          createMany: {
            data: days.map(day => ({
              dayOfWeek: day.dayOfWeek,
              enabled: day.enabled,
              startTime: day.startTime,
              endTime: day.endTime,
            })),
          },
        },
      },
      include: {
        availability: true,
      },
    });

    logger.info(`[Schedule] Created schedule ${name} for user ${userId}`);

    return schedule as unknown as ScheduleWithAvailability;
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(id: string): Promise<ScheduleWithAvailability | null> {
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    return schedule as unknown as ScheduleWithAvailability | null;
  }

  /**
   * List schedules for a user
   */
  async listSchedules(userId: string): Promise<ScheduleWithAvailability[]> {
    const schedules = await prisma.schedule.findMany({
      where: { userId },
      include: {
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return schedules as unknown as ScheduleWithAvailability[];
  }

  /**
   * Update schedule
   */
  async updateSchedule(
    id: string,
    userId: string,
    updates: { name?: string; isDefault?: boolean }
  ): Promise<ScheduleWithAvailability> {
    // Verify ownership
    const existing = await prisma.schedule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await prisma.schedule.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updates,
      include: {
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    logger.info(`[Schedule] Updated schedule ${id}`);

    return schedule as unknown as ScheduleWithAvailability;
  }

  /**
   * Update schedule availability
   */
  async updateScheduleAvailability(
    id: string,
    userId: string,
    days: ScheduleDayInput[]
  ): Promise<ScheduleWithAvailability> {
    // Verify ownership
    const existing = await prisma.schedule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // Delete existing availability and create new
    await prisma.scheduleDay.deleteMany({
      where: { scheduleId: id },
    });

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        availability: {
          createMany: {
            data: days.map(day => ({
              dayOfWeek: day.dayOfWeek,
              enabled: day.enabled,
              startTime: day.startTime,
              endTime: day.endTime,
            })),
          },
        },
      },
      include: {
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    logger.info(`[Schedule] Updated availability for schedule ${id}`);

    return schedule as unknown as ScheduleWithAvailability;
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await prisma.schedule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // Cannot delete if it's the only schedule
    const scheduleCount = await prisma.schedule.count({
      where: { userId },
    });

    if (scheduleCount <= 1) {
      throw new Error('Cannot delete the only schedule');
    }

    // Check if it's linked to event types
    const linkedEventTypes = await prisma.eventTypeSchedule.count({
      where: { scheduleId: id },
    });

    if (linkedEventTypes > 0) {
      throw new Error('Cannot delete schedule linked to event types');
    }

    await prisma.schedule.delete({
      where: { id },
    });

    logger.info(`[Schedule] Deleted schedule ${id}`);
  }

  /**
   * Get or create default schedule for user
   */
  async getOrCreateDefaultSchedule(userId: string): Promise<ScheduleWithAvailability> {
    let schedule = await prisma.schedule.findFirst({
      where: { userId, isDefault: true },
      include: {
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!schedule) {
      // Create default schedule (Mon-Fri, 9am-5pm)
      schedule = await this.createSchedule(
        userId,
        'Default',
        [
          { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '17:00' },
        ],
        true
      );
    }

    return schedule as unknown as ScheduleWithAvailability;
  }

  /**
   * Create special date (holiday, exception)
   */
  async createSpecialDate(
    userId: string,
    date: Date,
    type: 'BLOCKED' | 'AVAILABLE' | 'MODIFIED_HOURS',
    options?: {
      startTime?: string;
      endTime?: string;
      title?: string;
    }
  ): Promise<void> {
    await prisma.specialDate.create({
      data: {
        userId,
        date,
        type,
        startTime: options?.startTime,
        endTime: options?.endTime,
        title: options?.title,
      },
    });

    logger.info(`[Schedule] Created special date ${date} (${type}) for user ${userId}`);
  }

  /**
   * Delete special date
   */
  async deleteSpecialDate(id: string, userId: string): Promise<void> {
    await prisma.specialDate.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * List special dates for a date range
   */
  async listSpecialDates(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ id: string; date: Date; type: string; startTime: string | null; endTime: string | null; title: string | null }[]> {
    const dates = await prisma.specialDate.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return dates;
  }
}

export const scheduleService = new ScheduleService();
export default scheduleService;
