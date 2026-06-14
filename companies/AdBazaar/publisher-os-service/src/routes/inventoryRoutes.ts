import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Inventory, Placement } from '../models/index.js';
import { inventoryService, publisherService } from '../services/index.js';
import { internalServiceAuth, publisherApiKeyAuth } from '../middleware/index.js';
import { logger, recordError, inventoryCount } from '../utils/index.js';

const router = Router();

// Validation schemas
const createInventorySchema = z.object({
  placementId: z.string().optional(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  type: z.enum(['banner', 'video', 'native', 'interstitial', 'rewarded', 'CTV']),
  adTypes: z.array(z.string()).min(1),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    size: z.string()
  }),
  position: z.enum(['header', 'sidebar', 'in-article', 'footer', 'overlay', 'pre-roll', 'mid-roll', 'post-roll']),
  environment: z.enum(['web', 'mobile-web', 'app', 'CTV']).optional(),
  targeting: z.object({
    geo: z.object({
      countries: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      cities: z.array(z.string()).optional(),
      postalCodes: z.array(z.string()).optional()
    }).optional(),
    device: z.object({
      types: z.array(z.enum(['desktop', 'mobile', 'tablet', 'CTV'])).optional(),
      os: z.array(z.string()).optional(),
      browsers: z.array(z.string()).optional()
    }).optional(),
    dayparting: z.object({
      days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])).optional(),
      hours: z.array(z.number().min(0).max(23)).optional()
    }).optional(),
    audience: z.object({
      segments: z.array(z.string()).optional(),
      excludes: z.array(z.string()).optional()
    }).optional(),
    content: z.object({
      categories: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
      excludes: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  floorPrice: z.number().positive().optional(),
  reservePrice: z.number().positive().optional(),
  maxBid: z.number().positive().optional(),
  currency: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

const updateInventorySchema = createInventorySchema.partial().omit({ publisherId: true });

// Routes with internal service auth
router.use(internalServiceAuth);

/**
 * POST /api/publishers/:publisherId/inventory
 * Add inventory for a publisher
 */
router.post('/publishers/:publisherId/inventory', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const data = createInventorySchema.parse(req.body);

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

    const inventory = await inventoryService.create({
      publisherId,
      ...data
    });

    // Update metrics
    inventoryCount.inc({
      publisher_id: publisherId,
      type: inventory.type,
      enabled: 'true'
    }, 1);

    logger.info('Inventory created', { publisherId, inventoryId: inventory._id });
    res.status(201).json({
      success: true,
      data: inventory
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

    logger.error('Failed to create inventory', { error });
    recordError('create_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create inventory'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/inventory
 * Get inventory for a publisher
 */
router.get('/publishers/:publisherId/inventory', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { type, enabled, tags, page = '1', limit = '50' } = req.query;

    const result = await inventoryService.listByPublisher({
      publisherId,
      type: type as string,
      enabled: enabled === 'true' ? true : enabled === 'false' ? false : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10)
    });

    res.json({
      success: true,
      data: result.inventories,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }
    });
  } catch (error) {
    logger.error('Failed to list inventory', { error });
    recordError('list_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to list inventory'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/inventory/:inventoryId
 * Get specific inventory
 */
router.get('/publishers/:publisherId/inventory/:inventoryId', async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.getById(req.params.inventoryId);

    if (!inventory) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Inventory not found'
      });
      return;
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    logger.error('Failed to get inventory', { error });
    recordError('get_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get inventory'
    });
  }
});

/**
 * PUT /api/publishers/:publisherId/inventory/:inventoryId
 * Update inventory
 */
router.put('/publishers/:publisherId/inventory/:inventoryId', async (req: Request, res: Response) => {
  try {
    const data = updateInventorySchema.parse(req.body);
    const inventory = await inventoryService.update(req.params.inventoryId, data);

    if (!inventory) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Inventory not found'
      });
      return;
    }

    logger.info('Inventory updated', { inventoryId: inventory._id });
    res.json({
      success: true,
      data: inventory
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

    logger.error('Failed to update inventory', { error });
    recordError('update_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update inventory'
    });
  }
});

/**
 * DELETE /api/publishers/:publisherId/inventory/:inventoryId
 * Delete inventory
 */
router.delete('/publishers/:publisherId/inventory/:inventoryId', async (req: Request, res: Response) => {
  try {
    const deleted = await inventoryService.delete(req.params.inventoryId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Inventory not found'
      });
      return;
    }

    logger.info('Inventory deleted', { inventoryId: req.params.inventoryId });
    res.json({
      success: true,
      message: 'Inventory deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete inventory', { error });
    recordError('delete_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete inventory'
    });
  }
});

/**
 * POST /api/publishers/:publisherId/inventory/:inventoryId/pause
 * Pause inventory
 */
router.post('/publishers/:publisherId/inventory/:inventoryId/pause', async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.setEnabled(req.params.inventoryId, false);

    if (!inventory) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Inventory not found'
      });
      return;
    }

    logger.info('Inventory paused', { inventoryId: inventory._id });
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    logger.error('Failed to pause inventory', { error });
    recordError('pause_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to pause inventory'
    });
  }
});

/**
 * POST /api/publishers/:publisherId/inventory/:inventoryId/resume
 * Resume inventory
 */
router.post('/publishers/:publisherId/inventory/:inventoryId/resume', async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.setEnabled(req.params.inventoryId, true);

    if (!inventory) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Inventory not found'
      });
      return;
    }

    logger.info('Inventory resumed', { inventoryId: inventory._id });
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    logger.error('Failed to resume inventory', { error });
    recordError('resume_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to resume inventory'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/inventory/stats
 * Get inventory stats summary
 */
router.get('/publishers/:publisherId/inventory/stats', async (req: Request, res: Response) => {
  try {
    const stats = await inventoryService.getStatsSummary(req.params.publisherId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get inventory stats', { error });
    recordError('get_inventory_stats', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get inventory stats'
    });
  }
});

export default router;