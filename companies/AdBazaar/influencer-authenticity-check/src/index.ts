import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectDatabase } from './config/database';
import { register } from './config/metrics';
import routes from './routes';
import { authMiddleware, errorHandler, notFoundHandler, metricsMiddleware } from './middleware';
import { logger } from 'utils/logger.js';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: config.nodeEnv === 'production'
        ? ['https://adBazaar.com', 'https://www.adBazaar.com']
        : '*',
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Metrics middleware
    this.app.use(metricsMiddleware);
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'influencer-authenticity-check',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });

    // Readiness check
    this.app.get('/ready', async (_req: Request, res: Response) => {
      try {
        // Check database connection
        const mongoose = await import('mongoose');
        const dbState = mongoose.connection.readyState;

        if (dbState !== 1) {
          res.status(503).json({
            status: 'not ready',
            database: 'disconnected',
          });
          return;
        }

        res.json({
          status: 'ready',
          database: 'connected',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(503).json({
          status: 'not ready',
          error: 'Health check failed',
        });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', async (_req: Request, res: Response) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        logger.error('Metrics error', { error });
        res.status(500).end();
      }
    });

    // API routes with authentication
    this.app.use('/api', authMiddleware, routes);

    // 404 handler
    this.app.use(notFoundHandler);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();

      // Start server
      this.app.listen(config.port, () => {
        logger.info(`Server started`, {
          port: config.port,
          environment: config.nodeEnv,
          service: 'influencer-authenticity-check',
        });

        logger.info(`Health check: http://localhost:${config.port}/health`);
        logger.info(`Metrics: http://localhost:${config.port}/metrics`);
        logger.info(`API base: http://localhost:${config.port}/api`);
      });
    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    const mongoose = await import('mongoose');
    await mongoose.disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error during shutdown', { error });
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

// Start the application
const app = new App();
app.start().catch((error) => {
  logger.error('Application startup failed', { error });
  process.exit(1);
});

export default app;