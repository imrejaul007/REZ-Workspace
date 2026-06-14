import { Router, Request, Response } from 'express';
import { z } from 'zod';
import responderService from '../services/responderService';
import { Schedule, ApiResponse } from '../types';
import logger from '../utils/logger';

const router = Router();

const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

const createScheduleSchema = z.object({
  templateId: z.string().uuid(),
  dayOfWeek: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'),
  timezone: z.string().default('UTC'),
  isActive: z.boolean().default(true)
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = createScheduleSchema.parse(req.body);

    const schedule = responderService.addSchedule(
      validatedData.templateId,
      {
        dayOfWeek: validatedData.dayOfWeek,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        timezone: validatedData.timezone,
        isActive: validatedData.isActive
      },
      tenantId
    );

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const response: ApiResponse<Schedule> = {
      success: true,
      data: schedule,
      message: 'Schedule created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error creating schedule:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const schedules = responderService.getSchedules(tenantId);

    const response: ApiResponse<Schedule[]> = {
      success: true,
      data: schedules
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = responderService.deleteSchedule(req.params.id, tenantId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    logger.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
