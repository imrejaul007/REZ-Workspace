import { Router, Request, Response } from 'express';
import {
  sdkConfigService,
  publisherService,
  placementService,
  adRequestService,
  trackingService,
} from '../services/index.js';
import {
  authMiddleware,
  validate,
  asyncHandler,
  adRequestRateLimiter,
} from '../middleware/index.js';
import {
  AdRequestSchema,
  ImpressionSchema,
  ClickSchema,
  AppIdSchema,
  PlacementIdSchema,
  PublisherIdSchema,
  EarningsQuerySchema,
} from '../middleware/validation.js';

const router = Router();

/**
 * GET /api/mobile/config/:appId
 * Get SDK configuration for an app
 */
router.get(
  '/config/:appId',
  asyncHandler(async (req: Request, res: Response) => {
    const { appId } = req.params;

    const config = await sdkConfigService.getConfig(appId);

    if (!config) {
      res.status(404).json({
        success: false,
        error: 'App not found or not active',
      });
      return;
    }

    res.json({
      success: true,
      data: config,
    });
  })
);

/**
 * POST /api/mobile/register
 * Register a new publisher
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, company } = req.body;

    try {
      const result = await publisherService.register({ name, email, password, company });

      res.status(201).json({
        success: true,
        data: {
          publisher: result.publisher,
          token: result.token,
        },
        message: 'Publisher registered successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  })
);

/**
 * POST /api/mobile/login
 * Login publisher
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const result = await publisherService.login(email, password);

      res.json({
        success: true,
        data: {
          publisher: result.publisher,
          token: result.token,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }
  })
);

/**
 * GET /api/mobile/placement/:placementId
 * Get placement configuration
 */
router.get(
  '/placement/:placementId',
  asyncHandler(async (req: Request, res: Response) => {
    const { placementId } = req.params;

    const placement = await placementService.getById(placementId);

    if (!placement) {
      res.status(404).json({
        success: false,
        error: 'Placement not found',
      });
      return;
    }

    res.json({
      success: true,
      data: placement,
    });
  })
);

/**
 * POST /api/mobile/ad-request
 * Request ad for placement
 */
router.post(
  '/ad-request',
  adRequestRateLimiter,
  validate(AdRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const adRequestData = req.body;

    try {
      const result = await adRequestService.createRequest(adRequestData);

      res.json({
        success: true,
        data: {
          request: result.request,
          ad: result.ad || null,
          noFill: !result.ad,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ad request failed';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  })
);

/**
 * POST /api/mobile/impression
 * Track impression
 */
router.post(
  '/impression',
  validate(ImpressionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const impressionData = req.body;

    const impression = await trackingService.recordImpression(impressionData);

    res.json({
      success: true,
      data: {
        impressionId: impression.impressionId,
        timestamp: impression.timestamp,
      },
    });
  })
);

/**
 * POST /api/mobile/click
 * Track click
 */
router.post(
  '/click',
  validate(ClickSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const clickData = req.body;

    const click = await trackingService.recordClick(clickData);

    res.json({
      success: true,
      data: {
        clickId: click.clickId,
        timestamp: click.timestamp,
      },
    });
  })
);

/**
 * GET /api/mobile/publisher/:id/earnings
 * Get publisher earnings
 */
router.get(
  '/publisher/:id/earnings',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const earnings = await publisherService.getEarnings(id, start, end);

    res.json({
      success: true,
      data: earnings,
    });
  })
);

/**
 * POST /api/mobile/apps
 * Add a new app to publisher
 */
router.post(
  '/apps',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, platform, bundleId, category } = req.body;
    const publisherId = req.auth?.publisherId;

    if (!publisherId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    try {
      const app = await publisherService.addApp(publisherId, {
        name,
        platform,
        bundleId,
        category,
      });

      res.status(201).json({
        success: true,
        data: app,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add app';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  })
);

/**
 * GET /api/mobile/apps
 * Get all apps for publisher
 */
router.get(
  '/apps',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const publisherId = req.auth?.publisherId;

    if (!publisherId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const publisher = await publisherService.getById(publisherId);

    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Publisher not found',
      });
      return;
    }

    res.json({
      success: true,
      data: publisher.apps,
    });
  })
);

/**
 * POST /api/mobile/placement
 * Create a new placement
 */
router.post(
  '/placement',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const placementData = req.body;

    try {
      const placement = await placementService.create(placementData);

      res.status(201).json({
        success: true,
        data: placement,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create placement';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  })
);

/**
 * GET /api/mobile/placement/app/:appId
 * Get all placements for an app
 */
router.get(
  '/placement/app/:appId',
  asyncHandler(async (req: Request, res: Response) => {
    const { appId } = req.params;

    const placements = await placementService.getByAppId(appId);

    res.json({
      success: true,
      data: placements,
    });
  })
);

/**
 * GET /api/mobile/publisher/profile
 * Get publisher profile
 */
router.get(
  '/publisher/profile',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const publisherId = req.auth?.publisherId;

    if (!publisherId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const publisher = await publisherService.getById(publisherId);

    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Publisher not found',
      });
      return;
    }

    res.json({
      success: true,
      data: publisher,
    });
  })
);

/**
 * PATCH /api/mobile/publisher/settings
 * Update publisher settings
 */
router.patch(
  '/publisher/settings',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const publisherId = req.auth?.publisherId;

    if (!publisherId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    try {
      const publisher = await publisherService.updateSettings(publisherId, req.body);

      if (!publisher) {
        res.status(404).json({
          success: false,
          error: 'Publisher not found',
        });
        return;
      }

      res.json({
        success: true,
        data: publisher.settings,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  })
);

export default router;