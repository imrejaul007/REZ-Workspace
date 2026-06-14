import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { serviceAuth, validateRequest } from '../middleware';
import { ConversionLiftSchema } from '../utils/validation';
import { conversionLiftService } from '../services';
import { logger } from '../utils/logger';

const router = Router();

// Record conversion lift data
router.post(
  '/:studyId/conversion-lift',
  serviceAuth,
  validateRequest(ConversionLiftSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const conversion = await conversionLiftService.recordConversion(req.body, req.params.studyId);

    logger.info('Conversion lift data recorded via API', {
      studyId: req.params.studyId,
      treatmentGroup: req.body.treatmentGroup
    });

    res.status(201).json({
      success: true,
      data: conversion
    });
  })
);

// Get conversion lift results
router.get(
  '/:studyId/conversion-lift',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await conversionLiftService.getConversionLiftResults(req.params.studyId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Conversion lift results not available. Insufficient data or study not found.'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  })
);

// Batch record conversions (for high-volume data ingestion)
router.post(
  '/:studyId/conversion-lift/batch',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const conversions = req.body.conversions as any[];

    if (!Array.isArray(conversions) || conversions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'conversions array is required'
      });
      return;
    }

    const results = [];
    for (const conv of conversions) {
      try {
        const result = await conversionLiftService.recordConversion(conv, req.params.studyId);
        results.push({ success: true, data: result });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    logger.info('Batch conversion lift data recorded', {
      studyId: req.params.studyId,
      total: conversions.length,
      successful: results.filter((r: any) => r.success).length
    });

    res.status(201).json({
      success: true,
      data: results,
      summary: {
        total: conversions.length,
        successful: results.filter((r: any) => r.success).length,
        failed: results.filter((r: any) => !r.success).length
      }
    });
  })
);

export default router;