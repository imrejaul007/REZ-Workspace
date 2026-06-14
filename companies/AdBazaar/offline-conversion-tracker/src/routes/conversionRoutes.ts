import { Router, Request, Response, NextFunction } from 'express';
import { conversionService } from '../services';
import {
  CreateConversionSchema,
  BatchConversionSchema,
  ConversionIdSchema,
  CampaignIdSchema,
  logger
} from '../utils';
import { ZodError } from 'zod';

const router = Router();

/**
 * POST /api/conversions - Record a new conversion
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedInput = CreateConversionSchema.parse(req.body);
    const conversion = await conversionService.createConversion(validatedInput);

    res.status(201).json({
      success: true,
      data: conversion
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/conversions/:id - Get conversion by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ConversionIdSchema.parse(req.params);
    const conversion = await conversionService.getConversion(id);

    if (!conversion) {
      res.status(404).json({
        success: false,
        error: 'Conversion not found'
      });
      return;
    }

    res.json({
      success: true,
      data: conversion
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/conversions/batch - Batch upload conversions
 */
router.post('/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedInput = BatchConversionSchema.parse(req.body);
    const result = await conversionService.createBatch(validatedInput);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/conversions/campaign/:campaignId - Get campaign conversions
 */
router.get('/campaign/:campaignId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = CampaignIdSchema.parse(req.params);

    const options = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      type: req.query.type as string,
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const result = await conversionService.getCampaignConversions(campaignId, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/conversions/attribution - Attribution report
 */
router.get('/attribution', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attributionService } = await import('../services');

    const input = {
      campaignId: req.query.campaignId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      attributionModel: (req.query.model as any) || 'last_click',
      attributionWindow: req.query.window ? parseInt(req.query.window as string) : 30
    };

    const report = await attributionService.getAttributionReport(input);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conversions/import - Import from file
 */
router.post('/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { importService } = await import('../services');

    const { fileName, fileType, fileSize, campaignId, importType, source } = req.body;

    // Create import record
    const importRecord = await importService.createImport({
      fileName,
      fileType,
      fileSize,
      campaignId,
      importType: importType || 'manual',
      source
    });

    res.status(201).json({
      success: true,
      data: {
        fileId: importRecord.fileId,
        status: importRecord.status
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversions/analytics - Conversion analytics
 */
router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { analyticsService } = await import('../services');

    const input = {
      campaignId: req.query.campaignId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      groupBy: (req.query.groupBy as any) || 'day',
      type: req.query.type as any,
      includeDemographics: req.query.includeDemographics === 'true'
    };

    const analytics = await analyticsService.getAnalytics(input);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversions/dashboard - Dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { analyticsService } = await import('../services');

    const campaignId = req.query.campaignId as string;
    const dashboard = await analyticsService.getDashboard(campaignId);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conversions/match - Match to online
 */
router.post('/match', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { matchService } = await import('../services');

    const { offlineId, matchType, matchData, attributionWindow } = req.body;

    const match = await matchService.matchConversion({
      offlineId,
      matchType,
      matchData,
      attributionWindow: attributionWindow || 30
    });

    res.status(201).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/conversions/:id - Delete conversion
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ConversionIdSchema.parse(req.params);
    const deleted = await conversionService.deleteConversion(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Conversion not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Conversion deleted'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    next(error);
  }
});

/**
 * PATCH /api/conversions/:id/status - Update conversion status
 */
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ConversionIdSchema.parse(req.params);
    const { status } = req.body;

    if (!['pending', 'matched', 'confirmed', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
      return;
    }

    const conversion = await conversionService.updateStatus(id, status);

    if (!conversion) {
      res.status(404).json({
        success: false,
        error: 'Conversion not found'
      });
      return;
    }

    res.json({
      success: true,
      data: conversion
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversions/statistics - Get statistics
 */
router.get('/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaignId = req.query.campaignId as string;
    const stats = await conversionService.getStatistics(campaignId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;