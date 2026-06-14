import mongoose from 'mongoose';
import { config } from './config';
import { logger } from './utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = config.mongodb.uri;

    await mongoose.connect(mongoUri);

    // Mask credentials in log
    const maskedUri = mongoUri.replace(/\/\/.*@/, '//<credentials>@');
    logger.info('database', 'MongoDB connected', { uri: maskedUri });

    mongoose.connection.on('error', (err) => {
      logger.error('database', 'MongoDB connection error', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('database', 'MongoDB disconnected, attempting to reconnect');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('database', 'MongoDB reconnected');
    });

  } catch (error) {
    logger.error('database', 'Failed to connect to MongoDB', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('database', 'MongoDB disconnected');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
