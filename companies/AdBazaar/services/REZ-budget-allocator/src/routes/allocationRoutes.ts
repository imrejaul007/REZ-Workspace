import { Router, Request, Response } from 'express';
import { z } from 'zod';
import budgetService from '../services/budgetService';
import { BudgetStrategy, PacingMode, AllocationStatus, ApiResponse, BudgetAllocation } from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createAllocationSchema = z.object({
  campaignId: z.string().min(1),
  adGroupId: z.string().optional(),
  strategy: z.nativeEnum(BudgetStrategy),
  pacingMode: z.nativeEnum(PacingMode).optional(),
  totalBudget: z.number().min(0),
  dailyBudget: z.number().min(0).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  weights: z.record(z.number()).optional()
});

const updateAllocationSchema = z.object({
  totalBudget: z.number().min(0).optional(),
  dailyBudget: z.number().min(0).optional(),
  strategy: z.nativeEnum(BudgetStrategy).optional(),
  pacingMode: z.nativeEnum(PacingMode).optional(),
  status: z.nativeEnum(AllocationStatus).optional(),
  weights: z.record(z.number()).optional()
});

const recordSpendingSchema = z.object({
  allocationId: z.string().uuid(),
  amount: z.number().min(0),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  revenue: z.number().min(0).optional()
});

// Create allocation
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createAllocationSchema.parse(req.body);

    const allocation = budgetService.createAllocation(validatedData);

    const response: ApiResponse<BudgetAllocation> = {
      success: true,
      data: allocation,
      message: 'Budget allocation created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error creating allocation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get allocation
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const allocation = budgetService.getAllocation(req.params.id);

    if (!allocation) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    const response: ApiResponse<BudgetAllocation> = {
      success: true,
      data: allocation
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching allocation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get allocation for campaign
router.get('/campaign/:campaignId', async (req: Request, res: Response) => {
  try {
    const allocation = budgetService.getAllocationForCampaign(req.params.campaignId);

    if (!allocation) {
      return res.status(404).json({ success: false, error: 'No active allocation for this campaign' });
    }

    const response: ApiResponse<BudgetAllocation> = {
      success: true,
      data: allocation
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching allocation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// List allocations
router.get('/', async (req: Request, res: Response) => {
  try {
    const campaignId = req.query.campaignId as string | undefined;
    const status = req.query.status as AllocationStatus | undefined;
    const strategy = req.query.strategy as BudgetStrategy | undefined;

    const allocations = budgetService.getAllocations({ campaignId, status, strategy });

    const response: ApiResponse<BudgetAllocation[]> = {
      success: true,
      data: allocations
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching allocations:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update allocation
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateAllocationSchema.parse(req.body);

    const allocation = budgetService.updateAllocation(req.params.id, validatedData);

    if (!allocation) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    const response: ApiResponse<BudgetAllocation> = {
      success: true,
      data: allocation,
      message: 'Allocation updated successfully'
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error updating allocation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete allocation
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = budgetService.deleteAllocation(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    res.json({ success: true, message: 'Allocation deleted successfully' });
  } catch (error) {
    logger.error('Error deleting allocation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Record spending
router.post('/spending', async (req: Request, res: Response) => {
  try {
    const validatedData = recordSpendingSchema.parse(req.body);

    const allocation = budgetService.recordSpending(validatedData);

    if (!allocation) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    const response: ApiResponse<BudgetAllocation> = {
      success: true,
      data: allocation,
      message: 'Spending recorded successfully'
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error recording spending:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get pacing status
router.get('/:id/pacing', async (req: Request, res: Response) => {
  try {
    const pacing = budgetService.getPacingStatus(req.params.id);

    if (!pacing) {
      return res.status(404).json({ success: false, error: 'Pacing status not found' });
    }

    const response: ApiResponse<typeof pacing> = {
      success: true,
      data: pacing
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching pacing status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
