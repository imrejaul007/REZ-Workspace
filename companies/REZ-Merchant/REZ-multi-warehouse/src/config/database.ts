import mongoose from 'mongoose';
import logger from './logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_multi_warehouse';

interface MongooseOptions {
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
}

const mongooseOptions: MongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

export const connectDatabase = async (): Promise<void> => {
  try {
    logger.info('Connecting to MongoDB...', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(MONGODB_URI, mongooseOptions);

    logger.info('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: (error as Error).message });
    throw error;
  }
};

export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export default mongoose;
