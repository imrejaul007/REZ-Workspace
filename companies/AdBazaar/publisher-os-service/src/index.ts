import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from './config/index.js';
import { logger, register, recordHttpRequest } from './utils/index.js';
import {
  publisherRoutes,
  inventoryRoutes,
  placementRoutes,
  revenueRoutes,
  performanceRoutes,
  floorPriceRoutes,
  headerBiddingRoutes
} from './routes/index.js';

// Create Express app
const app = express();

// Redis client
let redis: Redis | null = null;

// MongoDB connection
async function connectMongoDB(): Promise<void> {
  try {
    const mongoUri = config.mongodb.uri;
    await mongoose.connect(mongoUri, config.mongodb.options);
    logger.info('MongoDB connected', { uri: mongoUri });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

// Redis connection
async function connectRedis(): Promise<void> {
  try {
    redis = new Redis(config.redis.url);
    redis.on('connect', () => {
      logger.info('Redis connected', { url: config.redis.url });
    });
    redis.on('error', (error) => {
      logger.error('Redis error', { error });
    });
  } catch (error) {
    logger.warn('Redis not available', { error });
  }
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS middleware
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Publisher-Key', 'X-Admin-Token', 'X-Service-Name', 'X-Admin-Name']
}));

// Compression middleware
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    // Log request
    logger.info('HTTP Request', {
      method: req.method,
      path: route,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Record metrics
    recordHttpRequest(req.method, route, res.statusCode, duration);
  });

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redis?.status === 'ready' ? 'connected' : 'disconnected';

  const health = {
    status: mongoStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'publisher-os-service',
    version: '1.0.0',
    uptime: process.uptime(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API Routes
app.use('/api/publishers', publisherRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', placementRoutes);
app.use('/api', revenueRoutes);
app.use('/api', performanceRoutes);
app.use('/api', floorPriceRoutes);
app.use('/api', headerBiddingRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: config.env === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down...');

  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error closing MongoDB', { error });
  }

  try {
    if (redis) {
      await redis.quit();
      logger.info('Redis disconnected');
    }
  } catch (error) {
    logger.error('Error closing Redis', { error });
  }

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`Publisher OS Service started`, {
        port: config.port,
        env: config.env,
        nodeVersion: process.version
      });

      logger.info('Available routes:', {
        publishers: '/api/publishers',
        inventory: '/api/publishers/:id/inventory',
        placements: '/api/publishers/:id/placements',
        revenue: '/api/publishers/:id/revenue',
        performance: '/api/publishers/:id/performance',
        floorPrices: '/api/publishers/:id/floor-prices',
        headerBidding: '/api/publishers/:id/header-bidding',
        health: '/health',
        metrics: '/metrics'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export default app;