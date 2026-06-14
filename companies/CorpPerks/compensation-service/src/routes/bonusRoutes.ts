import { Router, Request, Response } from 'express';
import { bonusService } from '../services/index.js';
import { createBonusPlanSchema, calculateBonusSchema, payBonusSchema } from '../validators/index.js';
import { asyncHandler, validateRequest } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/bonus/plans - List all bonus plans
router.get(
  '/plans',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;

    const { plans, total } = await bonusService.findAllPlans({ type, status }, page, limit);

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

// GET /api/bonus/plans/:id - Get bonus plan by ID
router.get(
  '/plans/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await bonusService.findPlanById(req.params.id);

    res.json({
      success: true,
      data: plan,
    });
  })
);

// GET /api/bonus/:employeeId - Get bonus eligibility for an employee
router.get(
  '/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const includeSummary = req.query.summary === 'true';

    if (includeSummary) {
      const summary = await bonusService.getEmployeeBonusSummary(employeeId);

      res.json({
        success: true,
        data: summary,
      });
    } else {
      const eligibilities = await bonusService.findEligibilityByEmployeeId(employeeId);

      res.json({
        success: true,
        data: eligibilities,
      });
    }
  })
);

// POST /api/bonus/plans - Create a new bonus plan
router.post(
  '/plans',
  validateRequest({ body: createBonusPlanSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await bonusService.createPlan(req.body);

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Bonus plan created successfully',
    });
  })
);

// POST /api/bonus/calculate - Calculate bonus eligibility for an employee
router.post(
  '/calculate',
  validateRequest({ body: calculateBonusSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, planId, baseSalary, performanceRating, tenureMonths } = req.body;

    const eligibility = await bonusService.getOrCreateEligibility(
      employeeId,
      planId,
      performanceRating,
      tenureMonths
    );

    const calculation = await bonusService.calculateEligibility({
      employeeId,
      planId,
      baseSalary,
      performanceRating,
      tenureMonths,
    });

    res.json({
      success: true,
      data: {
        eligibility,
        calculation,
      },
    });
  })
);

// POST /api/bonus/pay - Mark a bonus as paid
router.post(
  '/pay',
  validateRequest({ body: payBonusSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { eligibilityId, paidBy } = req.body;
    const eligibility = await bonusService.markAsPaid(eligibilityId, paidBy);

    res.json({
      success: true,
      data: eligibility,
      message: 'Bonus marked as paid',
    });
  })
);

// GET /api/bonus/plan/:planId/eligibilities - Get all eligibilities for a plan
router.get(
  '/plan/:planId/eligibilities',
  asyncHandler(async (req: Request, res: Response) => {
    const eligibilities = await bonusService.findEligibilityByPlanId(req.params.planId);

    const summary = eligibilities.reduce(
      (acc, el) => {
        switch (el.status) {
          case 'eligible':
            acc.totalEligible += el.calculatedAmount;
            acc.countEligible++;
            break;
          case 'pending':
            acc.totalPending += el.calculatedAmount;
            acc.countPending++;
            break;
          case 'paid':
            acc.totalPaid += el.calculatedAmount;
            acc.countPaid++;
            break;
        }
        return acc;
      },
      { totalEligible: 0, totalPending: 0, totalPaid: 0, countEligible: 0, countPending: 0, countPaid: 0 }
    );

    res.json({
      success: true,
      data: {
        summary,
        eligibilities,
      },
    });
  })
);

export default router;
