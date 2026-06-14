import { Router, Request, Response } from 'express';
import { incrementService } from '../services/index.js';
import {
  createIncrementPlanSchema,
  approveIncrementSchema,
  rejectIncrementSchema,
  planIncrementsSchema,
  approveIncrementRequestSchema,
  rejectIncrementRequestSchema,
} from '../validators/index.js';
import { asyncHandler, validateRequest } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/increments/plans - List all increment plans
router.get(
  '/plans',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const fiscalYear = req.query.fiscalYear as string | undefined;
    const status = req.query.status as string | undefined;

    const { plans, total } = await incrementService.findAllPlans({ fiscalYear, status }, page, limit);

    res.json({
      success: true,
      data: plans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/increments/plans/:id - Get increment plan by ID
router.get(
  '/plans/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await incrementService.findPlanById(req.params.id);

    res.json({
      success: true,
      data: plan,
    });
  })
);

// GET /api/increments/requests - Get all increment requests
router.get(
  '/requests',
  asyncHandler(async (req: Request, res: Response) => {
    const planId = req.query.planId as string | undefined;
    const employeeId = req.query.employeeId as string | undefined;

    let requests;
    if (planId) {
      requests = await incrementService.findRequestsByPlanId(planId);
    } else if (employeeId) {
      requests = await incrementService.findRequestsByEmployeeId(employeeId);
    } else {
      requests = await incrementService.findPendingRequests();
    }

    res.json({
      success: true,
      data: requests,
    });
  })
);

// POST /api/increments/plan - Create a new increment plan
router.post(
  '/plan',
  validateRequest({ body: createIncrementPlanSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await incrementService.createPlan(req.body);

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Increment plan created successfully',
    });
  })
);

// POST /api/increments/plan - Plan increments for employees
router.post(
  '/plan/increments',
  validateRequest({ body: planIncrementsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const requests = await incrementService.planIncrements(req.body);

    res.status(201).json({
      success: true,
      data: requests,
      message: `Planned ${requests.length} increment requests`,
    });
  })
);

// POST /api/increments/approve - Approve an increment plan
router.post(
  '/approve',
  validateRequest({ body: approveIncrementSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { planId, approvedBy } = req.body;
    const plan = await incrementService.approvePlan(planId, approvedBy);

    res.json({
      success: true,
      data: plan,
      message: 'Increment plan approved',
    });
  })
);

// POST /api/increments/reject - Reject an increment plan
router.post(
  '/reject',
  validateRequest({ body: rejectIncrementSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { planId, rejectedBy, reason } = req.body;
    const plan = await incrementService.rejectPlan(planId, rejectedBy, reason);

    res.json({
      success: true,
      data: plan,
      message: 'Increment plan rejected',
    });
  })
);

// POST /api/increments/request/approve - Approve an increment request
router.post(
  '/request/approve',
  validateRequest({ body: approveIncrementRequestSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { requestId, approvedBy } = req.body;
    const request = await incrementService.approveIncrementRequest(requestId, approvedBy);

    res.json({
      success: true,
      data: request,
      message: 'Increment request approved',
    });
  })
);

// POST /api/increments/request/reject - Reject an increment request
router.post(
  '/request/reject',
  validateRequest({ body: rejectIncrementRequestSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { requestId, rejectedBy, reason } = req.body;
    const request = await incrementService.rejectIncrementRequest(requestId, rejectedBy, reason);

    res.json({
      success: true,
      data: request,
      message: 'Increment request rejected',
    });
  })
);

// POST /api/increments/process - Process approved increments for a plan
router.post(
  '/process',
  asyncHandler(async (req: Request, res: Response) => {
    const { planId } = req.body;
    const processed = await incrementService.processApprovedIncrements(planId);

    res.json({
      success: true,
      data: { processedCount: processed },
      message: `Processed ${processed} increments`,
    });
  })
);

export default router;
