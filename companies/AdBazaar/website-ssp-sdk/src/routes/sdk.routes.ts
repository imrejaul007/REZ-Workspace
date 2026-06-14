import { Router, Response } from 'express';
import { z } from 'zod';
import { publisherService, placementService, eventService, sdkConfigService } from '../services/index.js';
import { AuthRequest, generateToken, apiKeyAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { sdkImpressionsTotal, sdkClicksTotal, sdkEarningsTotal, publishersTotal } from '../middleware/metrics.middleware.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('SDKRoutes');
const router = Router();

// Validation schemas
const publisherIdParamSchema = z.object({
  publisherId: z.string().uuid(),
});

const placementIdParamSchema = z.object({
  placementId: z.string().uuid(),
});

const publisherIdRouteSchema = z.object({
  id: z.string(),
});

const RegisterPublisherSchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url(),
  category: z.enum([
    'news', 'blog', 'entertainment', 'ecommerce', 'social',
    'gaming', 'education', 'tech', 'lifestyle', 'finance',
    'sports', 'travel', 'food', 'health', 'other'
  ]),
  contact: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  settings: z.object({
    adFormats: z.array(z.enum(['banner', 'rectangle', 'native', 'video', 'interstitial'])).optional(),
    minCPM: z.number().min(0).optional(),
    headerBidding: z.boolean().optional(),
  }).optional(),
});

const CreatePublisherSchema = RegisterPublisherSchema.extend({
  status: z.enum(['active', 'pending', 'suspended']).optional(),
});

const TrackImpressionSchema = z.object({
  placementId: z.string().uuid(),
  adId: z.string().optional(),
  metadata: z.object({
    country: z.string().optional(),
    device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    referrer: z.string().optional(),
  }).optional(),
});

const TrackClickSchema = z.object({
  impressionId: z.string().uuid(),
  placementId: z.string().uuid(),
  adId: z.string().optional(),
  metadata: z.object({
    country: z.string().optional(),
    device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  }).optional(),
});

const CreatePlacementSchema = z.object({
  publisherId: z.string().uuid(),
  name: z.string().min(1).max(100),
  pageUrl: z.string().url(),
  adFormats: z.array(z.enum(['banner', 'rectangle', 'native', 'video', 'interstitial'])),
  size: z.object({
    width: z.number().int().min(1).max(2000),
    height: z.number().int().min(1).max(2000),
  }),
  position: z.enum(['header', 'sidebar', 'content', 'footer', 'interstitial']),
  minCPM: z.number().min(0).optional(),
});

// GET /api/sdk/config/:publisherId - Get SDK configuration
router.get(
  '/config/:publisherId',
  validateParams(publisherIdParamSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { publisherId } = req.params;

      const config = await sdkConfigService.getSDKConfig(publisherId);
      if (!config) {
        res.status(404).json({ error: 'Publisher not found or not active' });
        return;
      }

      res.json(config);
    } catch (error) {
      logger.error('Error getting SDK config:', error);
      res.status(500).json({ error: 'Failed to get SDK config' });
    }
  }
);

// POST /api/sdk/register - Register publisher (public registration)
router.post(
  '/register',
  validateBody(RegisterPublisherSchema),
  async (req, res: Response): Promise<void> => {
    try {
      const publisher = await publisherService.createPublisher({
        ...req.body,
        status: 'pending', // New registrations are pending approval
      });

      const token = generateToken(publisher.publisherId, publisher.publisherId);

      // Update metrics
      publishersTotal.inc({ status: 'pending' });

      res.status(201).json({
        message: 'Publisher registered successfully',
        publisher: {
          publisherId: publisher.publisherId,
          name: publisher.name,
          website: publisher.website,
          status: publisher.status,
        },
        token,
      });
    } catch (error) {
      logger.error('Error registering publisher:', error);
      res.status(500).json({ error: 'Failed to register publisher' });
    }
  }
);

// GET /api/sdk/placement/:placementId - Get placement config
router.get(
  '/placement/:placementId',
  validateParams(placementIdParamSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { placementId } = req.params;

      const config = await placementService.getPlacementConfig(placementId);
      if (!config) {
        res.status(404).json({ error: 'Placement not found' });
        return;
      }

      if (config.status !== 'active') {
        res.status(403).json({ error: 'Placement is not active' });
        return;
      }

      res.json({ config });
    } catch (error) {
      logger.error('Error getting placement config:', error);
      res.status(500).json({ error: 'Failed to get placement config' });
    }
  }
);

// POST /api/sdk/impression - Track impression
router.post(
  '/impression',
  apiKeyAuthMiddleware,
  validateBody(TrackImpressionSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const publisherId = req.user!.publisherId;
      const { placementId, adId, metadata } = req.body;

      const impression = await eventService.trackImpression(publisherId, {
        placementId,
        adId,
        metadata,
      });

      // Update metrics
      sdkImpressionsTotal.inc({ publisher_id: publisherId, placement_id: placementId });

      res.status(201).json({
        eventId: impression.eventId,
        timestamp: impression.timestamp,
      });
    } catch (error) {
      logger.error('Error tracking impression:', error);
      res.status(500).json({ error: 'Failed to track impression' });
    }
  }
);

// POST /api/sdk/click - Track click
router.post(
  '/click',
  apiKeyAuthMiddleware,
  validateBody(TrackClickSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const publisherId = req.user!.publisherId;
      const { impressionId, placementId, adId, metadata } = req.body;

      // Verify impression exists
      const impression = await eventService.getImpressionById(impressionId);
      if (!impression) {
        res.status(400).json({ error: 'Invalid impression ID' });
        return;
      }

      const click = await eventService.trackClick(publisherId, impressionId, {
        placementId,
        adId,
        metadata,
      });

      // Update metrics
      sdkClicksTotal.inc({ publisher_id: publisherId, placement_id: placementId });

      res.status(201).json({
        eventId: click.eventId,
        timestamp: click.timestamp,
      });
    } catch (error) {
      logger.error('Error tracking click:', error);
      res.status(500).json({ error: 'Failed to track click' });
    }
  }
);

// GET /api/sdk/publisher/:id/earnings - Get publisher earnings
router.get(
  '/publisher/:id/earnings',
  validateParams(publisherIdRouteSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const earnings = await publisherService.getPublisherEarnings(id);
      res.json(earnings);
    } catch (error) {
      logger.error('Error getting earnings:', error);
      res.status(500).json({ error: 'Failed to get earnings' });
    }
  }
);

// POST /api/sdk/publisher - Create publisher account (admin/internal)
router.post(
  '/publisher',
  validateBody(CreatePublisherSchema),
  async (req, res: Response): Promise<void> => {
    try {
      const publisher = await publisherService.createPublisher({
        name: req.body.name,
        website: req.body.website,
        category: req.body.category,
        contact: req.body.contact,
        settings: req.body.settings,
        status: req.body.status || 'active',
      });

      const token = generateToken(publisher.publisherId, publisher.publisherId);

      // Update metrics
      publishersTotal.inc({ status: publisher.status });

      res.status(201).json({
        message: 'Publisher created successfully',
        publisher: {
          publisherId: publisher.publisherId,
          name: publisher.name,
          website: publisher.website,
          category: publisher.category,
          status: publisher.status,
          settings: publisher.settings,
        },
        token,
      });
    } catch (error) {
      logger.error('Error creating publisher:', error);
      res.status(500).json({ error: 'Failed to create publisher' });
    }
  }
);

// POST /api/sdk/placement - Create placement
router.post(
  '/placement',
  validateBody(CreatePlacementSchema),
  async (req, res: Response): Promise<void> => {
    try {
      const placement = await placementService.createPlacement(req.body);

      res.status(201).json({
        message: 'Placement created successfully',
        placement: {
          placementId: placement.placementId,
          publisherId: placement.publisherId,
          name: placement.name,
          pageUrl: placement.pageUrl,
          adFormats: placement.adFormats,
          size: placement.size,
          position: placement.position,
          status: placement.status,
        },
      });
    } catch (error) {
      logger.error('Error creating placement:', error);
      res.status(500).json({ error: 'Failed to create placement' });
    }
  }
);

export default router;