import mongoose from 'mongoose';
import { logger } from './logger.js';

const connectMongoDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/risna_agreement_service';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
};

const disconnectMongoDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

export { connectMongoDB, disconnectMongoDB };