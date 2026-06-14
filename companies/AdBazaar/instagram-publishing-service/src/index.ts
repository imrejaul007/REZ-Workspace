import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { register as prometheusRegister, collectDefaultMetrics, Histogram, Counter } from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import config from './config/index.js';
import logger from 'utils/logger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler, apiKeyAuth, rateLimit } from './middleware/index.js';
import { publishingService } from './services/index.js';

// Load OpenAPI specification
const swaggerDocument = YAML.load('./docs/openapi.yaml');

// Create Express app
const app: Express = express();

// Prometheus metrics
const httpRequestDuration = new Histogram({
  name: `${config.metrics.prefix}_http_request_duration_seconds`,
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestCounter = new Counter({
  name: `${config.metrics.prefix}_http_requests_total`,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestCounter.inc({ method: req.method, route, status_code: res.statusCode });

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

// Rate limiting
app.use(rateLimit(config.rateLimit.maxRequests, config.rateLimit.windowMs));

// Health check endpoint (public)
app.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    service: config.app.serviceName,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.nodeEnv,
 };

  // Check MongoDB connection
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  health.status = mongoStatus === 'connected' ? 'ok' : 'degraded';

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// Metrics endpoint (public for Prometheus scraping)
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', prometheusRegister.contentType);
    res.end(await prometheusRegister.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Instagram Publishing Service API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// API routes (protected with API key)
app.use('/api', apiKeyAuth, routes);

// API documentation
app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'Instagram Publishing Service',
    version: '1.0.0',
    description: 'Publish feed posts, Reels, and Stories to Instagram',
    endpoints: {
      health: 'GET /health',
      metrics: 'GET /metrics',
      publish: {
        immediate: 'POST /api/publish',
        schedule: 'POST /api/publish/schedule',
        draft: 'POST /api/publish/draft',
        drafts: 'GET /api/publish/drafts',
        content: 'GET /api/content/:id',
        delete: 'DELETE /api/content/:id',
      },
      accounts: {
        list: 'GET /api/accounts',
        details: 'GET /api/accounts/:id',
        connect: 'POST /api/accounts/:id/connect',
        disconnect: 'POST /api/accounts/:id/disconnect',
        sync: 'POST /api/accounts/:id/sync',
        content: 'GET /api/accounts/:id/content',
        stats: 'GET /api/accounts/:id/stats',
      },
      webhooks: {
        verify: 'GET /api/webhooks/instagram',
        callback: 'POST /api/webhooks/instagram',
      },
    },
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.database.uri, {
      maxPoolSize: config.database.options.maxPoolSize,
      minPoolSize: config.database.options.minPoolSize,
      serverSelectionTimeoutMS: config.database.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.database.options.socketTimeoutMS,
    });

    logger.info('MongoDB connected', { uri: config.database.uri });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop the scheduler
  publishingService.stopScheduler();

  // Close MongoDB connection
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  // Exit process
  process.exit(0);
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Collect default metrics
    if (config.metrics.enabled) {
      collectDefaultMetrics({ prefix: config.metrics.prefix });
      logger.info('Prometheus metrics enabled');
    }

    // Start the scheduler for scheduled content
    if (config.scheduler.enabled) {
      publishingService.startScheduler();
 }

    // Start listening
    const server = app.listen(config.app.port, () => {
      logger.info(`Server started`, {
        port: config.app.port,
        environment: config.app.nodeEnv,
        service: config.app.serviceName,
      });
 });

    // Handle graceful shutdown
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;