import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './utils/logger';
import { metrics, httpRequestDuration } from './utils/metrics';
import { internalAuth } from './middleware/auth';
import { Deal } from './models/Deal';
import { DealTerms } from './models/DealTerms';
import { DealNegotiation } from './models/DealNegotiation';
import { DealAnalytics } from './models/DealAnalytics';
import { dealService } from './services/dealService';
import { termsService } from './services/termsService';
import { negotiationService } from './services/negotiationService';
import { analyticsService } from './services/analyticsService';
import { pacingService } from './services/pacingService';

// Environment variables
const PORT = process.env.PORT || 4963;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deal-id-service';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: ReturnType<typeof createClient>;

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
      },
      duration / 1000
    );
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'deal-id-service',
    port: PORT,
    uptime: process.uptime(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient.isReady ? 'connected' : 'disconnected',
    },
  };

  try {
    await redisClient.ping();
    res.json(health);
  } catch {
    health.status = 'degraded';
    health.checks.redis = 'disconnected';
    res.status(503).json(health);
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', metrics.register.contentType);
  res.end(await metrics.register.metrics());
});

// API Routes
app.post('/api/deals', internalAuth, async (req: Request, res: Response) => {
  try {
    const deal = await dealService.createDeal(req.body);
    logger.info('Deal created', { dealId: deal.dealId });
    res.status(201).json(deal);
  } catch (error) {
    logger.error('Error creating deal', { error });
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

app.get('/api/deals', internalAuth, async (req: Request, res: Response) => {
  try {
    const { buyer, seller, status, type, page = 1, limit = 20 } = req.query;
    const deals = await dealService.listDeals({
      buyer: buyer as string,
      seller: seller as string,
      status: status as string,
      type: type as string,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(deals);
  } catch (error) {
    logger.error('Error listing deals', { error });
    res.status(500).json({ error: 'Failed to list deals' });
  }
});

app.get('/api/deals/:id', internalAuth, async (req: Request, res: Response) => {
  try {
    const deal = await dealService.getDeal(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    logger.error('Error getting deal', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to get deal' });
  }
});

app.put('/api/deals/:id', internalAuth, async (req: Request, res: Response) => {
  try {
    const deal = await dealService.updateDeal(req.params.id, req.body);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    logger.info('Deal updated', { dealId: deal.dealId });
    res.json(deal);
  } catch (error) {
    logger.error('Error updating deal', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

app.post('/api/deals/:id/activate', internalAuth, async (req: Request, res: Response) => {
  try {
    const deal = await dealService.activateDeal(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    logger.info('Deal activated', { dealId: deal.dealId });
    res.json(deal);
  } catch (error) {
    logger.error('Error activating deal', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to activate deal' });
  }
});

app.post('/api/deals/:id/pause', internalAuth, async (req: Request, res: Response) => {
  try {
    const deal = await dealService.pauseDeal(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    logger.info('Deal paused', { dealId: deal.dealId });
    res.json(deal);
  } catch (error) {
    logger.error('Error pausing deal', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to pause deal' });
  }
});

app.get('/api/deals/:id/analytics', internalAuth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await analyticsService.getDealAnalytics(
      req.params.id,
      startDate as string,
      endDate as string
    );
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting deal analytics', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to get deal analytics' });
  }
});

app.post('/api/deals/:id/negotiate', internalAuth, async (req: Request, res: Response) => {
  try {
    const negotiation = await negotiationService.createNegotiation(
      req.params.id,
      req.body
    );
    logger.info('Negotiation created', { dealId: req.params.id });
    res.status(201).json(negotiation);
  } catch (error) {
    logger.error('Error creating negotiation', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to create negotiation' });
  }
});

app.post('/api/deals/:id/terms', internalAuth, async (req: Request, res: Response) => {
  try {
    const terms = await termsService.createTerms(req.params.id, req.body);
    logger.info('Deal terms created', { dealId: req.params.id });
    res.status(201).json(terms);
  } catch (error) {
    logger.error('Error creating deal terms', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to create deal terms' });
  }
});

app.get('/api/deals/:id/terms', internalAuth, async (req: Request, res: Response) => {
  try {
    const terms = await termsService.getTerms(req.params.id);
    if (!terms) {
      return res.status(404).json({ error: 'Deal terms not found' });
    }
    res.json(terms);
  } catch (error) {
    logger.error('Error getting deal terms', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to get deal terms' });
  }
});

app.put('/api/deals/:id/terms', internalAuth, async (req: Request, res: Response) => {
  try {
    const terms = await termsService.updateTerms(req.params.id, req.body);
    if (!terms) {
      return res.status(404).json({ error: 'Deal terms not found' });
    }
    logger.info('Deal terms updated', { dealId: req.params.id });
    res.json(terms);
  } catch (error) {
    logger.error('Error updating deal terms', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to update deal terms' });
  }
});

app.get('/api/deals/:id/pacing', internalAuth, async (req: Request, res: Response) => {
  try {
    const pacing = await pacingService.getPacingStatus(req.params.id);
    res.json(pacing);
  } catch (error) {
    logger.error('Error getting pacing status', { error, dealId: req.params.id });
    res.status(500).json({ error: 'Failed to get pacing status' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Database and Redis connections
async function connectDatabases() {
  try {
    // MongoDB connection
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

    // Redis connection
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err }));
    await redisClient.connect();
    logger.info('Connected to Redis', { url: REDIS_URL });
  } catch (error) {
    logger.error('Failed to connect to databases', { error });
    throw error;
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  try {
    await mongoose.connection.close();
    await redisClient.quit();
    logger.info('Connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await connectDatabases();

    // Initialize indexes
    await Deal.init();
    await DealTerms.init();
    await DealNegotiation.init();
    await DealAnalytics.init();

    app.listen(PORT, () => {
      logger.info(`Deal ID Service started on port ${PORT}`);
 });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();
