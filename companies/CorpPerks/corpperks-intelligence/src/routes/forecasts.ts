// Forecasts Routes
// Predictive analytics endpoints

import { Router, Request, Response } from 'express';
import { forecastService } from '../services/index.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

// GET /api/v1/forecasts
// Get complete workforce forecast
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';

    const forecast = await forecastService.generateWorkforceForecast(tenantId);

    const response: ApiResponse<typeof forecast> = {
      success: true,
      data: forecast,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Error generating workforce forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate workforce forecast',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/forecasts/attrition
// Get attrition risk forecast
router.get('/attrition', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';

    const attritionForecast = await forecastService.getAttritionRiskForecast(tenantId);

    res.json({
      success: true,
      data: attritionForecast,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting attrition forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get attrition forecast',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/forecasts/hiring
// Get hiring forecast
router.get('/hiring', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';

    const hiringForecast = await forecastService.getHiringForecast(tenantId);

    res.json({
      success: true,
      data: hiringForecast,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting hiring forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hiring forecast',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/forecasts/cost
// Get cost projection
router.get('/cost', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const months = parseInt(req.query.months as string) || 3;

    const costProjection = await forecastService.getCostProjection(tenantId, months);

    res.json({
      success: true,
      data: costProjection,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting cost projection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cost projection',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/forecasts/payroll
// Get payroll forecast
router.get('/payroll', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';

    const forecast = await forecastService.generateWorkforceForecast(tenantId);

    res.json({
      success: true,
      data: forecast.payrollForecast,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting payroll forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payroll forecast',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/forecasts/productivity
// Get productivity forecast
router.get('/productivity', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';

    const forecast = await forecastService.generateWorkforceForecast(tenantId);

    res.json({
      success: true,
      data: forecast.productivityTrend,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting productivity forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get productivity forecast',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/forecasts/headcount
// Get headcount forecast
router.get('/headcount', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';

    const forecast = await forecastService.generateWorkforceForecast(tenantId);

    res.json({
      success: true,
      data: forecast.headcountForecast,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting headcount forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get headcount forecast',
      timestamp: new Date(),
    });
  }
});

// GET /api/v1/forecasts/budget
// Get hiring budget forecast
router.get('/budget', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';

    const forecast = await forecastService.generateWorkforceForecast(tenantId);

    res.json({
      success: true,
      data: forecast.hiringBudget,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting hiring budget forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hiring budget forecast',
      timestamp: new Date(),
    });
  }
});

export default router;
