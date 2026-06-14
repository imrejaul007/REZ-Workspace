import { createApp } from './app';
import { config } from './config';
import { database } from './services/database';
import { cacheService } from './services/cache';
import logger from './utils/logger';

async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    if (config.database.url) {
      await database.connect();
      await database.initializeSchema();
    } else {
      logger.warn('Database not configured, running without persistence');
    }

    // Connect to Redis
    await cacheService.connect();

    // Create and start server
    const app = createApp();

    const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-notifications-hub',
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
app.listen(config.server.port, () => {
      logger.info(`REZ Notifications Hub started`, {
        port: config.server.port,
        nodeEnv: config.server.nodeEnv,
        apiVersion: config.server.apiVersion,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await database.disconnect();
          await cacheService.disconnect();
          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();
