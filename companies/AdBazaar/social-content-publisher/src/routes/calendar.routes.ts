import { Router, Response } from 'express';
import { postService } from '../services/post.service';
import { asyncHandler, AuthenticatedRequest, internalServiceAuth } from '../middleware';
import { getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth } from '../utils';

const router = Router();

// Apply auth middleware to all routes
router.use(internalServiceAuth);

// Get calendar data (default: current week)
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;
    const { start, end, range = 'week' } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (start && end) {
      startDate = new Date(start as string);
      endDate = new Date(end as string);
    } else if (range === 'month') {
      startDate = getStartOfMonth();
      endDate = getEndOfMonth();
    } else {
      startDate = getStartOfWeek();
      endDate = getEndOfWeek();
    }

    const calendarData = await postService.getCalendarData(companyId, startDate, endDate);

    // Group by date
    const groupedByDate: Record<string, any[]> = {};
    calendarData.forEach((item) => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(item);
    });

    res.json({
      success: true,
      data: {
        startDate,
        endDate,
        items: calendarData,
        groupedByDate,
 total: calendarData.length,
      },
    });
  })
);

// Get calendar data for specific month
router.get(
  '/month/:year/:month',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;
    const { year, month } = req.params;

    const startDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0);

    const calendarData = await postService.getCalendarData(companyId, startDate, endDate);

    res.json({
      success: true,
      data: {
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        startDate,
        endDate,
        items: calendarData,
        total: calendarData.length,
      },
    });
  })
);

// Get upcoming scheduled posts
router.get(
  '/upcoming',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;
    const { days = '7' } = req.query;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days as string, 10));

    const calendarData = await postService.getCalendarData(companyId, startDate, endDate);

    res.json({
      success: true,
      data: {
        items: calendarData,
        total: calendarData.length,
      },
    });
  })
);

export default router;