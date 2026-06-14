import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/index.js';
import routes from './routes/index.js';
import { redisService } from './services/index.js';
import {
  metricsMiddleware,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';
import { targetingService } from './services/index.js';

class App {
  public app: Application;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (config.nodeEnv !== 'test') {
      this.app.use(morgan(config.logging.format));
    }

    // Prometheus metrics
    this.app.use(metricsMiddleware);

    // Trust proxy (for load balancers)
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    this.app.use(routes);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async connectDatabase(): Promise<void> {
    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.error('MongoDB connection error:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error:', { error: err instanceof Error ? err.message : String(err) });
    });

    mongoose.connection.on('disconnected', () => {
      logger.info('MongoDB disconnected');
    });
  }

  public async connectRedis(): Promise<void> {
    try {
      await redisService.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis connection failed, continuing without cache:', error);
    }
  }

  public async start(): Promise<void> {
    // Connect to databases
    await this.connectDatabase();
    await this.connectRedis();

    // Initialize BuzzLocal integration
    await targetingService.initBuzzLocalIntegration();

    // Start server
    const server = this.

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'apartment-targeting-service',
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
      logger.info(`🚀 Apartment Targeting Service running on port ${config.port}`);
      logger.info(`   Environment: ${config.nodeEnv}`);
      logger.info(`   Health: http://localhost:${config.port}/health`);
      logger.info(`   Metrics: http://localhost:${config.port}/metrics`);
    });

    // Graceful shutdown
    this.setupGracefulShutdown(server);
  }

  private setupGracefulShutdown(server: ReturnType<Application['listen']>): void {
    const shutdown = async (signal: string): Promise<void> => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.info(`\n${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await redisService.disconnect();
          logger.info('Redis disconnected');
        } catch (err) {
          logger.error('Redis disconnect error:', { error: err instanceof Error ? err.message : String(err) });
        }

        try {
          await mongoose.connection.close();
          logger.info('MongoDB disconnected');
        } catch (err) {
          logger.error('MongoDB disconnect error:', { error: err instanceof Error ? err.message : String(err) });
        }

        logger.info('Shutdown complete');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the application
const app = new App();
app.start().catch((error) => {
  logger.error('Failed to start application:', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

export default app;