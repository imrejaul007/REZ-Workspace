import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { logger } from 'utils/logger.js';
import { metricsMiddleware, getMetrics, getContentType } from './utils/metrics';
import { internalServiceAuth } from './middleware/auth';
import { retailerRoutes, campaignRoutes, analyticsRoutes } from './routes';

// Environment variables
const PORT = process.env.PORT || 4990;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/retail_media_os';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Connect to MongoDB
const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// Connect to Redis
const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', { error: err instanceof Error ? err.message : String(err) });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without Redis:', error);
    redisClient = null;
  }
};

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    service: 'retail-media-os-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient?.isReady ? 'connected' : 'disconnected'
  };

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    logger.error('Error generating metrics:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).send('Error generating metrics');
  }
});

// API routes
app.use('/api/retailers', internalServiceAuth, retailerRoutes);
app.use('/api/campaigns', internalServiceAuth, campaignRoutes);
app.use('/api/analytics', internalServiceAuth, analyticsRoutes);

// Campaign routes that need retailerId in body
app.post('/api/campaigns', internalServiceAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { createCampaignSchema } = await import('./middleware/validation');
    const { campaignService } = await import('./services');

    const validation = createCampaignSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const campaign = await campaignService.create({
      retailerId: req.body.retailerId,
      ...validation.data
    });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
});

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
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Retail Media OS Service started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Export for testing
export { app, redisClient };

// Start the server
startServer();