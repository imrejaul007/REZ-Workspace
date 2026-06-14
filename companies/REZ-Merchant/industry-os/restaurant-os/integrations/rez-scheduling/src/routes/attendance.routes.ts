/**
 * Attendance Routes
 */

import { Router, Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { requireRoles } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Clock in
router.post('/clock-in', async (req: Request, res: Response) => {
  try {
    const { employeeId, restaurantId, shiftId } = req.body;
    const attendanceId = `ATT${Date.now()}${crypto.randomUUID().split('-')[0]}`;

    const attendance = new Attendance({
      attendanceId,
      merchantId: req.body.merchantId || '',
      restaurantId,
      employeeId,
      shiftId,
      date: new Date(),
      clockIn: new Date(),
      status: 'present',
    });

    await attendance.save();
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to clock in' });
  }
});

// Clock out
router.post('/clock-out', async (req: Request, res: Response) => {
  try {
    const { employeeId, date } = req.body;
    const clockOut = new Date();

    const attendance = await Attendance.findOne({
      employeeId,
      date: new Date(date || new Date()),
      clockOut: null,
    });

    if (!attendance) {
      res.status(404).json({ success: false, error: 'No active clock-in found' });
      return;
    }

    const clockIn = new Date(attendance.clockIn!);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / 3600000;

    attendance.clockOut = clockOut;
    attendance.actualHours = hoursWorked;
    attendance.overtimeHours = Math.max(0, hoursWorked - 8);

    await attendance.save();
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to clock out' });
  }
});

// Get attendance records
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, employeeId, startDate, endDate } = req.query;
    const query: unknown = {};

    if (restaurantId) query.restaurantId = restaurantId;
    if (employeeId) query.employeeId = employeeId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch records' });
  }
});

// Get attendance summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { restaurantId, employeeId, startDate, endDate } = req.query;

    const summary = await Attendance.aggregate([
      {
        $match: {
          restaurantId: restaurantId as string,
          date: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
        },
      },
      {
        $group: {
          _id: employeeId ? '$employeeId' : null,
          totalDays: { $sum: 1 },
          totalHours: { $sum: '$actualHours' },
          totalOvertime: { $sum: '$overtimeHours' },
          avgHours: { $avg: '$actualHours' },
        },
      },
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

export { router as attendanceRoutes };
