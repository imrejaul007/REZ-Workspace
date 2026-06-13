/**
 * AI Concierge Agent - Main Entry Point
 * AI Concierge service for Hotel OS
 */

import dotenv from 'dotenv';
import { createApp } from './app';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '8452');
const NODE_ENV = process.env.NODE_ENV || 'development';

async function main() {
  try {
    const { app } = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`AI Concierge Agent started`, {
        port: PORT,
        environment: NODE_ENV,
        service: process.env.SERVICE_NAME || 'ai-concierge',
        version: process.env.SERVICE_VERSION || '1.0.0',
      });

      logger.info(`API endpoints available:`, {
        guestTwin: `POST/GET /api/twins/guest`,
        guestTwinById: `GET/PUT/DELETE /api/twins/guest/:id`,
        guestPreferences: `PUT /api/twins/guest/:id/preferences`,
        roomTwin: `POST/GET /api/twins/room`,
        roomTwinById: `GET/PUT/DELETE /api/twins/room/:id`,
        roomStatus: `GET/PUT /api/twins/room/:id/status`,
        roomIoT: `PUT /api/twins/room/:id/iot`,
        propertyTwin: `POST/GET /api/twins/property`,
        propertyTwinById: `GET/PUT/DELETE /api/twins/property/:id`,
        health: `GET /health`,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise.toString(),
      });
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start AI Concierge Agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

main();
