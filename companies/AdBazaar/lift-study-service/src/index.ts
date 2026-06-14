import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { register } from 'prom-client';

import { logger } from 'utils/logger.js';
import { metricsMiddleware } from './utils/metrics';
import { errorHandler, notFoundHandler } from './middleware';

import {
  studyRoutes,
  brandLiftRoutes,
  conversionLiftRoutes,
  surveyRoutes,
  analysisRoutes
} from './routes';

// Import models for mongoose connection
import './models';

const app: Express = express();
const PORT = process.env.PORT || 4972;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    service: 'lift-study-service',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      mongodb: 'unknown',
      redis: 'unknown'
    }
  };

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      health.checks.mongodb = 'healthy';
    } else {
      health.checks.mongodb = 'unhealthy';
      health.status = 'degraded';
    }
  } catch {
    health.checks.mongodb = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    const redisClient = await getRedisClient();
    if (redisClient && redisClient.isOpen) {
      health.checks.redis = 'healthy';
    } else {
      health.checks.redis = 'unhealthy';
      health.status = 'degraded';
    }
  } catch {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness check
app.get('/ready', async (req: Request, res: Response) => {
  const isReady = mongoose.connection.readyState === 1;

  if (isReady) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

// Liveness check
app.get('/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end();
  }
});

// API Routes
app.use('/api/studies', studyRoutes);
app.use('/api/studies', brandLiftRoutes);
app.use('/api/studies', conversionLiftRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/analysis', analysisRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Lift Study Service',
    version: '1.0.0',
    description: 'Brand lift and conversion lift measurement service',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      studies: '/api/studies',
      surveys: '/api/surveys',
      analysis: '/api/analysis'
    }
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    try {
      await redisClient.connect();
    } catch (error: any) {
      logger.warn('Redis connection failed, continuing without cache', { error: error.message });
      redisClient = null;
    }
  }

  return redisClient;
}

// Database connection
async function connectToMongoDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lift_study_service';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error: any) {
    logger.error('MongoDB connection failed', { error: error.message });
    throw error;
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  // Close Redis
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error: any) {
      logger.error('Error closing Redis', { error: error.message });
    }
  }

  // Close MongoDB
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error: any) {
    logger.error('Error closing MongoDB', { error: error.message });
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    // Connect to Redis (optional)
    await getRedisClient();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Lift Study Service started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });

      logger.info('Available endpoints:', {
        studies: `POST /api/studies - Create lift study`,
        listStudies: `GET /api/studies - List studies`,
        getStudy: `GET /api/studies/:id - Get study`,
        updateStudy: `PUT /api/studies/:id - Update study`,
        startStudy: `POST /api/studies/:id/start - Start study`,
        brandLift: `POST /api/studies/:id/brand-lift - Submit brand lift survey`,
        brandLiftResults: `GET /api/studies/:id/brand-lift - Get brand lift results`,
        conversionLift: `POST /api/studies/:id/conversion-lift - Record conversion`,
        results: `GET /api/studies/:id/results - Get analysis results`,
        recommendations: `GET /api/studies/:id/recommendations - Get recommendations`,
        health: `GET /health - Health check`,
        metrics: `GET /metrics - Prometheus metrics`
      });
    });

  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();

export default app;