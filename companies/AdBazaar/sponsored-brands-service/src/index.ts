import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { logger, getMetrics, getContentType, httpRequestDuration, errorCounter } from './utils';
import { internalServiceAuth, optionalAuth, AuthenticatedRequest } from './middleware';
import {
  campaignService,
  CreateCampaignSchema,
  UpdateCampaignSchema,
  keywordService,
  AddKeywordSchema,
  bidService,
  analyticsService,
  recommendationService
} from './services';

const app = express();
const PORT = process.env.PORT || 4991;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sponsored_brands';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: ReturnType<typeof createClient> | null = null;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString()
      },
      duration
    );
  });

  next();
});

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isOpen ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'sponsored-brands-service',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    connections: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  });
});

app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', getContentType());
    res.send(await getMetrics());
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).send('Failed to get metrics');
  }
});

app.post('/api/brands', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = CreateCampaignSchema.parse(req.body);
    const campaign = await campaignService.create(validatedData);

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'validation', service: 'campaign' });
    logger.error('Failed to create campaign', { error });

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

app.get('/api/brands', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { advertiserId, brandId, status, page, limit } = req.query;

    const result = await campaignService.list({
      advertiserId: advertiserId as string,
      brandId: brandId as string,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.campaigns,
      pagination: {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        total: result.total
      }
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'query', service: 'campaign' });
    logger.error('Failed to list campaigns', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.get('/api/brands/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = await campaignService.getById(req.params.id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'query', service: 'campaign' });
    logger.error('Failed to get campaign', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.put('/api/brands/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = UpdateCampaignSchema.parse(req.body);
    const campaign = await campaignService.update(req.params.id, validatedData);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'update', service: 'campaign' });
    logger.error('Failed to update campaign', { error, campaignId: req.params.id });

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

app.patch('/api/brands/:id/status', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!['draft', 'active', 'paused', 'archived'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid status value'
      });
      return;
    }

    const campaign = await campaignService.changeStatus(req.params.id, status);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'update', service: 'campaign' });
    logger.error('Failed to change campaign status', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.delete('/api/brands/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await campaignService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'delete', service: 'campaign' });
    logger.error('Failed to delete campaign', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.post('/api/brands/:id/keywords', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keywords } = req.body;

    if (Array.isArray(keywords)) {
      const addedKeywords = await keywordService.bulkAddKeywords(req.params.id, keywords);
      res.status(201).json({
        success: true,
        data: addedKeywords
      });
    } else {
      const validatedData = AddKeywordSchema.parse(req.body);
      const keyword = await keywordService.addKeyword(req.params.id, validatedData);
      res.status(201).json({
        success: true,
        data: keyword
      });
    }
  } catch (error: any) {
    errorCounter.inc({ type: 'create', service: 'keyword' });
    logger.error('Failed to add keywords', { error, campaignId: req.params.id });

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

app.get('/api/brands/:id/keywords', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, matchType, page, limit } = req.query;

    const result = await keywordService.listByCampaign(req.params.id, {
      status: status as string,
      matchType: matchType as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.keywords,
      pagination: {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        total: result.total
      }
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'query', service: 'keyword' });
    logger.error('Failed to list keywords', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.patch('/api/brands/:id/keywords/:keywordId', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const keyword = await keywordService.update(req.params.keywordId, req.body);

    if (!keyword) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Keyword not found'
      });
      return;
    }

    res.json({
      success: true,
      data: keyword
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'update', service: 'keyword' });
    logger.error('Failed to update keyword', { error, keywordId: req.params.keywordId });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.get('/api/brands/:id/performance', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { start, end } = req.query;

    const dateRange = start && end ? {
      start: new Date(start as string),
      end: new Date(end as string)
    } : undefined;

    const performance = await analyticsService.getCampaignPerformance(req.params.id, dateRange);

    res.json({
      success: true,
      data: performance
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'query', service: 'analytics' });
    logger.error('Failed to get performance', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.get('/api/brands/:id/analytics', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;

    const [performance, timeSeries, keywordPerf, audienceInsights, benchmarks] = await Promise.all([
      analyticsService.getCampaignPerformance(req.params.id),
      analyticsService.getTimeSeriesData(req.params.id, daysNum),
      analyticsService.getKeywordPerformance(req.params.id),
      analyticsService.getAudienceInsights(req.params.id),
      analyticsService.getBenchmarkMetrics(req.params.id)
    ]);

    res.json({
      success: true,
      data: {
        current: performance,
        timeSeries,
        keywordPerformance: keywordPerf,
        audienceInsights,
        benchmarks
      }
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'query', service: 'analytics' });
    logger.error('Failed to get analytics', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.post('/api/brands/:id/bid', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keywordId, bid, keywordIds } = req.body;

    if (keywordId && bid !== undefined) {
      const keyword = await bidService.setKeywordBid(req.params.id, keywordId, bid);

      if (!keyword) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Keyword not found'
        });
        return;
      }

      res.json({
        success: true,
        data: keyword
      });
    } else if (keywordIds && Array.isArray(keywordIds)) {
      const bids = keywordIds.map((kid: string, idx: number) => ({
        keywordId: kid,
        bid: req.body.bids?.[idx] || 0.5
      }));

      const keywords = await bidService.setBulkBids(req.params.id, bids);

      res.json({
        success: true,
        data: keywords
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'keywordId and bid required, or keywordIds array'
      });
 }
  } catch (error: any) {
    errorCounter.inc({ type: 'update', service: 'bid' });
    logger.error('Failed to set bid', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.get('/api/brands/:id/recommendations', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.query;

    const [keywordRecs, audienceRecs, creativeRecs, budgetRec, optimization] = await Promise.all([
      recommendationService.getKeywordRecommendations(req.params.id),
      recommendationService.getAudienceRecommendations(req.params.id),
      recommendationService.getCreativeRecommendations(req.params.id),
      recommendationService.getBudgetRecommendations(req.params.id),
      recommendationService.getCampaignOptimization(req.params.id)
    ]);

    res.json({
      success: true,
      data: {
        keywords: keywordRecs,
        audiences: audienceRecs,
        creatives: creativeRecs,
        budget: budgetRec,
        optimization
      }
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'query', service: 'recommendation' });
    logger.error('Failed to get recommendations', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.get('/api/brands/:id/recommendations/bids', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recommendations = await recommendationService.getBidRecommendations(req.params.id);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    errorCounter.inc({ type: 'query', service: 'recommendation' });
    logger.error('Failed to get bid recommendations', { error, campaignId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  errorCounter.inc({ type: 'unhandled', service: 'api' });
  logger.error('Unhandled error', { error: err, path: req.path });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.error('Redis error', { error: err }));
    redisClient.on('connect', () => logger.info('Connected to Redis', { url: REDIS_URL }));
    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed - continuing without cache', { error });
    redisClient = null;
  }
}

async function startServer(): Promise<void> {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`Sponsored Brands Service started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (redisClient) {
    await redisClient.quit();
  }
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (redisClient) {
    await redisClient.quit();
  }
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;