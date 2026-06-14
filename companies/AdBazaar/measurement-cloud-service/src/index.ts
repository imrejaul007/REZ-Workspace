import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import logger from 'utils/logger.js';
import register, { metricsMiddleware } from './utils/metrics';

// Environment configuration
const PORT = process.env.PORT || 4970;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/measurement-cloud';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client
let redisClient: RedisClientType;

// Initialize Redis connection
async function initRedis(): Promise<RedisClientType> {
  try {
    redisClient = createClient({ url: REDIS_URL });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { url: REDIS_URL });
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis', { error: String(error) });
    throw error;
  }
}

// Initialize MongoDB connection
async function initMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: String(error) });
    throw error;
  }
}

import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Import services
import measurementService from './services/measurementService';
import attributionService from './services/attributionService';
import brandSafetyService from './services/brandSafetyService';
import viewabilityService from './services/viewabilityService';

// Import models for validation
import { MeasurementType } from './models/Measurement';
import { AttributionModel } from './models/Attribution';
import { ViewabilityStandard } from './models/Viewability';

// Import middleware
import { internalServiceAuth, requestLogger } from './middleware/auth';

// Validation schemas
const campaignMeasurementSchema = z.object({
  campaignId: z.string().min(1),
  type: z.nativeEnum(MeasurementType),
  period: z.object({
    start: z.string().datetime().or(z.date()),
    end: z.string().datetime().or(z.date())
  }),
  metrics: z.object({
    impressions: z.number().min(0),
    uniqueImpressions: z.number().min(0).optional(),
    clicks: z.number().min(0).optional(),
    conversions: z.number().min(0).optional(),
    spend: z.number().min(0).optional()
  }),
  demographics: z.object({
    ageGroups: z.record(z.number()).optional(),
    gender: z.record(z.number()).optional(),
    income: z.record(z.number()).optional()
  }).optional(),
  geoDistribution: z.array(z.object({
    country: z.string(),
    state: z.string().optional(),
    city: z.string().optional(),
    impressions: z.number()
  })).optional(),
  deviceBreakdown: z.record(z.number()).optional(),
  channelBreakdown: z.record(z.number()).optional(),
  brandLift: z.object({
    awareness: z.number().optional(),
    consideration: z.number().optional(),
    preference: z.number().optional(),
    purchaseIntent: z.number().optional()
  }).optional(),
  incrementality: z.object({
    testGroup: z.number(),
    controlGroup: z.number()
  }).optional()
});

const impressionSchema = z.object({
  campaignId: z.string().min(1),
  impressionId: z.string().optional(),
  timestamp: z.string().datetime().or(z.date()).optional(),
  deviceType: z.string().optional(),
  placementType: z.string().optional(),
  userId: z.string().optional(),
  publisherId: z.string().optional(),
  placementId: z.string().optional(),
  creativeId: z.string().optional(),
  viewerInfo: z.object({
    country: z.string(),
    state: z.string().optional(),
    city: z.string().optional(),
    deviceType: z.string(),
    browser: z.string().optional(),
    os: z.string().optional()
  }).optional(),
  viewabilityData: z.object({
    visibleArea: z.number().min(0).max(100),
    viewableTime: z.number().min(0),
    inViewStart: z.string().datetime().optional(),
    inViewEnd: z.string().datetime().optional()
  }).optional()
});

const attributionSchema = z.object({
  campaignId: z.string().min(1),
  model: z.nativeEnum(AttributionModel),
  conversionId: z.string().min(1),
  customerId: z.string().optional(),
  conversionValue: z.number().min(0),
  conversionTimestamp: z.string().datetime().or(z.date()),
  touchpoints: z.array(z.object({
    type: z.string(),
    channel: z.string(),
    timestamp: z.string().datetime().or(z.date()),
    campaignId: z.string().optional(),
    placementId: z.string().optional(),
    creativeId: z.string().optional(),
    score: z.number().optional()
  })),
  windowDays: z.number().min(1).max(90).optional()
});

const brandSafetySchema = z.object({
  campaignId: z.string().min(1),
  contentUrl: z.string().url().optional(),
  contentText: z.string().optional(),
  contentCategories: z.array(z.string()).optional(),
  competitorDomains: z.array(z.string()).optional(),
  customKeywords: z.object({
    positive: z.array(z.string()).optional(),
    negative: z.array(z.string()).optional()
  }).optional()
});

const viewabilitySchema = z.object({
  campaignId: z.string().min(1),
  impressionId: z.string().min(1),
  timestamp: z.string().datetime().or(z.date()).optional(),
  standard: z.nativeEnum(ViewabilityStandard).optional(),
  viewableTime: z.number().min(0),
  visibleArea: z.number().min(0).max(100),
  inViewStart: z.string().datetime().optional(),
  inViewEnd: z.string().datetime().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'ctv']).optional(),
  format: z.enum(['display', 'video', 'native']).optional(),
  placementType: z.enum(['preRoll', 'midRoll', 'postRoll', 'inFeed', 'banner']).optional(),
  playerState: z.object({
    paused: z.boolean().optional(),
    muted: z.boolean().optional(),
    fullscreen: z.boolean().optional(),
    autoplay: z.boolean().optional()
  }).optional()
});

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for API
}));
app.use(cors());
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Request logging
app.use(requestLogger);

// Health check endpoint (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isOpen ? 'connected' : 'disconnected';

  const healthy = mongoStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    service: 'measurement-cloud-service',
    version: '1.0.0',
    port: PORT,
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(String(error));
  }
});

// API routes with authentication
const apiRouter = Router();

// Apply authentication to all API routes
apiRouter.use(internalServiceAuth());

// ==================== CAMPAIGN MEASUREMENT ====================

/**
 * POST /api/measurements/campaign
 * Record campaign measurement data
 */
apiRouter.post('/measurements/campaign', async (req: Request, res: Response) => {
  try {
    const validation = campaignMeasurementSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors
      });
    }

    const input = validation.data;

    const measurement = await measurementService.recordCampaignMeasurement({
      ...input,
      period: {
        start: new Date(input.period.start),
        end: new Date(input.period.end)
      }
    });

    res.status(201).json({
      success: true,
      data: {
        measurementId: (measurement as any)._id,
        campaignId: measurement.campaignId,
        timestamp: measurement.timestamp
      }
    });
  } catch (error) {
    logger.error('Error recording campaign measurement', { error: String(error) });
    res.status(500).json({
      error: 'Failed to record campaign measurement',
      message: String(error)
    });
  }
});

/**
 * GET /api/measurements/campaign/:id
 * Get campaign measurement by ID
 */
apiRouter.get('/measurements/campaign/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, startDate, endDate } = req.query;

    const measurements = await measurementService.getCampaignMeasurement(id, {
      type: type as MeasurementType,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: {
        campaignId: id,
        measurements
      }
    });
  } catch (error) {
    logger.error('Error getting campaign measurement', { error: String(error) });
    res.status(500).json({
      error: 'Failed to get campaign measurement',
      message: String(error)
    });
  }
});

// ==================== IMPRESSIONS ====================

/**
 * POST /api/measurements/impression
 * Record an impression event
 */
apiRouter.post('/measurements/impression', async (req: Request, res: Response) => {
  try {
    const validation = impressionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors
      });
    }

    const input = validation.data;

    const result = await measurementService.recordImpression({
      ...input,
      timestamp: input.timestamp ? new Date(input.timestamp) : undefined
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error recording impression', { error: String(error) });
    res.status(500).json({
      error: 'Failed to record impression',
      message: String(error)
    });
  }
});

// ==================== ATTRIBUTION ====================

/**
 * POST /api/measurements/attribution
 * Record attribution for a conversion
 */
apiRouter.post('/measurements/attribution', async (req: Request, res: Response) => {
  try {
    const validation = attributionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors
      });
    }

    const input = validation.data;

    const attribution = await attributionService.recordAttribution({
      ...input,
      conversionTimestamp: new Date(input.conversionTimestamp),
      touchpoints: input.touchpoints.map(tp => ({
        ...tp,
        timestamp: new Date(tp.timestamp)
      }))
    });

    res.status(201).json({
      success: true,
      data: {
        attributionId: (attribution as any)._id,
        campaignId: attribution.campaignId,
        conversionId: attribution.conversionId,
        model: attribution.model
      }
    });
  } catch (error) {
    logger.error('Error recording attribution', { error: String(error) });
    res.status(500).json({
      error: 'Failed to record attribution',
      message: String(error)
    });
  }
});

/**
 * GET /api/measurements/attribution/:campaignId
 * Get attribution data for a campaign
 */
apiRouter.get('/measurements/attribution/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { model, startDate, endDate } = req.query;

    const attributionData = await attributionService.getAttributionData(campaignId, {
      model: model as AttributionModel,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: {
        campaignId,
        ...attributionData
      }
    });
  } catch (error) {
    logger.error('Error getting attribution data', { error: String(error) });
    res.status(500).json({
      error: 'Failed to get attribution data',
      message: String(error)
    });
  }
});

// ==================== BRAND SAFETY ====================

/**
 * POST /api/measurements/brand-safety
 * Perform brand safety check
 */
apiRouter.post('/measurements/brand-safety', async (req: Request, res: Response) => {
  try {
    const validation = brandSafetySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors
      });
    }

    const input = validation.data;

    const result = await brandSafetyService.performBrandSafetyCheck(input);

    res.status(201).json({
      success: true,
      data: {
        checkId: (result as any)._id,
        campaignId: result.campaignId,
        overallScore: result.overallScore,
        overallStatus: result.overallStatus,
        checks: result.checks.length
      }
    });
  } catch (error) {
    logger.error('Error performing brand safety check', { error: String(error) });
    res.status(500).json({
      error: 'Failed to perform brand safety check',
      message: String(error)
    });
  }
});

/**
 * GET /api/measurements/brand-safety/:campaignId
 * Get brand safety results for a campaign
 */
apiRouter.get('/measurements/brand-safety/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate, limit } = req.query;

    const results = await brandSafetyService.getBrandSafetyResults(campaignId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: {
        campaignId,
        results
      }
    });
  } catch (error) {
    logger.error('Error getting brand safety results', { error: String(error) });
    res.status(500).json({
      error: 'Failed to get brand safety results',
      message: String(error)
    });
  }
});

// ==================== VIEWABILITY ====================

/**
 * POST /api/measurements/viewability
 * Track viewability for an impression
 */
apiRouter.post('/measurements/viewability', async (req: Request, res: Response) => {
  try {
    const validation = viewabilitySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors
      });
    }

    const input = validation.data;

    const result = await viewabilityService.trackViewability({
      ...input,
      timestamp: input.timestamp ? new Date(input.timestamp) : undefined,
      inViewStart: input.inViewStart ? new Date(input.inViewStart) : undefined,
      inViewEnd: input.inViewEnd ? new Date(input.inViewEnd) : undefined
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error tracking viewability', { error: String(error) });
    res.status(500).json({
      error: 'Failed to track viewability',
      message: String(error)
    });
  }
});

/**
 * GET /api/measurements/viewability/:campaignId
 * Get viewability metrics for a campaign
 */
apiRouter.get('/measurements/viewability/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate, standard } = req.query;

    const metrics = await viewabilityService.getViewabilityMetrics(campaignId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      standard: standard as ViewabilityStandard
    });

    res.json({
      success: true,
      data: {
        campaignId,
        ...metrics
      }
    });
  } catch (error) {
    logger.error('Error getting viewability metrics', { error: String(error) });
    res.status(500).json({
      error: 'Failed to get viewability metrics',
      message: String(error)
    });
  }
});

// ==================== ANALYTICS ====================

/**
 * GET /api/measurements/analytics/:campaignId
 * Get full analytics for a campaign
 */
apiRouter.get('/measurements/analytics/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    // Get measurement analytics
    const measurementAnalytics = await measurementService.getCampaignAnalytics(campaignId, start, end);

    // Get attribution data
    const attributionData = await attributionService.getAttributionData(campaignId, { startDate: start, endDate: end });

    // Get viewability metrics
    const viewabilityMetrics = await viewabilityService.getViewabilityMetrics(campaignId, { startDate: start, endDate: end });

    // Get brand safety results (latest)
    const brandSafetyResults = await brandSafetyService.getBrandSafetyResults(campaignId, { limit: 1 });

    res.json({
      success: true,
      data: {
        campaignId,
        period: {
          start: start || 'all-time',
          end: end || 'now'
        },
        overview: {
          impressions: measurementAnalytics.totalImpressions,
          clicks: measurementAnalytics.totalClicks,
          conversions: measurementAnalytics.totalConversions,
          spend: measurementAnalytics.totalSpend,
          avgCpm: measurementAnalytics.avgCpm,
          avgCtr: measurementAnalytics.avgCtr,
          conversionRate: measurementAnalytics.conversionRate
        },
        attribution: attributionData,
        viewability: viewabilityMetrics,
        brandSafety: brandSafetyResults[0] || null,
        timeSeries: measurementAnalytics.timeSeries,
        deviceBreakdown: measurementAnalytics.deviceBreakdown
      }
    });
  } catch (error) {
    logger.error('Error getting analytics', { error: String(error) });
    res.status(500).json({
      error: 'Failed to get analytics',
      message: String(error)
    });
  }
});

// Mount API router
app.use('/api', apiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB', { error: String(error) });
  }

  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis', { error: String(error) });
  }

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    // Initialize connections
    await initMongoDB();
    await initRedis();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Measurement Cloud Service started`, {
        port: PORT,
        service: 'measurement-cloud-service',
        version: '1.0.0',
        mongodb: MONGODB_URI,
        redis: REDIS_URL
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: String(error) });
    process.exit(1);
  }
}

start();

export default app;