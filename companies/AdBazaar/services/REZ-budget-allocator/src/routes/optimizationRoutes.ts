import { Router, Request, Response } from 'express';
import { z } from 'zod';
import budgetService from '../services/budgetService';
import { BudgetStrategy, ApiResponse, BudgetRecommendation, Forecast } from '../types';
import logger from '../utils/logger';

const router = Router();

// Optimization schemas
const allocateAcrossCampaignsSchema = z.object({
  campaignIds: z.array(z.string()),
  totalBudget: z.number().min(0),
  strategy: z.nativeEnum(BudgetStrategy)
});

const forecastSchema = z.object({
  allocationId: z.string().uuid(),
  targetDate: z.string().datetime()
});

// Optimize budget
router.post('/optimize/:allocationId', async (req: Request, res: Response) => {
  try {
    const recommendation = budgetService.optimizeBudget(req.params.allocationId);

    const response: ApiResponse<BudgetRecommendation> = {
      success: true,
      data: recommendation
    };
    res.json(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    logger.error('Error optimizing budget:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Allocate budget across campaigns
router.post('/allocate', async (req: Request, res: Response) => {
  try {
    const validatedData = allocateAcrossCampaignsSchema.parse(req.body);

    const allocations = budgetService.allocateBudgetAcrossCampaigns(
      validatedData.campaignIds,
      validatedData.totalBudget,
      validatedData.strategy
    );

    const response: ApiResponse<Record<string, number>> = {
      success: true,
      data: allocations,
      message: 'Budget allocated across campaigns'
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
    logger.error('Error allocating budget:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Generate forecast
router.post('/forecast', async (req: Request, res: Response) => {
  try {
    const validatedData = forecastSchema.parse(req.body);

    const forecast = budgetService.generateForecast(
      validatedData.allocationId,
      new Date(validatedData.targetDate)
    );

    const response: ApiResponse<Forecast> = {
      success: true,
      data: forecast
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
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    logger.error('Error generating forecast:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get forecasts
router.get('/forecasts', async (req: Request, res: Response) => {
  try {
    const allocationId = req.query.allocationId as string | undefined;

    const forecasts = budgetService.getForecasts(allocationId);

    const response: ApiResponse<Forecast[]> = {
      success: true,
      data: forecasts
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching forecasts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = budgetService.getStats();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
