/**
 * Search Ads Service - Main Entry Point
 * AdBazaar Search Engine Advertising Platform
 * Port: 4993
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Config and utilities
import { config } from './config';
import logger, { httpLogStream } from 'utils/logger.js';
import { recordRequest, getMetrics, getContentType } from './utils/metrics';

// Models
import { SearchCampaign, SearchAd, SearchKeyword, SearchPerformance } from './models';

// Services
import {
  campaignService,
  adService,
  keywordService,
  qualityScoreService,
  optimizationService,
} from './services';

// Middleware
import { internalServiceAuth, requestLogger, advertiserAuth } from './middleware/auth';

// Validation schemas
const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  advertiserId: z.string().min(1),
  budget: z.object({
    daily: z.number().min(0),
    total: z.number().min(0),
  }),
  network: z.enum(['google', 'bing', 'yahoo', 'all']).optional(),
  targeting: z
    .object({
      locations: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      devices: z.array(z.string()).optional(),
      ageRanges: z.array(z.string()).optional(),
    })
    .optional(),
  bidding: z
    .object({
      strategy: z.enum(['cpc', 'cpm', 'target_roas', 'max_conversions']).optional(),
      defaultCpc: z.number().min(0.01).optional(),
      targetRoas: z.number().optional(),
    })
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const CreateAdSchema = z.object({
  headline: z.string().min(1).max(90),
  description: z.string().min(1).max(180),
  description2: z.string().max(180).optional(),
  url: z.string().url(),
  displayUrl: z.string().min(1).max(35),
  finalUrl: z.string().url().optional(),
});

const AddKeywordSchema = z.object({
  term: z.string().min(1).max(100),
  matchType: z.enum(['exact', 'phrase', 'broad', 'modified_broad']),
  bid: z.number().min(0.01),
});

const OptimizeSchema = z.object({
  strategy: z.enum(['aggressive', 'moderate', 'conservative']),
  targetCpc: z.number().optional(),
  targetRoas: z.number().optional(),
  minQualityScore: z.number().min(1).max(10).optional(),
});

// Express app
const app = express();

// Redis client
let redisClient: RedisClientType;

// Middleware
app.use(express.json());
app.use(requestLogger);

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && config.cors.origins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Internal-Token, X-Service-Id, X-Advertiser-Id');
  }
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    service: 'search-ads-service',
    port: config.port,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient?.isReady ? 'connected' : 'disconnected',
  };

  res.json(health);
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', getContentType());
    res.send(await getMetrics());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// ============================================
// CAMPAIGN ROUTES
// ============================================

// Create campaign
app.post('/api/search/campaigns', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const data = CreateCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to create campaign', { error });
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
});

// Get campaign by ID
app.get('/api/search/campaigns/:id', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaign(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error('Failed to get campaign', { error, campaignId: req.params.id });
    res.status(500).json({ error: 'Failed to get campaign' });
  }
});

// List campaigns
app.get('/api/search/campaigns', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { advertiserId, status, limit, page } = req.query;

    const result = await campaignService.listCampaigns({
      advertiserId: advertiserId as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
    });

    res.json({
      success: true,
      data: result.campaigns,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    logger.error('Failed to list campaigns', { error });
    res.status(500).json({ error: 'Failed to list campaigns' });
  }
});

// Update campaign
app.put('/api/search/campaigns/:id', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const data = CreateCampaignSchema.partial().parse(req.body);
    const campaign = await campaignService.updateCampaign(req.params.id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate as any) : undefined,
      endDate: data.endDate ? new Date(data.endDate as any) : undefined,
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to update campaign', { error, campaignId: req.params.id });
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }
});

// Activate campaign
app.post('/api/search/campaigns/:id/activate', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.activateCampaign(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error('Failed to activate campaign', { error, campaignId: req.params.id });
    res.status(500).json({ error: 'Failed to activate campaign' });
  }
});

// Pause campaign
app.post('/api/search/campaigns/:id/pause', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.pauseCampaign(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error('Failed to pause campaign', { error, campaignId: req.params.id });
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

// ============================================
// AD ROUTES
// ============================================

// Create ad
app.post('/api/search/campaigns/:id/ads', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const data = CreateAdSchema.parse(req.body);
    const ad = await adService.createAd(req.params.id, data);

    res.status(201).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to create ad', { error, campaignId: req.params.id });
      res.status(500).json({ error: 'Failed to create ad' });
    }
  }
});

// List ads for campaign
app.get('/api/search/campaigns/:id/ads', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const ads = await adService.getAdsByCampaign(req.params.id);

    res.json({
      success: true,
      data: ads,
    });
  } catch (error) {
    logger.error('Failed to list ads', { error, campaignId: req.params.id });
    res.status(500).json({ error: 'Failed to list ads' });
  }
});

// Update ad
app.put('/api/search/ads/:adId', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const data = CreateAdSchema.partial().parse(req.body);
    const ad = await adService.updateAd(req.params.adId, data);

    if (!ad) {
      res.status(404).json({ error: 'Ad not found' });
      return;
    }

    res.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to update ad', { error, adId: req.params.adId });
      res.status(500).json({ error: 'Failed to update ad' });
    }
  }
});

// ============================================
// KEYWORD ROUTES
// ============================================

// Add keyword
app.post('/api/search/campaigns/:id/keywords', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const data = AddKeywordSchema.parse(req.body);
    const keyword = await keywordService.addKeyword(req.params.id, data);

    res.status(201).json({
      success: true,
      data: keyword,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to add keyword', { error, campaignId: req.params.id });
      res.status(500).json({ error: 'Failed to add keyword' });
    }
  }
});

// List keywords for campaign
app.get('/api/search/campaigns/:id/keywords', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const keywords = await keywordService.getKeywordsByCampaign(req.params.id);

    res.json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    logger.error('Failed to list keywords', { error, campaignId: req.params.id });
    res.status(500).json({ error: 'Failed to list keywords' });
  }
});

// Update keyword
app.put('/api/search/keywords/:keywordId', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { bid, matchType, status } = req.body;
    const keyword = await keywordService.updateKeyword(req.params.keywordId, { bid, matchType, status });

    if (!keyword) {
      res.status(404).json({ error: 'Keyword not found' });
      return;
    }

    res.json({
      success: true,
      data: keyword,
    });
  } catch (error) {
    logger.error('Failed to update keyword', { error, keywordId: req.params.keywordId });
    res.status(500).json({ error: 'Failed to update keyword' });
  }
});

// ============================================
// PERFORMANCE ROUTES
// ============================================

// Get campaign performance
app.get('/api/search/campaigns/:id/performance', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const performance = await optimizationService.getCampaignPerformance(req.params.id, days);

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    logger.error('Failed to get performance', { error, campaignId: req.params.id });
    res.status(500).json({ error: 'Failed to get performance' });
  }
});

// ============================================
// QUALITY SCORE ROUTES
// ============================================

// Get campaign quality score
app.get('/api/search/campaigns/:id/quality-score', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const scores = await qualityScoreService.getCampaignQualityScores(req.params.id);
    const avgScore = await qualityScoreService.getAverageQualityScore(req.params.id);

    res.json({
      success: true,
      data: {
        averageScore: avgScore,
        keywords: scores,
      },
    });
  } catch (error) {
    logger.error('Failed to get quality score', { error, campaignId: req.params.id });
    res.status(500).json({ error: 'Failed to get quality score' });
  }
});

// Calculate keyword quality score
app.post('/api/search/keywords/:keywordId/quality-score', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const score = await qualityScoreService.calculateQualityScore(req.params.keywordId);

    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    logger.error('Failed to calculate quality score', { error, keywordId: req.params.keywordId });
    res.status(500).json({ error: 'Failed to calculate quality score' });
  }
});

// ============================================
// OPTIMIZATION ROUTES
// ============================================

// Optimize campaign
app.post('/api/search/campaigns/:id/optimize', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const data = OptimizeSchema.parse(req.body);
    const result = await optimizationService.optimizeCampaign(req.params.id, data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to optimize campaign', { error, campaignId: req.params.id });
      res.status(500).json({ error: 'Failed to optimize campaign' });
    }
  }
});

// Auto-optimize campaign
app.post('/api/search/campaigns/:id/auto-optimize', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const result = await optimizationService.autoOptimize(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to auto-optimize campaign', { error, campaignId: req.params.id });
    res.status(500).json({ error: 'Failed to auto-optimize campaign' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.env === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...', { uri: config.mongodb.uri });
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected successfully');

    // Connect to Redis
    logger.info('Connecting to Redis...', { host: config.redis.host, port: config.redis.port });
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
 database: config.redis.db,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`Search Ads Service started on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await mongoose.disconnect();
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await mongoose.disconnect();
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

// Start the server
startServer();

export { app };