/**
 * Stats Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { CheckIn } from '../models/checkIn';
import { getGymOccupancy } from '../services/accessService';

const router = Router();

// Get gym occupancy
router.get('/:gymId/occupancy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const occupancy = await getGymOccupancy(req.params.gymId);
    res.json({ success: true, data: occupancy });
  } catch (error) {
    next(error);
  }
});

// Get daily stats
router.get('/:gymId/daily', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIns = await CheckIn.find({
      gymId: req.params.gymId,
      checkInTime: { $gte: today },
    });

    const stats = {
      totalVisits: checkIns.length,
      peakHour: getPeakHour(checkIns),
      averageDuration: calculateAverageDuration(checkIns),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// Get hourly breakdown
router.get('/:gymId/hourly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1);

    const checkIns = await CheckIn.find({
      gymId: req.params.gymId,
      checkInTime: { $gte: targetDate, $lt: endDate },
    });

    const hourlyBreakdown: Record<number, number> = {};
    for (let i = 5; i <= 23; i++) {
      hourlyBreakdown[i] = 0;
    }

    checkIns.forEach((checkIn) => {
      const hour = new Date(checkIn.checkInTime).getHours();
      if (hourlyBreakdown[hour] !== undefined) {
        hourlyBreakdown[hour]++;
      }
    });

    res.json({ success: true, data: hourlyBreakdown });
  } catch (error) {
    next(error);
  }
});

function getPeakHour(checkIns: unknown[]): number {
  const hours: Record<number, number> = {};
  checkIns.forEach((checkIn) => {
    const hour = new Date(checkIn.checkInTime).getHours();
    hours[hour] = (hours[hour] || 0) + 1;
  });
  let peakHour = 0;
  let maxCount = 0;
  Object.entries(hours).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  });
  return peakHour;
}

function calculateAverageDuration(checkIns: unknown[]): number {
  const completed = checkIns.filter((c) => c.duration);
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, c) => sum + c.duration, 0);
  return Math.round(total / completed.length);
}

export { router as statsRoutes };
