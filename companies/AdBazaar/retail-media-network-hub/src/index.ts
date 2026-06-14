import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { register } from './config/metrics.js';

import routes from './routes/index.js';
import {
  metricsMiddleware,
  rateLimiter,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';

async function bootstrap(): Promise<Express> {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Metrics middleware
  app.use(metricsMiddleware);

  // Rate limiting
  app.use(rateLimiter);

  // Health check endpoint (before auth)
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      service: 'retail-media-network-hub',
      timestamp: new Date().toISOString(),
      port: config.port,
    });
  });

  // Metrics endpoint
  if (config.metrics.enabled) {
    app.get(config.metrics.path, async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (err) {
        res.status(500).end();
      }
    });
  }

  // API routes
  app.use('/api', routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  // Connect to databases
  try {
    await connectDatabase();
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }

  try {
    await connectRedis();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', { error: error instanceof Error ? error.message : String(error) });
    // Redis is optional, continue without it
    logger.info('Continuing without Redis caching...');
  }

  // Start server
  const server = app.listen(config.port, () => {
    logger.info(`
╔══════════════════════════════════════════════════════════════╗
║           RETAIL MEDIA NETWORK HUB                           ║
║              AdBazaar - REZ Ecosystem                         ║
╠══════════════════════════════════════════════════════════════╣
║  Port:        ${config.port}                                       ║
║  Environment: ${config.nodeEnv.padEnd(43)}║
║  Metrics:     ${config.metrics.enabled ? 'Enabled' : 'Disabled'.padEnd(42)}║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    Health:     http://localhost:${config.port}/health             ║
║    Metrics:    http://localhost:${config.port}/metrics            ║
║    API Base:   http://localhost:${config.port}/api                ║
╠══════════════════════════════════════════════════════════════╣
║  Campaign APIs:                                             ║
║    POST   /api/retail-media/campaign                         ║
║    GET    /api/retail-media/campaigns                        ║
║    GET    /api/retail-media/campaigns/:id                    ║
║    PUT    /api/retail-media/campaigns/:id                    ║
║    DELETE /api/retail-media/campaigns/:id                   ║
║                                                              ║
║  Inventory APIs:                                            ║
║    GET    /api/retail-media/inventory                       ║
║    GET    /api/retail-media/inventory/product/:id           ║
║    GET    /api/retail-media/inventory/category/performance  ║
║                                                              ║
║  Sponsored Products:                                        ║
║    POST   /api/retail-media/sponsored                        ║
║    GET    /api/retail-media/sponsored                       ║
║    PATCH  /api/retail-media/sponsored/:id/bid                ║
║    PATCH  /api/retail-media/sponsored/:id/budget             ║
║                                                              ║
║  Analytics:                                                 ║
║    GET    /api/retail-media/analytics                        ║
║    GET    /api/retail-media/analytics/campaign/:id           ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return app;
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

export { bootstrap };