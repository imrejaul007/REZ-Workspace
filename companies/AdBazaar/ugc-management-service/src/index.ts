import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';
import routes from './routes';
import { errorHandler, notFoundHandler, metricsMiddleware } from './middleware';
import { metricsRegister, updateContentMetrics } from './middleware/metrics';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-token', 'x-user-id']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// Metrics middleware
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'ugc-management-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus
  });
});

// Readiness check
app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected'
      });
      return;
    }

    res.json({
      status: 'ready',
      service: 'ugc-management-service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: 'Health check failed'
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Update metrics before returning
    await updateContentMetrics();

    res.set('Content-Type', metricsRegister.contentType);
    res.send(await metricsRegister.metrics());
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).send('Error generating metrics');
  }
});

// API routes
app.use('/api', routes);

// Not found handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Import mongoose for health checks
import mongoose from 'mongoose';

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`UGC Management Service started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Start metrics update interval (every 60 seconds)
    setInterval(async () => {
      try {
        await updateContentMetrics();
      } catch (error) {
        logger.error('Error updating metrics', { error });
      }
    }, 60000);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Export for testing
export { app };

// Start the server
startServer();