import { Router, Request, Response } from 'express';
import { salaryBandService } from '../services/index.js';
import { createSalaryBandSchema, updateSalaryBandSchema } from '../validators/index.js';
import { asyncHandler, validateRequest } from '../utils/asyncHandler.js';
import { logger } from '../utils/index.js';

const router = Router();

// GET /api/bands - List all salary bands
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const level = req.query.level as string | undefined;

    const filters = level ? { level } : undefined;
    const { bands, total } = await salaryBandService.findAll(filters, page, limit);

    res.json({
      success: true,
      data: bands,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/bands/:id - Get salary band by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const band = await salaryBandService.findById(req.params.id);

    res.json({
      success: true,
      data: band,
    });
  })
);

// POST /api/bands - Create a new salary band
router.post(
  '/',
  validateRequest({ body: createSalaryBandSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const band = await salaryBandService.create(req.body);

    res.status(201).json({
      success: true,
      data: band,
      message: 'Salary band created successfully',
    });
  })
);

// PATCH /api/bands/:id - Update a salary band
router.patch(
  '/:id',
  validateRequest({ body: updateSalaryBandSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const band = await salaryBandService.update(req.params.id, req.body);

    res.json({
      success: true,
      data: band,
      message: 'Salary band updated successfully',
    });
  })
);

// DELETE /api/bands/:id - Delete a salary band
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await salaryBandService.delete(req.params.id);

    res.json({
      success: true,
      message: 'Salary band deleted successfully',
    });
  })
);

// GET /api/bands/level/:level - Get bands by level
router.get(
  '/level/:level',
  asyncHandler(async (req: Request, res: Response) => {
    const bands = await salaryBandService.findByLevel(req.params.level);

    res.json({
      success: true,
      data: bands,
    });
  })
);

export default router;
