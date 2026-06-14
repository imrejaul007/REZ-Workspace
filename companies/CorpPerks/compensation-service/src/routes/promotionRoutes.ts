import { Router, Request, Response } from 'express';
import { promotionService } from '../services/index.js';
import {
  createPromotionSchema,
  approvePromotionSchema,
  rejectPromotionSchema,
  processPromotionSchema,
} from '../validators/index.js';
import { asyncHandler, validateRequest } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/promotions - List all promotions
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const employeeId = req.query.employeeId as string | undefined;
    const status = req.query.status as string | undefined;

    const { promotions, total } = await promotionService.findAll(
      { employeeId, status },
      page,
      limit
    );

    res.json({
      success: true,
      data: promotions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/promotions/pending - Get pending promotions
router.get(
  '/pending',
  asyncHandler(async (_req: Request, res: Response) => {
    const promotions = await promotionService.findPending();

    res.json({
      success: true,
      data: promotions,
    });
  })
);

// GET /api/promotions/:id - Get promotion by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const promotion = await promotionService.findById(req.params.id);

    res.json({
      success: true,
      data: promotion,
    });
  })
);

// POST /api/promotions - Create a new promotion
router.post(
  '/',
  validateRequest({ body: createPromotionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const promotion = await promotionService.create(req.body);

    res.status(201).json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully',
    });
  })
);

// POST /api/promotions/approve - Approve a promotion
router.post(
  '/approve',
  validateRequest({ body: approvePromotionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { promotionId, approvedBy } = req.body;
    const promotion = await promotionService.approve(promotionId, approvedBy);

    res.json({
      success: true,
      data: promotion,
      message: 'Promotion approved',
    });
  })
);

// POST /api/promotions/reject - Reject a promotion
router.post(
  '/reject',
  validateRequest({ body: rejectPromotionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { promotionId, rejectedBy, reason } = req.body;
    const promotion = await promotionService.reject(promotionId, rejectedBy, reason);

    res.json({
      success: true,
      data: promotion,
      message: 'Promotion rejected',
    });
  })
);

// POST /api/promotions/process - Process an approved promotion
router.post(
  '/process',
  validateRequest({ body: processPromotionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { promotionId, processedBy, newSalary } = req.body;
    const promotion = await promotionService.process(promotionId, processedBy, newSalary);

    res.json({
      success: true,
      data: promotion,
      message: 'Promotion processed successfully',
    });
  })
);

// GET /api/promotions/employee/:employeeId - Get promotions for an employee
router.get(
  '/employee/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const promotions = await promotionService.findByEmployeeId(req.params.employeeId);

    res.json({
      success: true,
      data: promotions,
    });
  })
);

export default router;
