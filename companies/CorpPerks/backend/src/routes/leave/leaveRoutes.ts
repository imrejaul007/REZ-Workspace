import { Router, Response } from 'express';
import { z } from 'zod';
import { LeaveRequest, Employee } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError } from '../../middleware/index.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();

const createLeaveSchema = z.object({
  employeeId: z.string(),
  leaveType: z.enum(['sick', 'casual', 'earned', 'wfh', 'annual', 'unpaid']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1),
});

const approveLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

function calculateDays(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// GET /api/leave
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const leaveType = req.query.leaveType as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const filter: any = { tenantId: req.tenantId };

    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    if (startDate) filter.startDate = { $gte: new Date(startDate) };
    if (endDate) filter.endDate = { $lte: new Date(endDate) };

    if (req.user?.role === 'employee') {
      filter.employeeId = req.user.userId;
    }

    const [requests, total] = await Promise.all([
      LeaveRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      LeaveRequest.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/leave/:id
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const request = await LeaveRequest.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!request) {
      throw new AppError('Leave request not found', 404);
    }

    res.json({
      success: true,
      data: request,
    });
  })
);

// POST /api/leave
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createLeaveSchema.parse(req.body);

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const totalDays = calculateDays(startDate, endDate);

    const employee = await Employee.findOne({
      _id: data.employeeId,
      tenantId: req.tenantId,
      isDeleted: false,
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const balance = employee.leaveBalance[data.leaveType as keyof typeof employee.leaveBalance] || 0;

    if (balance < totalDays && data.leaveType !== 'unpaid') {
      throw new AppError(`Insufficient leave balance. Available: ${balance} days`, 400);
    }

    const request = await LeaveRequest.create({
      ...data,
      tenantId: req.tenantId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      startDate,
      endDate,
      totalDays,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: request,
    });
  })
);

// PUT /api/leave/:id/approve
router.put(
  '/:id/approve',
  authenticate,
  authorize('admin', 'hr_manager', 'manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, rejectionReason } = approveLeaveSchema.parse(req.body);

    const request = await LeaveRequest.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!request) {
      throw new AppError('Leave request not found', 404);
    }

    if (request.status !== 'pending') {
      throw new AppError('Leave request has already been processed', 400);
    }

    request.status = status;
    request.approvedBy = req.user?.userId;
    request.approvedAt = new Date();

    if (status === 'rejected') {
      request.rejectionReason = rejectionReason;
    }

    if (status === 'approved' && request.leaveType !== 'unpaid') {
      await Employee.findByIdAndUpdate(request.employeeId, {
        [`leaveBalance.${request.leaveType}`]: (balance: number) => balance - request.totalDays,
      });
    }

    await request.save();

    res.json({
      success: true,
      data: request,
    });
  })
);

// PUT /api/leave/:id/cancel
router.put(
  '/:id/cancel',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const request = await LeaveRequest.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!request) {
      throw new AppError('Leave request not found', 404);
    }

    if (request.employeeId !== req.user?.userId) {
      throw new AppError('You can only cancel your own leave requests', 403);
    }

    if (request.status !== 'pending') {
      throw new AppError('Only pending requests can be cancelled', 400);
    }

    request.status = 'cancelled';
    await request.save();

    res.json({
      success: true,
      message: 'Leave request cancelled',
    });
  })
);

// GET /api/leave/balances
router.get(
  '/balances/all',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const employees = await Employee.find({
      tenantId: req.tenantId,
      isDeleted: false,
    }).select('firstName lastName employeeId leaveBalance');

    res.json({
      success: true,
      data: employees,
    });
  })
);

export default router;
