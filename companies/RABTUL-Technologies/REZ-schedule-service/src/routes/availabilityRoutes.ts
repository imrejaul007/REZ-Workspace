import { Router, Request, Response } from 'express';
import { availabilityService } from '../services/availabilityService';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

function getStringQuery(req: Request, name: string): string | undefined {
  const val = (req.query as Record<string, unknown>)[name];
  return typeof val === 'string' ? val : undefined;
}

/**
 * Get availability for an event type
 * GET /api/event-types/:id/availability
 */
router.get('/event-types/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const guestTimezone = req.query.guestTimezone as string | undefined;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const slots = await availabilityService.getAvailableSlots(
      id,
      new Date(startDate),
      new Date(endDate),
      guestTimezone
    );

    res.json({
      success: true,
      data: {
        slots,
        availableSlots: slots.filter(s => s.available),
        unavailableSlots: slots.filter(s => !s.available),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    logger.error('[Availability] Get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get availability' });
  }
});

/**
 * Get public availability by username and slug
 * GET /api/availability/:username/:slug
 */
router.get('/:username/:slug', async (req: Request, res: Response) => {
  try {
    const { username, slug } = req.params;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const guestTimezone = req.query.guestTimezone as string | undefined;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const eventType = await prisma.eventType.findFirst({
      where: { slug, userId: user.id, isPublic: true, active: true },
    });

    if (!eventType) {
      return res.status(404).json({ success: false, error: 'Event type not found' });
    }

    const slots = await availabilityService.getAvailableSlots(
      eventType.id,
      new Date(startDate),
      new Date(endDate),
      guestTimezone
    );

    res.json({
      success: true,
      data: {
        eventType: {
          id: eventType.id,
          slug: eventType.slug,
          title: eventType.title || 'Event',
          description: eventType.description || '',
          duration: eventType.duration,
          locationType: eventType.locationType,
          price: eventType.price,
          currency: eventType.currency,
          user: { name: user.name, username: user.username, avatarUrl: user.avatarUrl },
        },
        slots,
      },
    });
  } catch (error) {
    logger.error('[Availability] Public error:', error);
    res.status(500).json({ success: false, error: 'Failed to get availability' });
  }
});

/**
 * Check slot availability
 * POST /api/availability/check
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { eventTypeId, startTime, endTime, timezone = 'Asia/Kolkata' } = req.body;

    const isAvailable = await availabilityService.isSlotAvailable(
      eventTypeId,
      new Date(startTime),
      new Date(endTime),
      timezone
    );

    res.json({ success: true, data: { available: isAvailable } });
  } catch (error) {
    logger.error('[Availability] Check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check availability' });
  }
});

export default router;
