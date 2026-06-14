/**
 * REZ Hotel Housekeeping Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RoomStatus,
  TaskType,
  TaskPriority,
  TaskStatus,
  InspectionResult,
  resetStore,
  getRoomStatus,
  getAllRoomStatuses,
  updateRoomStatus,
  setNextCleaning,
  createTask,
  getTask,
  getTasksByHotel,
  getTasksByStaff,
  getTasksByRoom,
  updateTask,
  assignTaskToStaff,
  completeTask,
  cancelTask,
  addStaff,
  getStaffByHotel,
  getStaff,
  deactivateStaff,
  createInspection,
  getInspectionsByRoom,
  getInspection,
  getHousekeepingStats,
} from './services/housekeeping.service.js';

describe('Housekeeping Service', () => {
  beforeEach(() => {
    resetStore();
  });

  // ========================
  // ROOM STATUS TESTS
  // ========================

  describe('Room Status Management', () => {
    it('should update room status to VACANT_CLEAN', () => {
      const room = updateRoomStatus('hotel-1', 'room-101', RoomStatus.VACANT_CLEAN);

      expect(room).toBeDefined();
      expect(room.status).toBe(RoomStatus.VACANT_CLEAN);
      expect(room.lastCleaned).toBeInstanceOf(Date);
      expect(room.roomId).toBe('room-101');
      expect(room.hotelId).toBe('hotel-1');
    });

    it('should update room status to OCCUPIED', () => {
      const room = updateRoomStatus('hotel-1', 'room-102', RoomStatus.OCCUPIED);

      expect(room.status).toBe(RoomStatus.OCCUPIED);
      expect(room.lastCleaned).toBeNull();
    });

    it('should update room status to VACANT_DIRTY', () => {
      const room = updateRoomStatus('hotel-1', 'room-103', RoomStatus.VACANT_DIRTY);

      expect(room.status).toBe(RoomStatus.VACANT_DIRTY);
    });

    it('should update room status to OUT_OF_ORDER', () => {
      const room = updateRoomStatus('hotel-1', 'room-104', RoomStatus.OUT_OF_ORDER);

      expect(room.status).toBe(RoomStatus.OUT_OF_ORDER);
    });

    it('should set lastCleaned when status changes to VACANT_CLEAN', () => {
      updateRoomStatus('hotel-1', 'room-105', RoomStatus.VACANT_DIRTY);
      const room = updateRoomStatus('hotel-1', 'room-105', RoomStatus.VACANT_CLEAN);

      expect(room.lastCleaned).toBeInstanceOf(Date);
    });

    it('should get all room statuses for a hotel', () => {
      updateRoomStatus('hotel-1', 'room-101', RoomStatus.VACANT_CLEAN);
      updateRoomStatus('hotel-1', 'room-102', RoomStatus.OCCUPIED);
      updateRoomStatus('hotel-2', 'room-201', RoomStatus.VACANT_DIRTY);

      const rooms = getAllRoomStatuses('hotel-1');

      expect(rooms).toHaveLength(2);
      expect(rooms.map(r => r.roomId)).toContain('room-101');
      expect(rooms.map(r => r.roomId)).toContain('room-102');
    });

    it('should set next cleaning time for a room', () => {
      updateRoomStatus('hotel-1', 'room-101', RoomStatus.VACANT_CLEAN);
      const nextCleaning = new Date('2026-06-03T10:00:00Z');
      const room = setNextCleaning('hotel-1', 'room-101', nextCleaning);

      expect(room?.nextCleaning).toEqual(nextCleaning);
    });

    it('should return undefined when setting next cleaning for non-existent room', () => {
      const room = setNextCleaning('hotel-1', 'non-existent', new Date());
      expect(room).toBeUndefined();
    });
  });

  // ========================
  // TASK TESTS
  // ========================

  describe('Task Management', () => {
    it('should create a new cleaning task', () => {
      const scheduled = new Date('2026-06-02T14:00:00Z');
      const task = createTask(
        'room-101',
        'hotel-1',
        TaskType.CLEANING,
        TaskPriority.MEDIUM,
        scheduled
      );

      expect(task).toBeDefined();
      expect(task.taskId).toMatch(/^TASK-[A-F0-9]+$/);
      expect(task.roomId).toBe('room-101');
      expect(task.hotelId).toBe('hotel-1');
      expect(task.type).toBe(TaskType.CLEANING);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.staffId).toBeNull();
    });

    it('should create task with staff assignment', () => {
      const scheduled = new Date();
      const task = createTask(
        'room-102',
        'hotel-1',
        TaskType.DEEP_CLEAN,
        TaskPriority.HIGH,
        scheduled,
        'staff-1'
      );

      expect(task.staffId).toBe('staff-1');
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it('should get task by ID', () => {
      const task = createTask('room-101', 'hotel-1', TaskType.TURNDOWN, TaskPriority.LOW, new Date());
      const found = getTask(task.taskId);

      expect(found).toEqual(task);
    });

    it('should get undefined for non-existent task', () => {
      const found = getTask('non-existent-task');
      expect(found).toBeUndefined();
    });

    it('should get all tasks for a hotel sorted by scheduled date', () => {
      createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.LOW, new Date('2026-06-03'));
      createTask('room-102', 'hotel-1', TaskType.DEEP_CLEAN, TaskPriority.HIGH, new Date('2026-06-02'));
      createTask('room-103', 'hotel-2', TaskType.INSPECTION, TaskPriority.MEDIUM, new Date());

      const tasks = getTasksByHotel('hotel-1');

      expect(tasks).toHaveLength(2);
      expect(tasks[0].roomId).toBe('room-102'); // Earlier scheduled
      expect(tasks[1].roomId).toBe('room-101');
    });

    it('should get tasks by staff member', () => {
      createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date(), 'staff-1');
      createTask('room-102', 'hotel-1', TaskType.TURNDOWN, TaskPriority.LOW, new Date(), 'staff-1');
      createTask('room-103', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date(), 'staff-2');

      const staff1Tasks = getTasksByStaff('hotel-1', 'staff-1');
      const staff2Tasks = getTasksByStaff('hotel-1', 'staff-2');

      expect(staff1Tasks).toHaveLength(2);
      expect(staff2Tasks).toHaveLength(1);
    });

    it('should update task status', () => {
      const task = createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date());
      const updated = updateTask(task.taskId, { status: TaskStatus.IN_PROGRESS });

      expect(updated?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should assign task to staff', () => {
      const task = createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date());
      const assigned = assignTaskToStaff(task.taskId, 'staff-1');

      expect(assigned?.staffId).toBe('staff-1');
      expect(assigned?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should complete a task', () => {
      const task = createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date());
      const completed = completeTask(task.taskId, 'Room cleaned thoroughly');

      expect(completed?.status).toBe(TaskStatus.COMPLETED);
      expect(completed?.completed).toBeInstanceOf(Date);
      expect(completed?.notes).toBe('Room cleaned thoroughly');
    });

    it('should cancel a task', () => {
      const task = createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date());
      const cancelled = cancelTask(task.taskId);

      expect(cancelled?.status).toBe(TaskStatus.CANCELLED);
    });

    it('should return undefined when updating non-existent task', () => {
      const result = updateTask('non-existent', { status: TaskStatus.COMPLETED });
      expect(result).toBeUndefined();
    });
  });

  // ========================
  // STAFF TESTS
  // ========================

  describe('Staff Management', () => {
    it('should add a new staff member', () => {
      const s = addStaff('hotel-1', 'John Doe', 'john@hotel.com', '555-1234', 'Zone A');

      expect(s).toBeDefined();
      expect(s.staffId).toMatch(/^STAFF-[A-F0-9]+$/);
      expect(s.name).toBe('John Doe');
      expect(s.email).toBe('john@hotel.com');
      expect(s.active).toBe(true);
    });

    it('should get all active staff for a hotel', () => {
      addStaff('hotel-1', 'Staff 1', 's1@hotel.com', '111', 'Zone A');
      addStaff('hotel-1', 'Staff 2', 's2@hotel.com', '222', 'Zone B');
      addStaff('hotel-2', 'Staff 3', 's3@hotel.com', '333', 'Zone C');

      const hotel1Staff = getStaffByHotel('hotel-1');
      expect(hotel1Staff).toHaveLength(2);
    });

    it('should get staff by ID', () => {
      const s = addStaff('hotel-1', 'Jane Doe', 'jane@hotel.com', '555-5678', 'Zone B');
      const found = getStaff(s.staffId);

      expect(found?.name).toBe('Jane Doe');
    });

    it('should deactivate staff member', () => {
      const s = addStaff('hotel-1', 'Deactivate Me', 'deactivate@hotel.com', '555-9999', 'Zone C');
      deactivateStaff(s.staffId);

      const allStaff = getStaffByHotel('hotel-1');
      expect(allStaff.find(st => st.staffId === s.staffId)).toBeUndefined();
    });

    it('should return undefined for non-existent staff', () => {
      const found = getStaff('non-existent-staff');
      expect(found).toBeUndefined();
    });
  });

  // ========================
  // INSPECTION TESTS
  // ========================

  describe('Inspection Management', () => {
    it('should create an inspection', () => {
      const checklist = {
        bed: true,
        bathroom: true,
        floor: false,
        minibar: true,
      };

      const inspection = createInspection(
        'task-1',
        'room-101',
        'hotel-1',
        'inspector-1',
        InspectionResult.PASS,
        85,
        checklist,
        'Good work overall',
        ['photo1.jpg', 'photo2.jpg']
      );

      expect(inspection).toBeDefined();
      expect(inspection.inspectionId).toMatch(/^INSP-[A-F0-9]+$/);
      expect(inspection.result).toBe(InspectionResult.PASS);
      expect(inspection.score).toBe(85);
      expect(inspection.checklist).toEqual(checklist);
      expect(inspection.photos).toHaveLength(2);
    });

    it('should create a failed inspection', () => {
      const inspection = createInspection(
        'task-1',
        'room-102',
        'hotel-1',
        'inspector-1',
        InspectionResult.FAIL,
        40,
        { bed: false, bathroom: false, floor: false }
      );

      expect(inspection.result).toBe(InspectionResult.FAIL);
      expect(inspection.score).toBe(40);
    });

    it('should get inspections by room', () => {
      createInspection('task-1', 'room-101', 'hotel-1', 'inspector-1', InspectionResult.PASS, 90, {});
      createInspection('task-2', 'room-101', 'hotel-1', 'inspector-2', InspectionResult.FAIL, 50, {});
      createInspection('task-3', 'room-102', 'hotel-1', 'inspector-1', InspectionResult.PASS, 95, {});

      const room101Inspections = getInspectionsByRoom('hotel-1', 'room-101');

      expect(room101Inspections).toHaveLength(2);
    });

    it('should get inspection by ID', () => {
      const inspection = createInspection(
        'task-1',
        'room-101',
        'hotel-1',
        'inspector-1',
        InspectionResult.PASS,
        85,
        {}
      );

      const found = getInspection(inspection.inspectionId);
      expect(found?.inspectionId).toBe(inspection.inspectionId);
    });
  });

  // ========================
  // STATISTICS TESTS
  // ========================

  describe('Housekeeping Statistics', () => {
    it('should calculate statistics correctly', () => {
      // Setup rooms
      updateRoomStatus('hotel-1', 'room-101', RoomStatus.VACANT_CLEAN);
      updateRoomStatus('hotel-1', 'room-102', RoomStatus.OCCUPIED);
      updateRoomStatus('hotel-1', 'room-103', RoomStatus.VACANT_DIRTY);
      updateRoomStatus('hotel-1', 'room-104', RoomStatus.OUT_OF_ORDER);

      // Setup tasks
      createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date('2026-06-01'));
      createTask('room-102', 'hotel-1', TaskType.TURNDOWN, TaskPriority.LOW, new Date('2026-06-01'));

      const stats = getHousekeepingStats('hotel-1');

      expect(stats.totalRooms).toBe(4);
      expect(stats.statusBreakdown[RoomStatus.VACANT_CLEAN]).toBe(1);
      expect(stats.statusBreakdown[RoomStatus.OCCUPIED]).toBe(1);
      expect(stats.statusBreakdown[RoomStatus.VACANT_DIRTY]).toBe(1);
      expect(stats.statusBreakdown[RoomStatus.OUT_OF_ORDER]).toBe(1);
      expect(stats.pendingTasks).toBe(2);
    });

    it('should count completed tasks for today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date());
      const completedTask = createTask('room-102', 'hotel-1', TaskType.TURNDOWN, TaskPriority.LOW, new Date());
      completeTask(completedTask.taskId);

      const stats = getHousekeepingStats('hotel-1');
      expect(stats.completedToday).toBe(1);
    });

    it('should count overdue tasks', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.MEDIUM, new Date()); // Today
      const overdueTask = createTask('room-102', 'hotel-1', TaskType.TURNDOWN, TaskPriority.LOW, yesterday); // Yesterday

      const stats = getHousekeepingStats('hotel-1');
      expect(stats.overdueTasks).toBe(1);
    });
  });

  // ========================
  // EDGE CASES
  // ========================

  describe('Edge Cases', () => {
    it('should handle empty hotel rooms', () => {
      const rooms = getAllRoomStatuses('empty-hotel');
      expect(rooms).toHaveLength(0);
    });

    it('should handle hotel with no tasks', () => {
      const tasks = getTasksByHotel('empty-hotel');
      expect(tasks).toHaveLength(0);
    });

    it('should preserve notes when updating room status', () => {
      updateRoomStatus('hotel-1', 'room-101', RoomStatus.OCCUPIED, 'VIP guest');
      const room = updateRoomStatus('hotel-1', 'room-101', RoomStatus.VACANT_CLEAN);

      expect(room.notes).toBe('VIP guest');
    });

    it('should update priority correctly', () => {
      const task = createTask('room-101', 'hotel-1', TaskType.CLEANING, TaskPriority.LOW, new Date());
      const updated = updateTask(task.taskId, { priority: TaskPriority.URGENT });

      expect(updated?.priority).toBe(TaskPriority.URGENT);
    });
  });
});
