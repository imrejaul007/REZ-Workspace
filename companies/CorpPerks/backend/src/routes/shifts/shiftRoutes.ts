import { Router, Response } from 'express';
import { z } from 'zod';
import { Shift, ShiftTemplate, Employee } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError } from '../../middleware/index.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();

const createShiftSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  breakMinutes: z.number().optional().default(30),
});

const createTemplateSchema = z.object({
  name: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  breakMinutes: z.number().optional().default(30),
});

const updateShiftSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  breakMinutes: z.number().optional(),
});

// GET /api/shifts
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const date = req.query.date as string;
    const status = req.query.status as string;

    const filter: any = { tenantId: req.tenantId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) filter.status = status;

    const [shifts, total] = await Promise.all([
      Shift.find(filter).sort({ date: 1, startTime: 1 }).skip(skip).limit(limit),
      Shift.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: shifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/shifts/stats
router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [active, total, completed, late] = await Promise.all([
      Shift.countDocuments({ tenantId: req.tenantId, status: 'in_progress', date: today }),
      Shift.countDocuments({ tenantId: req.tenantId, date: today }),
      Shift.countDocuments({ tenantId: req.tenantId, status: 'completed', date: today }),
      Shift.countDocuments({ tenantId: req.tenantId, status: 'absent', date: today }),
    ]);

    res.json({
      success: true,
      data: {
        active,
        total,
        completed,
        late,
      },
    });
  })
);

// GET /api/shifts/templates
router.get(
  '/templates',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const templates = await ShiftTemplate.find({
      tenantId: req.tenantId,
      isActive: true,
    });

    res.json({
      success: true,
      data: templates,
    });
  })
);

// POST /api/shifts/templates
router.post(
  '/templates',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createTemplateSchema.parse(req.body);

    const template = await ShiftTemplate.create({
      ...data,
      tenantId: req.tenantId,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  })
);

// POST /api/shifts
router.post(
  '/',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createShiftSchema.parse(req.body);

    const employee = await Employee.findOne({
      _id: data.employeeId,
      tenantId: req.tenantId,
      isDeleted: false,
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const shift = await Shift.create({
      ...data,
      tenantId: req.tenantId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: new Date(data.date),
      status: 'scheduled',
    });

    res.status(201).json({
      success: true,
      data: shift,
    });
  })
);

// PUT /api/shifts/:id
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = updateShiftSchema.parse(req.body);

    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      data,
      { new: true, runValidators: true }
    );

    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    res.json({
      success: true,
      data: shift,
    });
  })
);

// PUT /api/shifts/:id/start
router.put(
  '/:id/start',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, employeeId: req.user?.userId },
      { status: 'in_progress', checkIn: new Date() },
      { new: true }
    );

    if (!shift) {
      throw new AppError('Shift not found or not authorized', 404);
    }

    res.json({
      success: true,
      data: shift,
    });
  })
);

// PUT /api/shifts/:id/complete
router.put(
  '/:id/complete',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, employeeId: req.user?.userId },
      { status: 'completed', checkOut: new Date() },
      { new: true }
    );

    if (!shift) {
      throw new AppError('Shift not found or not authorized', 404);
    }

    res.json({
      success: true,
      data: shift,
    });
  })
);

// DELETE /api/shifts/:id
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const shift = await Shift.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    res.json({
      success: true,
      message: 'Shift deleted successfully',
    });
  })
);

export default router;
