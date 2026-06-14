import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  pacingService,
  statusService,
  optimizationService,
  forecastService,
  alertService
} from '../services';
import { PacingStrategy, AlertThreshold, AlertSeverity, IPaginationParams } from '../types';
import { internalServiceAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createPacingSchema = z.object({
  campaignId: z.string().min(1),
  strategy: z.nativeEnum(PacingStrategy),
  totalBudget: z.number().positive(),
  dailyBudget: z.number().positive(),
  hourlyBudget: z.number().optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  targetImpressions: z.number().optional(),
  targetClicks: z.number().optional(),
  targetConversions: z.number().optional(),
  customSchedule: z.record(z.string(), z.number()).optional()
});

const updatePacingSchema = z.object({
  strategy: z.nativeEnum(PacingStrategy).optional(),
  totalBudget: z.number().positive().optional(),
  dailyBudget: z.number().positive().optional(),
  hourlyBudget: z.number().optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  targetImpressions: z.number().optional(),
  targetClicks: z.number().optional(),
  targetConversions: z.number().optional(),
  isActive: z.boolean().optional(),
  customSchedule: z.record(z.string(), z.number()).optional()
});

const updateStatusSchema = z.object({
  spent: z.number().min(0),
  impressions: z.number().optional(),
  clicks: z.number().optional(),
  conversions: z.number().optional(),
  hourlyData: z.array(z.object({
    hour: z.number().min(0).max(23),
    spent: z.number().min(0),
    impressions: z.number().optional(),
    clicks: z.number().optional()
  })).optional()
});

const optimizeSchema = z.object({
  targetPace: z.number().min(0).max(200),
  adjustmentType: z.enum(['budget', 'bid', 'schedule']),
  reason: z.string().min(1)
});

const createAlertSchema = z.object({
  campaignId: z.string().min(1),
  alertType: z.nativeEnum(AlertThreshold),
  threshold: z.number().min(0),
  severity: z.nativeEnum(AlertSeverity).optional(),
  message: z.string().optional(),
  notificationChannels: z.array(z.string()).optional()
});

/**
 * POST /api/pace/campaigns
 * Create a new campaign pacing configuration
 */
router.post('/campaigns', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = createPacingSchema.parse(req.body);

    // Convert string dates to Date objects
    const input = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate)
    };

    const pacing = await pacingService.createPacing(input);

    // Create default alerts
    await alertService.createDefaultAlerts(
      input.campaignId,
      input.dailyBudget,
      input.totalBudget
    );

    res.status(201).json({
      success: true,
      data: pacing,
      message: 'Campaign pacing created successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create campaign pacing', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pace/campaigns
 * List all campaign pacing configurations
 */
router.get('/campaigns', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const params: IPaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await pacingService.listPacing(params);

    res.json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error: any) {
    logger.error('Failed to list campaign pacing', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pace/campaigns/:id
 * Get pacing configuration for a specific campaign
 */
router.get('/campaigns/:id', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pacing = await pacingService.getPacingByCampaignId(id);

    if (!pacing) {
      res.status(404).json({
        success: false,
        error: 'Pacing configuration not found'
      });
      return;
    }

    res.json({
      success: true,
      data: pacing
    });
  } catch (error: any) {
    logger.error('Failed to get campaign pacing', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/pace/campaigns/:id
 * Update pacing configuration for a campaign
 */
router.put('/campaigns/:id', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updatePacingSchema.parse(req.body);

    // Convert string dates to Date objects if provided
    const updates: any = { ...validatedData };
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const pacing = await pacingService.updatePacing(id, updates);

    if (!pacing) {
      res.status(404).json({
        success: false,
        error: 'Pacing configuration not found'
      });
      return;
    }

    res.json({
      success: true,
      data: pacing,
      message: 'Campaign pacing updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update campaign pacing', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/pace/campaigns/:id
 * Delete pacing configuration for a campaign
 */
router.delete('/campaigns/:id', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await pacingService.deletePacing(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Pacing configuration not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Campaign pacing deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete campaign pacing', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pace/campaigns/:id/status
 * Get current pacing status for a campaign
 */
router.get('/campaigns/:id/status', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = await statusService.getStatus(id);

    if (!status) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found or no pacing configured'
      });
      return;
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    logger.error('Failed to get campaign status', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/pace/campaigns/:id/status
 * Update pacing status for a campaign
 */
router.put('/campaigns/:id/status', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);

    const status = await statusService.updateStatus(id, validatedData);

    // Check and trigger alerts
    await alertService.checkAlerts(id);

    res.json({
      success: true,
      data: status,
      message: 'Pacing status updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update pacing status', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pace/campaigns/:id/optimize
 * Optimize pacing for a campaign
 */
router.post('/campaigns/:id/optimize', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = optimizeSchema.parse(req.body);

    const result = await optimizationService.optimizePacing(id, validatedData);

    res.json({
      success: true,
      data: result,
      message: 'Campaign optimized successfully'
    });
  } catch (error: any) {
    logger.error('Failed to optimize campaign', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pace/campaigns/:id/forecast
 * Get pacing forecast for a campaign
 */
router.get('/campaigns/:id/forecast', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const forecastDays = parseInt(req.query.forecastDays as string) || 7;

    const forecast = await forecastService.getForecast(id, { forecastDays });

    if (!forecast) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found or no pacing configured'
      });
      return;
    }

    res.json({
      success: true,
      data: forecast
    });
  } catch (error: any) {
    logger.error('Failed to get forecast', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pace/campaigns/:id/recommendations
 * Get optimization recommendations for a campaign
 */
router.get('/campaigns/:id/recommendations', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recommendations = await optimizationService.getRecommendations(id);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    logger.error('Failed to get recommendations', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pace/alerts
 * Create a new pacing alert
 */
router.post('/alerts', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = createAlertSchema.parse(req.body);

    const alert = await alertService.createAlert(validatedData);

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create alert', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pace/alerts
 * Get all alerts (optionally filtered by campaign)
 */
router.get('/alerts', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { campaignId, severity } = req.query;

    if (campaignId) {
      const alerts = await alertService.getAlerts(campaignId as string);
      res.json({
        success: true,
        data: alerts
      });
    } else if (severity) {
      const alerts = await alertService.getAlertsBySeverity(severity as AlertSeverity);
      res.json({
        success: true,
        data: alerts
      });
    } else {
      const alerts = await alertService.getActiveAlerts();
      res.json({
        success: true,
        data: alerts
      });
    }
  } catch (error: any) {
    logger.error('Failed to get alerts', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pace/alerts/:id
 * Get specific alert
 */
router.get('/alerts/:id', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { PacingAlert } = require('../models');
    const alert = await PacingAlert.findById(id);

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
      return;
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error: any) {
    logger.error('Failed to get alert', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/pace/alerts/:id
 * Delete an alert
 */
router.delete('/alerts/:id', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await alertService.deleteAlert(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete alert', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pace/alerts/:id/toggle
 * Enable or disable an alert
 */
router.post('/alerts/:id/toggle', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const alert = await alertService.setAlertEnabled(id, enabled);

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
      return;
    }

    res.json({
      success: true,
      data: alert,
      message: `Alert ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error: any) {
    logger.error('Failed to toggle alert', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pace/alerts/check
 * Manually trigger alert check for a campaign
 */
router.post('/alerts/check', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      res.status(400).json({
        success: false,
        error: 'campaignId is required'
      });
      return;
    }

    const result = await alertService.checkAlerts(campaignId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to check alerts', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;