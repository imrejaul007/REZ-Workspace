import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { floorPriceService, publisherService } from '../services/index.js';
import { internalServiceAuth } from '../middleware/index.js';
import { logger, recordError, floorPriceGauge } from '../utils/index.js';

const router = Router();

// Validation schemas
const setFloorPriceSchema = z.object({
  inventoryId: z.string().optional(),
  type: z.enum(['banner', 'video', 'native', 'interstitial', 'rewarded', 'CTV']).optional(),
  position: z.string().optional(),
  environment: z.enum(['web', 'mobile-web', 'app', 'CTV']).optional(),
  country: z.string().optional(),
  device: z.enum(['desktop', 'mobile', 'tablet', 'CTV']).optional(),
  price: z.number().positive(),
  currency: z.string().optional(),
  algorithm: z.enum(['static', 'dynamic', 'auction']).optional(),
  priority: z.number().int().min(1).max(100).optional(),
  dayparting: z.object({
    days: z.array(z.string()).optional(),
    hours: z.array(z.number().min(0).max(23)).optional()
  }).optional()
});

const updateFloorPriceSchema = setFloorPriceSchema.partial();

// Routes with internal service auth
router.use(internalServiceAuth);

/**
 * POST /api/publishers/:publisherId/floor-prices
 * Set floor price rule
 */
router.post('/publishers/:publisherId/floor-prices', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const data = setFloorPriceSchema.parse(req.body);

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

    const rule = await floorPriceService.setRule({
      publisherId,
      name: `Floor price rule for ${data.type || 'all types'}`,
      priority: data.priority || 50,
      conditions: {
        inventoryTypes: data.type ? [data.type] : undefined,
        positions: data.position ? [data.position] : undefined,
        environments: data.environment ? [data.environment] : undefined,
        countries: data.country ? [data.country] : undefined,
        devices: data.device ? [data.device] : undefined,
        dayparting: data.dayparting
      },
      price: data.price,
      currency: data.currency || publisher.settings.currency,
      algorithm: data.algorithm || 'static',
      enabled: true
    });

    logger.info('Floor price rule created', { publisherId, ruleId: rule.id });
    res.status(201).json({
      success: true,
      data: rule
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

    logger.error('Failed to set floor price', { error });
    recordError('set_floor_price', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to set floor price'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/floor-prices
 * Get all floor price rules
 */
router.get('/publishers/:publisherId/floor-prices', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;

    const rules = await floorPriceService.getRules(publisherId);

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('Failed to get floor prices', { error });
    recordError('get_floor_prices', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get floor prices'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/floor-prices/:ruleId
 * Get specific floor price rule
 */
router.get('/publishers/:publisherId/floor-prices/:ruleId', async (req: Request, res: Response) => {
  try {
    const { publisherId, ruleId } = req.params;

    const rules = await floorPriceService.getRules(publisherId);
    const rule = rules.find(r => r.id === ruleId);

    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor price rule not found'
      });
      return;
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('Failed to get floor price', { error });
    recordError('get_floor_price', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get floor price'
    });
  }
});

/**
 * PUT /api/publishers/:publisherId/floor-prices/:ruleId
 * Update floor price rule
 */
router.put('/publishers/:publisherId/floor-prices/:ruleId', async (req: Request, res: Response) => {
  try {
    const { publisherId, ruleId } = req.params;
    const data = updateFloorPriceSchema.parse(req.body);

    const rule = await floorPriceService.updateRule(publisherId, ruleId, {
      price: data.price,
      currency: data.currency,
      algorithm: data.algorithm,
      priority: data.priority,
      conditions: {
        inventoryTypes: data.type ? [data.type] : undefined,
        positions: data.position ? [data.position] : undefined,
        environments: data.environment ? [data.environment] : undefined,
        countries: data.country ? [data.country] : undefined,
        devices: data.device ? [data.device] : undefined,
        dayparting: data.dayparting
      }
    } as any);

    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor price rule not found'
      });
      return;
    }

    logger.info('Floor price rule updated', { publisherId, ruleId });
    res.json({
      success: true,
      data: rule
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

    logger.error('Failed to update floor price', { error });
    recordError('update_floor_price', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update floor price'
    });
  }
});

/**
 * DELETE /api/publishers/:publisherId/floor-prices/:ruleId
 * Delete floor price rule
 */
router.delete('/publishers/:publisherId/floor-prices/:ruleId', async (req: Request, res: Response) => {
  try {
    const { publisherId, ruleId } = req.params;

    const deleted = await floorPriceService.deleteRule(publisherId, ruleId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor price rule not found'
      });
      return;
    }

    logger.info('Floor price rule deleted', { publisherId, ruleId });
    res.json({
      success: true,
      message: 'Floor price rule deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete floor price', { error });
    recordError('delete_floor_price', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete floor price'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/floor-prices/:inventoryId/price
 * Get floor price for specific inventory
 */
router.get('/publishers/:publisherId/floor-prices/:inventoryId/price', async (req: Request, res: Response) => {
  try {
    const { publisherId, inventoryId } = req.params;
    const { country, device, hour } = req.query;

    const result = await floorPriceService.getFloorPrice(publisherId, inventoryId, {
      country: country as string,
      device: device as string,
      hour: hour ? parseInt(hour as string, 10) : undefined
    });

    // Update metrics
    floorPriceGauge.set(
      { publisher_id: publisherId, inventory_id: inventoryId, type: 'dynamic' },
      result.floorPrice
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get floor price', { error });
    recordError('get_floor_price_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get floor price'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/floor-prices/optimize
 * Get floor price optimization recommendations
 */
router.get('/publishers/:publisherId/floor-prices/optimize', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;

    const recommendations = await floorPriceService.optimizeFloorPrices(publisherId);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Failed to get floor price optimization', { error });
    recordError('get_floor_price_optimization', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get floor price optimization'
    });
  }
});

export default router;