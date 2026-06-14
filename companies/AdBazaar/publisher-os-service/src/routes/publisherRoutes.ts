import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Publisher } from '../models/index.js';
import { publisherService } from '../services/index.js';
import { internalServiceAuth, adminAuth } from '../middleware/index.js';
import { logger, recordError } from '../utils/index.js';

const router = Router();

// Validation schemas
const createPublisherSchema = z.object({
  name: z.string().min(1).max(100),
  domains: z.array(z.string().url()).min(1),
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    title: z.string().optional()
  }),
  category: z.string().min(1),
  logo: z.string().url().optional(),
  description: z.string().max(500).optional(),
  settings: z.object({
    defaultFloorPrice: z.number().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    revenueShare: z.number().optional(),
    paymentTerms: z.enum(['NET15', 'NET30', 'NET45', 'NET60']).optional(),
    autoPay: z.boolean().optional(),
    headerBiddingEnabled: z.boolean().optional(),
    dealPriority: z.enum(['CPM', 'CPC', 'CPA', 'Hybrid']).optional(),
    allowedAdTypes: z.array(z.string()).optional(),
    blockedAdvertisers: z.array(z.string()).optional(),
    blockedCategories: z.array(z.string()).optional(),
    brandSafety: z.object({
      enabled: z.boolean().optional(),
      level: z.enum(['Strict', 'Moderate', 'Relaxed']).optional(),
      customFilters: z.array(z.string()).optional()
    }).optional(),
    pacing: z.object({
      enabled: z.boolean().optional(),
      dailyLimit: z.number().optional(),
      monthlyLimit: z.number().optional()
    }).optional()
  }).optional()
});

const updatePublisherSchema = createPublisherSchema.partial();

// All routes require internal service auth
router.use(internalServiceAuth);

/**
 * POST /api/publishers
 * Create a new publisher
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createPublisherSchema.parse(req.body);
    const publisher = await publisherService.create(data);

    logger.info('Publisher created via API', { publisherId: publisher._id });
    res.status(201).json({
      success: true,
      data: publisher
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

    logger.error('Failed to create publisher', { error });
    recordError('create_publisher', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create publisher'
    });
  }
});

/**
 * GET /api/publishers
 * List publishers with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      verified,
      category,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const filters = {
      status: status as string,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      category: category as string,
      search: search as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10)
    };

    const result = await publisherService.list(filters);

    res.json({
      success: true,
      data: result.publishers,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }
    });
  } catch (error) {
    logger.error('Failed to list publishers', { error });
    recordError('list_publishers', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to list publishers'
    });
  }
});

/**
 * GET /api/publishers/:id
 * Get publisher details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const publisher = await publisherService.getById(req.params.id);

    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    res.json({
      success: true,
      data: publisher
    });
  } catch (error) {
    logger.error('Failed to get publisher', { error, publisherId: req.params.id });
    recordError('get_publisher', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get publisher'
    });
  }
});

/**
 * PUT /api/publishers/:id
 * Update publisher
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = updatePublisherSchema.parse(req.body);
    const publisher = await publisherService.update(req.params.id, data);

    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    logger.info('Publisher updated via API', { publisherId: publisher._id });
    res.json({
      success: true,
      data: publisher
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

    logger.error('Failed to update publisher', { error, publisherId: req.params.id });
    recordError('update_publisher', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update publisher'
    });
  }
});

/**
 * POST /api/publishers/:id/verify
 * Verify publisher
 */
router.post('/:id/verify', adminAuth, async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Status must be "approved" or "rejected"'
      });
      return;
    }

    const publisher = await publisherService.verify(
      req.params.id,
      status,
      notes,
      req.headers['x-admin-name'] as string
    );

    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    logger.info(`Publisher ${status}`, { publisherId: publisher._id });
    res.json({
      success: true,
      data: publisher
    });
  } catch (error) {
    logger.error('Failed to verify publisher', { error, publisherId: req.params.id });
    recordError('verify_publisher', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to verify publisher'
    });
  }
});

/**
 * POST /api/publishers/:id/suspend
 * Suspend publisher
 */
router.post('/:id/suspend', adminAuth, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Reason is required'
      });
      return;
    }

    const publisher = await publisherService.suspend(req.params.id, reason);

    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    logger.info('Publisher suspended', { publisherId: publisher._id, reason });
    res.json({
      success: true,
      data: publisher
    });
  } catch (error) {
    logger.error('Failed to suspend publisher', { error, publisherId: req.params.id });
    recordError('suspend_publisher', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to suspend publisher'
    });
  }
});

/**
 * POST /api/publishers/:id/reactivate
 * Reactivate publisher
 */
router.post('/:id/reactivate', adminAuth, async (req: Request, res: Response) => {
  try {
    const publisher = await publisherService.reactivate(req.params.id);

    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    logger.info('Publisher reactivated', { publisherId: publisher._id });
    res.json({
      success: true,
      data: publisher
    });
  } catch (error) {
    logger.error('Failed to reactivate publisher', { error, publisherId: req.params.id });
    recordError('reactivate_publisher', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to reactivate publisher'
    });
  }
});

/**
 * POST /api/publishers/:id/regenerate-key
 * Regenerate API key
 */
router.post('/:id/regenerate-key', adminAuth, async (req: Request, res: Response) => {
  try {
    const newApiKey = await publisherService.regenerateApiKey(req.params.id);

    if (!newApiKey) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    logger.info('Publisher API key regenerated', { publisherId: req.params.id });
    res.json({
      success: true,
      data: { apiKey: newApiKey }
    });
  } catch (error) {
    logger.error('Failed to regenerate API key', { error, publisherId: req.params.id });
    recordError('regenerate_key', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to regenerate API key'
    });
  }
});

/**
 * GET /api/publishers/categories
 * Get publisher categories
 */
router.get('/meta/categories', async (req: Request, res: Response) => {
  try {
    const categories = await publisherService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Failed to get categories', { error });
    recordError('get_categories', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get categories'
    });
  }
});

export default router;