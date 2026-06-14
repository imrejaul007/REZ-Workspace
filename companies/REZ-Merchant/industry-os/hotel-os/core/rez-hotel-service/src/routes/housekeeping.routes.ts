/**
 * Housekeeping Routes
 *
 * Endpoints for housekeeping task management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { HousekeepingTask } from '../models/HousekeepingTask';
import { Room } from '../models/Room';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[housekeeping-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  roomId: z.string().min(1),
  taskType: z.enum(['cleaning', 'deep_clean', 'turndown', 'inspection', 'maintenance']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueBy: z.string().datetime(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

const updateTaskSchema = z.object({
  taskType: z.enum(['cleaning', 'deep_clean', 'turndown', 'inspection', 'maintenance']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  assignedTo: z.string().optional(),
  dueBy: z.string().datetime().optional(),
  notes: z.string().optional(),
});

function generateTaskId(): string {
  return 'HT' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * Create housekeeping task
 * POST /api/housekeeping
 */
router.post('/', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'housekeeper'), async (req: Request, res: Response) => {
  try {
    const input = createTaskSchema.parse(req.body);
    const hotelId = req.user?.hotelId || req.body.hotelId;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    // Get room details
    const room = await Room.findOne({ roomId: input.roomId, hotelId });
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    const taskId = generateTaskId();

    const task = new HousekeepingTask({
      taskId,
      hotelId,
      roomId: input.roomId,
      roomNumber: room.roomNumber,
      taskType: input.taskType,
      priority: input.priority,
      status: 'pending',
      assignedTo: input.assignedTo,
      dueBy: new Date(input.dueBy),
      notes: input.notes,
    });

    await task.save();
    log('Housekeeping task created', { taskId, roomId: input.roomId });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Housekeeping task created successfully',
    });
  } catch (error) {
    log('Create task error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

/**
 * Get task by ID
 * GET /api/housekeeping/:taskId
 */
router.get('/:taskId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const task = await HousekeepingTask.findOne({ taskId: req.params.taskId });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    log('Get task error:', error);
    res.status(500).json({ success: false, message: 'Failed to get task' });
  }
});

/**
 * Get tasks by hotel
 * GET /api/housekeeping
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || req.query.hotelId as string;
    const status = req.query.status as string;
    const assignedTo = req.query.assignedTo as string;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const query: Record<string, unknown> = { hotelId };
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await HousekeepingTask.find(query).sort({ dueBy: 1 });

    res.json({
      success: true,
      data: { tasks, total: tasks.length },
    });
  } catch (error) {
    log('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tasks' });
  }
});

/**
 * Get tasks by room
 * GET /api/housekeeping/room/:roomId
 */
router.get('/room/:roomId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await HousekeepingTask.find({ roomId: req.params.roomId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { tasks, total: tasks.length },
    });
  } catch (error) {
    log('Get room tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tasks' });
  }
});

/**
 * Get tasks by staff
 * GET /api/housekeeping/staff/:staffId
 */
router.get('/staff/:staffId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await HousekeepingTask.find({ assignedTo: req.params.staffId }).sort({ dueBy: 1 });

    res.json({
      success: true,
      data: { tasks, total: tasks.length },
    });
  } catch (error) {
    log('Get staff tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tasks' });
  }
});

/**
 * Get overdue tasks
 * GET /api/housekeeping/overdue/:hotelId
 */
router.get('/overdue/:hotelId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await HousekeepingTask.find({
      hotelId: req.params.hotelId,
      status: { $in: ['pending', 'in_progress'] },
      dueBy: { $lt: new Date() },
    }).sort({ dueBy: 1 });

    res.json({
      success: true,
      data: { tasks, total: tasks.length },
    });
  } catch (error) {
    log('Get overdue tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to get overdue tasks' });
  }
});

/**
 * Update task
 * PUT /api/housekeeping/:taskId
 */
router.put('/:taskId', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'housekeeper'), async (req: Request, res: Response) => {
  try {
    const input = updateTaskSchema.parse(req.body);
    const updates: Record<string, unknown> = {};

    if (input.taskType) updates.taskType = input.taskType;
    if (input.priority) updates.priority = input.priority;
    if (input.status) {
      updates.status = input.status;
      if (input.status === 'completed') {
        updates.completedAt = new Date();
      }
    }
    if (input.assignedTo) updates.assignedTo = input.assignedTo;
    if (input.dueBy) updates.dueBy = new Date(input.dueBy);
    if (input.notes !== undefined) updates.notes = input.notes;

    const task = await HousekeepingTask.findOneAndUpdate(
      { taskId: req.params.taskId },
      { $set: updates },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // If task completed, update room status
    if (input.status === 'completed') {
      await Room.findOneAndUpdate(
        { roomId: task.roomId },
        { $set: { status: 'available' } }
      );
      log('Room status updated to available', { roomId: task.roomId });
    }

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  } catch (error) {
    log('Update task error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

/**
 * Complete task
 * POST /api/housekeeping/:taskId/complete
 */
router.post('/:taskId/complete', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'housekeeper'), async (req: Request, res: Response) => {
  try {
    const task = await HousekeepingTask.findOneAndUpdate(
      { taskId: req.params.taskId },
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Update room status to available
    await Room.findOneAndUpdate(
      { roomId: task.roomId },
      { $set: { status: 'available' } }
    );

    log('Task completed', { taskId: req.params.taskId, roomId: task.roomId });

    res.json({
      success: true,
      data: task,
      message: 'Task completed successfully',
    });
  } catch (error) {
    log('Complete task error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete task' });
  }
});

/**
 * Assign task to staff
 * POST /api/housekeeping/:taskId/assign
 */
router.post('/:taskId/assign', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const { staffId } = z.object({
      staffId: z.string().min(1),
    }).parse(req.body);

    const task = await HousekeepingTask.findOneAndUpdate(
      { taskId: req.params.taskId },
      { $set: { assignedTo: staffId, status: 'in_progress' } },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({
      success: true,
      data: task,
      message: 'Task assigned successfully',
    });
  } catch (error) {
    log('Assign task error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to assign task' });
  }
});

/**
 * Delete task
 * DELETE /api/housekeeping/:taskId
 */
router.delete('/:taskId', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const task = await HousekeepingTask.findOneAndUpdate(
      { taskId: req.params.taskId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Task cancelled successfully',
    });
  } catch (error) {
    log('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
});

/**
 * Get housekeeping statistics
 * GET /api/housekeeping/stats/:hotelId
 */
router.get('/stats/:hotelId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pending, inProgress, completed, overdue] = await Promise.all([
      HousekeepingTask.countDocuments({ hotelId: req.params.hotelId, status: 'pending' }),
      HousekeepingTask.countDocuments({ hotelId: req.params.hotelId, status: 'in_progress' }),
      HousekeepingTask.countDocuments({ hotelId: req.params.hotelId, status: 'completed', completedAt: { $gte: today, $lt: tomorrow } }),
      HousekeepingTask.countDocuments({ hotelId: req.params.hotelId, status: { $in: ['pending', 'in_progress'] }, dueBy: { $lt: new Date() } }),
    ]);

    res.json({
      success: true,
      data: {
        pending,
        inProgress,
        completedToday: completed,
        overdue,
        totalActive: pending + inProgress,
      },
    });
  } catch (error) {
    log('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get statistics' });
  }
});

export default router;
