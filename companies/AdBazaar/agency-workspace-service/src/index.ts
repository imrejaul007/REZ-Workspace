import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Utils
import { logger } from './utils/logger';
import { metricsHandler, httpRequestDuration, httpRequestsTotal } from './utils/metrics';

// Middleware
import { internalServiceAuth, requestLogger, errorHandler, notFoundHandler, rateLimit } from './middleware';

// Routes
import { agencyRoutes } from './routes';

// Environment variables
const PORT = parseInt(process.env.PORT || '5010');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agency-workspace';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Global Redis client
let redisClient: RedisClientType;

// Create Express app
const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Api-Key', 'X-Agency-Id', 'X-User-Email']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prometheus metrics endpoint
app.get('/metrics', metricsHandler);

// Request timing middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration / 1000
    );

    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });

  next();
});

// Health check (before auth)
app.get('/health', (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isOpen ? 'connected' : 'disconnected';

  res.json({
    success: true,
    service: 'agency-workspace-service',
    version: '1.0.0',
    port: PORT,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  });
});

// API Routes
app.use('/api/agencies', rateLimit(100), agencyRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error: any) {
    logger.error('Failed to connect to MongoDB', { error: error.message });
    // Continue running even if MongoDB is not available (for development)
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max retries reached');
            return new Error('Redis max retries reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { url: REDIS_URL });
    });

    await redisClient.connect();
  } catch (error: any) {
    logger.warn('Failed to connect to Redis, continuing without cache', { error: error.message });
    // Create a dummy Redis client for development
    redisClient = {
      isOpen: false,
      get: async () => null,
      set: async () => 'OK',
      del: async () => 1,
      exists: async () => 0,
      expire: async () => 1
    } as unknown as RedisClientType;
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await Promise.all([
      connectMongoDB(),
      connectRedis()
    ]);

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Agency Workspace Service started`, {
        port: PORT,
        env: NODE_ENV,
        nodeVersion: process.version
      });

      logger.info(
╔══════════════════════════════════════════════════════════════╗
║           AGENCY WORKSPACE SERVICE v1.0.0                   ║
║                                                              ║
║  Port: ${PORT}                                                ║
║  Environment: ${NODE_ENV.padEnd(40)}║
║                                                              ║
║  Endpoints:                                                  ║
║  - GET  /health              Health check                   ║
║  - GET  /metrics             Prometheus metrics              ║
║  - POST /api/agencies        Register agency                ║
║  - GET  /api/agencies        List agencies                  ║
║  - GET  /api/agencies/:id    Get agency                     ║
║  - PUT  /api/agencies/:id    Update agency                  ║
║  - POST /api/agencies/:id/clients    Add client             ║
║  - GET  /api/agencies/:id/clients    List clients          ║
║  - POST /api/agencies/:id/teams      Add team member       ║
║  - GET  /api/agencies/:id/teams      List team             ║
║  - POST /api/agencies/:id/campaigns  Create campaign       ║
║  - GET  /api/agencies/:id/campaigns  List campaigns        ║
║  - GET  /api/agencies/:id/performance Agency performance  ║
║  - GET  /api/agencies/:id/revenue    Revenue analytics     ║
║  - POST /api/agencies/:id/templates  Campaign templates    ║
║  - GET  /api/agencies/:id/dashboard  Agency dashboard      ║
║                                                              ║
║  Competitors: Trade Desk, Amazon DSP, Google DV360          ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await gracefulShutdown();
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await gracefulShutdown();
    });

  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(): Promise<void> {
  try {
    logger.info('Closing database connections');

    if (redisClient?.isOpen) {
      await redisClient.quit();
    }

    await mongoose.connection.close();

    logger.info('All connections closed, exiting');
    process.exit(0);
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

// Export app for testing
export { app };

// Start the server
startServer();