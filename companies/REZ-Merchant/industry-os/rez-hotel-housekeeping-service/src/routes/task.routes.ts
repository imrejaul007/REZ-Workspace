/**
 * Task Routes
 *
 * Endpoints for housekeeping task management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { taskService } from '../services/task.service';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[task-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  roomId: z.string().min(1),
  roomNumber: z.string().min(1),
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

const completeTaskSchema = z.object({
  notes: z.string().optional(),
});

const searchSchema = z.object({
  hotelId: z.string().optional(),
  status: z.string().optional(),
  taskType: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * Create task
 * POST /api/tasks
 */
router.post('/', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'housekeeper'), async (req: Request, res: Response) => {
  try {
    const input = createTaskSchema.parse(req.body);
    const hotelId = req.user?.hotelId || req.body.hotelId;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const task = await taskService.createTask(hotelId, input);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
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
 * GET /api/tasks/:taskId
 */
router.get('/:taskId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTask(req.params.taskId);

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
 * Get tasks
 * GET /api/tasks
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = searchSchema.parse(req.query);
    const tasks = await taskService.getTasks(filters);

    res.json({
      success: true,
      data: { tasks, total: tasks.length },
    });
  } catch (error) {
    log('Get tasks error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid parameters', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to get tasks' });
  }
});

/**
 * Get tasks by room
 * GET /api/tasks/room/:roomId
 */
router.get('/room/:roomId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getTasksByRoom(req.params.roomId);

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
 * GET /api/tasks/staff/:staffId
 */
router.get('/staff/:staffId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getTasksByStaff(req.params.staffId);

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
 * GET /api/tasks/overdue/:hotelId
 */
router.get('/overdue/:hotelId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getOverdueTasks(req.params.hotelId);

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
 * Get task statistics
 * GET /api/tasks/stats/:hotelId
 */
router.get('/stats/:hotelId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const stats = await taskService.getTaskStats(
      req.params.hotelId,
      date ? new Date(date as string) : undefined
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    log('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get statistics' });
  }
});

/**
 * Update task
 * PUT /api/tasks/:taskId
 */
router.put('/:taskId', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'housekeeper'), async (req: Request, res: Response) => {
  try {
    const input = updateTaskSchema.parse(req.body);
    const task = await taskService.updateTask(req.params.taskId, input);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
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
 * Assign task to staff
 * POST /api/tasks/:taskId/assign
 */
router.post('/:taskId/assign', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const { staffId } = z.object({
      staffId: z.string().min(1),
    }).parse(req.body);

    const task = await taskService.assignTask(req.params.taskId, staffId);

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
 * Start task
 * POST /api/tasks/:taskId/start
 */
router.post('/:taskId/start', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'housekeeper'), async (req: Request, res: Response) => {
  try {
    const task = await taskService.startTask(req.params.taskId);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({
      success: true,
      data: task,
      message: 'Task started successfully',
    });
  } catch (error) {
    log('Start task error:', error);
    res.status(500).json({ success: false, message: 'Failed to start task' });
  }
});

/**
 * Complete task
 * POST /api/tasks/:taskId/complete
 */
router.post('/:taskId/complete', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'housekeeper'), async (req: Request, res: Response) => {
  try {
    const { notes } = completeTaskSchema.parse(req.body);
    const task = await taskService.completeTask(req.params.taskId, notes);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({
      success: true,
      data: task,
      message: 'Task completed successfully',
    });
  } catch (error) {
    log('Complete task error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to complete task' });
  }
});

/**
 * Cancel task
 * POST /api/tasks/:taskId/cancel
 */
router.post('/:taskId/cancel', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const task = await taskService.cancelTask(req.params.taskId);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({
      success: true,
      data: task,
      message: 'Task cancelled successfully',
    });
  } catch (error) {
    log('Cancel task error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel task' });
  }
});

export default router;
