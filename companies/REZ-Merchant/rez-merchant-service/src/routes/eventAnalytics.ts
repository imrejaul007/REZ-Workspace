import { Router } from 'express';
import { eventAnalyticsService } from '../services/eventAnalyticsService';

const router = Router();

/**
 * GET /api/event-analytics/:eventId
 * Get aggregated analytics for an event across all dates.
 */
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const analytics = await eventAnalyticsService.getEventAnalytics(eventId);

    if (!analytics) {
      res.status(404).json({ error: 'No analytics found for this event' });
      return;
    }

    res.json({ data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/event-analytics/:eventId/report
 * Get a comprehensive report for an event.
 */
router.get('/:eventId/report', async (req, res) => {
  try {
    const { eventId } = req.params;
    const report = await eventAnalyticsService.getEventReport(eventId);
    res.json({ data: report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/event-analytics/:eventId/daily/:date
 * Get analytics for a specific event on a specific date.
 * Date format: YYYY-MM-DD
 */
router.get('/:eventId/daily/:date', async (req, res) => {
  try {
    const { eventId, date } = req.params;
    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const analytics = await eventAnalyticsService.getDailyAnalytics(eventId, parsedDate);

    if (!analytics) {
      res.status(404).json({ error: 'No analytics found for this event on the specified date' });
      return;
    }

    res.json({ data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
