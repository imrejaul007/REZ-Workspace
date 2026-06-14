import mongoose, { Types } from 'mongoose';
import { HousekeepingTask, IHousekeepingTask, HOUSEKEEPING_STATUSES } from '../models/HousekeepingTask';
import { logger } from '../config/logger';

export interface TaskInput {
  storeId: string;
  roomId: string;
  roomNumber: string;
  taskType: 'cleaning' | 'maintenance' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface HousekeepingReport {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  verifiedTasks: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  byTaskType: {
    cleaning: number;
    maintenance: number;
    inspection: number;
  };
  completionRate: number;
  averageCompletionTime?: number;
}

export class HousekeepingService {
  /**
   * Create a new housekeeping task
   */
  async createTask(data: TaskInput): Promise<IHousekeepingTask> {
    const task = new HousekeepingTask({
      storeId: new Types.ObjectId(data.storeId),
      roomId: data.roomId,
      roomNumber: data.roomNumber,
      taskType: data.taskType,
      priority: data.priority,
      notes: data.notes,
      status: 'pending',
    });

    await task.save();

    logger.info('[Housekeeping] Task created', {
      taskId: task._id,
      storeId: data.storeId,
      roomNumber: data.roomNumber,
      taskType: data.taskType,
      priority: data.priority,
    });

    return task;
  }

  /**
   * Get tasks for a store, optionally filtered by status
   */
  async getTasks(storeId: string, status?: string): Promise<IHousekeepingTask[]> {
    const query: Record<string, unknown> = {
      storeId: new Types.ObjectId(storeId),
    };

    if (status && HOUSEKEEPING_STATUSES.includes(status as 'pending' | 'in_progress' | 'completed' | 'verified')) {
      query.status = status;
    }

    const tasks = await HousekeepingTask.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return tasks;
  }

  /**
   * Get all tasks for a specific room
   */
  async getRoomTasks(roomId: string): Promise<IHousekeepingTask[]> {
    const tasks = await HousekeepingTask.find({ roomId })
      .sort({ createdAt: -1 })
      .lean();

    return tasks;
  }

  /**
   * Assign a task to a staff member
   */
  async assignTask(taskId: string, staffId: string, staffName: string): Promise<void> {
    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      throw new Error('Housekeeping task not found');
    }

    if (task.status !== 'pending') {
      throw new Error('Only pending tasks can be assigned');
    }

    task.assignedTo = new Types.ObjectId(staffId);
    task.assignedToName = staffName;
    await task.save();

    logger.info('[Housekeeping] Task assigned', {
      taskId,
      staffId,
      staffName,
    });
  }

  /**
   * Start working on a task
   */
  async startTask(taskId: string): Promise<void> {
    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      throw new Error('Housekeeping task not found');
    }

    if (task.status !== 'pending') {
      throw new Error('Only pending tasks can be started');
    }

    if (!task.assignedTo) {
      throw new Error('Task must be assigned before starting');
    }

    task.status = 'in_progress';
    await task.save();

    logger.info('[Housekeeping] Task started', {
      taskId,
      assignedTo: task.assignedTo.toString(),
    });
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, notes?: string): Promise<void> {
    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      throw new Error('Housekeeping task not found');
    }

    if (task.status !== 'in_progress') {
      throw new Error('Only tasks in progress can be completed');
    }

    task.status = 'completed';
    task.completedAt = new Date();
    if (notes) {
      task.notes = notes;
    }
    await task.save();

    logger.info('[Housekeeping] Task completed', {
      taskId,
      completedAt: task.completedAt,
    });
  }

  /**
   * Verify a completed task
   */
  async verifyTask(taskId: string, verifiedBy: string): Promise<void> {
    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      throw new Error('Housekeeping task not found');
    }

    if (task.status !== 'completed') {
      throw new Error('Only completed tasks can be verified');
    }

    task.status = 'verified';
    task.verifiedAt = new Date();
    task.verifiedBy = new Types.ObjectId(verifiedBy);
    await task.save();

    logger.info('[Housekeeping] Task verified', {
      taskId,
      verifiedBy,
      verifiedAt: task.verifiedAt,
    });
  }

  /**
   * Get tasks assigned to a specific housekeeper for a given date
   */
  async getHousekeeperTasks(staffId: string, date: Date): Promise<IHousekeepingTask[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await HousekeepingTask.find({
      assignedTo: new Types.ObjectId(staffId),
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ priority: -1, createdAt: 1 })
      .lean();

    return tasks;
  }

  /**
   * Generate a housekeeping report for a store on a given date
   */
  async getTasksReport(storeId: string, date: Date): Promise<HousekeepingReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await HousekeepingTask.find({
      storeId: new Types.ObjectId(storeId),
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const verifiedTasks = tasks.filter((t) => t.status === 'verified').length;

    const byPriority = {
      urgent: tasks.filter((t) => t.priority === 'urgent').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low: tasks.filter((t) => t.priority === 'low').length,
    };

    const byTaskType = {
      cleaning: tasks.filter((t) => t.taskType === 'cleaning').length,
      maintenance: tasks.filter((t) => t.taskType === 'maintenance').length,
      inspection: tasks.filter((t) => t.taskType === 'inspection').length,
    };

    // Calculate completion rate (completed + verified / total)
    const completedOrVerified = completedTasks + verifiedTasks;
    const completionRate = totalTasks > 0 ? (completedOrVerified / totalTasks) * 100 : 0;

    // Calculate average completion time (in minutes)
    const completedWithTime = tasks.filter(
      (t) => t.status === 'completed' || t.status === 'verified',
    );
    let averageCompletionTime: number | undefined;

    if (completedWithTime.length > 0) {
      const totalCompletionMs = completedWithTime.reduce((acc, task) => {
        if (task.completedAt) {
          const completionMs = task.completedAt.getTime() - task.createdAt.getTime();
          return acc + completionMs;
        }
        return acc;
      }, 0);
      averageCompletionTime = Math.round(totalCompletionMs / completedWithTime.length / 60000); // Convert to minutes
    }

    logger.info('[Housekeeping] Report generated', {
      storeId,
      date: date.toISOString(),
      totalTasks,
      completionRate: completionRate.toFixed(2),
    });

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      verifiedTasks,
      byPriority,
      byTaskType,
      completionRate: Math.round(completionRate * 100) / 100,
      averageCompletionTime,
    };
  }
}

// Factory function
export function createHousekeepingService(): HousekeepingService {
  return new HousekeepingService();
}
