import { Router, Response } from 'express';
import { z } from 'zod';
import { Attendance, Employee } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError } from '../../middleware/index.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();

const checkInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
});

const checkOutSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
});

// GET /api/attendance
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const date = req.query.date as string;
    const employeeId = req.query.employeeId as string;

    const filter: any = { tenantId: req.tenantId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (employeeId) filter.employeeId = employeeId;

    const [records, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/attendance/today
router.get(
  '/today',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const record = await Attendance.findOne({
      tenantId: req.tenantId,
      employeeId: req.user?.userId,
      date: { $gte: today, $lt: tomorrow },
    });

    res.json({
      success: true,
      data: record || null,
    });
  })
);

// GET /api/attendance/stats
router.get(
  '/stats',
  authenticate,
  authorize('admin', 'hr_manager', 'manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [present, absent, late, onLeave] = await Promise.all([
      Attendance.countDocuments({
        tenantId: req.tenantId,
        date: today,
        status: 'present',
      }),
      Attendance.countDocuments({
        tenantId: req.tenantId,
        date: today,
        status: 'absent',
      }),
      Attendance.countDocuments({
        tenantId: req.tenantId,
        date: today,
        status: 'late',
      }),
      Attendance.countDocuments({
        tenantId: req.tenantId,
        date: today,
        status: 'on_leave',
      }),
    ]);

    res.json({
      success: true,
      data: {
        present,
        absent,
        late,
        onLeave,
        total: present + absent + late + onLeave,
      },
    });
  })
);

// POST /api/attendance/check-in
router.post(
  '/check-in',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { latitude, longitude, address } = checkInSchema.parse(req.body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Attendance.findOne({
      tenantId: req.tenantId,
      employeeId: req.user?.userId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (existing?.checkIn) {
      throw new AppError('Already checked in today', 400);
    }

    const hour = new Date().getHours();
    const isLate = hour >= 10;

    const attendance = await Attendance.findOneAndUpdate(
      {
        tenantId: req.tenantId,
        employeeId: req.user?.userId,
        date: { $gte: today, $lt: tomorrow },
      },
      {
        tenantId: req.tenantId,
        employeeId: req.user?.userId!,
        date: today,
        checkIn: new Date(),
        checkInLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
          address,
        },
        status: isLate ? 'late' : 'present',
        isRemote: latitude === 0 && longitude === 0,
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: attendance,
      message: isLate ? 'Checked in late' : 'Checked in successfully',
    });
  })
);

// POST /api/attendance/check-out
router.post(
  '/check-out',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { latitude, longitude, address } = checkOutSchema.parse(req.body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      tenantId: req.tenantId,
      employeeId: req.user?.userId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!attendance) {
      throw new AppError('No attendance record found for today', 404);
    }

    if (attendance.checkOut) {
      throw new AppError('Already checked out today', 400);
    }

    attendance.checkOut = new Date();

    if (latitude !== undefined && longitude !== undefined) {
      attendance.checkOutLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
        address,
      };
    }

    if (attendance.checkIn) {
      const hoursWorked = (attendance.checkOut.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);
      attendance.hoursWorked = Math.round(hoursWorked * 10) / 10;
    }

    await attendance.save();

    res.json({
      success: true,
      data: attendance,
      message: 'Checked out successfully',
    });
  })
);

export default router;
