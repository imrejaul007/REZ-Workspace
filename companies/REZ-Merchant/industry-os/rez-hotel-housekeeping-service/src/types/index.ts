/**
 * Hotel Housekeeping Service Types
 */

export type TaskType = 'cleaning' | 'deep_clean' | 'turndown' | 'inspection' | 'maintenance';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export interface IHousekeepingTask {
  taskId: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  dueBy: Date;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IHousekeepingStaff {
  staffId: string;
  hotelId: string;
  name: string;
  phone: string;
  email?: string;
  role: 'housekeeper' | 'supervisor' | 'manager';
  shift: 'morning' | 'afternoon' | 'night';
  assignedRooms: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHousekeepingSchedule {
  scheduleId: string;
  hotelId: string;
  date: Date;
  tasks: Array<{
    taskId: string;
    staffId: string;
    roomIds: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  roomId: string;
  roomNumber: string;
  taskType: TaskType;
  priority: TaskPriority;
  dueBy: string;
  assignedTo?: string;
  notes?: string;
}

export interface UpdateTaskInput {
  taskType?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: string;
  dueBy?: string;
  notes?: string;
}

export interface CreateStaffInput {
  name: string;
  phone: string;
  email?: string;
  role: IHousekeepingStaff['role'];
  shift: IHousekeepingStaff['shift'];
}

export interface TaskSearchFilters {
  hotelId?: string;
  status?: TaskStatus;
  taskType?: TaskType;
  priority?: TaskPriority;
  assignedTo?: string;
  dueFrom?: string;
  dueTo?: string;
}
