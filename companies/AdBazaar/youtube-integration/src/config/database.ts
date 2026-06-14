import mongoose from 'mongoose';
import { config } from './index.js';
import logger from './logger.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected successfully', { uri: config.mongodb.uri.replace(/\/\/.*@/, '//***@') });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
};

export default connectDatabase;