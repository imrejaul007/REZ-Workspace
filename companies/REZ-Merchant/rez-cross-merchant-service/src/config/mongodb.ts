/**
 * MongoDB Configuration
 */

import mongoose from 'mongoose';

export async function connectMongoDB(): Promise<void> {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-cross-merchant';

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
