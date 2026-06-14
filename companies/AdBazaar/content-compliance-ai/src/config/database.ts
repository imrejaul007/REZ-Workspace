import mongoose from 'mongoose';

export interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectionOptions;
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/content-compliance-ai';

  let uri = baseUri;
  if (user && password) {
    uri = baseUri.replace('://', `://${user}:${password}@`);
  }

  return {
    uri,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  };
};

export const connectDatabase = async (): Promise<void> => {
  const config = getDatabaseConfig();

  try {
    await mongoose.connect(config.uri, config.options);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};
