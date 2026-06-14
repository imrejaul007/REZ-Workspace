import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import utils and services
import { logger, register, httpRequestDuration, httpRequestsTotal, activeConnections } from './utils';
import { serviceAuth, corsMiddleware, requestLogger } from './middleware';
import conversionRoutes from './routes/conversionRoutes';

// Import models to register them with mongoose
import './models';

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 4975;

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_offline_conversions';

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error: any) {
    logger.error('MongoDB connection error', { error: error.message });
    throw error;
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { url: redisUrl });
      activeConnections.set({ type: 'redis' }, 1);
    });

    redisClient.on('disconnect', () => {
      logger.warn('Disconnected from Redis');
      activeConnections.set({ type: 'redis' }, 0);
    });

    await redisClient.connect();
  } catch (error: any) {
    logger.warn('Redis connection failed, continuing without Redis', { error: error.message });
    redisClient = null;
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  const healthcheck = {
    status: 'ok',
    service: 'offline-conversion-tracker',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isReady ? 'connected' : 'disconnected'
    }
  };

  try {
    // Check MongoDB
    await mongoose.connection.db?.admin().ping();

    res.status(healthcheck.checks.mongodb === 'connected' ? 200 : 503).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'degraded';
    healthcheck.checks.mongodb = 'error';
    res.status(503).json(healthcheck);
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error: any) {
    logger.error('Metrics error', { error: error.message });
    res.status(500).end();
  }
});

// API routes with authentication
app.use('/api/conversions', serviceAuth, conversionRoutes);

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'offline-conversion-tracker',
    version: '1.0.0',
    description: 'AdBazaar Offline Conversion Tracker',
    port: PORT,
    endpoints: {
      health: 'GET /health',
      metrics: 'GET /metrics',
      conversions: {
        create: 'POST /api/conversions',
        get: 'GET /api/conversions/:id',
        batch: 'POST /api/conversions/batch',
        campaign: 'GET /api/conversions/campaign/:campaignId',
        attribution: 'GET /api/conversions/attribution',
        import: 'POST /api/conversions/import',
        analytics: 'GET /api/conversions/analytics',
        dashboard: 'GET /api/conversions/dashboard',
        match: 'POST /api/conversions/match'
      }
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Request duration tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode.toString() },
      duration
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString()
    });
  });

  next();
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close Redis
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    // Close MongoDB
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Offline Conversion Tracker started`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        mongodb: MONGODB_URI
      });

      activeConnections.set({ type: 'http' }, 1);
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Export for testing
export { app, redisClient };

// Start if running directly
if (require.main === module) {
  startServer();
}