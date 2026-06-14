import { Router, Response } from 'express';
import { z } from 'zod';
import { scheduleService } from '../services/ScheduleService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateScheduleSchema = z.object({
  name: z.string().min(1),
  reportId: z.string().min(1),
  frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  time: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  recipients: z.array(z.string()).min(1),
  format: z.enum(['json', 'csv', 'pdf', 'excel']).default('csv'),
  filters: z.record(z.any()).optional()
});

const UpdateScheduleSchema = CreateScheduleSchema.partial();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const activeOnly = req.query.activeOnly !== 'false';

    const schedules = await scheduleService.getSchedules(orgId, activeOnly);

    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error: any) {
    logger.error('Error getting schedules:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateScheduleSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const schedule = await scheduleService.createSchedule({
      ...validated,
      organizationId: orgId
    });

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error: any) {
    logger.error('Error creating schedule:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/due', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedules = await scheduleService.getDueSchedules();

    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error: any) {
    logger.error('Error getting due schedules:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const schedule = await scheduleService.getScheduleById(id, orgId);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
      return;
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error: any) {
    logger.error(`Error getting schedule ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateScheduleSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const schedule = await scheduleService.updateSchedule(id, validated, orgId);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
      return;
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error: any) {
    logger.error(`Error updating schedule ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
 try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await scheduleService.deleteSchedule(id, orgId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting schedule ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/execute', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await scheduleService.executeSchedule(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`Error executing schedule ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;