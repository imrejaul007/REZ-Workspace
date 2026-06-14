import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { budgetService } from '../services/budgetService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createBudgetSchema = z.object({
  fundId: z.string().min(1),
  type: z.enum(['monthly', 'quarterly', 'annual', 'campaign']),
  period: z.object({
    start: z.string().transform((s) => new Date(s)),
    end: z.string().transform((s) => new Date(s)),
  }),
  allocatedAmount: z.number().min(0),
});

/**
 * POST /api/budgets
 * Create a new budget
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createBudgetSchema.parse(req.body);
    const budget = await budgetService.createBudget(input);

    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create budget' });
  }
});

/**
 * GET /api/budgets/:id
 * Get budget by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const budget = await budgetService.getBudget(req.params.id);

    if (!budget) {
      res.status(404).json({ success: false, error: 'Budget not found' });
      return;
    }

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch budget' });
  }
});

/**
 * GET /api/budgets/fund/:fundId
 * Get budget by fund
 */
router.get('/fund/:fundId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const budget = await budgetService.getBudgetByFund(req.params.fundId);

    if (!budget) {
      res.status(404).json({ success: false, error: 'Budget not found' });
      return;
    }

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch budget' });
  }
});

/**
 * GET /api/budgets/:id/utilization
 * Get budget utilization
 */
router.get('/:id/utilization', authMiddleware, async (req: Request, res: Response) => {
  try {
    const utilization = await budgetService.getBudgetUtilization(req.params.id);

    if (!utilization) {
      res.status(404).json({ success: false, error: 'Budget not found' });
      return;
    }

    res.json({ success: true, data: utilization });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch utilization' });
  }
});

/**
 * GET /api/budgets/:id/allocation/:partnerId
 * Get partner allocation
 */
router.get('/:id/allocation/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const allocation = await budgetService.getPartnerAllocation(req.params.id, req.params.partnerId);

    if (!allocation) {
      res.status(404).json({ success: false, error: 'Budget not found' });
      return;
    }

    res.json({ success: true, data: allocation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch allocation' });
  }
});

export default router;