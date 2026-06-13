import { Router } from 'express';
import { schedulingController } from '../controllers/scheduling.controller';

const router = Router();

// ============================================================================
// Housekeeper Routes
// ============================================================================

/**
 * POST /api/scheduling/housekeepers
 * Create a new housekeeper
 */
router.post('/housekeepers', (req, res, next) => schedulingController.createHousekeeper(req, res, next));

/**
 * GET /api/scheduling/housekeepers/:staffId
 * Get housekeeper by ID
 */
router.get('/housekeepers/:staffId', (req, res, next) => schedulingController.getHousekeeper(req, res, next));

/**
 * GET /api/scheduling/housekeepers/property/:propertyId
 * Get all housekeepers for a property
 */
router.get('/housekeepers/property/:propertyId', (req, res, next) => schedulingController.getHousekeepersByProperty(req, res, next));

// ============================================================================
// Cleaning Task Routes
// ============================================================================

/**
 * POST /api/scheduling/tasks
 * Create a new cleaning task
 */
router.post('/tasks', (req, res, next) => schedulingController.createCleaningTask(req, res, next));

/**
 * GET /api/scheduling/tasks/:taskId
 * Get cleaning task by ID
 */
router.get('/tasks/:taskId', (req, res, next) => schedulingController.getCleaningTask(req, res, next));

/**
 * GET /api/scheduling/tasks/room/:roomId
 * Get tasks for a room
 */
router.get('/tasks/room/:roomId', (req, res, next) => schedulingController.getTasksByRoom(req, res, next));

/**
 * GET /api/scheduling/tasks/status/:status
 * Get tasks by status
 */
router.get('/tasks/status/:status', (req, res, next) => schedulingController.getTasksByStatus(req, res, next));

/**
 * GET /api/scheduling/tasks/pending/:propertyId
 * Get pending tasks for a property
 */
router.get('/tasks/pending/:propertyId', (req, res, next) => schedulingController.getPendingTasks(req, res, next));

/**
 * POST /api/scheduling/tasks/:taskId/assign
 * Assign a task to a housekeeper
 */
router.post('/tasks/:taskId/assign', (req, res, next) => schedulingController.assignTask(req, res, next));

/**
 * POST /api/scheduling/tasks/:taskId/complete
 * Mark a task as completed
 */
router.post('/tasks/:taskId/complete', (req, res, next) => schedulingController.completeTask(req, res, next));

/**
 * POST /api/scheduling/tasks/:taskId/cancel
 * Cancel a task
 */
router.post('/tasks/:taskId/cancel', (req, res, next) => schedulingController.cancelTask(req, res, next));

// ============================================================================
// Schedule Routes
// ============================================================================

/**
 * POST /api/scheduling/schedule
 * Generate a cleaning schedule
 */
router.post('/schedule', (req, res, next) => schedulingController.generateSchedule(req, res, next));

/**
 * GET /api/scheduling/schedule/:scheduleId
 * Get a schedule by ID
 */
router.get('/schedule/:scheduleId', (req, res, next) => schedulingController.getSchedule(req, res, next));

/**
 * GET /api/scheduling/schedule/property/:propertyId
 * Get schedules for a property
 */
router.get('/schedule/property/:propertyId', (req, res, next) => schedulingController.getSchedulesByProperty(req, res, next));

// ============================================================================
// Predictive Analytics Routes
// ============================================================================

/**
 * GET /api/scheduling/analytics/occupancy/:propertyId
 * Predict occupancy for a property
 */
router.get('/analytics/occupancy/:propertyId', (req, res, next) => schedulingController.predictOccupancy(req, res, next));

/**
 * GET /api/scheduling/analytics/maintenance/:propertyId
 * Predict maintenance needs for a property
 */
router.get('/analytics/maintenance/:propertyId', (req, res, next) => schedulingController.predictMaintenanceNeeds(req, res, next));

export default router;