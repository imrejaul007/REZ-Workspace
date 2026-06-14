import { TimeEntry, WorkLog, Task } from '../models/index.js';
import { createLogger } from '../utils/logger.js';
import type {
  TimeEntryCreateInput,
  TimeEntryFilters,
  WorkLogCreateInput
} from '../types/index.js';

const logger = createLogger('time-service');

// ============================================================================
// TIME ENTRY
// ============================================================================

export async function createTimeEntry(input: TimeEntryCreateInput): Promise<typeof TimeEntry.prototype> {
  try {
    const entry = new TimeEntry({
      ...input,
      date: new Date(input.date)
    });

    await entry.save();

    // Update task actual hours if linked
    if (input.taskId) {
      await Task.findOneAndUpdate(
        { taskId: input.taskId },
        { $inc: { actualHours: input.hours } }
      );
    }

    logger.info(`Created time entry: ${input.hours}h for employee ${input.employeeId}`);
    return entry;
  } catch (error) {
    logger.error('Error creating time entry:', error);
    throw error;
  }
}

export async function getTimeEntry(entryId: string): Promise<typeof TimeEntry.prototype | null> {
  try {
    const entry = await TimeEntry.findById(entryId);
    return entry;
  } catch (error) {
    logger.error('Error getting time entry:', error);
    throw error;
  }
}

export async function getTimeEntries(
  filters: TimeEntryFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<{ entries: typeof TimeEntry.prototype[]; total: number }> {
  try {
    const query: Record<string, unknown> = {};

    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.projectId) query.projectId = filters.projectId;
    if (filters.taskId) query.taskId = filters.taskId;
    if (filters.type) query.type = filters.type;

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) (query.date as Record<string, Date>).$gte = filters.startDate;
      if (filters.endDate) (query.date as Record<string, Date>).$lte = filters.endDate;
    }

    const [entries, total] = await Promise.all([
      TimeEntry.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      TimeEntry.countDocuments(query)
    ]);

    return { entries, total };
  } catch (error) {
    logger.error('Error getting time entries:', error);
    throw error;
  }
}

export async function getEmployeeTimeEntries(
  employeeId: string,
  startDate?: Date,
  endDate?: Date
): Promise<typeof TimeEntry.prototype[]> {
  try {
    const query: Record<string, unknown> = { employeeId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, Date>).$gte = startDate;
      if (endDate) (query.date as Record<string, Date>).$lte = endDate;
    }

    const entries = await TimeEntry.find(query)
      .sort({ date: -1 });

    return entries;
  } catch (error) {
    logger.error('Error getting employee time entries:', error);
    throw error;
  }
}

export async function updateTimeEntry(
  entryId: string,
  updates: Partial<TimeEntryCreateInput>
): Promise<typeof TimeEntry.prototype | null> {
  try {
    const entry = await TimeEntry.findById(entryId);
    if (!entry) {
      return null;
    }

    // Update task hours if hours changed
    if (updates.hours && updates.hours !== entry.hours) {
      const hoursDiff = updates.hours - entry.hours;
      if (entry.taskId) {
        await Task.findOneAndUpdate(
          { taskId: entry.taskId },
          { $inc: { actualHours: hoursDiff } }
        );
      }
    }

    const updatedEntry = await TimeEntry.findByIdAndUpdate(
      entryId,
      { $set: updates },
      { new: true }
    );

    if (updatedEntry) {
      logger.info(`Updated time entry: ${entryId}`);
    }

    return updatedEntry;
  } catch (error) {
    logger.error('Error updating time entry:', error);
    throw error;
  }
}

export async function deleteTimeEntry(entryId: string): Promise<boolean> {
  try {
    const entry = await TimeEntry.findById(entryId);
    if (!entry) {
      return false;
    }

    // Update task actual hours
    if (entry.taskId) {
      await Task.findOneAndUpdate(
        { taskId: entry.taskId },
        { $inc: { actualHours: -entry.hours } }
      );
    }

    const result = await TimeEntry.deleteOne({ _id: entryId });
    logger.info(`Deleted time entry: ${entryId}`);

    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Error deleting time entry:', error);
    throw error;
  }
}

// ============================================================================
// TIME SUMMARY
// ============================================================================

export async function getEmployeeTimeSummary(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalHours: number;
  byType: Record<string, number>;
  byProject: Record<string, number>;
  dailyHours: { date: string; hours: number }[];
}> {
  try {
    const entries = await TimeEntry.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

    const byType: Record<string, number> = {};
    const byProject: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    for (const entry of entries) {
      // By type
      byType[entry.type] = (byType[entry.type] || 0) + entry.hours;

      // By project
      byProject[entry.projectName] = (byProject[entry.projectName] || 0) + entry.hours;

      // By day
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + entry.hours;
    }

    const dailyHours = Object.entries(dailyMap)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalHours, byType, byProject, dailyHours };
  } catch (error) {
    logger.error('Error getting employee time summary:', error);
    throw error;
  }
}

export async function getProjectTimeSummary(
  projectId: string
): Promise<{
  totalHours: number;
  byEmployee: Record<string, { name: string; hours: number }>;
  byType: Record<string, number>;
  overtimeHours: number;
}> {
  try {
    const entries = await TimeEntry.find({ projectId });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const overtimeHours = entries
      .filter(e => e.type === 'overtime')
      .reduce((sum, e) => sum + e.hours, 0);

    const byEmployee: Record<string, { name: string; hours: number }> = {};
    const byType: Record<string, number> = {};

    for (const entry of entries) {
      // By employee
      if (!byEmployee[entry.employeeId]) {
        byEmployee[entry.employeeId] = { name: entry.employeeName, hours: 0 };
      }
      byEmployee[entry.employeeId].hours += entry.hours;

      // By type
      byType[entry.type] = (byType[entry.type] || 0) + entry.hours;
    }

    return { totalHours, byEmployee, byType, overtimeHours };
  } catch (error) {
    logger.error('Error getting project time summary:', error);
    throw error;
  }
}

// ============================================================================
// WORK LOG
// ============================================================================

export async function createWorkLog(input: WorkLogCreateInput): Promise<typeof WorkLog.prototype> {
  try {
    // Check if log already exists for this employee today
    const today = new Date(input.date);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await WorkLog.findOne({
      employeeId: input.employeeId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existing) {
      // Update existing log
      existing.completed = input.completed;
      existing.blockers = input.blockers || '';
      existing.tomorrowPlan = input.tomorrowPlan || '';
      existing.tasksWorkedOn = input.tasksWorkedOn || [];
      existing.submittedAt = new Date();
      await existing.save();

      logger.info(`Updated work log for employee ${input.employeeId} on ${today.toDateString()}`);
      return existing;
    }

    const workLog = new WorkLog({
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      date: today,
      completed: input.completed,
      blockers: input.blockers || '',
      tomorrowPlan: input.tomorrowPlan || '',
      tasksWorkedOn: input.tasksWorkedOn || [],
      submittedAt: new Date()
    });

    await workLog.save();
    logger.info(`Created work log for employee ${input.employeeId}`);

    return workLog;
  } catch (error) {
    logger.error('Error creating work log:', error);
    throw error;
  }
}

export async function getEmployeeWorkLogs(
  employeeId: string,
  limit: number = 30
): Promise<typeof WorkLog.prototype[]> {
  try {
    const logs = await WorkLog.find({ employeeId })
      .sort({ date: -1 })
      .limit(limit);

    return logs;
  } catch (error) {
    logger.error('Error getting employee work logs:', error);
    throw error;
  }
}

export async function getWorkLog(
  employeeId: string,
  date: Date
): Promise<typeof WorkLog.prototype | null> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const log = await WorkLog.findOne({
      employeeId,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    return log;
  } catch (error) {
    logger.error('Error getting work log:', error);
    throw error;
  }
}

export async function getTodayWorkLogs(): Promise<typeof WorkLog.prototype[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await WorkLog.find({
      date: { $gte: today, $lt: tomorrow }
    }).sort({ submittedAt: -1 });

    return logs;
  } catch (error) {
    logger.error('Error getting today work logs:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY
// ============================================================================

export async function getActiveTimers(employeeId: string): Promise<{
  hasActiveTimer: boolean;
  taskId?: string;
  projectId?: string;
  projectName?: string;
  startTime?: Date;
  elapsedMinutes?: number;
}> {
  // This would integrate with a cache/redis in production
  // For now, return a simple implementation
  try {
    // Check for incomplete time entries without end time (would need separate tracking)
    // For this implementation, we'll check recent entries
    await TimeEntry.findOne({
      employeeId,
      taskId: { $exists: true }
    }).sort({ createdAt: -1 });

    return {
      hasActiveTimer: false
    };
  } catch (error) {
    logger.error('Error getting active timers:', error);
    return { hasActiveTimer: false };
  }
}

export async function checkOvertimeAlerts(employeeId: string): Promise<{
  hasAlert: boolean;
  weeklyHours: number;
  overtimeHours: number;
  message?: string;
}> {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const entries = await TimeEntry.find({
      employeeId,
      date: { $gte: weekStart }
    });

    const weeklyHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const standardHours = 40;
    const overtimeHours = Math.max(0, weeklyHours - standardHours);

    if (weeklyHours > standardHours) {
      return {
        hasAlert: true,
        weeklyHours,
        overtimeHours,
        message: `You have logged ${overtimeHours.toFixed(1)} hours of overtime this week.`
      };
    }

    return { hasAlert: false, weeklyHours, overtimeHours };
  } catch (error) {
    logger.error('Error checking overtime alerts:', error);
    return { hasAlert: false, weeklyHours: 0, overtimeHours: 0 };
  }
}
