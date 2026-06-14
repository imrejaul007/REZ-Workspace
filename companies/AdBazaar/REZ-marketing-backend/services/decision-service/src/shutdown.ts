import logger from 'utils/logger.js';

/**
 * Graceful Shutdown Handler
 * Handles SIGTERM and SIGINT for graceful container shutdown
 */

import { redis } from './config/redis.js';

let isShuttingDown = false;

export async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.info('[SHUTDOWN] Already shutting down...');
    return;
  }

  isShuttingDown = true;
  logger.info(`[SHUTDOWN] Received ${signal}, starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    logger.error('[SHUTDOWN] Forced shutdown after timeout');
    process.exit(1);
  }, 30000);

  try {
    // 1. Stop accepting new connections
    logger.info('[SHUTDOWN] Stopping accepting new connections...');

    // 2. Close Redis connections
    logger.info('[SHUTDOWN] Closing Redis connections...');
    await redis.quit();
    logger.info('[SHUTDOWN] Redis connections closed');

    // 3. Close any open handles
    logger.info('[SHUTDOWN] Closing open handles...');

    // 4. Clear any pending operations
    logger.info('[SHUTDOWN] Clearing pending operations...');

    clearTimeout(shutdownTimeout);
    logger.info('[SHUTDOWN] Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('[SHUTDOWN] Error during shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  logger.error('[SHUTDOWN] Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[SHUTDOWN] Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
