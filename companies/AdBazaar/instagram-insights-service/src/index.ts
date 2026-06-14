import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import promClient from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Load environment variables
dotenv.config();

// Load OpenAPI specification
const swaggerDocument = YAML.load('./docs/openapi.yaml');

// Import configurations
import { getAppConfig, connectDatabase, disconnectDatabase, logger } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import { insightsRouter } from './routes';
import { getInstagramApiService } from './services';

// Initialize Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();

// Add default metrics
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const instagramApiCalls = new promClient.Counter({
  name: 'instagram_api_calls_total',
  help: 'Total number of Instagram API calls',
  labelNames: ['endpoint', 'status'],
});

const insightsCacheHits = new promClient.Counter({
  name: 'insights_cache_hits_total',
  help: 'Total number of insights cache hits',
  labelNames: ['type'],
});

const insightsCacheMisses = new promClient.Counter({
  name: 'insights_cache_misses_total',
  help: 'Total number of insights cache misses',
  labelNames: ['type'],
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(instagramApiCalls);
register.registerMetric(insightsCacheHits);
register.registerMetric(insightsCacheMisses);

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Internal-Token', 'X-Request-ID'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      duration: `${duration.toFixed(3)}s`,
    });
  });
  next();
});

// Request ID middleware
app.use((req: Request, res: Response, next) => {
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Metrics middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  // Check Instagram API health
  let instagramStatus = 'unknown';
  try {
    const instagramApi = getInstagramApiService();
    instagramStatus = (await instagramApi.healthCheck()) ? 'healthy' : 'unhealthy';
  } catch {
    instagramStatus = 'unhealthy';
  }

  const isHealthy = mongoStatus === 'connected' && instagramStatus !== 'unhealthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: getAppConfig().version,
    uptime: process.uptime(),
    services: {
      mongodb: mongoStatus,
      instagram_api: instagramStatus,
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  });
});

// Metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).send('Error generating metrics');
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Instagram Insights Service API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// API routes
app.use('/api/insights', insightsRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'instagram-insights-service',
    version: getAppConfig().version,
    description: 'Deep analytics from Instagram Insights API',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      insights: '/api/insights',
    },
    documentation: {
      account: 'GET /api/insights/account',
      content: 'GET /api/insights/content',
      contentById: 'GET /api/insights/content/:id',
      audience: 'GET /api/insights/audience',
      activeTimes: 'GET /api/insights/audience/active',
      stories: 'GET /api/insights/stories',
      reels: 'GET /api/insights/reels',
      hashtags: 'GET /api/insights/hashtags',
      bestTimes: 'GET /api/insights/best-times',
      export: 'POST /api/insights/export',
      dashboard: 'GET /api/insights/dashboard',
    },
  });
});

//404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close database connection
    await disconnectDatabase();
    logger.info('Database connection closed');

    // Close any open handles
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Start server
const startServer = async () => {
  try {
    const config = getAppConfig();

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDatabase();
    logger.info('MongoDB connected successfully');

    // Start Express server
    app.listen(config.port, config.host, () => {
      logger.info(`Server started`, {
        host: config.host,
        port: config.port,
        env: config.env,
        version: config.version,
      });
      logger.info(`Health check: http://${config.host}:${config.port}/health`);
      logger.info(`Metrics: http://${config.host}:${config.port}/metrics`);
      logger.info(`API: http://${config.host}:${config.port}/api/insights`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Export metrics helpers for use in services
export {
  httpRequestDuration,
  httpRequestTotal,
  instagramApiCalls,
  insightsCacheHits,
  insightsCacheMisses,
};

export default app;

// Start if this is the main module
if (require.main === module) {
  startServer();
}
