import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-retail-inventory';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB Connected');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

export default { connectDatabase };
