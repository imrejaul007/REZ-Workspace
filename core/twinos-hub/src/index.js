/**
 * TwinOS Hub - Central repository for all digital twins
 * Manages 113 twins across 24 industries
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import Redis from 'ioredis';

import { TwinRegistry } from './services/twinRegistry.js';
import { TwinSyncService } from './services/twinSyncService.js';
import { TwinAnalytics } from './services/twinAnalytics.js';
import twinRoutes from './routes/twins.js';
import industryTwinRoutes from './routes/industryTwins.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Redis for state
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize services
const twinRegistry = new TwinRegistry({ redis, logger });
const syncService = new TwinSyncService({ redis, logger });
const analytics = new TwinAnalytics({ redis, logger });

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      duration: Date.now() - start,
      status: res.statusCode
    });
  });
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const twinCount = twinRegistry.getTotalCount();
  const industryCount = twinRegistry.getIndustryCount();
  
  res.json({
    status: 'healthy',
    service: 'twinos-hub',
    version: '1.0.0',
    twins: twinCount,
    industries: industryCount,
    timestamp: new Date().toISOString()
  });
});

// Statistics
app.get('/stats', async (req, res) => {
  res.json({
    totalTwins: twinRegistry.getTotalCount(),
    byIndustry: twinRegistry.getCountByIndustry(),
    byType: twinRegistry.getCountByType(),
    activeTwins: await twinRegistry.getActiveCount(),
    metrics: await analytics.getMetrics()
  });
});

// Routes
app.use('/twins', twinRoutes);
app.use('/industries', industryTwinRoutes);

// Industry-specific twin counts
app.get('/catalog', async (req, res) => {
  res.json(twinRegistry.getCatalog());
});

// Initialize and start
async function initialize() {
  await twinRegistry.initialize();
  logger.info(`TwinOS Hub initialized with ${twinRegistry.getTotalCount()} twins across ${twinRegistry.getIndustryCount()} industries`);
}

app.listen(PORT, async () => {
  await initialize();
  logger.info(`TwinOS Hub running on port ${PORT}`);
});

export default app;
