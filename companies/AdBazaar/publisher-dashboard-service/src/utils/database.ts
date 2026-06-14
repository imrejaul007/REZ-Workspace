import mongoose from 'mongoose';
import { config } from '../config';
import logger from './logger';

const connectDatabase = async (): Promise<void> => {
  try {
    const uri = config.database.mongo.uri;

    logger.info('Connecting to MongoDB...', { uri: uri.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(uri, config.database.mongo.options);

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
};

const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: (error as Error).message });
    throw error;
  }
};

export { connectDatabase, disconnectDatabase };
export default mongoose;