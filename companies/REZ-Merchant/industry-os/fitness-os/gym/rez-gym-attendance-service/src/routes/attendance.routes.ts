/**
 * Attendance Routes
 */

import { Router, Request, Response } from 'express';
import { Attendance } from '../models/Attendance';

const router = Router();

// POST /api/attendance/checkin - Check in
router.post('/checkin', async (req: Request, res: Response) => {
  try {
    const { userId, gymId, membershipId, sessionType, sessionId } = req.body;

    // Check if already checked in
    const existingAttendance = await Attendance.findOne({
      userId,
      gymId,
      isActive: true,
    });

    if (existingAttendance) {
      res.status(400).json({
        success: false,
        error: 'Already checked in',
        data: existingAttendance,
      });
      return;
    }

    const attendanceId = `ATT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const attendance = new Attendance({
      attendanceId,
      userId,
      gymId,
      membershipId,
      checkInTime: new Date().toISOString(),
      sessionType: sessionType || 'gym',
      sessionId,
      source: 'qr',
      isActive: true,
    });

    await attendance.save();

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ success: false, error: 'Failed to check in' });
  }
});

// POST /api/attendance/checkout - Check out
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { userId, gymId } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { userId, gymId, isActive: true },
      {
        $set: {
          checkOutTime: new Date().toISOString(),
          isActive: false,
        },
      },
      { new: true }
    );

    if (!attendance) {
      res.status(404).json({ success: false, error: 'No active check-in found' });
      return;
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ success: false, error: 'Failed to check out' });
  }
});

// GET /api/attendance/user/:userId - Get user attendance
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { date, limit } = req.query;

    const query: Record<string, unknown> = { userId };
    if (date) query.checkInTime = { $regex: `^${date}` };

    const attendance = await Attendance.find(query)
      .sort({ checkInTime: -1 })
      .limit(parseInt(limit as string) || 30);

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
});

// GET /api/attendance/current - Get current gym occupancy
router.get('/current/:gymId', async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;

    const currentOccupancy = await Attendance.countDocuments({
      gymId,
      isActive: true,
    });

    res.json({ success: true, data: { occupancy: currentOccupancy } });
  } catch (error) {
    console.error('Error fetching occupancy:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch occupancy' });
  }
});

export { router as attendanceRoutes };
