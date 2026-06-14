import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/index.js';
import { databaseService } from './services/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// Compression
app.use(compression());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'pmp-invite-service',
    version: '1.0.0',
    description: 'Private Marketplace (PMP) invite management service for AdBazaar SSP',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      metrics: '/api/metrics',
      invites: '/api/pmp/invites',
      deals: '/api/pmp/deals',
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await databaseService.connectMongo();

    // Connect to Redis
    logger.info('Connecting to Redis...');
    try {
      await databaseService.connectRedis();
    } catch (redisError) {
      logger.warn('Redis connection failed, continuing without Redis:', redisError);
    }

    // Start HTTP server
    const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pmp-invite-service',
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
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║         PMP Invite Service Started Successfully             ║
╠════════════════════════════════════════════════════════════╣
║  Port:      ${config.port.toString().padEnd(47)}║
║  Env:       ${config.nodeEnv.padEnd(47)}║
║  MongoDB:   ${config.mongodb.uri.replace(/\/\/.*@/, '//***@').padEnd(47)}║
║  Redis:     ${config.redis.host}:${config.redis.port}`.padEnd(64) + `║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                              ║
║    POST   /api/pmp/invite       - Create invite           ║
║    GET    /api/pmp/invites      - List invites            ║
║    GET    /api/pmp/invites/:id  - Get invite               ║
║    POST   /api/pmp/invites/:id/accept - Accept invite      ║
║    POST   /api/pmp/invites/:id/decline - Decline invite    ║
║    GET    /api/pmp/deals        - List deals              ║
║    GET    /api/health           - Health check             ║
║    GET    /api/metrics          - Prometheus metrics       ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await databaseService.disconnectMongo();
          await databaseService.disconnectRedis();
        } catch (error) {
          logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
        }

        logger.info('Shutdown complete');
        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start if this is the main module
startServer();

export { app };