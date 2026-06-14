/**
 * REZ Hotel Housekeeping Service
 * In-memory data store for room status and task management
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export enum RoomStatus {
  VACANT_CLEAN = 'VACANT_CLEAN',
  VACANT_DIRTY = 'VACANT_DIRTY',
  OCCUPIED = 'OCCUPIED',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskType {
  CLEANING = 'CLEANING',
  DEEP_CLEAN = 'DEEP_CLEAN',
  TURNDOWN = 'TURNDOWN',
  INSPECTION = 'INSPECTION',
  MAINTENANCE_CLEAN = 'MAINTENANCE_CLEAN',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum InspectionResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NEEDS_REWORK = 'NEEDS_REWORK',
}

export interface RoomStatusRecord {
  roomId: string;
  hotelId: string;
  status: RoomStatus;
  lastCleaned: Date | null;
  nextCleaning: Date | null;
  notes: string;
  updatedAt: Date;
}

export interface HousekeepingTask {
  taskId: string;
  roomId: string;
  hotelId: string;
  staffId: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  scheduled: Date;
  completed: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HousekeepingStaff {
  staffId: string;
  hotelId: string;
  name: string;
  email: string;
  phone: string;
  zone: string;
  active: boolean;
}

export interface Inspection {
  inspectionId: string;
  taskId: string;
  roomId: string;
  hotelId: string;
  inspectorId: string;
  result: InspectionResult;
  score: number;
  checklist: Record<string, boolean>;
  notes: string;
  photos: string[];
  createdAt: Date;
}

// In-memory data stores
const roomStatuses = new Map<string, RoomStatusRecord>();
const tasks = new Map<string, HousekeepingTask>();
const staff = new Map<string, HousekeepingStaff>();
const inspections = new Map<string, Inspection>();

// Helper functions
function getRoomKey(hotelId: string, roomId: string): string {
  return `${hotelId}:${roomId}`;
}

function generateTaskId(): string {
  return `TASK-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function generateStaffId(): string {
  return `STAFF-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function generateInspectionId(): string {
  return `INSP-${uuidv4().slice(0, 8).toUpperCase()}`;
}

// Room Status Functions
export function getRoomStatus(hotelId: string, roomId: string): RoomStatusRecord | undefined {
  const key = getRoomKey(hotelId, roomId);
  return roomStatuses.get(key);
}

export function getAllRoomStatuses(hotelId: string): RoomStatusRecord[] {
  const result: RoomStatusRecord[] = [];
  for (const record of roomStatuses.values()) {
    if (record.hotelId === hotelId) {
      result.push(record);
    }
  }
  return result;
}

export function updateRoomStatus(
  hotelId: string,
  roomId: string,
  status: RoomStatus,
  notes?: string
): RoomStatusRecord {
  const key = getRoomKey(hotelId, roomId);
  const existing = roomStatuses.get(key);

  const record: RoomStatusRecord = {
    roomId,
    hotelId,
    status,
    lastCleaned: status === RoomStatus.VACANT_CLEAN ? new Date() : (existing?.lastCleaned || null),
    nextCleaning: existing?.nextCleaning || null,
    notes: notes || existing?.notes || '',
    updatedAt: new Date(),
  };

  roomStatuses.set(key, record);
  return record;
}

export function setNextCleaning(hotelId: string, roomId: string, nextCleaning: Date): RoomStatusRecord | undefined {
  const key = getRoomKey(hotelId, roomId);
  const existing = roomStatuses.get(key);

  if (!existing) return undefined;

  const record: RoomStatusRecord = {
    ...existing,
    nextCleaning,
    updatedAt: new Date(),
  };

  roomStatuses.set(key, record);
  return record;
}

// Task Functions
export function createTask(
  roomId: string,
  hotelId: string,
  type: TaskType,
  priority: TaskPriority,
  scheduled: Date,
  staffId?: string,
  notes?: string
): HousekeepingTask {
  const taskId = generateTaskId();
  const now = new Date();

  const task: HousekeepingTask = {
    taskId,
    roomId,
    hotelId,
    staffId: staffId || null,
    type,
    priority,
    status: TaskStatus.PENDING,
    scheduled,
    completed: null,
    notes: notes || '',
    createdAt: now,
    updatedAt: now,
  };

  tasks.set(taskId, task);
  return task;
}

export function getTask(taskId: string): HousekeepingTask | undefined {
  return tasks.get(taskId);
}

export function getTasksByHotel(hotelId: string): HousekeepingTask[] {
  const result: HousekeepingTask[] = [];
  for (const task of tasks.values()) {
    if (task.hotelId === hotelId) {
      result.push(task);
    }
  }
  return result.sort((a, b) => a.scheduled.getTime() - b.scheduled.getTime());
}

export function getTasksByStaff(hotelId: string, staffId: string): HousekeepingTask[] {
  const result: HousekeepingTask[] = [];
  for (const task of tasks.values()) {
    if (task.hotelId === hotelId && task.staffId === staffId) {
      result.push(task);
    }
  }
  return result.sort((a, b) => a.scheduled.getTime() - b.scheduled.getTime());
}

export function getTasksByRoom(hotelId: string, roomId: string): HousekeepingTask[] {
  const result: HousekeepingTask[] = [];
  for (const task of tasks.values()) {
    if (task.hotelId === hotelId && task.roomId === roomId) {
      result.push(task);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function updateTask(
  taskId: string,
  updates: Partial<Pick<HousekeepingTask, 'status' | 'staffId' | 'priority' | 'notes' | 'completed'>>
): HousekeepingTask | undefined {
  const existing = tasks.get(taskId);
  if (!existing) return undefined;

  const task: HousekeepingTask = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  tasks.set(taskId, task);
  return task;
}

export function assignTaskToStaff(taskId: string, staffId: string): HousekeepingTask | undefined {
  return updateTask(taskId, { staffId, status: TaskStatus.IN_PROGRESS });
}

export function completeTask(taskId: string, notes?: string): HousekeepingTask | undefined {
  const now = new Date();
  return updateTask(taskId, {
    status: TaskStatus.COMPLETED,
    completed: now,
    notes: notes || undefined,
  });
}

export function cancelTask(taskId: string): HousekeepingTask | undefined {
  return updateTask(taskId, { status: TaskStatus.CANCELLED });
}

// Staff Functions
export function addStaff(
  hotelId: string,
  name: string,
  email: string,
  phone: string,
  zone: string
): HousekeepingStaff {
  const staffId = generateStaffId();
  const s: HousekeepingStaff = {
    staffId,
    hotelId,
    name,
    email,
    phone,
    zone,
    active: true,
  };
  staff.set(staffId, s);
  return s;
}

export function getStaffByHotel(hotelId: string): HousekeepingStaff[] {
  const result: HousekeepingStaff[] = [];
  for (const s of staff.values()) {
    if (s.hotelId === hotelId && s.active) {
      result.push(s);
    }
  }
  return result;
}

export function getStaff(staffId: string): HousekeepingStaff | undefined {
  return staff.get(staffId);
}

export function deactivateStaff(staffId: string): boolean {
  const s = staff.get(staffId);
  if (!s) return false;
  s.active = false;
  return true;
}

// Inspection Functions
export function createInspection(
  taskId: string,
  roomId: string,
  hotelId: string,
  inspectorId: string,
  result: InspectionResult,
  score: number,
  checklist: Record<string, boolean>,
  notes?: string,
  photos?: string[]
): Inspection {
  const inspectionId = generateInspectionId();

  const inspection: Inspection = {
    inspectionId,
    taskId,
    roomId,
    hotelId,
    inspectorId,
    result,
    score,
    checklist,
    notes: notes || '',
    photos: photos || [],
    createdAt: new Date(),
  };

  inspections.set(inspectionId, inspection);
  return inspection;
}

export function getInspectionsByRoom(hotelId: string, roomId: string): Inspection[] {
  const result: Inspection[] = [];
  for (const insp of inspections.values()) {
    if (insp.hotelId === hotelId && insp.roomId === roomId) {
      result.push(insp);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getInspection(inspectionId: string): Inspection | undefined {
  return inspections.get(inspectionId);
}

// Statistics
export function getHousekeepingStats(hotelId: string): {
  totalRooms: number;
  statusBreakdown: Record<RoomStatus, number>;
  pendingTasks: number;
  completedToday: number;
  overdueTasks: number;
} {
  const rooms = getAllRoomStatuses(hotelId);
  const allTasks = getTasksByHotel(hotelId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statusBreakdown: Record<RoomStatus, number> = {
    [RoomStatus.VACANT_CLEAN]: 0,
    [RoomStatus.VACANT_DIRTY]: 0,
    [RoomStatus.OCCUPIED]: 0,
    [RoomStatus.OUT_OF_ORDER]: 0,
    [RoomStatus.OUT_OF_SERVICE]: 0,
  };

  for (const room of rooms) {
    statusBreakdown[room.status]++;
  }

  const pendingTasks = allTasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS).length;
  const completedToday = allTasks.filter(t =>
    t.status === TaskStatus.COMPLETED &&
    t.completed &&
    t.completed >= today
  ).length;
  const overdueTasks = allTasks.filter(t =>
    (t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS) &&
    t.scheduled < new Date()
  ).length;

  return {
    totalRooms: rooms.length,
    statusBreakdown,
    pendingTasks,
    completedToday,
    overdueTasks,
  };
}

// Reset function for testing
export function resetStore(): void {
  roomStatuses.clear();
  tasks.clear();
  staff.clear();
  inspections.clear();
}
