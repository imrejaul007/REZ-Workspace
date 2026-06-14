import { Router, Response } from 'express';
import { z } from 'zod';
import { scheduleService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('ScheduleRoutes');
const router = Router();

const schedulePostSchema = z.object({
  postId: z.string(),
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']),
  scheduledAt: z.string().datetime(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']).optional(),
  recurrenceConfig: z.object({
    interval: z.number().optional(),
    daysOfWeek: z.array(z.number()).optional(),
    daysOfMonth: z.array(z.number()).optional(),
    endDate: z.string().datetime().optional()
  }).optional()
});

// Schedule a post
router.post('/:id/schedule', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = schedulePostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const schedule = await scheduleService.createSchedule({
      userId: req.userId!,
      postId: validation.data.postId || req.params.id,
      platform: validation.data.platform,
      scheduledAt: new Date(validation.data.scheduledAt),
      recurrence: validation.data.recurrence,
      recurrenceConfig: validation.data.recurrenceConfig
    });

    res.status(201).json(schedule);
  } catch (error) {
    logger.error('Error scheduling post', { error });
    res.status(500).json({ error: 'Failed to schedule post' });
  }
});

// Get schedules for user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, limit } = req.query;
    const schedules = await scheduleService.findByUser(req.userId!, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : 50
    });

    res.json(schedules);
  } catch (error) {
    logger.error('Error fetching schedules', { error });
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Get schedule by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await scheduleService.findById(req.params.id);

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    res.json(schedule);
  } catch (error) {
    logger.error('Error fetching schedule', { error });
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Cancel a schedule
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await scheduleService.cancelSchedule(req.params.id);

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    res.json(schedule);
  } catch (error) {
    logger.error('Error cancelling schedule', { error });
    res.status(500).json({ error: 'Failed to cancel schedule' });
  }
});

// Get schedule stats
router.get('/stats/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await scheduleService.getScheduleStats(req.userId!);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching schedule stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;