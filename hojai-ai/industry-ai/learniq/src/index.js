const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');

const server = app.listen(config.port, async () => {
  logger.info('='.repeat(50));
  logger.info('LEARNIQ - Education AI Operating System');
  logger.info('='.repeat(50));
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Port: ${config.port}`);
  logger.info(`Node Version: ${process.version}`);
  logger.info(`Server started at: ${new Date().toISOString()}`);

  try {
    await connectDB();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
  }

  logger.info('='.repeat(50));
  logger.info('AI Agents initialized:');
  logger.info('  - Tutor Agent (Personalized Learning)');
  logger.info('  - Admission Agent (Enrollment Processing)');
  logger.info('  - Placement Agent (Career Guidance)');
  logger.info('  - Grader Agent (Assessment Scoring)');
  logger.info('='.repeat(50));
});

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectDB();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('warning', (warning) => {
  logger.warn('Process Warning:', warning.name, warning.message);
});

module.exports = server;