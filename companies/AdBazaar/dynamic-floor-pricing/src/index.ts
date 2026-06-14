import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import config from './config';
import { logger, createLogger } from 'utils/logger.js';
import { register, recordResponseTime } from './utils/metrics';
import { authMiddleware } from './middleware/auth';
import floorRoutes from './routes/floorRoutes';

const appLogger = createLogger('App');

export let redisClient: ReturnType<typeof createClient> | null = null;

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    appLogger.info('Connected to MongoDB', { uri: config.mongodb.uri });
  } catch (error) {
    appLogger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port
      },
      password: config.redis.password
    });

    redisClient.on('error', (err) => {
      appLogger.error('Redis Client Error', { error: err });
    });

    redisClient.on('connect', () => {
      appLogger.info('Connected to Redis', {
        host: config.redis.host,
        port: config.redis.port
      });
    });

    await redisClient.connect();
  } catch (error) {
    appLogger.warn('Failed to connect to Redis, continuing without cache', { error });
    redisClient = null;
  }
}

function setupMiddleware(app: Express): void {
  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      appLogger.info('Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`
      });

      recordResponseTime(req.method, req.path, res.statusCode, duration);
    });

    next();
  });
}

function setupRoutes(app: Express): void {
  // Health check endpoint (no auth required)
  app.get('/health', async (req: Request, res: Response) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = redisClient?.isOpen ? 'connected' : 'disconnected';

    const isHealthy = mongoStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus
      }
    });
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

  // API routes with auth
  app.use('/api/floors', authMiddleware, floorRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`
    });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    appLogger.error('Unhandled error', { error: err, path: req.path });
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred'
    });
  });
}

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Create Express app
    const app = express();

    // Setup middleware and routes
    setupMiddleware(app);
    setupRoutes(app);

    // Start server
    const server = app.listen(config.port, () => {
      appLogger.info(`Dynamic Floor Pricing Service started`, {
        port: config.port,
        env: config.nodeEnv
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      appLogger.info(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        appLogger.info('HTTP server closed');

        try {
          await mongoose.connection.close();
          appLogger.info('MongoDB connection closed');

          if (redisClient) {
            await redisClient.quit();
            appLogger.info('Redis connection closed');
          }
        } catch (error) {
          appLogger.error('Error during shutdown', { error });
        }

        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        appLogger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    appLogger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;