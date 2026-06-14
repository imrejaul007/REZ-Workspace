import mongoose from 'mongoose';
import { config } from '../config';
import logger from 'utils/logger.js';

class DatabaseService {
  private static instance: DatabaseService;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const uri = this.buildConnectionUri();
      logger.info(`Connecting to MongoDB at ${config.mongodb.uri.split('@')[1] || 'localhost'}`);

      await mongoose.connect(uri, {
        maxPoolSize: config.mongodb.options.maxPoolSize,
        serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
        socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
      });

      this.isConnected = true;
      logger.info('MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  private buildConnectionUri(): string {
    const { uri, user, password } = config.mongodb;

    if (user && password) {
      // Replace credentials in URI if provided
      return uri.replace('mongodb://', `mongodb://${user}:${password}@`);
    }

    return uri;
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.info('Database already disconnected');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from MongoDB:', error);
      throw error;
    }
  }

  public isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionState(): number {
    return mongoose.connection.readyState;
  }
}

export const databaseService = DatabaseService.getInstance();
export default databaseService;