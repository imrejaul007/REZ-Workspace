import { v4 as uuidv4 } from 'uuid';
import { TimeEntry, ActiveTimer, CreateTimeEntrySchema, UpdateTimeEntrySchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('TimeEntryService');

// In-memory storage
const timeEntries: Map<string, TimeEntry> = new Map();
const activeTimers: Map<string, ActiveTimer> = new Map(); // key: `${tenantId}:${userId}`

export class TimeEntryService {
  // Calculate duration in minutes between two dates
  private calculateDuration(startTime: Date, endTime: Date): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  }

  async create(tenantId: string, userId: string, data: unknown): Promise<TimeEntry> {
    const parsed = CreateTimeEntrySchema.parse(data);

    const startTime = new Date(parsed.startTime);
    const endTime = new Date(parsed.endTime);

    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }

    const entry: TimeEntry = {
      id: uuidv4(),
      tenantId,
      userId,
      projectId: parsed.projectId,
      taskId: parsed.taskId,
      description: parsed.description,
      startTime,
      endTime,
      duration: this.calculateDuration(startTime, endTime),
      isBillable: parsed.isBillable ?? true,
      isManual: parsed.isManual ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    timeEntries.set(entry.id, entry);
    logger.info('Time entry created', { entryId: entry.id, tenantId, userId, duration: entry.duration });

    return entry;
  }

  async startTimer(tenantId: string, userId: string, data: {
    projectId: string;
    taskId?: string;
    description?: string;
    isBillable?: boolean;
  }): Promise<ActiveTimer> {
    const key = `${tenantId}:${userId}`;

    // Stop any existing timer
    const existing = activeTimers.get(key);
    if (existing) {
      await this.stopTimer(tenantId, userId);
    }

    const timer: ActiveTimer = {
      id: uuidv4(),
      tenantId,
      userId,
      projectId: data.projectId,
      taskId: data.taskId,
      description: data.description,
      startTime: new Date(),
      isBillable: data.isBillable ?? true,
    };

    activeTimers.set(key, timer);
    logger.info('Timer started', { timerId: timer.id, tenantId, userId });

    return timer;
  }

  async getActiveTimer(tenantId: string, userId: string): Promise<ActiveTimer | null> {
    const key = `${tenantId}:${userId}`;
    return activeTimers.get(key) || null;
  }

  async stopTimer(tenantId: string, userId: string): Promise<TimeEntry | null> {
    const key = `${tenantId}:${userId}`;
    const timer = activeTimers.get(key);

    if (!timer) {
      return null;
    }

    const endTime = new Date();
    const entry: TimeEntry = {
      id: uuidv4(),
      tenantId,
      userId,
      projectId: timer.projectId,
      taskId: timer.taskId,
      description: timer.description,
      startTime: timer.startTime,
      endTime,
      duration: this.calculateDuration(timer.startTime, endTime),
      isBillable: timer.isBillable,
      isManual: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    timeEntries.set(entry.id, entry);
    activeTimers.delete(key);
    logger.info('Timer stopped', { entryId: entry.id, tenantId, userId, duration: entry.duration });

    return entry;
  }

  async findById(tenantId: string, id: string): Promise<TimeEntry | null> {
    const entry = timeEntries.get(id);
    if (!entry || entry.tenantId !== tenantId) {
      return null;
    }
    return entry;
  }

  async findAll(tenantId: string, options?: {
    userId?: string;
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
    billableOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<TimeEntry[]> {
    let result = Array.from(timeEntries.values())
      .filter(e => e.tenantId === tenantId);

    if (options?.userId) {
      result = result.filter(e => e.userId === options.userId);
    }
    if (options?.projectId) {
      result = result.filter(e => e.projectId === options.projectId);
    }
    if (options?.startDate) {
      result = result.filter(e => e.startTime >= options.startDate!);
    }
    if (options?.endDate) {
      result = result.filter(e => e.startTime <= options.endDate!);
    }
    if (options?.billableOnly) {
      result = result.filter(e => e.isBillable);
    }

    // Sort by start time descending
    result.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  async update(tenantId: string, id: string, userId: string, data: unknown): Promise<TimeEntry | null> {
    const existing = timeEntries.get(id);
    if (!existing || existing.tenantId !== tenantId) {
      return null;
    }

    const parsed = UpdateTimeEntrySchema.parse(data);

    let startTime = existing.startTime;
    let endTime = existing.endTime;
    let duration = existing.duration;

    if (parsed.startTime && parsed.endTime) {
      startTime = new Date(parsed.startTime);
      endTime = new Date(parsed.endTime);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      duration = this.calculateDuration(startTime, endTime);
    }

    const updated: TimeEntry = {
      ...existing,
      projectId: parsed.projectId ?? existing.projectId,
      taskId: parsed.taskId !== undefined ? parsed.taskId : existing.taskId,
      description: parsed.description !== undefined ? parsed.description : existing.description,
      startTime,
      endTime: endTime!,
      duration,
      isBillable: parsed.isBillable ?? existing.isBillable,
      updatedAt: new Date(),
    };

    timeEntries.set(id, updated);
    logger.info('Time entry updated', { entryId: id, tenantId });

    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const entry = timeEntries.get(id);
    if (!entry || entry.tenantId !== tenantId) {
      return false;
    }

    const deleted = timeEntries.delete(id);
    if (deleted) {
      logger.info('Time entry deleted', { entryId: id, tenantId });
    }
    return deleted;
  }

  // Get total time for a user
  async getTotalTime(tenantId: string, userId: string, options?: { startDate?: Date; endDate?: Date }): Promise<{
    totalMinutes: number;
    billableMinutes: number;
    nonBillableMinutes: number;
  }> {
    const entries = await this.findAll(tenantId, {
      userId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
    const billableMinutes = entries
      .filter(e => e.isBillable)
      .reduce((sum, e) => sum + e.duration, 0);

    return {
      totalMinutes,
      billableMinutes,
      nonBillableMinutes: totalMinutes - billableMinutes,
    };
  }
}

export const timeEntryService = new TimeEntryService();
