/**
 * Instagram Shop Integration Service
 * Connects Instagram Shop for product tagging and in-app checkout
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import promClient from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { config } from './config';
import logger from './utils/logger';
import {
  authMiddleware,
  errorHandler,
  notFoundHandler,
  requestLogger,
} from './middleware';
import {
  productRoutes,
  orderRoutes,
  analyticsRoutes,
  webhookRoutes,
} from './routes';

// Load OpenAPI specification
const swaggerDocument = YAML.load('./docs/openapi.yaml');

// Initialize Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register],
});

// Request counter middleware
const metricsMiddleware = (req: Request, res: Response, next: () => void): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status: res.statusCode.toString(),
      },
      duration
    );
  });

  next();
};

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Metrics middleware
app.use(metricsMiddleware);

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'instagram-shop-integration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
  });
});

// Readiness check
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    await mongoose.connection.db?.admin().ping();

    res.json({
      status: 'ready',
      mongodb: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'not ready',
      mongodb: 'disconnected',
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Instagram Shop Integration API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhookRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'You have accessed a protected route',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('Connected to MongoDB', { uri: config.mongodb.uri });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      logger.info(`Instagram Shop Integration Service started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        mongoUri: config.mongodb.uri,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

startServer();

export default app;