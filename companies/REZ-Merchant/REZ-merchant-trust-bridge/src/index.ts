import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { trustSyncService } from './services/trustSync';
import { alertService } from './services/alertService';
import { createBridgeRouter } from './routes/bridge';
import {
  validateInternalToken,
  requestLogger,
  errorHandler,
  corsMiddleware,
  rateLimitMiddleware,
} from './middleware/auth';

class Application {
  private app: Express;
  private server: ReturnType<Express['listen']> | null = null;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  private setupMiddleware(): void {
    // Trust proxy (for rate limiting behind load balancer)
    this.app.set('trust proxy', 1);

    // CORS
    this.app.use(corsMiddleware);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(requestLogger);

    // Rate limiting
    this.app.use(
      rateLimitMiddleware(config.rateLimitWindow, config.rateLimitMax)
    );

    logger.info('Middleware configured');
  }

  private setupRoutes(): void {
    // Health check (no auth required)
    this.app.get('/health', (_req, res) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          service: 'rez-merchant-trust-bridge',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
        timestamp: new Date().toISOString(),
      });
    });

    // Readiness check
    this.app.get('/ready', async (_req, res) => {
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Database connection not ready',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: {
          status: 'ready',
          mongodb: 'connected',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // API routes (with auth)
    const bridgeRouter = createBridgeRouter();

    // Apply auth middleware to API routes
    this.app.use('/api/bridge', validateInternalToken, bridgeRouter);

    // Also mount without /api/prefix for simpler access
    this.app.use('/', validateInternalToken, bridgeRouter);

    logger.info('Routes configured');
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress');
        return;
      }

      this.isShuttingDown = true;
      logger.info(`Received ${signal}, starting graceful shutdown`);

      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Stop auto sync
      trustSyncService.stopAutoSync();

      // Close MongoDB connection
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (err) {
        logger.error('Error closing MongoDB connection', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      // Give time for in-flight requests to complete
      await new Promise((resolve) => setTimeout(resolve, 5000));

      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', { error: err.message, stack: err.stack });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
      });
    });
  }

  async connectDatabase(): Promise<void> {
    try {
      logger.info('Connecting to MongoDB...', { uri: config.mongodbUri.replace(/\/\/.*@/, '//<credentials>@') });

      await mongoose.connect(config.mongodbUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('MongoDB connected successfully');

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
    } catch (err) {
      logger.error('Failed to connect to MongoDB', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
  }

  async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();
      logger.info('Configuration validated');

      // Connect to database
      await this.connectDatabase();

      // Setup alert callbacks
      this.setupAlertCallbacks();

      // Start auto sync
      trustSyncService.startAutoSync();

      // Start HTTP server
      this.server = this.app.listen(config.port, () => {
        logger.info(`Server started on port ${config.port}`, {
          port: config.port,
          nodeEnv: process.env.NODE_ENV || 'development',
          logLevel: config.logLevel,
        });
      });

      // Handle server errors
      this.server.on('error', (err: Error) => {
        logger.error('Server error', { error: err.message });
        process.exit(1);
      });
    } catch (err) {
      logger.error('Failed to start application', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      process.exit(1);
    }
  }

  private setupAlertCallbacks(): void {
    alertService.onAlert((alert) => {
      logger.info('Alert triggered', {
        merchantId: alert.merchantId,
        type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
      });

      // In production, this would:
      // - Send email notifications
      // - Send push notifications
      // - Trigger webhooks
      // - Update monitoring dashboards
    });

    logger.info('Alert callbacks configured');
  }
}

// Create and start the application
const app = new Application();
app.start().catch((err) => {
  logger.error('Failed to start application', {
    error: err instanceof Error ? err.message : 'Unknown error',
  });
  process.exit(1);
});

export default app;
