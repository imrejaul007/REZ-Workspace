import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Placement, Inventory } from '../models/index.js';
import { publisherService } from '../services/index.js';
import { internalServiceAuth } from '../middleware/index.js';
import { logger, recordError, placementCount } from '../utils/index.js';

const router = Router();

// Validation schemas
const createPlacementSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  sizes: z.array(z.object({
    width: z.number().positive(),
    height: z.number().positive()
  })).min(1),
  adTypes: z.array(z.enum(['banner', 'video', 'native', 'richmedia', 'CTV'])).min(1),
  positions: z.array(z.enum(['header', 'sidebar', 'in-article', 'footer', 'overlay', 'pre-roll', 'mid-roll', 'post-roll'])).min(1),
  environments: z.array(z.enum(['web', 'mobile-web', 'app', 'CTV'])).min(1),
  floorPrice: z.number().positive().optional(),
  currency: z.string().optional(),
  settings: z.object({
    viewabilityTarget: z.number().min(0).max(100).optional(),
    brandSafetyLevel: z.enum(['Strict', 'Moderate', 'Relaxed']).optional(),
    frequencyCapping: z.number().min(0).optional(),
    pacing: z.enum(['none', 'even', 'front', 'back']).optional(),
    dynamicAllocation: z.boolean().optional(),
    deals: z.object({
      preferred: z.boolean().optional(),
      private: z.boolean().optional(),
      programmatic: z.boolean().optional()
    }).optional()
  }).optional(),
  targeting: z.object({
    geo: z.object({
      countries: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      cities: z.array(z.string()).optional()
    }).optional(),
    device: z.object({
      types: z.array(z.enum(['desktop', 'mobile', 'tablet', 'CTV'])).optional(),
      os: z.array(z.string()).optional()
    }).optional(),
    dayparting: z.object({
      days: z.array(z.string()).optional(),
      hours: z.array(z.number().min(0).max(23)).optional()
    }).optional(),
    audience: z.object({
      segments: z.array(z.string()).optional()
    }).optional(),
    content: z.object({
      categories: z.array(z.string()).optional()
    }).optional()
  }).optional()
});

const updatePlacementSchema = createPlacementSchema.partial();

// Routes with internal service auth
router.use(internalServiceAuth);

/**
 * POST /api/publishers/:publisherId/placements
 * Create placement for a publisher
 */
router.post('/publishers/:publisherId/placements', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const data = createPlacementSchema.parse(req.body);

    // Verify publisher exists
    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    // Use first size as primary
    const primarySize = data.sizes[0];

    const placement = new Placement({
      publisherId,
      ...data,
      primarySize,
      floorPrice: data.floorPrice || publisher.settings.defaultFloorPrice,
      currency: data.currency || publisher.settings.currency,
      settings: {
        viewabilityTarget: 70,
        brandSafetyLevel: 'Moderate',
        frequencyCapping: 0,
        pacing: 'none',
        dynamicAllocation: true,
        deals: {
          preferred: true,
          private: true,
          programmatic: true
        },
        ...data.settings
      },
      stats: {
        totalImpressions: 0,
        totalRevenue: 0,
        avgEcpm: 0,
        fillRate: 0,
        viewability: 0
      }
    });

    await placement.save();

    // Update metrics
    placementCount.inc({
      publisher_id: publisherId,
      status: 'active'
    }, 1);

    logger.info('Placement created', { publisherId, placementId: placement._id });
    res.status(201).json({
      success: true,
      data: placement
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
      return;
    }

    logger.error('Failed to create placement', { error });
    recordError('create_placement', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create placement'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/placements
 * List placements for a publisher
 */
router.get('/publishers/:publisherId/placements', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { status, adType, page = '1', limit = '50' } = req.query;

    const query: Record<string, unknown> = { publisherId };

    if (status) {
      query.status = status;
    }

    if (adType) {
      query.adTypes = adType;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const [placements, total] = await Promise.all([
      Placement.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Placement.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: placements,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Failed to list placements', { error });
    recordError('list_placements', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to list placements'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/placements/:placementId
 * Get specific placement
 */
router.get('/publishers/:publisherId/placements/:placementId', async (req: Request, res: Response) => {
  try {
    const placement = await Placement.findById(req.params.placementId);

    if (!placement) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Placement not found'
      });
      return;
    }

    res.json({
      success: true,
      data: placement
    });
  } catch (error) {
    logger.error('Failed to get placement', { error });
    recordError('get_placement', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get placement'
    });
  }
});

/**
 * PUT /api/publishers/:publisherId/placements/:placementId
 * Update placement
 */
router.put('/publishers/:publisherId/placements/:placementId', async (req: Request, res: Response) => {
  try {
    const data = updatePlacementSchema.parse(req.body);

    // If sizes are being updated, recalculate primary size
    if (data.sizes && data.sizes.length > 0) {
      (data as Record<string, unknown>).primarySize = data.sizes[0];
    }

    const placement = await Placement.findByIdAndUpdate(
      req.params.placementId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!placement) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Placement not found'
      });
      return;
    }

    logger.info('Placement updated', { placementId: placement._id });
    res.json({
      success: true,
      data: placement
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
      return;
    }

    logger.error('Failed to update placement', { error });
    recordError('update_placement', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update placement'
    });
  }
});

/**
 * POST /api/publishers/:publisherId/placements/:placementId/pause
 * Pause placement
 */
router.post('/publishers/:publisherId/placements/:placementId/pause', async (req: Request, res: Response) => {
  try {
    const placement = await Placement.findByIdAndUpdate(
      req.params.placementId,
      { $set: { status: 'paused' } },
      { new: true }
    );

    if (!placement) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Placement not found'
      });
      return;
    }

    logger.info('Placement paused', { placementId: placement._id });
    res.json({
      success: true,
      data: placement
    });
  } catch (error) {
    logger.error('Failed to pause placement', { error });
    recordError('pause_placement', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to pause placement'
    });
  }
});

/**
 * POST /api/publishers/:publisherId/placements/:placementId/resume
 * Resume placement
 */
router.post('/publishers/:publisherId/placements/:placementId/resume', async (req: Request, res: Response) => {
  try {
    const placement = await Placement.findByIdAndUpdate(
      req.params.placementId,
      { $set: { status: 'active' } },
      { new: true }
    );

    if (!placement) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Placement not found'
      });
      return;
    }

    logger.info('Placement resumed', { placementId: placement._id });
    res.json({
      success: true,
      data: placement
    });
  } catch (error) {
    logger.error('Failed to resume placement', { error });
    recordError('resume_placement', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to resume placement'
    });
  }
});

/**
 * DELETE /api/publishers/:publisherId/placements/:placementId
 * Archive placement
 */
router.delete('/publishers/:publisherId/placements/:placementId', async (req: Request, res: Response) => {
  try {
    const placement = await Placement.findByIdAndUpdate(
      req.params.placementId,
      { $set: { status: 'archived' } },
      { new: true }
    );

    if (!placement) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Placement not found'
      });
      return;
    }

    logger.info('Placement archived', { placementId: placement._id });
    res.json({
      success: true,
      message: 'Placement archived successfully'
    });
  } catch (error) {
    logger.error('Failed to archive placement', { error });
    recordError('archive_placement', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to archive placement'
    });
  }
});

/**
 * POST /api/publishers/:publisherId/placements/:placementId/inventory
 * Add inventory to placement
 */
router.post('/publishers/:publisherId/placements/:placementId/inventory', async (req: Request, res: Response) => {
  try {
    const { inventoryId } = req.body;

    if (!inventoryId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'inventoryId is required'
      });
      return;
    }

    // Verify inventory exists
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Inventory not found'
      });
      return;
    }

    // Update inventory with placement ID
    inventory.placementId = req.params.placementId as any;
    await inventory.save();

    // Add inventory to placement's child list
    await Placement.findByIdAndUpdate(
      req.params.placementId,
      { $addToSet: { childInventories: inventoryId } }
    );

    logger.info('Inventory added to placement', {
      placementId: req.params.placementId,
      inventoryId
    });

    res.json({
      success: true,
      message: 'Inventory added to placement'
    });
  } catch (error) {
    logger.error('Failed to add inventory to placement', { error });
    recordError('add_inventory_to_placement', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to add inventory to placement'
    });
  }
});

export default router;