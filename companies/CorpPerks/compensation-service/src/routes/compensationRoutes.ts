import { Router, Request, Response } from 'express';
import { compensationService } from '../services/index.js';
import { createCompensationSchema, updateCompensationSchema } from '../validators/index.js';
import { asyncHandler, validateRequest } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/compensation/:employeeId - Get compensation for an employee
router.get(
  '/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const details = await compensationService.getEmployeeCompensationDetails(req.params.employeeId);

    res.json({
      success: true,
      data: details,
    });
  })
);

// POST /api/compensation - Create a new compensation package
router.post(
  '/',
  validateRequest({ body: createCompensationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const compensation = await compensationService.create(req.body);

    res.status(201).json({
      success: true,
      data: compensation,
      message: 'Compensation package created successfully',
    });
  })
);

// PATCH /api/compensation/:id - Update a compensation package
router.patch(
  '/:id',
  validateRequest({ body: updateCompensationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const compensation = await compensationService.update(req.params.id, req.body);

    res.json({
      success: true,
      data: compensation,
      message: 'Compensation package updated successfully',
    });
  })
);

// DELETE /api/compensation/:id - Delete a compensation package
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await compensationService.delete(req.params.id);

    res.json({
      success: true,
      message: 'Compensation package deleted successfully',
    });
  })
);

// GET /api/compensation - Get all compensation packages (admin)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const employeeId = req.query.employeeId as string | undefined;

    let packages: any[];
    if (employeeId) {
      packages = await compensationService.findByEmployeeId(employeeId);
    } else {
      // Get all with pagination (would need to add this method)
      packages = [];
    }

    res.json({
      success: true,
      data: packages,
      pagination: {
        total: packages.length,
        page,
        limit,
        totalPages: 1,
      },
    });
  })
);

export default router;
