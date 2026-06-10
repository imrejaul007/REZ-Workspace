/**
 * PRODFLOW - Manufacturing AI Operating System
 * Production-Ready Entry Point
 */

import { createApp } from './app';
import { config, validateConfig } from './utils/config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase, createIndexes, seedDefaultData } from './utils/database';
import http from 'http';

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let httpServer: http.Server;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`${signal} received - Starting graceful shutdown...`);
  logger.info(`═══════════════════════════════════════════════════════════════`);

  const forceShutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out - forcing exit');
    process.exit(1);
  }, 30000);

  try {
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

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
    if (!validateConfig()) {
      logger.error('Configuration validation failed');
      process.exit(1);
    }

    logger.info('╔═══════════════════════════════════════════════════════════════╗');
    logger.info('║                                                               ║');
    logger.info('║                    PRODFLOW v1.0.0                           ║');
    logger.info('║              Manufacturing AI Operating System                 ║');
    logger.info('║                                                               ║');
    logger.info('╚═══════════════════════════════════════════════════════════════╝');

    logger.info('Connecting to MongoDB...');
    await connectDatabase();

    logger.info('Creating database indexes...');
    await createIndexes();

    logger.info('Checking for seed data...');
    await seedDefaultData();

    const app = createApp();

    httpServer = app.listen(config.port, () => {
      logger.info('');
      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info('  SERVER STARTED SUCCESSFULLY');
      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info(`  Port:           ${config.port}`);
      logger.info(`  Environment:    ${config.nodeEnv}`);
      logger.info(`  MongoDB:        ${config.mongodb.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      logger.info('');
      logger.info('  AI BRAIN CAPABILITIES:');
      logger.info('    • Production Planning - Intelligent scheduling');
      logger.info('    • Quality Control - Defect prediction');
      logger.info('    • Inventory Optimization - EOQ analysis');
      logger.info('    • Demand Forecasting - Time series analysis');
      logger.info('    • Equipment Maintenance - Failure prediction');
      logger.info('');
      logger.info('  ENDPOINTS:');
      logger.info('    • GET  /health/live        - Liveness probe');
      logger.info('    • GET  /health/ready       - Readiness probe');
      logger.info('    • GET  /health             - Detailed health');
      logger.info('    • GET  /api/ai/brain/status - AI Brain status');
      logger.info('    • POST /api/ai/brain/production/plan - Production planning');
      logger.info('    • POST /api/ai/brain/quality/predict - Quality prediction');
      logger.info('    • POST /api/ai/brain/inventory/optimize - Inventory optimization');
      logger.info('    • POST /api/ai/brain/demand/forecast - Demand forecasting');
      logger.info('    • POST /api/ai/brain/maintenance/predict - Maintenance prediction');
      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info('');
    });

    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      }
      logger.error('Server error', { error });
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
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
