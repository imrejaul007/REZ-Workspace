import { Router, Request, Response, NextFunction } from 'express';
import { salesLiftService, attributionService, campaignService, inventoryService } from '../services';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/analytics/sales-lift - Sales lift measurement
router.post('/sales-lift', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { retailerId, storeIds, method, period, baseline, treatment, controlGroup } = req.body;

    const salesLift = await salesLiftService.create({
      campaignId: req.body.campaignId,
      retailerId,
      storeIds,
      method,
      period: {
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate)
      },
      baseline,
      treatment,
      controlGroup
    });

    // Calculate and finalize
    await salesLiftService.calculateAndFinalize(salesLift._id.toString());

    const finalSalesLift = await salesLiftService.getById(salesLift._id.toString());
    const analysis = await salesLiftService.getAnalysis(salesLift._id.toString());

    res.status(201).json({
      success: true,
      data: {
        salesLift: finalSalesLift,
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/sales-lift/:id - Get sales lift by ID
router.get('/sales-lift/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salesLift = await salesLiftService.getById(req.params.id);

    if (!salesLift) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Sales lift not found'
      });
      return;
    }

    const analysis = await salesLiftService.getAnalysis(req.params.id);

    res.json({
      success: true,
      data: {
        salesLift,
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/sales-lift/retailer/:retailerId - Get all sales lifts for retailer
router.get('/sales-lift/retailer/:retailerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, method, limit, offset } = req.query;

    const result = await salesLiftService.listByRetailer(req.params.retailerId, {
      status: status as string,
      method: method as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.salesLifts,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/sales-lift/retailer/:retailerId/summary - Get average lift summary
router.get('/sales-lift/retailer/:retailerId/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await salesLiftService.getAverageLiftByRetailer(req.params.retailerId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/dashboard/:retailerId - Retail analytics dashboard
router.get('/dashboard/:retailerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get campaign performance summary
    const campaignSummary = await campaignService.getPerformanceSummary(
      req.params.retailerId,
      start,
      end
    );

    // Get inventory summary
    const inventorySummary = await inventoryService.getInventorySummary(req.params.retailerId);

    // Get sales lift summary
    const salesLiftSummary = await salesLiftService.getAverageLiftByRetailer(req.params.retailerId);

    // Get attribution summary
    const attributionSummary = await attributionService.getAttributionSummary(req.params.retailerId);

    res.json({
      success: true,
      data: {
        retailerId: req.params.retailerId,
        period: {
          startDate: start,
          endDate: end
        },
        campaigns: campaignSummary,
        inventory: inventorySummary,
        salesLift: salesLiftSummary,
        attribution: attributionSummary,
        summary: {
          totalRevenue: campaignSummary.totalRevenue,
          totalImpressions: campaignSummary.totalImpressions,
          avgRoas: campaignSummary.avgRoas,
          avgSalesLift: salesLiftSummary.avgSalesLift,
          inventoryUtilization: inventorySummary.utilizationRate
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/attribution/:retailerId - Attribution summary
router.get('/attribution/:retailerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await attributionService.getAttributionSummary(req.params.retailerId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/campaigns/:retailerId/performance - Campaign performance analytics
router.get('/campaigns/:retailerId/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const summary = await campaignService.getPerformanceSummary(
      req.params.retailerId,
      start,
      end
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/inventory/:retailerId - Inventory analytics
router.get('/inventory/:retailerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await inventoryService.getInventorySummary(req.params.retailerId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

export default router;