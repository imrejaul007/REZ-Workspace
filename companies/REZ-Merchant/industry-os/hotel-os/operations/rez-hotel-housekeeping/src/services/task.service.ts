/**
 * Task Service
 *
 * Business logic for housekeeping task management
 */

import { HousekeepingTask } from '../models/HousekeepingTask';
import { HousekeepingStaff } from '../models/Staff';
import { logger } from '../config/logger';
import { CreateTaskInput, UpdateTaskInput, TaskSearchFilters, TaskStatus } from '../types';
import axios from 'axios';

const log = (msg: string, meta?) => logger.info(`[task-service] ${msg}`, meta);

const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL || 'http://localhost:4020';

function generateTaskId(): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `HT${Date.now().toString(36)}${uuid}`;
  } catch {
    return 'HT' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}

class TaskService {
  /**
   * Create a new task
   */
  async createTask(hotelId: string, input: CreateTaskInput): Promise<typeof HousekeepingTask.prototype> {
    const taskId = generateTaskId();

    const task = new HousekeepingTask({
      taskId,
      hotelId,
      roomId: input.roomId,
      roomNumber: input.roomNumber,
      taskType: input.taskType,
      priority: input.priority,
      status: 'pending',
      assignedTo: input.assignedTo,
      dueBy: new Date(input.dueBy),
      notes: input.notes,
    });

    await task.save();
    log('Task created', { taskId, hotelId, roomNumber: input.roomNumber });

    // Notify room service about new task
    this.notifyRoomService(input.roomId, 'cleaning').catch(err => {
      log('Failed to notify room service', { error: err.message });
    });

    return task;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<typeof HousekeepingTask.prototype | null> {
    return HousekeepingTask.findOne({ taskId });
  }

  /**
   * Get tasks with filters
   */
  async getTasks(filters: TaskSearchFilters): Promise<typeof HousekeepingTask[]> {
    const query: Record<string, unknown> = {};

    if (filters.hotelId) query.hotelId = filters.hotelId;
    if (filters.status) query.status = filters.status;
    if (filters.taskType) query.taskType = filters.taskType;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    if (filters.dueFrom || filters.dueTo) {
      query.dueBy = {};
      if (filters.dueFrom) (query.dueBy as Record<string, Date>).$gte = new Date(filters.dueFrom);
      if (filters.dueTo) (query.dueBy as Record<string, Date>).$lte = new Date(filters.dueTo);
    }

    return HousekeepingTask.find(query).sort({ priority: -1, dueBy: 1 });
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<typeof HousekeepingTask.prototype | null> {
    const updates: Record<string, unknown> = {};

    if (input.taskType) updates.taskType = input.taskType;
    if (input.priority) updates.priority = input.priority;
    if (input.status) {
      updates.status = input.status;
      if (input.status === 'in_progress') updates.startedAt = new Date();
      if (input.status === 'completed') updates.completedAt = new Date();
    }
    if (input.assignedTo) updates.assignedTo = input.assignedTo;
    if (input.dueBy) updates.dueBy = new Date(input.dueBy);
    if (input.notes !== undefined) updates.notes = input.notes;

    const task = await HousekeepingTask.findOneAndUpdate(
      { taskId },
      { $set: updates },
      { new: true }
    );

    if (task) {
      log('Task updated', { taskId, updates });

      // Notify room service about status change
      if (input.status === 'completed') {
        await this.notifyRoomService(task.roomId, 'available');
      }
    }

    return task;
  }

  /**
   * Assign task to staff
   */
  async assignTask(taskId: string, staffId: string): Promise<typeof HousekeepingTask.prototype | null> {
    const task = await HousekeepingTask.findOneAndUpdate(
      { taskId },
      { $set: { assignedTo: staffId, status: 'in_progress', startedAt: new Date() } },
      { new: true }
    );

    if (task) {
      log('Task assigned', { taskId, staffId });

      // Update staff's assigned rooms
      await HousekeepingStaff.findOneAndUpdate(
        { staffId },
        { $addToSet: { assignedRooms: task.roomId } }
      );
    }

    return task;
  }

  /**
   * Start task
   */
  async startTask(taskId: string): Promise<typeof HousekeepingTask.prototype | null> {
    return this.updateTask(taskId, { status: 'in_progress' });
  }

  /**
   * Complete task
   */
  async completeTask(taskId: string, notes?: string): Promise<typeof HousekeepingTask.prototype | null> {
    const task = await HousekeepingTask.findOne({ taskId });
    if (!task) return null;

    const updates: Record<string, unknown> = {
      status: 'completed',
      completedAt: new Date(),
    };
    if (notes) updates.notes = notes;

    const updated = await HousekeepingTask.findOneAndUpdate(
      { taskId },
      { $set: updates },
      { new: true }
    );

    if (updated) {
      log('Task completed', { taskId, roomId: task.roomId });

      // Notify room service to mark room as available
      await this.notifyRoomService(task.roomId, 'available');

      // Remove room from staff's assigned rooms
      if (task.assignedTo) {
        await HousekeepingStaff.findOneAndUpdate(
          { staffId: task.assignedTo },
          { $pull: { assignedRooms: task.roomId } }
        );
      }
    }

    return updated;
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string): Promise<typeof HousekeepingTask.prototype | null> {
    return this.updateTask(taskId, { status: 'cancelled' });
  }

  /**
   * Get tasks by room
   */
  async getTasksByRoom(roomId: string): Promise<typeof HousekeepingTask[]> {
    return HousekeepingTask.find({ roomId }).sort({ createdAt: -1 });
  }

  /**
   * Get tasks by staff
   */
  async getTasksByStaff(staffId: string): Promise<typeof HousekeepingTask[]> {
    return HousekeepingTask.find({ assignedTo: staffId, status: { $ne: 'cancelled' } })
      .sort({ priority: -1, dueBy: 1 });
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(hotelId: string): Promise<typeof HousekeepingTask[]> {
    return HousekeepingTask.find({
      hotelId,
      status: { $in: ['pending', 'in_progress'] },
      dueBy: { $lt: new Date() },
    }).sort({ dueBy: 1 });
  }

  /**
   * Get task statistics
   */
  async getTaskStats(hotelId: string, date?: Date): Promise<{
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    averageCompletionTime: number;
  }> {
    const query: Record<string, unknown> = { hotelId };
    if (date) {
      query.createdAt = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      };
    }

    const tasks = await HousekeepingTask.find(query);

    const stats = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      averageCompletionTime: 0,
    };

    let totalCompletionTime = 0;
    let completedCount = 0;

    for (const task of tasks) {
      switch (task.status) {
        case 'pending': stats.pending++; break;
        case 'in_progress': stats.inProgress++; break;
        case 'completed': stats.completed++; break;
      }

      if (task.status !== 'completed' && task.dueBy < new Date()) {
        stats.overdue++;
      }

      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      stats.byType[task.taskType] = (stats.byType[task.taskType] || 0) + 1;

      if (task.status === 'completed' && task.startedAt && task.completedAt) {
        totalCompletionTime += task.completedAt.getTime() - task.startedAt.getTime();
        completedCount++;
      }
    }

    stats.averageCompletionTime = completedCount > 0 ? totalCompletionTime / completedCount / 60000 : 0;

    return stats;
  }

  /**
   * Notify room service about room status change
   */
  private async notifyRoomService(roomId: string, status: string): Promise<void> {
    try {
      await axios.patch(`${HOTEL_SERVICE_URL}/api/rooms/${roomId}/status`, { status }, {
        timeout: 5000,
        headers: { 'x-service-key': process.env.INTERNAL_SERVICE_TOKEN },
      });
    } catch (error) {
      log('Failed to notify room service', { roomId, status, error });
    }
  }
}

export const taskService = new TaskService();
