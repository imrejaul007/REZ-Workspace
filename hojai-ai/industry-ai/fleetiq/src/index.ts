/**
 * FLEETIQ - Fleet AI Operating System
 * Production-Ready Entry Point
 *
 * Features:
 * - MongoDB with Mongoose
 * - JWT Authentication
 * - Rate Limiting
 * - Helmet Security
 * - Winston Logger
 * - Health Checks
 * - Zod Validation
 * - Graceful Shutdown
 */

import { createApp } from './app';
import { config, validateConfig } from './utils/config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase, createIndexes, seedDefaultData } from './utils/database';

// ============================================
// TYPES
// ============================================

interface Server {
  close(callback?: () => void): void;
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: Server;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`${signal} received - Starting graceful shutdown...`);
  logger.info(`═══════════════════════════════════════════════════════════════`);

  // Set a timeout for forced shutdown
  const forceShutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out - forcing exit');
    process.exit(1);
  }, 30000);

  try {
    // Stop accepting new connections
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    // Close database connection
    await disconnectDatabase();

    clearTimeout(forceShutdownTimeout);

    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info('Shutdown complete - Good Bye!');
    logger.info('═══════════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    clearTimeout(forceShutdownTimeout);
    process.exit(1);
  }
};

// ============================================
// START SERVER
// ============================================

const startServer = async (): Promise<void> => {
  try {
    // Validate configuration
    if (!validateConfig()) {
      logger.error('Configuration validation failed');
      process.exit(1);
    }

    logger.info('╔═══════════════════════════════════════════════════════════════╗');
    logger.info('║                                                               ║');
    logger.info('║                    FLEETIQ v1.0.0                              ║');
    logger.info('║              Fleet AI Operating System                         ║');
    logger.info('║                                                               ║');
    logger.info('╚═══════════════════════════════════════════════════════════════╝');

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDatabase();

    // Create indexes
    logger.info('Creating database indexes...');
    await createIndexes();

    // Seed default data
    logger.info('Checking for seed data...');
    await seedDefaultData();

    // Create Express app
    const app = createApp();

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info('');
      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info('  SERVER STARTED SUCCESSFULLY');
      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info(`  Port:           ${config.port}`);
      logger.info(`  Environment:    ${config.nodeEnv}`);
      logger.info(`  MongoDB:        ${config.mongodb.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      logger.info('');
      logger.info('  AI EMPLOYEES:');
      logger.info('    • Dispatch Agent   - Optimal route planning');
      logger.info('    • Route Agent      - Navigation, ETA');
      logger.info('    • Fleet Manager    - Vehicle tracking');
      logger.info('    • Driver Coach     - Performance, compliance');
      logger.info('');
      logger.info('  ENDPOINTS:');
      logger.info('    • GET  /health/live      - Liveness probe');
      logger.info('    • GET  /health/ready     - Readiness probe');
      logger.info('    • GET  /health           - Detailed health');
      logger.info('    • GET  /ai/status         - AI employees status');
      logger.info('    • POST /api/ai/dispatch/optimize');
      logger.info('    • POST /api/ai/route/calculate');
      logger.info('    • POST /api/ai/fleet/analyze');
      logger.info('    • POST /api/ai/driver/coach');
      logger.info('');
      logger.info('  PRODUCTION FEATURES:');
      logger.info('    ✓ MongoDB with Mongoose');
      logger.info('    ✓ JWT Authentication');
      logger.info('    ✓ Rate Limiting');
      logger.info('    ✓ Helmet Security');
      logger.info('    ✓ CORS Protection');
      logger.info('    ✓ Winston Logging');
      logger.info('    ✓ Zod Validation');
      logger.info('    ✓ Graceful Shutdown');
      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info('');
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      }
      logger.error('Server error', { error });
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// ============================================
// START
// ============================================

startServer();

export default startServer;