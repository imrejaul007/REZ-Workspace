import { Request, Response } from 'express';
import { schedulerService } from '../services';
import { CreateScheduledNotificationSchema, UpdateScheduledNotificationSchema } from '../validators';

/**
 * Create a scheduled notification
 * POST /api/schedules
 */
export async function createScheduledNotification(req: Request, res: Response): Promise<void> {
  const validation = CreateScheduledNotificationSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.flatten(),
    });
    return;
  }

  const data = validation.data;

  try {
    const schedule = await schedulerService.createScheduledNotification({
      ...data,
      schedule: {
        ...data.schedule,
        scheduledAt: new Date(data.schedule.scheduledAt),
        endDate: data.schedule.endDate ? new Date(data.schedule.endDate) : undefined,
      },
    });

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Scheduled notification created',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create scheduled notification';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
}

/**
 * Update a scheduled notification
 * PATCH /api/schedules/:id
 */
export async function updateScheduledNotification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const validation = UpdateScheduledNotificationSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.flatten(),
    });
    return;
  }

  const data = validation.data;

  try {
    const schedule = await schedulerService.updateScheduledNotification(id, {
      ...data,
      schedule: data.schedule
        ? {
            ...data.schedule,
            scheduledAt: new Date(data.schedule.scheduledAt),
            endDate: data.schedule.endDate ? new Date(data.schedule.endDate) : undefined,
          }
        : undefined,
    });

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Scheduled notification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: schedule,
      message: 'Scheduled notification updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update scheduled notification',
    });
  }
}

/**
 * Get scheduled notifications
 * GET /api/schedules
 */
export async function getScheduledNotifications(req: Request, res: Response): Promise<void> {
  const { companyId, status, page, limit } = req.query;

  if (!companyId || typeof companyId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'companyId query parameter is required',
    });
    return;
  }

  try {
    const result = await schedulerService.getScheduledNotifications(companyId, {
      status: status as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled notifications',
    });
  }
}

/**
 * Get scheduled notification by ID
 * GET /api/schedules/:id
 */
export async function getScheduledNotificationById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const schedule = await schedulerService.getScheduledNotification(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Scheduled notification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled notification',
    });
  }
}

/**
 * Activate a scheduled notification
 * POST /api/schedules/:id/activate
 */
export async function activateScheduledNotification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const schedule = await schedulerService.activate(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Scheduled notification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: schedule,
      message: 'Scheduled notification activated',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to activate scheduled notification';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
}

/**
 * Pause a scheduled notification
 * POST /api/schedules/:id/pause
 */
export async function pauseScheduledNotification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const schedule = await schedulerService.pause(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Scheduled notification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: schedule,
      message: 'Scheduled notification paused',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to pause scheduled notification',
    });
  }
}

/**
 * Cancel a scheduled notification
 * POST /api/schedules/:id/cancel
 */
export async function cancelScheduledNotification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const schedule = await schedulerService.cancel(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Scheduled notification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: schedule,
      message: 'Scheduled notification cancelled',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel scheduled notification',
    });
  }
}

/**
 * Delete a scheduled notification
 * DELETE /api/schedules/:id
 */
export async function deleteScheduledNotification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const deleted = await schedulerService.deleteScheduledNotification(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Scheduled notification not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Scheduled notification deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete scheduled notification',
    });
  }
}

/**
 * Preview recipients for a scheduled notification
 * POST /api/schedules/preview
 */
export async function previewRecipients(req: Request, res: Response): Promise<void> {
  const { targetAudience } = req.body;

  if (!targetAudience) {
    res.status(400).json({
      success: false,
      error: 'targetAudience is required',
    });
    return;
  }

  try {
    const preview = await schedulerService.previewRecipients(targetAudience);

    res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to preview recipients',
    });
  }
}
