/**
 * REZ Merchant Intelligence Aggregator
 *
 * Cross-merchant analytics and benchmarking service
 * Provides anonymized insights from aggregated merchant data
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { logger } from './config/logger';
import { AggregationService } from './services/aggregationService';
import { BenchmarkService } from './services/benchmarkService';
import { HeatmapService } from './services/heatmapService';
import { TrendsService } from './services/trendsService';
import { connectRedis } from './config/redis';
import aggregationRouter from './routes/aggregation';
import benchmarkRouter from './routes/benchmark';
import heatmapRouter from './routes/heatmap';
import trendsRouter from './routes/trends';
import healthRouter from './routes/health';
import monitoringRouter from './routes/monitoring';
import { requireInternalToken } from './middleware/auth';
import {
  initializeMerchantIntelligence,
  aggregateMerchantSignals,
  emitCrossMerchantInsight,
  getMerchantIntelligenceStats
} from './intelligence';

const app = express();
const PORT = process.env.PORT || 4011;

// Middleware
app.use(helmet());
app.use(require('compression')());
app.use(express.json({ limit: '1mb' }));

// CORS
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (mobile apps, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Allow localhost in development only
    if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      callback(null, true);
      return;
    }
    // Check allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
}));

// Services
const aggregationService = new AggregationService();
const benchmarkService = new BenchmarkService();
const heatmapService = new HeatmapService();
const trendsService = new TrendsService();

// Make services available to routes
app.set('aggregationService', aggregationService);
app.set('benchmarkService', benchmarkService);
app.set('heatmapService', heatmapService);
app.set('trendsService', trendsService);

// Routes
app.use('/health', healthRouter);

// Internal routes (service-to-service)
app.use('/internal', requireInternalToken, aggregationRouter);

// Public benchmark routes (anonymized data only)
app.use('/api/v1/benchmark', benchmarkRouter);
app.use('/api/v1/heatmap', heatmapRouter);
app.use('/api/v1/trends', trendsRouter);

// Monitoring routes
app.use('/api/v1/monitoring', monitoringRouter);

// Error handler
app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ============================================
// INTELLIGENCE INITIALIZATION
// ============================================

let merchantIntelligence: any = null;

async function initializeIntelligence(): Promise<void> {
  try {
    merchantIntelligence = await initializeMerchantIntelligence({
      emitToParent: async (signal: any) => {
        // Emit to parent REZ Company Intelligence if available
        try {
          await fetch(`${process.env.REZ_COMPANY_INTELLIGENCE_URL || 'http://localhost:4200'}/api/intelligence/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...signal, source: 'merchant-aggregator' }),
          });
        } catch (e) {
          // Parent not available
        }
      }
    });
    logger.info('Merchant Intelligence initialized successfully');
  } catch (error) {
    logger.warn('Merchant Intelligence initialization failed', { error });
  }
}

// Signal ingestion endpoint
app.post('/api/intelligence/signals', async (req, res) => {
  try {
    const { merchantId, signal } = req.body;
    await aggregateMerchantSignals(merchantId, signal);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to aggregate merchant signal', { error });
    res.status(500).json({ success: false, error: 'Failed to process signal' });
  }
});

// Stats endpoint
app.get('/api/intelligence/stats', async (_req, res) => {
  const stats = await getMerchantIntelligenceStats();
  res.json({ success: true, data: stats });
});

// Insights endpoint
app.get('/api/intelligence/insights', async (_req, res) => {
  const insights = await merchantIntelligence?.getInsights?.() || [];
  res.json({ success: true, data: insights });
});

// Startup
async function start() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_merchant_intelligence';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') });

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Initialize aggregation service
    await aggregationService.initialize();
    logger.info('Aggregation service initialized');

    // Initialize intelligence layer
    await initializeIntelligence();
    logger.info('Intelligence layer: ' + (merchantIntelligence ? 'Active' : 'Standalone'));

    // Start cron jobs
    await trendsService.startCronJobs();
    logger.info('Cron jobs started');

    // Start server
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-merchant-intelligence-aggregator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
      logger.info(`Merchant Intelligence Aggregator started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export default app;
