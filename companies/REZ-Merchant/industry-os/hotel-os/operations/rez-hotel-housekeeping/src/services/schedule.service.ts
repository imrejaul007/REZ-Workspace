/**
 * Schedule Service
 *
 * Business logic for housekeeping staff scheduling
 */

import { HousekeepingTask } from '../models/HousekeepingTask';
import { HousekeepingStaff } from '../models/Staff';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[schedule-service] ${msg}`, meta);

function generateScheduleId(): string {
  return 'SCH' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
}

interface ScheduleEntry {
  taskId: string;
  staffId: string;
  roomIds: string[];
}

interface CreateScheduleInput {
  date: string;
  assignments: Array<{
    staffId: string;
    roomIds: string[];
  }>;
}

class ScheduleService {
  /**
   * Get staff by hotel
   */
  async getStaffByHotel(hotelId: string): Promise<typeof HousekeepingStaff[]> {
    return HousekeepingStaff.find({ hotelId, isActive: true });
  }

  /**
   * Get staff by shift
   */
  async getStaffByShift(hotelId: string, shift: 'morning' | 'afternoon' | 'night'): Promise<typeof HousekeepingStaff[]> {
    return HousekeepingStaff.find({ hotelId, shift, isActive: true });
  }

  /**
   * Create schedule for a day
   */
  async createSchedule(hotelId: string, input: CreateScheduleInput): Promise<{
    scheduleId: string;
    date: Date;
    assignments: ScheduleEntry[];
  }> {
    const scheduleId = generateScheduleId();
    const date = new Date(input.date);

    const assignments: ScheduleEntry[] = [];

    for (const assignment of input.assignments) {
      // Validate staff exists
      const staff = await HousekeepingStaff.findOne({ staffId: assignment.staffId, hotelId });
      if (!staff) continue;

      // Create tasks for each room
      const taskIds: string[] = [];
      for (const roomId of assignment.roomIds) {
        const taskId = 'HT' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();

        const task = new HousekeepingTask({
          taskId,
          hotelId,
          roomId,
          roomNumber: roomId, // Would be fetched from room service in production
          taskType: 'cleaning',
          priority: 'medium',
          status: 'pending',
          assignedTo: staff.staffId,
          dueBy: new Date(date.setHours(14, 0, 0, 0)),
        });

        await task.save();
        taskIds.push(taskId);
      }

      assignments.push({
        taskId: taskIds.join(','),
        staffId: staff.staffId,
        roomIds: assignment.roomIds,
      });

      // Update staff's assigned rooms
      await HousekeepingStaff.findOneAndUpdate(
        { staffId: staff.staffId },
        { $set: { assignedRooms: assignment.roomIds } }
      );
    }

    log('Schedule created', { scheduleId, hotelId, date: input.date, assignmentsCount: assignments.length });

    return {
      scheduleId,
      date,
      assignments,
    };
  }

  /**
   * Get daily schedule
   */
  async getDailySchedule(hotelId: string, date: Date): Promise<{
    date: Date;
    staff: Array<{
      staff: typeof HousekeepingStaff.prototype;
      tasks: typeof HousekeepingTask[];
    }>;
    summary: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      overdueTasks: number;
    };
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all tasks for the day
    const tasks = await HousekeepingTask.find({
      hotelId,
      dueBy: { $gte: startOfDay, $lte: endOfDay },
    });

    // Get all active staff
    const staffList = await HousekeepingStaff.find({ hotelId, isActive: true });

    const staffTasks = staffList.map(staff => ({
      staff,
      tasks: tasks.filter(t => t.assignedTo === staff.staffId),
    }));

    const summary = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      overdueTasks: tasks.filter(t => t.status !== 'completed' && t.dueBy < new Date()).length,
    };

    return {
      date,
      staff: staffTasks,
      summary,
    };
  }

  /**
   * Auto-assign tasks to staff
   */
  async autoAssignTasks(hotelId: string, date: Date): Promise<{
    assigned: number;
    unassigned: number;
    assignments: Array<{ taskId: string; staffId: string }>;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get unassigned tasks
    const unassignedTasks = await HousekeepingTask.find({
      hotelId,
      dueBy: { $gte: startOfDay, $lte: endOfDay },
      assignedTo: { $exists: false },
      status: 'pending',
    });

    // Get available staff
    const staff = await HousekeepingStaff.find({ hotelId, isActive: true });

    const assignments: Array<{ taskId: string; staffId: string }> = [];
    let staffIndex = 0;

    for (const task of unassignedTasks) {
      const assignedStaff = staff[staffIndex % staff.length];

      await HousekeepingTask.findOneAndUpdate(
        { taskId: task.taskId },
        { $set: { assignedTo: assignedStaff.staffId, status: 'in_progress' } }
      );

      assignments.push({ taskId: task.taskId, staffId: assignedStaff.staffId });
      staffIndex++;
    }

    log('Auto-assigned tasks', { hotelId, assigned: assignments.length, unassigned: unassignedTasks.length - assignments.length });

    return {
      assigned: assignments.length,
      unassigned: unassignedTasks.length - assignments.length,
      assignments,
    };
  }

  /**
   * Get staff performance
   */
  async getStaffPerformance(staffId: string, startDate: Date, endDate: Date): Promise<{
    staff: typeof HousekeepingStaff.prototype;
    tasksCompleted: number;
    averageTime: number;
    rating: number;
    byType: Record<string, number>;
  }> {
    const staff = await HousekeepingStaff.findOne({ staffId });
    if (!staff) {
      throw new Error('Staff not found');
    }

    const tasks = await HousekeepingTask.find({
      assignedTo: staffId,
      status: 'completed',
      completedAt: { $gte: startDate, $lte: endDate },
    });

    let totalTime = 0;
    const byType: Record<string, number> = {};

    for (const task of tasks) {
      if (task.startedAt && task.completedAt) {
        totalTime += task.completedAt.getTime() - task.startedAt.getTime();
      }
      byType[task.taskType] = (byType[task.taskType] || 0) + 1;
    }

    const averageTime = tasks.length > 0 ? totalTime / tasks.length / 60000 : 0; // in minutes

    // Calculate rating based on completion rate and time
    const rating = tasks.length > 0 ? Math.min(5, (tasks.length / 10) * 5) : 0;

    return {
      staff,
      tasksCompleted: tasks.length,
      averageTime: Math.round(averageTime),
      rating: Math.round(rating * 10) / 10,
      byType,
    };
  }
}

export const scheduleService = new ScheduleService();
