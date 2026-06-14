import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info(`MongoDB connected: ${config.mongodb.uri}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
    throw error;
  }
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.info('MongoDB disconnected');
});
