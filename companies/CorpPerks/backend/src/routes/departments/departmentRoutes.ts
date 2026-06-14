import { Router, Response } from 'express';
import { z } from 'zod';
import { Department } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError } from '../../middleware/index.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();

const createDepartmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  description: z.string().optional(),
  headId: z.string().optional(),
  parentId: z.string().optional(),
});

// GET /api/departments
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const departments = await Department.find({
      tenantId: req.tenantId,
      isActive: true,
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: departments,
    });
  })
);

// POST /api/departments
router.post(
  '/',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createDepartmentSchema.parse(req.body);

    const existing = await Department.findOne({
      tenantId: req.tenantId,
      $or: [{ code: data.code }, { name: data.name }],
    });

    if (existing) {
      throw new AppError('Department with this code or name already exists', 400);
    }

    const department = await Department.create({
      ...data,
      tenantId: req.tenantId,
    });

    res.status(201).json({
      success: true,
      data: department,
    });
  })
);

// PUT /api/departments/:id
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createDepartmentSchema.partial().parse(req.body);

    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      data,
      { new: true, runValidators: true }
    );

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    res.json({
      success: true,
      data: department,
    });
  })
);

// DELETE /api/departments/:id
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { isActive: false },
      { new: true }
    );

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    res.json({
      success: true,
      message: 'Department deactivated successfully',
    });
  })
);

export default router;
