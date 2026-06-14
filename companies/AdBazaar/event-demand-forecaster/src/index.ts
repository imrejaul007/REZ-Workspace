import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createClient } from 'redis';
import winston from 'winston';

// Utils
import { logger } from 'utils/logger.js';
import { metrics, httpRequestDuration, forecastRequestsTotal } from './utils/metrics';

// Routes
import forecastRoutes from './routes/forecastRoutes';

// Models (for index creation)
import './models/Forecast';
import './models/DemandTrend';
import './models/ForecastAnalytics';
import './models/Calibration';

// Environment
const PORT = process.env.PORT || 4885;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/event-demand-forecaster';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Express App
const app: Express = express();

// Trust proxy for accurate IP logging
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString()
    }, duration);
  });

  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    service: 'event-demand-forecaster',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient?.isOpen ? 'connected' : 'disconnected'
  };

  res.status(200).json(healthStatus);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', metrics.register.contentType);
  res.send(await metrics.register.metrics());
});

// API Routes
app.use('/api/forecast', forecastRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
      },
      password: REDIS_PASSWORD
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { host: REDIS_HOST, port: REDIS_PORT });
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { error });
    redisClient = null;
  }
}

// Export redis client for use in services
export function getRedisClient() {
  return redisClient;
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }

    if (redisClient?.isOpen) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function startServer(): Promise<void> {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`Event Demand Forecaster started`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`
      });

      // Log available routes
      logger.info('Available endpoints:', {
        health: `GET /health`,
        metrics: `GET /metrics`,
        forecast: `POST /api/forecast`,
        getForecast: `GET /api/forecast/:eventId`,
        trend: `GET /api/forecast/:eventId/trend`,
        analytics: `GET /api/forecast/:eventId/analytics`,
        category: `GET /api/forecast/category/:category`,
        location: `GET /api/forecast/location/:location`,
        calibrate: `POST /api/forecast/:eventId/calibrate`,
        recommendations: `GET /api/forecast/recommendations/:eventId`,
        dashboard: `GET /api/forecast/dashboard`
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();