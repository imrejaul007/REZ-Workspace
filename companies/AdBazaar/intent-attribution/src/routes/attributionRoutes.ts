import { Router, Request, Response, NextFunction } from 'express';
import { ConversionEventSchema, AttributionReportQuerySchema, AttributionModelSchema, UserJourneyQuerySchema, SegmentQuerySchema } from '../schemas.js';
import { AttributionModel, ApiResponse, UserAttributionJourney, SegmentAttribution } from '../types.js';
import conversionCaptureService from '../services/ConversionCaptureService.js';
import attributionCalculationService from '../services/AttributionCalculationService.js';
import roiService from '../services/ROIService.js';
import reportGeneratorService from '../services/ReportGeneratorService.js';
import { authMiddleware, internalServiceAuth, combinedAuthMiddleware } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = Router();

// Validation error handler
function handleValidationError(error: unknown, res: Response): void {
  if (error instanceof Error) {
    logger.warn('Validation error', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Validation failed'
    });
  }
}

// POST /api/attribution/convert - Report a conversion event
router.post('/convert', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = ConversionEventSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({
        success: false,
        error: `Validation failed: ${errors}`
      });
      return;
    }

    const conversion = await conversionCaptureService.captureConversion(parsed.data);

    logger.info('Conversion captured via API', {
      conversionId: conversion.conversionId,
      userId: conversion.userId,
      conversionType: conversion.conversionType
    });

    res.status(201).json({
      success: true,
      data: {
        conversionId: conversion.conversionId,
        userId: conversion.userId,
        conversionType: conversion.conversionType,
        conversionValue: conversion.conversionValue,
        currency: conversion.currency,
        category: conversion.category,
        attributedSignals: conversion.attributedSignals.length,
        model: conversion.model,
        timestamp: conversion.timestamp
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error capturing conversion', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to capture conversion'
    });
  }
});

// GET /api/attribution/report - Generate attribution report
router.get('/report', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = AttributionReportQuerySchema.safeParse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      model: req.query.model,
      sources: req.query.sources as string,
      segments: req.query.segments as string,
      limit: req.query.limit,
      offset: req.query.offset
    });

    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({
        success: false,
        error: `Validation failed: ${errors}`
      });
      return;
    }

    const report = await reportGeneratorService.generateReport({
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      model: parsed.data.model,
      sources: parsed.data.sources,
      segments: parsed.data.segments,
      limit: parsed.data.limit,
      offset: parsed.data.offset
    });

    res.json({
      success: true,
      data: report,
      meta: {
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error generating attribution report', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to generate attribution report'
    });
  }
});

// GET /api/attribution/journey/:userId - Get user attribution journey
router.get('/journey/:userId', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const parsed = UserJourneyQuerySchema.safeParse({
      userId,
      limit: req.query.limit,
      offset: req.query.offset
    });

    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({
        success: false,
        error: `Validation failed: ${errors}`
      });
      return;
    }

    const conversions = await conversionCaptureService.getConversionsByUserId(
      parsed.data.userId,
      parsed.data.limit,
      parsed.data.offset
    );

    const journey: UserAttributionJourney[] = conversions.map(conv => ({
      userId: conv.userId,
      conversionId: conv.conversionId,
      conversionType: conv.conversionType,
      conversionValue: conv.conversionValue,
      conversionDate: conv.timestamp,
      touchpoints: conv.attributedSignals.map(signal => ({
        signalId: signal.signalId,
        source: signal.source,
        eventType: signal.eventType,
        category: signal.category,
        timestamp: conv.timestamp, // Simplified - actual timestamp per signal would be better
        attributionCredit: signal.attributionCredit,
        attributionValue: signal.attributionValue
      }))
    }));

    res.json({
      success: true,
      data: journey,
      meta: {
        total: journey.length,
        limit: parsed.data.limit,
        offset: parsed.data.offset
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting user journey', { userId: req.params.userId, error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to get user attribution journey'
    });
  }
});

// GET /api/attribution/segments - Attribution by segment
router.get('/segments', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = SegmentQuerySchema.safeParse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      model: req.query.model,
      limit: req.query.limit
    });

    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({
        success: false,
        error: `Validation failed: ${errors}`
      });
      return;
    }

    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : new Date();

    const segments = await reportGeneratorService.generateSegmentReport(
      startDate,
      endDate,
      parsed.data.limit
    );

    res.json({
      success: true,
      data: segments,
      meta: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        total: segments.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting segment attribution', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to get segment attribution'
    });
  }
});

// POST /api/attribution/model - Set attribution model
router.post('/model', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = AttributionModelSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({
        success: false,
        error: `Validation failed: ${errors}`
      });
      return;
    }

    // In a real implementation, this would store the model preference
    // For now, we just acknowledge the request
    logger.info('Attribution model set', {
      model: parsed.data.model,
      config: parsed.data.config
    });

    res.json({
      success: true,
      data: {
        model: parsed.data.model,
        config: parsed.data.config,
        message: 'Attribution model updated successfully'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error setting attribution model', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to set attribution model'
    });
  }
});

// GET /api/attribution/sources - Get attribution by source
router.get('/sources', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const limit = parseInt(req.query.limit as string) || 20;

    const sources = await reportGeneratorService.generateSourceReport(startDate, endDate, limit);

    res.json({
      success: true,
      data: sources,
      meta: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        total: sources.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting source attribution', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to get source attribution'
    });
  }
});

// GET /api/attribution/timeline - Get conversion timeline
router.get('/timeline', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const intervalDays = parseInt(req.query.intervalDays as string) || 7;

    const timeline = await reportGeneratorService.generateTimelineReport(startDate, endDate, intervalDays);

    res.json({
      success: true,
      data: timeline,
      meta: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        intervalDays
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting timeline report', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to get timeline report'
    });
  }
});

// GET /api/attribution/roi - Get ROI metrics
router.get('/roi', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const segmentId = req.query.segmentId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const cost = parseFloat(req.query.cost as string) || 0;

    if (segmentId) {
      const roi = await roiService.calculateSegmentROI(segmentId, startDate, endDate, cost);
      res.json({
        success: true,
        data: roi
      });
    } else {
      // Get overall ROI efficiency
      const efficiency = await roiService.getAttributionEfficiency(startDate, endDate);
      res.json({
        success: true,
        data: efficiency
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting ROI metrics', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to get ROI metrics'
    });
  }
});

// GET /api/attribution/efficiency - Get attribution efficiency metrics
router.get('/efficiency', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const efficiency = await attributionCalculationService.getAttributionEfficiency(startDate, endDate);

    res.json({
      success: true,
      data: efficiency
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting efficiency metrics', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to get efficiency metrics'
    });
  }
});

// GET /api/attribution/compare-models - Compare attribution across models
router.get('/compare-models', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const comparison = await attributionCalculationService.compareModels(startDate, endDate);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error comparing attribution models', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to compare attribution models'
    });
  }
});

// GET /api/attribution/position - Get attribution by touchpoint position
router.get('/position', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const model = (req.query.model as AttributionModel) || AttributionModel.TIME_DECAY;

    const positionData = await attributionCalculationService.getAttributionByPosition(startDate, endDate, model);

    res.json({
      success: true,
      data: positionData
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting position attribution', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to get position attribution'
    });
  }
});

// GET /api/attribution/stats - Get conversion statistics
router.get('/stats', combinedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const stats = await conversionCaptureService.getConversionStats(startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting conversion stats', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Failed to get conversion statistics'
    });
  }
});

export default router;