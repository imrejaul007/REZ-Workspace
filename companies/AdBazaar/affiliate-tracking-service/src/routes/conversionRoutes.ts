import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { conversionService } from '../services/conversionService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createConversionSchema = z.object({
  affiliateId: z.string().min(1),
  campaignId: z.string().min(1),
  clickId: z.string().min(1),
  type: z.enum(['cpa', 'rev_share', 'hybrid']),
  revenue: z.number().min(0),
  customerData: z.object({
    customerId: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  conversionData: z.object({
    productId: z.string().optional(),
    orderValue: z.number().min(0).optional(),
    quantity: z.number().min(1).optional(),
  }).optional(),
  attribution: z.object({
    source: z.string(),
    medium: z.string(),
    campaign: z.string().optional(),
    landingUrl: z.string().optional(),
  }).optional(),
  timestamps: z.object({
    click: z.date().optional(),
    conversion: z.date().optional(),
  }).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'paid']),
  notes: z.string().optional(),
});

/**
 * POST /api/conversions
 * Create a new conversion
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createConversionSchema.parse(req.body);
    const conversion = await conversionService.createConversion(input);

    res.status(201).json({
      success: true,
      data: conversion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create conversion',
    });
  }
});

/**
 * GET /api/conversions
 * Get all conversions
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', status, affiliateId, campaignId } = req.query;

    let result;
    if (affiliateId) {
      result = await conversionService.getConversionsByAffiliate(affiliateId as string, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as any,
      });
    } else if (campaignId) {
      result = await conversionService.getConversionsByCampaign(campaignId as string, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as any,
      });
    } else {
      // Get overall stats
      const stats = await conversionService.getConversionStats();
      res.json({
        success: true,
        data: stats,
      });
      return;
    }

    res.json({
      success: true,
      data: result.conversions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversions',
    });
  }
});

/**
 * GET /api/conversions/:id
 * Get conversion by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const conversion = await conversionService.getConversion(req.params.id);

    if (!conversion) {
      res.status(404).json({
        success: false,
        error: 'Conversion not found',
      });
      return;
    }

    res.json({
      success: true,
      data: conversion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversion',
    });
  }
});

/**
 * PATCH /api/conversions/:id/status
 * Update conversion status
 */
router.patch('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, notes } = updateStatusSchema.parse(req.body);
    const conversion = await conversionService.updateConversionStatus(req.params.id, status, notes);

    if (!conversion) {
      res.status(404).json({
        success: false,
        error: 'Conversion not found',
      });
      return;
    }

    res.json({
      success: true,
      data: conversion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update conversion status',
    });
  }
});

/**
 * POST /api/conversions/bulk-approve
 * Bulk approve conversions
 */
router.post('/bulk-approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { conversionIds } = req.body;
    const count = await conversionService.bulkApproveConversions(conversionIds);

    res.json({
      success: true,
      data: { approved: count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to bulk approve conversions',
    });
  }
});

/**
 * GET /api/conversions/stats
 * Get conversion statistics
 */
router.get('/stats/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.query;
    const stats = await conversionService.getConversionStats(affiliateId as string);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

export default router;