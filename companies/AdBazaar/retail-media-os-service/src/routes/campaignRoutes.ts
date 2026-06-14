import { Router, Request, Response, NextFunction } from 'express';
import { campaignService, salesLiftService, attributionService } from '../services';
import { createCampaignSchema, addAdSchema, createSalesLiftSchema, calculateAttributionSchema } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/campaigns - Create retail media campaign
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = createCampaignSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const campaign = await campaignService.create({
      retailerId: req.body.retailerId,
      ...validation.data
    });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns - List campaigns
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { retailerId, advertiserId, status, objective, limit, offset } = req.query;

    const result = await campaignService.list({
      retailerId: retailerId as string,
      advertiserId: advertiserId as string,
      status: status as any,
      objective: objective as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.campaigns,
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

// GET /api/campaigns/:id - Get campaign
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.getById(req.params.id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.update(req.params.id, req.body);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/:id/status - Update campaign status
router.post('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    if (!['draft', 'active', 'paused', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid status value'
      });
      return;
    }

    const campaign = await campaignService.updateStatus(req.params.id, status);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/:id/ads - Add ads to campaign
router.post('/:id/ads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = addAdSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const campaign = await campaignService.addAd(req.params.id, {
      ...validation.data,
      adSchedule: {
        ...validation.data.adSchedule,
        startDate: new Date(validation.data.adSchedule.startDate),
        endDate: new Date(validation.data.adSchedule.endDate)
      }
    });

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id/performance - Performance analytics
router.get('/:id/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.getById(req.params.id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        campaignId: campaign._id,
        name: campaign.name,
        status: campaign.status,
        performance: campaign.performance,
        budget: campaign.budget,
        roas: campaign.performance.roas,
        ctr: campaign.performance.ctr,
        conversionRate: campaign.performance.conversionRate
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/:id/performance - Update performance metrics
router.post('/:id/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { impressions, clicks, conversions, revenue } = req.body;

    const campaign = await campaignService.updatePerformance(req.params.id, {
      impressions,
      clicks,
      conversions,
      revenue
    });

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: campaign.performance
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id/attribution - Sales attribution
router.get('/:id/attribution', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    const validation = calculateAttributionSchema.safeParse({
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate || new Date().toISOString(),
      attributionModel: req.query.model || 'last_touch',
      windowDays: req.query.windowDays || 7,
      storeId
    });

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const attribution = await attributionService.calculateAttribution({
      campaignId: req.params.id,
      ...validation.data
    });

    res.json({
      success: true,
      data: attribution
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/:id/sales-lift - Create sales lift test
router.post('/:id/sales-lift', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = createSalesLiftSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const campaign = await campaignService.getById(req.params.id);
    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    const salesLift = await salesLiftService.create({
      campaignId: req.params.id,
      retailerId: campaign.retailerId.toString(),
      ...validation.data
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

// GET /api/campaigns/:id/sales-lift - Get sales lift results
router.get('/:id/sales-lift', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salesLifts = await salesLiftService.getByCampaign(req.params.id);

    res.json({
      success: true,
      data: salesLifts
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await campaignService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;