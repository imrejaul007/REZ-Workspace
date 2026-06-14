import logger from '../utils/logger';

import mongoose from 'mongoose';
import config from './index';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info(`✅ MongoDB connected: ${config.mongoUri}`);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.info('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ MongoDB error:', err);
});

export default mongoose;
