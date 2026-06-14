/**
 * Schedule Routes - Weekly/Daily scheduling
 */

import { Router, Request, Response } from 'express';
import { Shift, Employee } from '../models/index';
import { requireRoles } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Auto-generate weekly schedule
router.post('/generate', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { restaurantId, startDate, endDate, preferences } = req.body;
    const shifts: unknown[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all active employees
    const employees = await Employee.find({ restaurantId, status: 'active' });

    let currentDate = new Date(start);
    while (currentDate <= end) {
      for (const employee of employees) {
        const shiftId = `SFT${Date.now()}${crypto.randomUUID().split('-')[0]}`;
        shifts.push({
          shiftId,
          merchantId: employee.merchantId,
          restaurantId,
          employeeId: employee.employeeId,
          date: new Date(currentDate),
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          role: employee.role,
          status: 'scheduled',
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await Shift.insertMany(shifts);
    res.json({ success: true, data: { created: shifts.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate schedule' });
  }
});

// Get weekly schedule summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    const shifts = await Shift.aggregate([
      {
        $match: {
          restaurantId: restaurantId as string,
          date: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: '$employeeId',
          totalShifts: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: [
                  { $toDate: '$endTime' },
                  { $toDate: '$startTime' }
                ]},
                3600000
              ]
            }
          },
        },
      },
    ]);

    res.json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

// Get employee availability
router.get('/availability/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const shifts = await Shift.find({
      employeeId,
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    });

    const totalHours = shifts.reduce((sum, shift) => {
      const start = new Date(`2000-01-01T${shift.startTime}`);
      const end = new Date(`2000-01-01T${shift.endTime}`);
      return sum + (end.getTime() - start.getTime()) / 3600000;
    }, 0);

    res.json({
      success: true,
      data: {
        employeeId,
        totalShifts: shifts.length,
        totalHours,
        scheduledDays: shifts.map(s => s.date),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get availability' });
  }
});

export { router as scheduleRoutes };
