import mongoose, { Mongoose, ConnectionOptions } from 'mongoose';
import logger from './logger';

const { log } = logger;

class Database {
  private static instance: Database;
  private connection: Mongoose | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private readonly reconnectDelay: number = 5000;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(uri?: string): Promise<Mongoose> {
    const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_subscriptions';

    if (this.isConnected && this.connection) {
      log.debug('Using existing database connection');
      return this.connection;
    }

    const options: ConnectionOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      directConnection: false,
      retryWrites: true,
      retryReads: true,
      w: 'majority' as const,
      ...(process.env.NODE_ENV === 'development' && {
        debug: true
      })
    };

    try {
      log.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') });

      this.connection = await mongoose.connect(mongoUri, options);

      this.isConnected = true;
      this.reconnectAttempts = 0;

      log.info('Successfully connected to MongoDB');

      // Set up connection event handlers
      this.setupEventHandlers();

      return this.connection;
    } catch (error) {
      log.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.connection.on('connected', () => {
      log.info('MongoDB connection established');
      this.isConnected = true;
    });

    this.connection.connection.on('disconnected', () => {
      log.warn('MongoDB disconnected');
      this.isConnected = false;
      this.handleDisconnect();
    });

    this.connection.connection.on('error', (err) => {
      log.error('MongoDB connection error', { error: err });
    });

    this.connection.connection.on('close', () => {
      log.info('MongoDB connection closed');
      this.isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', this gracefulShutdown.bind(this, 'SIGINT'));
    process.on('SIGTERM', this.gracefulShutdown.bind(this, 'SIGTERM'));
  }

  private async handleDisconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    log.info(`Attempting to reconnect to MongoDB (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        log.error('Reconnection attempt failed', { error });
      }
    }, delay);
  }

  public async gracefulShutdown(signal: string): Promise<void> {
    log.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
      if (this.connection) {
        await this.connection.connection.close();
        log.info('MongoDB connection closed gracefully');
      }
    } catch (error) {
      log.error('Error during graceful shutdown', { error });
    }

    process.exit(0);
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.isConnected = false;
      this.connection = null;
      log.info('Disconnected from MongoDB');
    }
  }

  public isHealthy(): boolean {
    return this.isConnected && this.connection !== null;
  }

  public getConnection(): Mongoose | null {
    return this.connection;
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export convenience functions
export const connectDatabase = () => database.connect();
export const disconnectDatabase = () => database.disconnect();
export const isDatabaseHealthy = () => database.isHealthy();
