import { Router, Response } from 'express';
import { parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { calendarService, CreateEventInput, UpdateEventInput, BulkMoveInput } from '../services/index.js';
import { authMiddleware, AuthenticatedRequest, validateBody, validateQuery, calendarQuerySchema, createEventSchema, updateEventSchema, bulkMoveSchema, exportQuerySchema } from '../middleware/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { date, startDate, endDate, platform, status } = req.query as Record<string, string>;

    let start: Date;
    let end: Date;

    if (date) {
      start = startOfMonth(parseISO(date));
      end = endOfMonth(parseISO(date));
    } else if (startDate && endDate) {
      start = parseISO(startDate);
      end = parseISO(endDate);
    } else {
      start = startOfMonth(new Date());
      end = endOfMonth(new Date());
    }

    const view = await calendarService.getCalendarView({
      userId,
      startDate: start,
      endDate: end,
      view: 'month',
      platform,
      status,
    });

    res.json({
      success: true,
      data: view,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/week', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { date, direction } = req.query as Record<string, string>;

    let baseDate = date ? parseISO(date) : new Date();

    if (direction === 'next') {
      baseDate = addWeeks(baseDate, 1);
    } else if (direction === 'prev') {
      baseDate = subWeeks(baseDate, 1);
    }

    const view = await calendarService.getWeekView(userId, baseDate);

    res.json({
      success: true,
      data: view,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/day', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { date, direction } = req.query as Record<string, string>;

    let baseDate = date ? parseISO(date) : new Date();

    if (direction === 'next') {
      baseDate = addDays(baseDate, 1);
    } else if (direction === 'prev') {
      baseDate = subDays(baseDate, 1);
    }

    const view = await calendarService.getDayView(userId, baseDate);

    res.json({
      success: true,
      data: view,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/events', validateBody(createEventSchema), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const input: CreateEventInput = {
      ...req.body,
      date: typeof req.body.date === 'string' ? parseISO(req.body.date) : req.body.date,
      createdBy: userId,
    };

    const event = await calendarService.createEvent(input);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/events/:id', validateBody(updateEventSchema), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const input: UpdateEventInput = {
      ...req.body,
      date: req.body.date ? (typeof req.body.date === 'string' ? parseISO(req.body.date) : req.body.date) : undefined,
    };

    const event = await calendarService.updateEvent(id, input);

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/events/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    await calendarService.deleteEvent(id);

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bulk-move', validateBody(bulkMoveSchema), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const input: BulkMoveInput = {
      ...req.body,
      newDate: typeof req.body.newDate === 'string' ? parseISO(req.body.newDate) : req.body.newDate,
    };

    const events = await calendarService.bulkMoveEvents(input);

    res.json({
      success: true,
      data: {
        moved: events.length,
        events,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/conflicts', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { date, time, excludeId } = req.query as Record<string, string>;

    if (!date || !time) {
      res.status(400).json({
        success: false,
        error: { message: 'date and time are required' },
      });
      return;
    }

    const conflicts = await calendarService.checkConflicts(parseISO(date), time, excludeId);

    res.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { format, startDate, endDate } = req.query as Record<string, string>;

    const start = startDate ? parseISO(startDate) : startOfMonth(new Date());
    const end = endDate ? parseISO(endDate) : endOfMonth(new Date());

    if (format === 'ical') {
      const ical = await calendarService.exportToICal(start, end);
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="calendar-${Date.now()}.ics"`);
      res.send(ical);
      return;
    }

    if (format === 'csv') {
      const csv = await calendarService.exportToCSV(start, end);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="calendar-${Date.now()}.csv"`);
      res.send(csv);
      return;
    }

    const view = await calendarService.getCalendarView({
      userId: req.userId!,
      startDate: start,
      endDate: end,
      view: 'month',
    });

    res.json({
      success: true,
      data: view,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/import', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { csvData } = req.body;

    if (!csvData) {
      res.status(400).json({
        success: false,
        error: { message: 'csvData is required' },
      });
      return;
    }

    const result = await calendarService.importFromCSV(csvData, req.userId!);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;

    const start = startDate ? parseISO(startDate) : startOfMonth(new Date());
    const end = endDate ? parseISO(endDate) : endOfMonth(new Date());

    const stats = await calendarService.getStats(start, end);
    const overdue = await calendarService.getOverdueEvents();

    res.json({
      success: true,
      data: {
        ...stats,
        overdue: overdue.length,
        overdueEvents: overdue,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { platform, count } = req.query as Record<string, string>;

    if (!platform) {
      res.status(400).json({
        success: false,
        error: { message: 'platform is required' },
      });
      return;
    }

    const suggestions = await calendarService.getSuggestions(req.userId!, platform, parseInt(count) || 5);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/events/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const event = await calendarService.getEvent(id);

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

export default router;