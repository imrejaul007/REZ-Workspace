/**
 * Housekeeping Service - Room Management Backend
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  taskType: 'cleaning' | 'turndown' | 'deep-clean' | 'laundry' | 'minibar' | 'supply' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  guestRequest?: boolean;
}

export interface RoomStatus {
  roomNumber: string;
  floor: number;
  type: 'standard' | 'deluxe' | 'suite';
  isClean: boolean;
  isOccupied: boolean;
  isMaintenance: boolean;
  lastCleaned?: string;
  currentGuestId?: string;
  condition: 'excellent' | 'good' | 'needs-attention' | 'out-of-order';
  pendingTasks: number;
}

export interface StaffMember {
  id: string;
  name: string;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  isActive: boolean;
  tasksToday: number;
  currentTask?: string;
  specialties: string[];
}

export class HousekeepingService {
  private tasks: Map<string, HousekeepingTask> = new Map();
  private rooms: Map<string, RoomStatus> = new Map();
  private staff: Map<string, StaffMember> = new Map();

  constructor() {
    this.initializeRooms();
    this.initializeStaff();
  }

  private initializeRooms(): void {
    const roomConfigs = [
      { number: '101', floor: 1, type: 'standard' as const },
      { number: '102', floor: 1, type: 'standard' as const },
      { number: '103', floor: 1, type: 'standard' as const },
      { number: '201', floor: 2, type: 'deluxe' as const },
      { number: '202', floor: 2, type: 'deluxe' as const },
      { number: '301', floor: 3, type: 'suite' as const },
    ];

    roomConfigs.forEach(config => {
      this.rooms.set(config.number, {
        ...config,
        isClean: true,
        isOccupied: false,
        isMaintenance: false,
        condition: 'excellent',
        pendingTasks: 0
      });
    });
  }

  private initializeStaff(): void {
    const staffConfigs = [
      { id: '1', name: 'Maria Garcia', shift: 'morning' as const, specialties: ['deep-clean', 'inspection'] },
      { id: '2', name: 'John Smith', shift: 'morning' as const, specialties: ['cleaning', 'laundry'] },
      { id: '3', name: 'Priya Sharma', shift: 'afternoon' as const, specialties: ['cleaning', 'turndown'] },
      { id: '4', name: 'Amit Kumar', shift: 'evening' as const, specialties: ['supply', 'minibar'] },
    ];

    staffConfigs.forEach(config => {
      this.staff.set(config.id, { ...config, isActive: true, tasksToday: 0 });
    });
  }

  async createTask(data: Omit<HousekeepingTask, 'id' | 'createdAt' | 'status'>): Promise<HousekeepingTask> {
    const task: HousekeepingTask = {
      ...data,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.tasks.set(task.id, task);

    // Update room pending tasks
    const room = this.rooms.get(task.roomNumber);
    if (room) {
      room.pendingTasks++;
    }

    return task;
  }

  async assignTask(taskId: string, staffId?: string): Promise<HousekeepingTask | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    // Find available staff
    const availableStaff = Array.from(this.staff.values()).find(s => s.isActive && !s.currentTask);
    const assignedStaff = staffId ? this.staff.get(staffId) : availableStaff;

    if (assignedStaff) {
      task.assignedTo = assignedStaff.name;
      task.status = 'in-progress';
      task.startedAt = new Date().toISOString();
      assignedStaff.currentTask = taskId;
      this.staff.set(assignedStaff.id, assignedStaff);
    }

    this.tasks.set(taskId, task);
    return task;
  }

  async completeTask(taskId: string, notes?: string): Promise<HousekeepingTask | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    if (notes) task.notes = notes;

    // Free up staff
    const staff = Array.from(this.staff.values()).find(s => s.currentTask === taskId);
    if (staff) {
      staff.currentTask = undefined;
      staff.tasksToday++;
      this.staff.set(staff.id, staff);
    }

    // Update room status
    const room = this.rooms.get(task.roomNumber);
    if (room) {
      room.pendingTasks = Math.max(0, room.pendingTasks - 1);
      room.isClean = true;
      room.lastCleaned = new Date().toISOString();
      if (room.pendingTasks === 0 && room.condition === 'needs-attention') {
        room.condition = 'good';
      }
      this.rooms.set(task.roomNumber, room);
    }

    this.tasks.set(taskId, task);
    return task;
  }

  async getRoomStatus(roomNumber: string): Promise<RoomStatus | undefined> {
    return this.rooms.get(roomNumber);
  }

  async getAllRoomStatuses(): Promise<RoomStatus[]> {
    return Array.from(this.rooms.values());
  }

  async getTaskById(taskId: string): Promise<HousekeepingTask | undefined> {
    return this.tasks.get(taskId);
  }

  async getTasksByRoom(roomNumber: string): Promise<HousekeepingTask[]> {
    return Array.from(this.tasks.values()).filter(t => t.roomNumber === roomNumber);
  }

  async getTasksByStatus(status: HousekeepingTask['status']): Promise<HousekeepingTask[]> {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  async getDashboard(): Promise<{
    stats: { pending: number; inProgress: number; completedToday: number; urgent: number };
    roomStatuses: RoomStatus[];
    staffStatus: StaffMember[];
    upcomingTasks: HousekeepingTask[];
  }> {
    const allTasks = Array.from(this.tasks.values());
    const today = new Date().toISOString().split('T')[0];

    return {
      stats: {
        pending: allTasks.filter(t => t.status === 'pending').length,
        inProgress: allTasks.filter(t => t.status === 'in-progress').length,
        completedToday: allTasks.filter(t => t.completedAt?.startsWith(today)).length,
        urgent: allTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length
      },
      roomStatuses: Array.from(this.rooms.values()),
      staffStatus: Array.from(this.staff.values()),
      upcomingTasks: allTasks.filter(t => t.status === 'pending').slice(0, 5)
    };
  }

  async requestEmergencyCleaning(roomNumber: string, reason: string): Promise<HousekeepingTask> {
    return this.createTask({
      roomNumber,
      taskType: 'deep-clean',
      priority: 'urgent',
      notes: reason,
      guestRequest: true
    });
  }

  async scheduleRoutineCleaning(roomNumber: string, date: string): Promise<HousekeepingTask> {
    return this.createTask({
      roomNumber,
      taskType: 'cleaning',
      priority: 'medium',
      notes: `Scheduled for ${date}`
    });
  }
}

export default HousekeepingService;