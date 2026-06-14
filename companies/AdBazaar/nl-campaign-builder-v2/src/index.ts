import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { database } from './config/database';
import { redis } from './config/redis';
import routes from './routes';
import { metricsMiddleware, metricsHandler } from './middleware/metrics.middleware';
import { apiLimiter } from './middleware/rate-limiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { logger } from 'utils/logger.js';

class App {
  public app: Application;
  private server: ReturnType<Application['listen']> | null = null;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });

    // Metrics
    this.app.use(metricsMiddleware);

    // Rate limiting
    this.app.use('/api/', apiLimiter);
  }

  private configureRoutes(): void {
    // Mount all routes
    this.app.use(routes);

    // Metrics endpoint
    this.app.get('/metrics', metricsHandler);
  }

  private configureErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  async connectDatabases(): Promise<void> {
    // Connect to MongoDB
    await database.connect();

    // Connect to Redis (optional)
    await redis.connect();
  }

  async start(): Promise<void> {
    try {
      // Connect to databases
      await this.connectDatabases();

      // Start server
      this.server = this.

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'nl-campaign-builder-v2',
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
        logger.info(`Server started on port ${config.port}`, {
          env: config.nodeEnv,
          port: config.port
        });
        logger.info(`Health check: http://localhost:${config.port}/health`);
        logger.info(`Metrics: http://localhost:${config.port}/metrics`);
        logger.info(`API base: http://localhost:${config.port}/api/nl`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Close database connections
      await database.disconnect();
      await redis.disconnect();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    await database.disconnect();
    await redis.disconnect();
  }
}

// Create and start app
const app = new App();

// Only start if this is the main module
if (require.main === module) {
  app.start();
}

export default app;
export { App };