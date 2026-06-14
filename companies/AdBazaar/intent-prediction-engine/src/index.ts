import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import promClient from 'prom-client';
import { connectDatabase, isDatabaseConnected } from './config/database.js';
import { getRedisClient, isRedisConnected } from './config/redis.js';
import { logger } from './config/logger.js';
import predictRoutes from './routes/predictRoutes.js';
import { HealthCheckResponse } from './types.js';

// Initialize Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'intent_prediction_engine_' });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'intent_prediction_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

const intentScoringTotal = new promClient.Counter({
  name: 'intent_prediction_scoring_total',
  help: 'Total number of intent scoring requests',
  labelNames: ['category', 'status'],
});

const dormantIntentsDetected = new promClient.Gauge({
  name: 'intent_prediction_dormant_intents',
  help: 'Number of dormant intents detected',
  labelNames: ['category'],
});

const segmentsCreated = new promClient.Counter({
  name: 'intent_prediction_segments_created_total',
  help: 'Total number of segments created',
});

const lookalikeGenerated = new promClient.Counter({
  name: 'intent_prediction_lookalike_generated_total',
  help: 'Total number of lookalike audiences generated',
});

// Create Express app
const app: Express = express();

// Trust proxy for accurate IP logging
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
      },
      duration
    );

    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
      ip: req.ip,
    });
  });

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbConnected = isDatabaseConnected();
  const redisConnected = isRedisConnected();

  const response: HealthCheckResponse = {
    status: dbConnected && redisConnected ? 'healthy' : dbConnected || redisConnected ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbConnected,
      redis: redisConnected,
    },
    version: '1.0.0',
  };

  const statusCode = response.status === 'healthy' ? 200 : response.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(response);
});

// Liveness probe
app.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness probe
app.get('/health/ready', async (req: Request, res: Response) => {
  const dbConnected = isDatabaseConnected();
  const redisConnected = isRedisConnected();

  if (dbConnected && redisConnected) {
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      services: { database: dbConnected, redis: redisConnected },
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API routes
app.use('/api/predict', predictRoutes);

// API documentation
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Intent Prediction Engine',
    version: '1.0.0',
    description: 'ML-powered intent analysis, audience segmentation, and prediction service',
    endpoints: {
      'POST /api/predict/intent-score': 'Get intent confidence score for user/category',
      'POST /api/predict/audience': 'Generate intent audience segment',
      'GET /api/predict/revival-candidates': 'Get dormant intents ready for revival',
      'POST /api/predict/lookalike': 'Generate lookalike audience',
      'GET /api/predict/segments': 'List available segments',
      'GET /api/predict/segments/:segmentId': 'Get segment by ID',
      'POST /api/predict/segments': 'Create a new segment',
      'GET /api/predict/timing/:userId': 'Predict optimal timing for user',
      'GET /api/predict/statistics': 'Get dormancy detection statistics',
      'POST /api/predict/batch-score': 'Batch score multiple intent signals',
    },
    health: '/health',
    metrics: '/metrics',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  // In production, you'd stop the HTTP server here

  // Disconnect from databases
  try {
    const { disconnectDatabase } = await import('./config/database.js');
    const { disconnectRedis } = await import('./config/redis.js');

    await Promise.all([disconnectDatabase(), disconnectRedis()]);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function startServer(): Promise<void> {
  const PORT = parseInt(process.env.PORT || '4801', 10);

  try {
    // Connect to databases
    logger.info('Connecting to databases...');
    await connectDatabase();
    getRedisClient(); // Initialize Redis client

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Intent Prediction Engine started`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        pid: process.pid,
      });

      logger.info('Available endpoints:', {
        health: `http://localhost:${PORT}/health`,
        metrics: `http://localhost:${PORT}/metrics`,
        api: `http://localhost:${PORT}/api`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();

export { app };
