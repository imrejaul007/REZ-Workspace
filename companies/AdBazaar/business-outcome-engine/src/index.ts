import express, { Express } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import logger from 'utils/logger.js';
import { metricsRegistry, dbConnectionStatus } from './utils/metrics.js';
import routes from './routes/index.js';
import outcomeRoutes from './routes/outcomeRoutes.js';
import { serviceAuth } from './middleware/index.js';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  rateLimiter,
  corsMiddleware,
} from './middleware/index.js';

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Express app
const app: Express = express();

// ============ Security Middleware ============

app.use(helmet());
app.use(corsMiddleware);
app.use(compression());

// ============ Body Parsing ============

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============ Request Logging ============

app.use(requestLogger);

// ============ Rate Limiting ============

app.use(rateLimiter(100, 60000)); // 100 requests per minute

// ============ Metrics Endpoint ============

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    const metrics = await metricsRegistry.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end();
  }
});

// ============ API Routes ============

app.use('/', routes);

// ============ Business Outcome Engine Routes ============

app.use('/api/outcomes', serviceAuth, outcomeRoutes);

// ============ Error Handling ============

app.use(notFoundHandler);
app.use(errorHandler);

// ============ Database Connection ============

const connectDB = async (): Promise<void> => {
  try {
    const uri = config.mongodb.uri;
    logger.info('Connecting to MongoDB...', { uri: uri.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(uri, {
      ...config.mongodb.options,
    });

    dbConnectionStatus.set(1);
    logger.info('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error instanceof Error ? error.message : String(error) });
      dbConnectionStatus.set(0);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      dbConnectionStatus.set(0);
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      dbConnectionStatus.set(1);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error instanceof Error ? error.message : String(error) });
    dbConnectionStatus.set(0);
    throw error;
  }
};

// ============ Redis Connection ============

const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password || undefined,
      database: config.redis.db,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', { error: error instanceof Error ? error.message : String(error) });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed - caching disabled', { error });
    redisClient = null;
  }
};

// ============ Graceful Shutdown ============

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    // Close Redis connection
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============ Start Server ============

const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();

    // Start HTTP server
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'business-outcome-engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(config.port, () => {
      logger.info(`Business Outcome Engine started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        version: '1.0.0',
      });

      logger.info('Available endpoints:', {
        health: `GET http://localhost:${config.port}/health`,
        metrics: `GET http://localhost:${config.port}/metrics`,
        predict: `POST http://localhost:${config.port}/api/predict`,
        track: `POST http://localhost:${config.port}/api/track`,
        goals: `POST http://localhost:${config.port}/api/goals`,
        interventions: `POST http://localhost:${config.port}/api/interventions/recommend`,
        learning: `GET http://localhost:${config.port}/api/learning/stats`,
        // Business Outcome Engine endpoints
        campaign: `POST http://localhost:${config.port}/api/outcomes/campaign`,
        campaignGet: `GET http://localhost:${config.port}/api/outcomes/campaign/:id`,
        outcomeTrack: `POST http://localhost:${config.port}/api/outcomes/track`,
        attribution: `GET http://localhost:${config.port}/api/outcomes/attribution/:campaignId`,
        optimize: `POST http://localhost:${config.port}/api/outcomes/optimize`,
        roas: `POST http://localhost:${config.port}/api/outcomes/roas`,
        forecasting: `GET http://localhost:${config.port}/api/outcomes/forecasting/:campaignId`,
        dashboard: `GET http://localhost:${config.port}/api/outcomes/dashboard/:advertiserId`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Start the application
startServer();

export default app;