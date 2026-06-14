import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from './config';
import { logger } from './utils/logger';
import { registry, recordHttpRequest } from './utils/metrics';
import {
  internalAuth,
  requestId,
  errorHandler,
  notFoundHandler,
  validateBody,
  validateQuery,
  createVideoSchema,
  updateVideoSchema,
  addSponsorSchema,
  createCampaignSchema,
  setTargetingSchema,
  listVideosQuerySchema,
  dateRangeSchema,
} from './middleware';
import {
  videoService,
  sponsorService,
  campaignService,
  analyticsService,
  targetingService,
} from './services';

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to MongoDB', { uri: config.mongodb.uri });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      database: config.redis.db,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { host: config.redis.host, port: config.redis.port });
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Failed to connect to Redis, continuing without cache', { error });
    redisClient = null;
  }
}

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestId);

// Request logging and metrics
app.use((req: Request, res: Response, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    recordHttpRequest(req.method, req.path, res.statusCode, duration);

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
      requestId: (req as any).requestId,
    });
  });

  next();
});

// Health check endpoint (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isReady ? 'connected' : 'disconnected';

  const healthy = mongoStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    service: 'sponsored-videos-service',
    version: '1.0.0',
    port: config.port,
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// Create API router
const apiRouter = Router();

// Apply internal auth to all API routes
apiRouter.use(internalAuth);

// ============== VIDEO ROUTES ==============

// POST /api/videos - Create video
apiRouter.post('/videos', validateBody(createVideoSchema), async (req: Request, res: Response, next) => {
  try {
    const video = await videoService.createVideo(req.body);

    res.status(201).json({
      success: true,
      data: video,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/videos - List videos
apiRouter.get('/videos', validateQuery(listVideosQuerySchema), async (req: Request, res: Response, next) => {
  try {
    const { page, limit, sortBy, sortOrder, status, advertiserId, category, tags, search } = req.query as any;

    const result = await videoService.listVideos({
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      advertiserId,
      category,
      tags: tags ? tags.split(',') : undefined,
      search,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/videos/:id - Get video
apiRouter.get('/videos/:id', async (req: Request, res: Response, next) => {
  try {
    const video = await videoService.getVideoById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
      });
    }

    res.json({
      success: true,
      data: video,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/videos/:id - Update video
apiRouter.put('/videos/:id', validateBody(updateVideoSchema), async (req: Request, res: Response, next) => {
  try {
    const video = await videoService.updateVideo(req.params.id, req.body);

    res.json({
      success: true,
      data: video,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/videos/:id - Delete video
apiRouter.delete('/videos/:id', async (req: Request, res: Response, next) => {
  try {
    const video = await videoService.deleteVideo(req.params.id);

    res.json({
      success: true,
      data: video,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/videos/:id/sponsor - Add sponsor to video
apiRouter.post('/videos/:id/sponsor', validateBody(addSponsorSchema), async (req: Request, res: Response, next) => {
  try {
    const sponsor = await sponsorService.createSponsor(req.params.id, req.body);

    // Update video with sponsor reference
    await videoService.addSponsor(req.params.id, sponsor._id!.toString());

    res.status(201).json({
      success: true,
      data: sponsor,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/videos/:id/sponsors - List sponsors for video
apiRouter.get('/videos/:id/sponsors', async (req: Request, res: Response, next) => {
  try {
    const { status, placement, page, limit } = req.query as any;

    const result = await sponsorService.listSponsorsByVideo(req.params.id, {
      status,
      placement,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============== CAMPAIGN ROUTES ==============

// POST /api/campaigns - Create campaign
apiRouter.post('/campaigns', validateBody(createCampaignSchema), async (req: Request, res: Response, next) => {
  try {
    const campaign = await campaignService.createCampaign(req.body);

    res.status(201).json({
      success: true,
      data: campaign,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id - Get campaign
apiRouter.get('/campaigns/:id', async (req: Request, res: Response, next) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Campaign not found',
        },
      });
    }

    res.json({
      success: true,
      data: campaign,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id/performance - Get campaign performance
apiRouter.get('/campaigns/:id/performance', async (req: Request, res: Response, next) => {
  try {
    const performance = await campaignService.getCampaignPerformance(req.params.id);

    res.json({
      success: true,
      data: performance,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/:id/target - Set campaign targeting
apiRouter.post('/campaigns/:id/target', validateBody(setTargetingSchema), async (req: Request, res: Response, next) => {
  try {
    const campaign = await campaignService.setTargeting(req.params.id, req.body);

    res.json({
      success: true,
      data: campaign,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id/analytics - Get campaign analytics
apiRouter.get('/campaigns/:id/analytics', async (req: Request, res: Response, next) => {
  try {
    const analytics = await analyticsService.getCampaignAnalytics(req.params.id);

    res.json({
      success: true,
      data: analytics,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/campaigns/:id/status - Update campaign status
apiRouter.put('/campaigns/:id/status', async (req: Request, res: Response, next) => {
  try {
    const { status } = req.body;
    let campaign;

    switch (status) {
      case 'active':
        campaign = await campaignService.activateCampaign(req.params.id);
        break;
      case 'paused':
        campaign = await campaignService.pauseCampaign(req.params.id);
        break;
      case 'completed':
        campaign = await campaignService.completeCampaign(req.params.id);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Invalid status value',
          },
        });
    }

    res.json({
      success: true,
      data: campaign,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============== ANALYTICS ROUTES ==============

// GET /api/analytics/views - Get view analytics
apiRouter.get('/analytics/views', validateQuery(dateRangeSchema), async (req: Request, res: Response, next) => {
  try {
    const { videoId, startDate, endDate } = req.query as any;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_VIDEO_ID',
          message: 'videoId query parameter is required',
        },
      });
    }

    const analytics = await analyticsService.getViewAnalytics(
      videoId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: analytics,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/engagement - Get engagement metrics
apiRouter.get('/analytics/engagement', validateQuery(dateRangeSchema), async (req: Request, res: Response, next) => {
  try {
    const { videoId, startDate, endDate } = req.query as any;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_VIDEO_ID',
          message: 'videoId query parameter is required',
        },
      });
    }

    const analytics = await analyticsService.getEngagementMetrics(
      videoId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: analytics,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/views - Record video view
apiRouter.post('/analytics/views', async (req: Request, res: Response, next) => {
  try {
    const { videoId, views, uniqueViews, source, device, geo, watchTime, campaignId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_VIDEO_ID',
          message: 'videoId is required',
        },
      });
    }

    await analyticsService.recordView(videoId, {
      views,
      uniqueViews,
      source,
      device,
      geo,
      watchTime,
      campaignId,
    });

    res.json({
      success: true,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/engagement - Record engagement
apiRouter.post('/analytics/engagement', async (req: Request, res: Response, next) => {
  try {
    const { videoId, type } = req.body;

    if (!videoId || !type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'videoId and type are required',
        },
      });
    }

    await analyticsService.recordEngagementAction(videoId, type);

    res.json({
      success: true,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/video/:id - Get video analytics summary
apiRouter.get('/analytics/video/:id', async (req: Request, res: Response, next) => {
  try {
    const summary = await analyticsService.getVideoAnalyticsSummary(req.params.id);

    res.json({
      success: true,
      data: summary,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/retention/:videoId - Get retention analysis
apiRouter.get('/analytics/retention/:videoId', async (req: Request, res: Response, next) => {
  try {
    const analysis = await analyticsService.getRetentionAnalysis(req.params.videoId);

    res.json({
      success: true,
      data: analysis,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/platform - Get platform-wide analytics
apiRouter.get('/analytics/platform', async (req: Request, res: Response, next) => {
  try {
    const { date } = req.query as any;
    const analytics = await analyticsService.getPlatformAnalytics(
      date ? new Date(date) : undefined
    );

    res.json({
      success: true,
      data: analytics,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============== TARGETING ROUTES ==============

// POST /api/targeting/validate - Validate targeting configuration
apiRouter.post('/targeting/validate', async (req: Request, res: Response, next) => {
  try {
    const targeting = req.body;
    const result = targetingService.validateTargeting(targeting);

    res.json({
      success: true,
      data: result,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/targeting/estimate - Estimate audience size
apiRouter.post('/targeting/estimate', async (req: Request, res: Response, next) => {
  try {
    const targeting = req.body;
    const estimate = await targetingService.estimateAudienceSize(targeting);

    res.json({
      success: true,
      data: estimate,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/targeting/match - Check if user matches targeting
apiRouter.post('/targeting/match', async (req: Request, res: Response, next) => {
  try {
    const { campaignId, userData } = req.body;

    if (!campaignId || !userData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'campaignId and userData are required',
        },
      });
    }

    const result = await targetingService.matchesTargeting(campaignId, userData);

    res.json({
      success: true,
      data: result,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Apply API router
app.use('/api', apiRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`Sponsored Videos Service started`, {
        port: config.port,
        env: config.env,
        version: '1.0.0',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  try {
    await mongoose.connection.close();
    if (redisClient) {
      await redisClient.quit();
    }
    logger.info('Connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export default app;