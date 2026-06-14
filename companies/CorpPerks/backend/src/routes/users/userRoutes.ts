import { Router, Response } from 'express';
import { z } from 'zod';
import { User, Tenant } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError } from '../../middleware/index.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

// GET /api/users
router.get(
  '/',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const filter: any = { tenantId: req.tenantId };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/users/:id
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

// PUT /api/users/:id/profile
router.put(
  '/:id/profile',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.userId !== req.params.id && !['admin', 'hr_manager'].includes(req.user?.role || '')) {
      throw new AppError('Not authorized to update this profile', 403);
    }

    const data = updateProfileSchema.parse(req.body);

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      data,
      { new: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

// PUT /api/users/:id/role
router.put(
  '/:id/role',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { role } = req.body;

    if (!['admin', 'hr_manager', 'manager', 'employee'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

// PUT /api/users/:id/deactivate
router.put(
  '/:id/deactivate',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  })
);

export default router;
