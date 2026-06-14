import { Router, Request, Response, NextFunction } from 'express';
import { campaignService } from '../services/campaignService.js';
import { outcomeService } from '../services/outcomeService.js';
import { attributionService } from '../services/attributionService.js';
import { optimizationService } from '../services/optimizationService.js';
import { roasService } from '../services/roasService.js';
import { forecastingService } from '../services/forecastingService.js';
import { CampaignObjective, CampaignStatus, AttributionModel } from '../models/outcomeModels.js';
import logger from 'utils/logger.js';

const router = Router();

// ============ Campaign Routes ============

/**
 * POST /api/outcomes/campaign
 * Create a new outcome campaign
 */
router.post('/api/outcomes/campaign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      advertiserId,
      name,
      description,
      objective,
      startDate,
      endDate,
      budget,
      kpis,
      attribution,
      targeting,
      metadata
    } = req.body;

    if (!advertiserId || !name || !objective || !startDate || !budget || !kpis) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: advertiserId, name, objective, startDate, budget, kpis'
      });
      return;
    }

    if (!Object.values(CampaignObjective).includes(objective)) {
      res.status(400).json({
        success: false,
        error: 'Invalid objective',
        validObjectives: Object.values(CampaignObjective)
      });
      return;
    }

    const result = await campaignService.createCampaign({
      advertiserId,
      name,
      description,
      objective,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      budget,
      kpis,
      attribution,
      targeting,
      metadata
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/outcomes/campaign/:id
 * Get campaign by ID
 */
router.get('/api/outcomes/campaign/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await campaignService.getCampaign(id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found'
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

/**
 * GET /api/outcomes/campaigns/:advertiserId
 * Get all campaigns for an advertiser
 */
router.get('/api/outcomes/campaigns/:advertiserId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { advertiserId } = req.params;
    const { status, objective, limit } = req.query;

    const campaigns = await campaignService.getAdvertiserCampaigns(
      advertiserId,
      {
        status: status as CampaignStatus | undefined,
        objective: objective as CampaignObjective | undefined,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({
      success: true,
      data: {
        campaigns,
        count: campaigns.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/outcomes/campaign/:id/status
 * Update campaign status
 */
router.put('/api/outcomes/campaign/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(CampaignStatus).includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses: Object.values(CampaignStatus)
      });
      return;
    }

    const campaign = await campaignService.updateCampaignStatus(id, status);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found'
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

// ============ Outcome Tracking Routes ============

/**
 * POST /api/outcomes/track
 * Track a business outcome
 */
router.post('/api/outcomes/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      campaignId,
      advertiserId,
      type,
      value,
      currency,
      customerId,
      sessionId,
      device,
      location,
      conversionData,
      timestamp
    } = req.body;

    if (!campaignId || !advertiserId || !type || value === undefined || !conversionData?.channel) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: campaignId, advertiserId, type, value, conversionData.channel'
      });
      return;
    }

    const result = await outcomeService.trackOutcome({
      campaignId,
      advertiserId,
      type,
      value,
      currency,
      customerId,
      sessionId,
      device,
      location,
      conversionData,
      timestamp: timestamp ? new Date(timestamp) : undefined
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/outcomes/campaign/:id/outcomes
 * Get outcomes for a campaign
 */
router.get('/api/outcomes/campaign/:id/outcomes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, type, limit } = req.query;

    const outcomes = await outcomeService.getCampaignOutcomes(id, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      type: type as string | undefined,
      limit: limit ? parseInt(limit as string) : 100
    });

    res.json({
      success: true,
      data: {
        outcomes,
        count: outcomes.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============ Attribution Routes ============

/**
 * GET /api/outcomes/attribution/:campaignId
 * Get attribution report for a campaign
 */
router.get('/api/outcomes/attribution/:campaignId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate, model } = req.query;

    const report = await attributionService.getAttributionReport(campaignId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      model: model as AttributionModel | undefined
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/outcomes/attribution/calculate
 * Calculate attribution for a specific outcome
 */
router.post('/api/outcomes/attribution/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outcomeId, model, lookbackWindow } = req.body;

    if (!outcomeId) {
      res.status(400).json({
        success: false,
        error: 'outcomeId is required'
      });
      return;
    }

    const result = await attributionService.calculateAttribution(
      outcomeId,
      model || AttributionModel.LINEAR,
      lookbackWindow || 30
    );

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Outcome not found or no touchpoints available'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/outcomes/attribution/:campaignId/compare
 * Compare attribution models for a campaign
 */
router.get('/api/outcomes/attribution/:campaignId/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;

    const comparison = await attributionService.compareAttributionModels(campaignId);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
});

// ============ Optimization Routes ============

/**
 * POST /api/outcomes/optimize
 * Get AI optimization recommendations
 */
router.post('/api/outcomes/optimize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      res.status(400).json({
        success: false,
        error: 'campaignId is required'
      });
      return;
    }

    const result = await optimizationService.getRecommendations(campaignId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/outcomes/optimize/apply
 * Apply automated optimizations
 */
router.post('/api/outcomes/optimize/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      res.status(400).json({
        success: false,
        error: 'campaignId is required'
      });
      return;
    }

    const result = await optimizationService.applyAutomatedOptimizations(campaignId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// ============ ROAS Routes ============

/**
 * POST /api/outcomes/roas
 * Calculate ROAS for a campaign
 */
router.post('/api/outcomes/roas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      campaignId,
      advertiserId,
      revenue,
      costs,
      conversions,
      metrics,
      periodType
    } = req.body;

    if (!campaignId || !advertiserId || revenue === undefined || !costs?.media) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: campaignId, advertiserId, revenue, costs.media'
      });
      return;
    }

    const result = await roasService.calculateROAS({
      campaignId,
      advertiserId,
      revenue,
      costs,
      conversions,
      metrics,
      periodType
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/outcomes/roas/:campaignId/trend
 * Get ROAS trend for a campaign
 */
router.get('/api/outcomes/roas/:campaignId/trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;
    const { periodType, limit } = req.query;

    const trend = await roasService.getROASTrend(
      campaignId,
      (periodType as 'daily' | 'weekly' | 'monthly') || 'daily',
      limit ? parseInt(limit as string) : 30
    );

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/outcomes/roas/:campaignId/suggestions
 * Get ROAS optimization suggestions
 */
router.get('/api/outcomes/roas/:campaignId/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;

    const suggestions = await roasService.getROASOptimizationSuggestions(campaignId);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
});

// ============ Forecasting Routes ============

/**
 * GET /api/outcomes/forecasting/:campaignId
 * Generate revenue forecast for a campaign
 */
router.get('/api/outcomes/forecasting/:campaignId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;
    const { advertiserId, forecastType, horizonDays, assumptions } = req.query;

    if (!advertiserId) {
      res.status(400).json({
        success: false,
        error: 'advertiserId query parameter is required'
      });
      return;
    }

    const result = await forecastingService.generateForecast({
      campaignId,
      advertiserId: advertiserId as string,
      forecastType: (forecastType as 'revenue' | 'conversions' | 'roi') || 'revenue',
      horizonDays: horizonDays ? parseInt(horizonDays as string) : 30,
      assumptions: assumptions ? JSON.parse(assumptions as string) : undefined
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/outcomes/forecasting/:campaignId/accuracy
 * Get forecast accuracy metrics
 */
router.get('/api/outcomes/forecasting/:campaignId/accuracy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;

    const accuracy = await forecastingService.getForecastAccuracy(campaignId);

    res.json({
      success: true,
      data: accuracy
    });
  } catch (error) {
    next(error);
  }
});

// ============ Performance Analytics Routes ============

/**
 * GET /api/outcomes/performance/:campaignId
 * Get performance analytics for a campaign
 */
router.get('/api/outcomes/performance/:campaignId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;
    const { periodType, limit } = req.query;

    const analytics = await outcomeService.getPerformanceAnalytics(
      campaignId,
      (periodType as 'daily' | 'weekly' | 'monthly') || 'daily',
      limit ? parseInt(limit as string) : 30
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/outcomes/dashboard/:advertiserId
 * Get outcome dashboard for an advertiser
 */
router.get('/api/outcomes/dashboard/:advertiserId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { advertiserId } = req.params;

    const dashboard = await outcomeService.getAdvertiserDashboard(advertiserId);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
});

// ============ Campaign Summary Routes ============

/**
 * GET /api/outcomes/summary/:advertiserId
 * Get campaign summary for an advertiser
 */
router.get('/api/outcomes/summary/:advertiserId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { advertiserId } = req.params;

    const summary = await campaignService.getCampaignSummary(advertiserId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/outcomes/performance/:campaignId/summary
 * Get campaign performance summary
 */
router.get('/api/outcomes/performance/:campaignId/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;

    const performance = await campaignService.getCampaignPerformance(campaignId);

    if (!performance) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
});

export default router;