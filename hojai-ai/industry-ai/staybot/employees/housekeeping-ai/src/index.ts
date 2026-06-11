/**
 * Housekeeping AI - Room Management Agent
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  taskType: 'cleaning' | 'turndown' | 'deep-clean' | 'laundry' | 'minibar' | 'supply';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface RoomStatus {
  roomNumber: string;
  isClean: boolean;
  isOccupied: boolean;
  lastCleaned?: string;
  pendingTasks: number;
  condition: 'excellent' | 'good' | 'needs-attention';
}

export interface StaffAssignment {
  staffId: string;
  staffName: string;
  currentRoom?: string;
  shift: 'morning' | 'afternoon' | 'evening';
  status: 'available' | 'busy' | 'break';
}

export class HousekeepingAI {
  private readonly staff: StaffAssignment[] = [
    { staffId: '1', staffName: 'Maria Garcia', shift: 'morning', status: 'available' },
    { staffId: '2', staffName: 'John Smith', shift: 'morning', status: 'available' },
    { staffId: '3', staffName: 'Priya Sharma', shift: 'afternoon', status: 'available' },
    { staffId: '4', staffName: 'Amit Kumar', shift: 'morning', status: 'available' },
    { staffId: '5', staffName: 'Lisa Chen', shift: 'evening', status: 'available' },
  ];

  /**
   * Create a new housekeeping task
   */
  async createTask(
    roomNumber: string,
    taskType: HousekeepingTask['taskType'],
    priority: HousekeepingTask['priority'],
    notes?: string
  ): Promise<{ task: HousekeepingTask; message: string }> {
    const availableStaff = this.staff.filter(s => s.status === 'available');
    const assignedStaff = priority === 'urgent'
      ? availableStaff[0]
      : availableStaff[Math.floor(Math.random() * availableStaff.length)];

    const task: HousekeepingTask = {
      id: uuidv4(),
      roomNumber,
      taskType,
      priority,
      status: 'pending',
      assignedTo: assignedStaff?.staffName,
      createdAt: new Date().toISOString(),
      notes
    };

    if (assignedStaff) {
      assignedStaff.status = 'busy';
      assignedStaff.currentRoom = roomNumber;
    }

    const message = this.generateTaskMessage(task);

    return { task, message };
  }

  /**
   * Get dashboard status
   */
  async getDashboard(): Promise<{
    stats: {
      pending: number;
      inProgress: number;
      completedToday: number;
      urgent: number;
    };
    tasks: HousekeepingTask[];
    insights: string[];
  }> {
    const insights: string[] = [];

    // Generate AI insights
    if (Math.random() > 0.5) {
      insights.push('High turnover expected between 11 AM - 1 PM. Consider deploying extra staff.');
    }
    if (Math.random() > 0.7) {
      insights.push('Suite rooms on floor 3 may need priority cleaning.');
    }
    insights.push('Current room status: All rooms in excellent condition.');

    return {
      stats: {
        pending: Math.floor(Math.random() * 10),
        inProgress: Math.floor(Math.random() * 5),
        completedToday: Math.floor(Math.random() * 20),
        urgent: Math.floor(Math.random() * 3)
      },
      tasks: [],
      insights
    };
  }

  /**
   * Assign task to staff
   */
  async assignTask(
    taskId: string,
    staffId?: string
  ): Promise<{ success: boolean; message: string }> {
    const staff = staffId
      ? this.staff.find(s => s.staffId === staffId)
      : this.staff.find(s => s.status === 'available');

    if (!staff) {
      return { success: false, message: 'No available staff for assignment.' };
    }

    staff.status = 'busy';

    return {
      success: true,
      message: `Task assigned to ${staff.staffName}. ${staff.shift} shift.`
    };
  }

  /**
   * Complete a task
   */
  async completeTask(
    taskId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    const staff = this.staff.find(s => s.status === 'busy');
    if (staff) {
      staff.status = 'available';
      staff.currentRoom = undefined;
    }

    return {
      success: true,
      message: `Task ${taskId} completed. Room ready for next guest.`
    };
  }

  /**
   * Request emergency cleaning
   */
  async emergencyClean(
    roomNumber: string,
    reason: string
  ): Promise<{ ticketId: string; eta: string; message: string }> {
    const task = await this.createTask(roomNumber, 'deep-clean', 'urgent', reason);

    return {
      ticketId: task.task.id,
      eta: '15 minutes',
      message: `Emergency cleaning team dispatched to Room ${roomNumber}. ETA: 15 minutes. ${reason}`
    };
  }

  /**
   * Get room cleaning schedule
   */
  async getSchedule(date: string): Promise<{
    schedule: { time: string; roomNumber: string; taskType: string; staff: string }[];
    optimalRoute: string[];
  }> {
    const rooms = ['101', '102', '201', '202', '301', '302'];
    const schedule = rooms.map((room, index) => ({
      time: `${8 + index}:00 AM`,
      roomNumber: room,
      taskType: index % 2 === 0 ? 'cleaning' : 'turndown',
      staff: this.staff[index % this.staff.length]?.staffName || 'Unassigned'
    }));

    return {
      schedule,
      optimalRoute: ['102', '101', '202', '201', '302', '301'] // Efficient route
    };
  }

  private generateTaskMessage(task: HousekeepingTask): string {
    const priorityMessages = {
      'urgent': `URGENT: ${task.taskType} requested for Room ${task.roomNumber}. Assigned to ${task.assignedTo}.`,
      'high': `${task.taskType} for Room ${task.roomNumber} marked HIGH priority. ETA: 10 mins.`,
      'medium': `${task.taskType} scheduled for Room ${task.roomNumber}. Assigned to ${task.assignedTo}.`,
      'low': `${task.taskType} queued for Room ${task.roomNumber}. Standard priority.`
    };

    return priorityMessages[task.priority];
  }
}

export default HousekeepingAI;