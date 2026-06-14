import { Router } from 'express';
import { HousekeepingService, TaskInput, HousekeepingReport } from '../services/housekeepingService';
import { merchantAuth } from '../middleware/merchantAuth';
import { HOUSEKEEPING_TASK_TYPES, HOUSEKEEPING_PRIORITIES, HOUSEKEEPING_STATUSES } from '../models/HousekeepingTask';

const router = Router();
const housekeepingService = new HousekeepingService();

/**
 * POST /api/housekeeping
 * Create a new housekeeping task
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { storeId, roomId, roomNumber, taskType, priority, notes } = req.body;

    // Validate required fields
    if (!storeId || !roomId || !roomNumber || !taskType) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: storeId, roomId, roomNumber, taskType',
      });
      return;
    }

    // Validate taskType
    if (!HOUSEKEEPING_TASK_TYPES.includes(taskType)) {
      res.status(400).json({
        success: false,
        error: `Invalid taskType. Must be one of: ${HOUSEKEEPING_TASK_TYPES.join(', ')}`,
      });
      return;
    }

    // Validate priority if provided
    if (priority && !HOUSEKEEPING_PRIORITIES.includes(priority)) {
      res.status(400).json({
        success: false,
        error: `Invalid priority. Must be one of: ${HOUSEKEEPING_PRIORITIES.join(', ')}`,
      });
      return;
    }

    const input: TaskInput = {
      storeId,
      roomId,
      roomNumber,
      taskType,
      priority: priority || 'medium',
      notes,
    };

    const task = await housekeepingService.createTask(input);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Housekeeping] Failed to create task', { error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/housekeeping
 * Get tasks for a store, optionally filtered by status
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const { storeId, status } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    // Validate status if provided
    if (status && !HOUSEKEEPING_STATUSES.includes(status as 'pending' | 'in_progress' | 'completed' | 'verified')) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${HOUSEKEEPING_STATUSES.join(', ')}`,
      });
      return;
    }

    const tasks = await housekeepingService.getTasks(storeId, status as string | undefined);

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Housekeeping] Failed to get tasks', { error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/housekeeping/:taskId/assign
 * Assign a task to a staff member
 */
router.post('/:taskId/assign', merchantAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { staffId, staffName } = req.body;

    if (!staffId || !staffName) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: staffId, staffName',
      });
      return;
    }

    await housekeepingService.assignTask(taskId, staffId, staffName);

    res.json({
      success: true,
      message: 'Task assigned successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    logger.error('[Housekeeping] Failed to assign task', { taskId: req.params.taskId, error: message });
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/housekeeping/:taskId/start
 * Start working on a task
 */
router.post('/:taskId/start', merchantAuth, async (req, res) => {
  try {
    const { taskId } = req.params;

    await housekeepingService.startTask(taskId);

    res.json({
      success: true,
      message: 'Task started successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    logger.error('[Housekeeping] Failed to start task', { taskId: req.params.taskId, error: message });
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/housekeeping/:taskId/complete
 * Complete a task
 */
router.post('/:taskId/complete', merchantAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;

    await housekeepingService.completeTask(taskId, notes);

    res.json({
      success: true,
      message: 'Task completed successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    logger.error('[Housekeeping] Failed to complete task', { taskId: req.params.taskId, error: message });
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/housekeeping/:taskId/verify
 * Verify a completed task
 */
router.post('/:taskId/verify', merchantAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { verifiedBy } = req.body;

    if (!verifiedBy) {
      res.status(400).json({
        success: false,
        error: 'verifiedBy is required',
      });
      return;
    }

    await housekeepingService.verifyTask(taskId, verifiedBy);

    res.json({
      success: true,
      message: 'Task verified successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    logger.error('[Housekeeping] Failed to verify task', { taskId: req.params.taskId, error: message });
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/housekeeping/room/:roomId
 * Get all tasks for a specific room
 */
router.get('/room/:roomId', merchantAuth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const tasks = await housekeepingService.getRoomTasks(roomId);

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Housekeeping] Failed to get room tasks', { roomId: req.params.roomId, error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/housekeeping/staff/:staffId
 * Get tasks assigned to a specific staff member for a given date
 */
router.get('/staff/:staffId', merchantAuth, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        error: 'date is required (format: YYYY-MM-DD)',
      });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
      return;
    }

    const tasks = await housekeepingService.getHousekeeperTasks(staffId, parsedDate);

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Housekeeping] Failed to get staff tasks', { staffId: req.params.staffId, error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/housekeeping/report
 * Get housekeeping report for a store on a given date
 */
router.get('/report', merchantAuth, async (req, res) => {
  try {
    const { storeId, date } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        error: 'date is required (format: YYYY-MM-DD)',
      });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
      return;
    }

    const report = await housekeepingService.getTasksReport(storeId, parsedDate);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Housekeeping] Failed to generate report', { storeId: req.query.storeId, error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export default router;
