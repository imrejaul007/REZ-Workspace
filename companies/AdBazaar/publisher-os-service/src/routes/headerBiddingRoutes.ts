import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { publisherService } from '../services/index.js';
import { internalServiceAuth } from '../middleware/index.js';
import { logger, recordError } from '../utils/index.js';

const router = Router();

// Validation schemas
const updateHeaderBiddingConfigSchema = z.object({
  enabled: z.boolean().optional(),
  bidders: z.array(z.object({
    id: z.string(),
    name: z.string(),
    endpoint: z.string().url(),
    timeout: z.number().min(100).max(2000).optional(),
    floorPriceEnabled: z.boolean().optional(),
    bidMultiplier: z.number().min(0.1).max(10).optional()
  })).optional(),
  timeout: z.number().min(100).max(2000).optional(),
  floorPriceAlgorithm: z.enum(['static', 'dynamic', 'auction']).optional(),
  settings: z.object({
    yieldOptimization: z.boolean().optional(),
    priceGranularity: z.enum(['exact', 'buckets', 'rank']).optional(),
    minBidIncrement: z.number().min(0.01).optional(),
    retryEnabled: z.boolean().optional(),
    retryCount: z.number().min(0).max(3).optional(),
    debugMode: z.boolean().optional()
  }).optional()
});

// Routes with internal service auth
router.use(internalServiceAuth);

/**
 * GET /api/publishers/:publisherId/header-bidding
 * Get header bidding configuration
 */
router.get('/publishers/:publisherId/header-bidding', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;

    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    const config = {
      enabled: publisher.sspConfig?.enabled || false,
      timeout: publisher.sspConfig?.timeout || 200,
      floorPriceAlgorithm: publisher.sspConfig?.floorPriceAlgorithm || 'dynamic',
      bidders: publisher.sspConfig?.bidders || [],
      settings: {
        headerBiddingEnabled: publisher.settings.headerBiddingEnabled,
        revenueShare: publisher.settings.revenueShare,
        dealPriority: publisher.settings.dealPriority
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to get header bidding config', { error });
    recordError('get_header_bidding', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get header bidding configuration'
    });
  }
});

/**
 * PUT /api/publishers/:publisherId/header-bidding
 * Update header bidding configuration
 */
router.put('/publishers/:publisherId/header-bidding', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const data = updateHeaderBiddingConfigSchema.parse(req.body);

    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    // Update SSP config
    const sspConfig = {
      enabled: data.enabled ?? publisher.sspConfig?.enabled ?? true,
      bidders: data.bidders ?? publisher.sspConfig?.bidders ?? [],
      timeout: data.timeout ?? publisher.sspConfig?.timeout ?? 200,
      floorPriceAlgorithm: data.floorPriceAlgorithm ?? publisher.sspConfig?.floorPriceAlgorithm ?? 'dynamic'
    };

    // Update header bidding settings
    const settings = {
      ...publisher.settings,
      headerBiddingEnabled: data.settings?.yieldOptimization ?? publisher.settings.headerBiddingEnabled
    };

    const updatedPublisher = await publisherService.update(publisherId, {
      sspConfig,
      settings
    } as any);

    logger.info('Header bidding config updated', { publisherId });
    res.json({
      success: true,
      data: {
        sspConfig,
        settings
      }
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

    logger.error('Failed to update header bidding config', { error });
    recordError('update_header_bidding', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update header bidding configuration'
    });
  }
});

/**
 * POST /api/publishers/:publisherId/header-bidding/enable
 * Enable header bidding
 */
router.post('/publishers/:publisherId/header-bidding/enable', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;

    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    await publisherService.update(publisherId, {
      settings: {
        ...publisher.settings,
        headerBiddingEnabled: true
      }
    } as any);

    logger.info('Header bidding enabled', { publisherId });
    res.json({
      success: true,
      message: 'Header bidding enabled successfully'
    });
  } catch (error) {
    logger.error('Failed to enable header bidding', { error });
    recordError('enable_header_bidding', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to enable header bidding'
    });
  }
});

/**
 * POST /api/publishers/:publisherId/header-bidding/disable
 * Disable header bidding
 */
router.post('/publishers/:publisherId/header-bidding/disable', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;

    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    await publisherService.update(publisherId, {
      settings: {
        ...publisher.settings,
        headerBiddingEnabled: false
      }
    } as any);

    logger.info('Header bidding disabled', { publisherId });
    res.json({
      success: true,
      message: 'Header bidding disabled successfully'
    });
  } catch (error) {
    logger.error('Failed to disable header bidding', { error });
    recordError('disable_header_bidding', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to disable header bidding'
    });
  }
});

/**
 * POST /api/publishers/:publisherId/header-bidding/bidders
 * Add bidder to header bidding
 */
router.post('/publishers/:publisherId/header-bidding/bidders', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const bidder = z.object({
      id: z.string(),
      name: z.string(),
      endpoint: z.string().url(),
      timeout: z.number().min(100).max(2000).optional(),
      floorPriceEnabled: z.boolean().optional(),
      bidMultiplier: z.number().min(0.1).max(10).optional()
    }).parse(req.body);

    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    const currentBidders = publisher.sspConfig?.bidders || [];
    const newBidders = [...currentBidders, bidder];

    await publisherService.update(publisherId, {
      sspConfig: {
        ...publisher.sspConfig,
        bidders: newBidders
      }
    } as any);

    logger.info('Bidder added to header bidding', { publisherId, bidderId: bidder.id });
    res.status(201).json({
      success: true,
      data: { bidders: newBidders }
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

    logger.error('Failed to add bidder', { error });
    recordError('add_bidder', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to add bidder'
    });
  }
});

/**
 * DELETE /api/publishers/:publisherId/header-bidding/bidders/:bidderId
 * Remove bidder from header bidding
 */
router.delete('/publishers/:publisherId/header-bidding/bidders/:bidderId', async (req: Request, res: Response) => {
  try {
    const { publisherId, bidderId } = req.params;

    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    const currentBidders = publisher.sspConfig?.bidders || [];
    const newBidders = currentBidders.filter(b => b.id !== bidderId);

    await publisherService.update(publisherId, {
      sspConfig: {
        ...publisher.sspConfig,
        bidders: newBidders
      }
    } as any);

    logger.info('Bidder removed from header bidding', { publisherId, bidderId });
    res.json({
      success: true,
      message: 'Bidder removed successfully',
      data: { bidders: newBidders }
    });
  } catch (error) {
    logger.error('Failed to remove bidder', { error });
    recordError('remove_bidder', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to remove bidder'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/header-bidding/tag
 * Get header bidding tag for publisher
 */
router.get('/publishers/:publisherId/header-bidding/tag', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;

    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    // Generate prebid.js configuration
    const tag = {
      version: '1.0.0',
      publishers: [{
        code: publisher.slug,
        bidders: publisher.sspConfig?.bidders || [],
        timeout: publisher.sspConfig?.timeout || 200,
        floorPriceAlgorithm: publisher.sspConfig?.floorPriceAlgorithm || 'dynamic',
        enabled: publisher.settings.headerBiddingEnabled
      }]
    };

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    logger.error('Failed to generate header bidding tag', { error });
    recordError('generate_header_tag', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to generate header bidding tag'
    });
  }
});

export default router;