import mongoose from 'mongoose';

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  username?: string;
  password?: string;
}

export const getDatabaseConfig = (): DatabaseConfig => ({
  host: process.env.MONGODB_HOST || 'localhost',
  port: parseInt(process.env.MONGODB_PORT || '27017', 10),
  name: process.env.MONGODB_DATABASE || 'instagram_insights',
  username: process.env.MONGODB_USERNAME,
  password: process.env.MONGODB_PASSWORD,
});

export const buildMongoUri = (config: DatabaseConfig): string => {
  const { host, port, name, username, password } = config;

  if (username && password) {
    return `mongodb://${username}:${password}@${host}:${port}/${name}`;
  }

  return `mongodb://${host}:${port}/${name}`;
};

export const connectDatabase = async (): Promise<typeof mongoose> => {
  const config = getDatabaseConfig();
  const uri = buildMongoUri(config);

  try {
    const connection = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};
