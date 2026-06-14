/**
 * Conversion Optimization AI Service
 * AI-powered conversion optimization engine for maximizing campaign ROI
 *
 * Port: 4820
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/env';
import logger from 'utils/logger.js';
import { getMetrics, getContentType, httpRequestsTotal, httpRequestDuration } from './utils/metrics';
import { optimizeRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { redisService } from './services';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and metrics
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);

    logger.debug('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
    });
  });

  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check endpoints
app.get('/health', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redisService.isReady();

  res.json({
    status: mongoOk ? 'healthy' : 'degraded',
    service: 'conversion-optimization-ai',
    port: config.PORT,
    mongodb: mongoOk ? 'connected' : 'disconnected',
    redis: redisOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;

  if (!mongoOk) {
    res.status(503).json({ ready: false, error: 'MongoDB not connected' });
    return;
  }

  res.json({ ready: true });
});

// Prometheus metrics endpoint
if (config.METRICS_ENABLED) {
  app.get(config.METRICS_PATH, async (_req: Request, res: Response) => {
    try {
      res.set('Content-Type', getContentType());
      res.send(await getMetrics());
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  });
}

// API routes
app.use('/api/optimize', optimizeRoutes);

// API documentation
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    service: 'Conversion Optimization AI',
    version: '1.0.0',
    description: 'AI-powered conversion optimization engine for maximizing campaign ROI',
    endpoints: {
      'POST /api/optimize/campaign': 'Start campaign optimization',
      'GET /api/optimize/campaign/:id': 'Get optimization status',
      'POST /api/optimize/bid': 'Get AI-optimized bid recommendation',
      'GET /api/optimize/campaign/:id/insights': 'Get optimization insights',
      'PUT /api/optimize/campaign/:id/pause': 'Pause optimization',
      'PUT /api/optimize/campaign/:id/resume': 'Resume optimization',
      'GET /api/optimize/recommendations': 'Get overall recommendations',
      'GET /api/optimize/campaign/:id/recommendations': 'Get recommendations for optimization',
      'GET /api/optimize/campaign/:id/audience': 'Get audience analysis',
      'GET /api/optimize/campaign/:id/timeslots': 'Get time-of-day optimization data',
      'GET /api/optimize/campaign/:id/competitors': 'Get competitor insights',
    },
    health: '/health',
    ready: '/ready',
    metrics: config.METRICS_ENABLED ? config.METRICS_PATH : 'disabled',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    await redisService.disconnect();
    await mongoose.connection.close();
    logger.info('Connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);

    // Connect to Redis (optional, service continues without it)
    await redisService.connect();

    // Start HTTP server
    app.listen(config.PORT, () => {
      logger.info(`[${new Date().toISOString()}] conversion-optimization-ai running on port ${config.PORT}`);
      logger.info(`[${new Date().toISOString()}] Health check: http://localhost:${config.PORT}/health`);
      logger.info(`[${new Date().toISOString()}] API docs: http://localhost:${config.PORT}/api`);

      if (config.METRICS_ENABLED) {
        logger.info(`[${new Date().toISOString()}] Metrics: http://localhost:${config.PORT}${config.METRICS_PATH}`);
      }
    });
  } catch (error) {
    logger.error('Startup error', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
}

start();

export default app;